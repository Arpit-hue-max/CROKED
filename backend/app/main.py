import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import logging
from contextlib import asynccontextmanager
from datetime import date, timedelta

import numpy as np
from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, engine, Base
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user_required
from app.models_db import User, Watchlist, PredictionDrift
from app.data_service import df_to_records, get_stock_info, latest_quote, fetch_ohlcv
from app.features_pipeline import build_multi_layer_dataset
from app.indian_stocks import normalize_symbol, search_stocks
from app.ml_predictor import generate_prediction
from app.models import (
    HealthResponse,
    PredictionResponse,
    StockDataResponse,
    StockSearchResult,
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    WatchlistAdd,
    WatchlistResponse,
    Quote,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "croked_debug.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])


def get_next_business_day(d: date) -> date:
    nxt = d + timedelta(days=1)
    while nxt.weekday() >= 5:  # Saturday or Sunday
        nxt += timedelta(days=1)
    return nxt


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CROKED Indian Stock Prediction API starting")
    import asyncio
    db_retries = 5
    for attempt in range(1, db_retries + 1):
        try:
            logger.info(f"Connecting to database and initializing tables (attempt {attempt}/{db_retries})...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized successfully")
            # Proactively preload Angel One instruments master
            from app.angelone_client import angelone_client
            if angelone_client.is_configured():
                logger.info("Preloading Angel One instrument master...")
                import threading
                threading.Thread(target=angelone_client.load_instruments, daemon=True).start()
            break
        except Exception as e:
            logger.warning(f"Database initialization failed on attempt {attempt}/{db_retries}: {e}")
            if attempt < db_retries:
                await asyncio.sleep(3)
            else:
                logger.exception("Failed to initialize database tables after maximum retries")
    yield
    logger.info("API shutting down")



app = FastAPI(
    title="CROKED — Indian Stock Prediction API",
    description="Educational ML-powered stock analysis for NSE/BSE. Not financial advice.",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://croked(-.*)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/health", response_model=HealthResponse)
@limiter.limit(settings.rate_limit)
async def health(request: Request):
    return HealthResponse(status="ok", market="NSE/BSE India", version="0.1.0")


@app.get("/api/debug/logs")
async def get_debug_logs():
    try:
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
            return {"logs": "".join(lines[-200:])}
        else:
            return {"error": "Log file not found"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/stocks/search", response_model=list[StockSearchResult])
@limiter.limit(settings.rate_limit)
async def stock_search(request: Request, q: str = Query("", max_length=50)):
    import asyncio
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(None, search_stocks, q)
    return [StockSearchResult(**s) for s in results]


# Global in-memory cache for stock quotes to prevent hitting yfinance too hard
# Schema: { symbol: (quote_dict, fetch_timestamp) }
_QUOTES_CACHE = {}
_QUOTES_CACHE_TTL = 15.0  # Cache quotes for 15 seconds


@app.get("/api/stocks/quotes", response_model=dict[str, Quote])
@limiter.limit(settings.rate_limit)
async def stock_quotes(request: Request, symbols: str = Query(..., description="Comma-separated list of symbols")):
    try:
        import asyncio
        import time
        import pandas as pd
        from concurrent.futures import ThreadPoolExecutor
        from datetime import datetime, timezone
        from app.data_service import latest_quote
        from app.features_pipeline import fetch_ohlcv_with_cache, cache
        from app.angelone_client import angelone_client

        symbol_list = []
        for s in symbols.split(","):
            s_clean = s.strip()
            if s_clean:
                try:
                    symbol_list.append(normalize_symbol(s_clean))
                except Exception:
                    pass

        # Try to resolve quotes using Angel One bulk market data first
        ao_quotes = {}
        if angelone_client.is_configured():
            try:
                loop = asyncio.get_event_loop()
                # Ensure instruments are loaded
                await loop.run_in_executor(None, angelone_client.load_instruments)
                # Fetch quotes
                ao_quotes = await loop.run_in_executor(None, angelone_client.get_quotes, symbol_list)
            except Exception as ao_err:
                logger.warning("Failed to fetch quotes from Angel One: %s. Falling back to yfinance.", ao_err)

        final_quotes = {}
        missing_symbols = []

        for sym in symbol_list:
            if sym in ao_quotes and ao_quotes[sym]["price"] > 0:
                final_quotes[sym] = Quote(**ao_quotes[sym])
            else:
                missing_symbols.append(sym)

        # Fallback to yfinance for any missing/international/failed symbols
        if missing_symbols:
            def fetch_one(sym: str) -> tuple[str, dict]:
                now = time.time()
                # Check in-memory cache first
                if sym in _QUOTES_CACHE:
                    cached_q, cached_time = _QUOTES_CACHE[sym]
                    if now - cached_time < _QUOTES_CACHE_TTL:
                        return sym, cached_q

                try:
                    df = fetch_ohlcv_with_cache(sym, "5d", "1d")
                    if df.empty:
                        raise ValueError(f"No history for {sym}")
                    q = latest_quote(df)
                    
                    # Cache the quote
                    _QUOTES_CACHE[sym] = (q, now)
                    return sym, q
                except Exception as e:
                    logger.warning("Failed to fetch quote for %s: %s", sym, e)
                    if sym in _QUOTES_CACHE:
                        return sym, _QUOTES_CACHE[sym][0]
                    
                    try:
                        cache_key = f"ohlcv_{sym}_5d_1d"
                        cached_data = cache.get(cache_key, max_age_seconds=9999999999)
                        if cached_data:
                            df_cached = pd.DataFrame(cached_data)
                            if not df_cached.empty:
                                q = latest_quote(df_cached)
                                return sym, q
                    except Exception as cache_err:
                        logger.warning("Failed to load expired SQLite cache for %s: %s", sym, cache_err)
                    
                    from datetime import datetime, timezone as tz
                    return sym, {
                        "price": 0.0, "change": 0.0, "change_percent": 0.0,
                        "volume": 0, "as_of": datetime.now(tz.utc).isoformat()
                    }

            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor(max_workers=min(len(missing_symbols), 12)) as pool:
                futures = [loop.run_in_executor(pool, fetch_one, sym) for sym in missing_symbols]
                pairs = await asyncio.gather(*futures)

            for sym, data in pairs:
                final_quotes[sym] = Quote(**data)

        return final_quotes
    except Exception as exc:
        logger.exception("Failed to fetch stock quotes")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock quotes: {exc}")



@app.get("/api/stocks/{symbol}/data", response_model=StockDataResponse)
@limiter.limit(settings.rate_limit)
async def stock_data(
    request: Request,
    symbol: str,
    period: str = Query("1y", pattern="^(1d|5d|1mo|3mo|6mo|1y|2y|5y)$"),
    interval: str = Query("1d", pattern="^(1m|2m|5m|15m|30m|60m|90m|1h|1d|1wk|1mo)$"),
):
    try:
        normalized = normalize_symbol(symbol)
        df, news_feed = build_multi_layer_dataset(normalized, period, interval)
        info = get_stock_info(normalized)
        quote = latest_quote(df)

        return StockDataResponse(
            symbol=normalized,
            name=info["name"],
            currency=info.get("currency", "INR"),
            exchange=info.get("exchange", "NSE"),
            sector=info.get("sector", "Unknown"),
            period=period,
            quote=quote,
            data=df_to_records(df),
            news=news_feed,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to fetch data for %s", symbol)
        raise HTTPException(status_code=502, detail="Market data provider unavailable. Try again later.") from exc


@app.get("/api/stocks/{symbol}/predict", response_model=PredictionResponse)
@limiter.limit("10/minute")
async def stock_predict(
    request: Request,
    symbol: str,
    period: str = Query("2y", pattern="^(1d|5d|6mo|1y|2y|5y)$"),
    interval: str = Query("1d", pattern="^(1m|2m|5m|15m|30m|60m|90m|1h|1d|1wk|1mo)$"),
    days: int = Query(5, ge=1, le=7),
    model: str = Query("Ensemble", pattern="^(XGBoost|LSTM|Ensemble)$"),
    db: Session = Depends(get_db),
):
    try:
        normalized = normalize_symbol(symbol)
        df, _ = build_multi_layer_dataset(normalized, period, interval)
        result = generate_prediction(df, forecast_days=days, model_name=model)
        
        # Save drift log (tomorrow's prediction) to database only for daily intervals
        if interval == "1d" and result.get("forecasts"):
            try:
                # Target date: next trading day (approximated by last date + 1 day)
                last_date_in_df = df.iloc[-1]["Date"].tz_convert("Asia/Kolkata").date()
                tomorrow_date = get_next_business_day(last_date_in_df)
                
                tomorrow_forecast = result["forecasts"][0]
                
                drift_entry = PredictionDrift(
                    symbol=normalized,
                    model_name=model,
                    prediction_date=tomorrow_date,
                    predicted_price=tomorrow_forecast["predicted_price"],
                    predicted_direction=tomorrow_forecast["direction"],
                    predicted_return_pct=tomorrow_forecast["predicted_return_pct"] / 100.0,
                )
                db.add(drift_entry)
                db.commit()
            except Exception as drift_err:
                logger.warning("Could not log prediction for drift monitoring: %s", drift_err)
                db.rollback()

        return PredictionResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed for %s", symbol)
        raise HTTPException(status_code=500, detail="Prediction service error. Try again later.") from exc


@app.post("/api/auth/register")
@limiter.limit(settings.rate_limit)
async def register(request: Request, user_in: UserRegister, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            return JSONResponse(status_code=400, content={"detail": "Email already registered"})
        
        hashed_password = get_password_hash(user_in.password)
        user = User(email=user_in.email, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)

        # Send welcome email (non-blocking)
        try:
            from app.email_service import send_welcome_email
            send_welcome_email(user.email)
        except Exception as e:
            logger.warning(f"Could not send welcome email to {user.email}: {e}")

        return UserResponse(id=user.id, email=user.email)
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Registration crash: {e}\n{tb}")
        return JSONResponse(status_code=400, content={"detail": f"Registration failed: {str(e)}", "traceback": tb})


@app.post("/api/auth/login", response_model=Token)
@limiter.limit(settings.rate_limit)
async def login(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer")


_VERIFICATION_CODES: dict[str, str] = {}

@app.post("/api/auth/forgot-password", response_model=dict)
@limiter.limit(settings.rate_limit)
async def forgot_password_endpoint(request: Request, forgot_in: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == forgot_in.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email address is not registered")
        
    import random
    from app.email_service import send_verification_code
    code = f"{random.randint(100000, 999999)}"
    _VERIFICATION_CODES[forgot_in.email] = code
    
    # Attempt SMTP delivery; falls back to console log if SMTP is not configured
    sent_via_email = send_verification_code(forgot_in.email, code)
    
    return {
        "status": "success",
        "message": (
            "Verification code sent to your email address."
            if sent_via_email
            else "Verification code logged to server console (email not configured)."
        )
        # SECURITY: 'code' is intentionally NOT included in the response.
    }

@app.post("/api/auth/reset-password", response_model=dict)
@limiter.limit(settings.rate_limit)
async def reset_password_endpoint(request: Request, reset_in: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == reset_in.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Email address not found")
        
    saved_code = _VERIFICATION_CODES.get(reset_in.email)
    if not saved_code or saved_code != reset_in.code:
        raise HTTPException(status_code=400, detail="Incorrect or expired verification code")
        
    if len(reset_in.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
    user.hashed_password = get_password_hash(reset_in.new_password)
    db.add(user)
    db.commit()
    
    # Remove code after successful verification
    _VERIFICATION_CODES.pop(reset_in.email, None)
    
    return {"status": "success", "message": "Password updated successfully"}


@app.get("/api/auth/me", response_model=UserResponse)
@limiter.limit(settings.rate_limit)
async def get_me(request: Request, current_user: User = Depends(get_current_user_required)):
    return current_user


@app.get("/api/watchlist", response_model=list[WatchlistResponse])
@limiter.limit(settings.rate_limit)
async def get_watchlist(request: Request, current_user: User = Depends(get_current_user_required), db: Session = Depends(get_db)):
    items = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    response = []
    for item in items:
        try:
            normalized = normalize_symbol(item.symbol)
            df = fetch_ohlcv(normalized, period="1mo")
            info = get_stock_info(normalized)
            quote = latest_quote(df)
            response.append(
                WatchlistResponse(
                    symbol=item.symbol,
                    name=info["name"],
                    price=quote["price"],
                    change=quote["change"],
                    change_percent=quote["change_percent"]
                )
            )
        except Exception:
            response.append(
                WatchlistResponse(
                    symbol=item.symbol,
                    name=item.symbol,
                    price=0.0,
                    change=0.0,
                    change_percent=0.0
                )
            )
    return response


@app.post("/api/watchlist", response_model=dict)
@limiter.limit(settings.rate_limit)
async def add_watchlist(request: Request, watch_in: WatchlistAdd, current_user: User = Depends(get_current_user_required), db: Session = Depends(get_db)):
    try:
        normalized = normalize_symbol(watch_in.symbol)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
        
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.symbol == normalized
    ).first()
    if existing:
        return {"status": "already_added", "symbol": normalized}
        
    watchlist_item = Watchlist(user_id=current_user.id, symbol=normalized)
    db.add(watchlist_item)
    db.commit()
    return {"status": "success", "symbol": normalized}


@app.delete("/api/watchlist/{symbol}", response_model=dict)
@limiter.limit(settings.rate_limit)
async def remove_watchlist(request: Request, symbol: str, current_user: User = Depends(get_current_user_required), db: Session = Depends(get_db)):
    try:
        normalized = normalize_symbol(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
        
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.symbol == normalized
    ).first()
    
    # Fallback to match legacy or unnormalized entries in db
    if not existing:
        existing = db.query(Watchlist).filter(
            Watchlist.user_id == current_user.id,
            Watchlist.symbol == symbol
        ).first()
        
    if not existing:
        raise HTTPException(status_code=404, detail="Symbol not found in watchlist")
        
    db.delete(existing)
    db.commit()
    return {"status": "success", "symbol": normalized}


@app.post("/api/monitoring/update", response_model=dict)
@limiter.limit(settings.rate_limit)
async def update_drift(request: Request, db: Session = Depends(get_db)):
    today = date.today()
    pending = db.query(PredictionDrift).filter(
        PredictionDrift.actual_price == None,
        PredictionDrift.prediction_date <= today
    ).all()
    
    if not pending:
        return {"updated": 0, "message": "No pending predictions to update"}
        
    symbol_groups = {}
    for p in pending:
        symbol_groups.setdefault(p.symbol, []).append(p)
        
    updated_count = 0
    for sym, predictions in symbol_groups.items():
        try:
            df = fetch_ohlcv(sym, period="1mo")
            price_map = {}
            return_map = {}
            for i in range(1, len(df)):
                row_date = df.iloc[i]["Date"].tz_convert("Asia/Kolkata").date()
                prev_close = df.iloc[i-1]["Close"]
                curr_close = df.iloc[i]["Close"]
                price_map[row_date] = curr_close
                return_map[row_date] = (curr_close - prev_close) / prev_close
                
            for p in predictions:
                pred_date = p.prediction_date
                if pred_date in price_map:
                    p.actual_price = float(price_map[pred_date])
                    p.actual_return_pct = float(return_map[pred_date])
                    p.actual_direction = "up" if p.actual_return_pct > 0 else "down"
                    p.error_abs = float(abs(p.actual_price - p.predicted_price))
                    p.is_correct = (p.predicted_direction == p.actual_direction)
                    db.add(p)
                    updated_count += 1
                else:
                    sorted_dates = sorted([d for d in price_map.keys() if d >= pred_date])
                    if sorted_dates:
                        closest_date = sorted_dates[0]
                        if (closest_date - pred_date).days <= 3:
                            p.actual_price = float(price_map[closest_date])
                            p.actual_return_pct = float(return_map[closest_date])
                            p.actual_direction = "up" if p.actual_return_pct > 0 else "down"
                            p.error_abs = float(abs(p.actual_price - p.predicted_price))
                            p.is_correct = (p.predicted_direction == p.actual_direction)
                            db.add(p)
                            updated_count += 1
        except Exception as e:
            logger.exception("Failed to update drift for symbol %s: %s", sym, e)
            
    db.commit()
    return {"updated": updated_count, "message": f"Successfully updated {updated_count} prediction records"}


@app.get("/api/monitoring/drift", response_model=dict)
@limiter.limit(settings.rate_limit)
async def get_drift_stats(request: Request, db: Session = Depends(get_db)):
    completed = db.query(PredictionDrift).filter(PredictionDrift.actual_price != None).order_by(PredictionDrift.prediction_date.desc()).all()
    
    if not completed:
        return {
            "total_predictions": 0,
            "overall_accuracy": None,
            "models": {},
            "recent_predictions": []
        }
        
    total = len(completed)
    correct = sum(1 for p in completed if p.is_correct)
    overall_accuracy = round((correct / total) * 100, 2)
    
    models_stats = {}
    for p in completed:
        m = p.model_name
        models_stats.setdefault(m, []).append(p)
        
    models_summary = {}
    for model_name, preds in models_stats.items():
        m_total = len(preds)
        m_correct = sum(1 for p in preds if p.is_correct)
        m_mae = np.mean([p.error_abs for p in preds]) if preds else 0.0
        models_summary[model_name] = {
            "total": m_total,
            "accuracy": round((m_correct / m_total) * 100, 2),
            "mae": round(float(m_mae), 4)
        }
        
    recent_history = []
    for p in reversed(completed[:50]):
        recent_history.append({
            "id": p.id,
            "symbol": p.symbol,
            "model_name": p.model_name,
            "prediction_date": p.prediction_date.isoformat(),
            "predicted_price": p.predicted_price,
            "actual_price": p.actual_price,
            "is_correct": p.is_correct,
            "error_pct": round((p.error_abs / p.actual_price) * 100, 2) if p.actual_price else 0.0
        })
        
    return {
        "total_predictions": total,
        "overall_accuracy": overall_accuracy,
        "models": models_summary,
        "recent_predictions": recent_history
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
