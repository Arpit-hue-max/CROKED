import logging
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

PERIOD_MAP = {
    "1d": "1d",
    "5d": "5d",
    "1mo": "1mo",
    "3mo": "3mo",
    "6mo": "6mo",
    "1y": "1y",
    "2y": "2y",
    "5y": "5y",
}

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)


def _create_yfinance_session():
    """Create a session that avoids Yahoo Finance rate-limit blocks."""
    try:
        from curl_cffi import requests as cffi_requests

        return cffi_requests.Session(impersonate="chrome")
    except ImportError:
        import requests

        session = requests.Session()
        session.headers["User-Agent"] = _USER_AGENT
        return session


def fetch_ohlcv_yfinance(symbol: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
    """Fetch OHLCV data for an Indian stock via yfinance."""
    if period not in PERIOD_MAP:
        raise ValueError(f"Invalid period. Choose from: {', '.join(PERIOD_MAP)}")

    session = _create_yfinance_session()
    ticker = yf.Ticker(symbol, session=session)
    df = ticker.history(period=period, interval=interval, auto_adjust=True)

    if df.empty:
        raise ValueError(f"No data found for symbol '{symbol}'. Verify NSE (.NS) or BSE (.BO) ticker.")

    df = df.reset_index()
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"], utc=True)
    elif "Datetime" in df.columns:
        df = df.rename(columns={"Datetime": "Date"})
        df["Date"] = pd.to_datetime(df["Date"], utc=True)

    required = ["Open", "High", "Low", "Close", "Volume"]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing column '{col}' in market data response")

    df = df[["Date", *required]].dropna()
    df = df.sort_values("Date").reset_index(drop=True)
    return df


def _fetch_from_alphavantage(symbol: str, api_key: str) -> pd.DataFrame:
    import httpx
    av_symbol = symbol
    if symbol.endswith(".NS"):
        av_symbol = symbol[:-3] + ".NSE"
    elif symbol.endswith(".BO"):
        av_symbol = symbol[:-3] + ".BOM"
        
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={av_symbol}&outputsize=full&apikey={api_key}"
    resp = httpx.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    
    if "Time Series (Daily)" not in data:
        raise ValueError(f"Alpha Vantage error: {data.get('Note', data.get('Error Message', 'Unknown error'))}")
        
    time_series = data["Time Series (Daily)"]
    records = []
    for date_str, ohlcv in time_series.items():
        records.append({
            "Date": pd.to_datetime(date_str, utc=True),
            "Open": float(ohlcv["1. open"]),
            "High": float(ohlcv["2. high"]),
            "Low": float(ohlcv["3. low"]),
            "Close": float(ohlcv["4. close"]),
            "Volume": int(ohlcv["5. volume"]),
        })
    df = pd.DataFrame(records)
    df = df.sort_values("Date").reset_index(drop=True)
    return df


def _fetch_from_finnhub(symbol: str, api_key: str, period: str) -> pd.DataFrame:
    import httpx
    import time
    to_time = int(time.time())
    days = 365
    if period == "1mo":
        days = 30
    elif period == "3mo":
        days = 90
    elif period == "6mo":
        days = 180
    elif period == "2y":
        days = 730
    elif period == "5y":
        days = 1825
        
    from_time = to_time - (days * 24 * 60 * 60)
    
    url = f"https://finnhub.io/api/v1/stock/candle?symbol={symbol}&resolution=D&from={from_time}&to={to_time}&token={api_key}"
    resp = httpx.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    
    if data.get("s") != "ok":
        raise ValueError(f"Finnhub error: {data.get('msg', 'No data returned')}")
        
    df = pd.DataFrame({
        "Date": pd.to_datetime(data["t"], unit="s", utc=True),
        "Open": data["o"],
        "High": data["h"],
        "Low": data["l"],
        "Close": data["c"],
        "Volume": data["v"],
    })
    df = df.sort_values("Date").reset_index(drop=True)
    return df


def fetch_ohlcv(symbol: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
    """Fetch OHLCV data for an Indian stock with automatic fallbacks."""
    from app.config import settings
    errors = []
    
    # 1. Try yfinance first
    try:
        logger.info("Attempting to fetch data for %s via yfinance (period=%s, interval=%s)", symbol, period, interval)
        return fetch_ohlcv_yfinance(symbol, period, interval)
    except Exception as e:
        logger.warning("yfinance failed for %s: %s", symbol, e)
        errors.append(f"yfinance: {e}")
        
    # 2. Fallback to Finnhub if key is configured
    if settings.finnhub_api_key:
        try:
            logger.info("Attempting to fetch data for %s via Finnhub", symbol)
            return _fetch_from_finnhub(symbol, settings.finnhub_api_key, period)
        except Exception as e:
            logger.warning("Finnhub failed for %s: %s", symbol, e)
            errors.append(f"Finnhub: {e}")
            
    # 3. Fallback to Alpha Vantage if key is configured
    if settings.alpha_vantage_api_key:
        try:
            logger.info("Attempting to fetch data for %s via Alpha Vantage", symbol)
            return _fetch_from_alphavantage(symbol, settings.alpha_vantage_api_key)
        except Exception as e:
            logger.warning("Alpha Vantage failed for %s: %s", symbol, e)
            errors.append(f"Alpha Vantage: {e}")
            
    raise ValueError(f"All data sources failed for '{symbol}'. Errors: {'; '.join(errors)}")


def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Add technical indicators using pandas (no ta-lib dependency)."""
    out = df.copy()
    close = out["Close"]

    out["SMA_20"] = close.rolling(20).mean()
    out["SMA_50"] = close.rolling(50).mean()
    out["EMA_12"] = close.ewm(span=12, adjust=False).mean()
    out["EMA_26"] = close.ewm(span=26, adjust=False).mean()
    out["MACD"] = out["EMA_12"] - out["EMA_26"]
    out["MACD_Signal"] = out["MACD"].ewm(span=9, adjust=False).mean()
    out["MACD_Hist"] = out["MACD"] - out["MACD_Signal"]

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    out["RSI"] = 100 - (100 / (1 + rs))

    out["BB_Mid"] = close.rolling(20).mean()
    bb_std = close.rolling(20).std()
    out["BB_Upper"] = out["BB_Mid"] + 2 * bb_std
    out["BB_Lower"] = out["BB_Mid"] - 2 * bb_std

    out["Return_1d"] = close.pct_change()
    out["Return_5d"] = close.pct_change(5)
    out["Return_20d"] = close.pct_change(20)
    out["Volatility_20d"] = out["Return_1d"].rolling(20).std()

    return out


def df_to_records(df: pd.DataFrame) -> list[dict]:
    records = []
    for _, row in df.iterrows():
        date_val = row["Date"]
        if hasattr(date_val, "isoformat"):
            date_str = date_val.isoformat()
        else:
            date_str = str(date_val)

        record = {"date": date_str}
        for col in df.columns:
            if col == "Date":
                continue
            val = row[col]
            if pd.isna(val):
                record[col.lower()] = None
            elif isinstance(val, (np.floating, float)):
                record[col.lower()] = round(float(val), 4)
            elif isinstance(val, (np.integer, int)):
                record[col.lower()] = int(val)
            else:
                record[col.lower()] = val
        records.append(record)
    return records


def get_stock_info(symbol: str) -> dict:
    try:
        session = _create_yfinance_session()
        ticker = yf.Ticker(symbol, session=session)
        info = ticker.info or {}
        return {
            "name": info.get("longName") or info.get("shortName") or symbol,
            "currency": info.get("currency", "INR"),
            "exchange": info.get("exchange", "NSE"),
            "sector": info.get("sector", "Unknown"),
            "market_cap": info.get("marketCap"),
        }
    except Exception as exc:
        logger.warning("Could not fetch info for %s: %s", symbol, exc)
        return {"name": symbol, "currency": "INR", "exchange": "NSE", "sector": "Unknown", "market_cap": None}


def latest_quote(df: pd.DataFrame) -> dict:
    last = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else last
    change = float(last["Close"] - prev["Close"])
    change_pct = float((change / prev["Close"]) * 100) if prev["Close"] else 0.0
    return {
        "price": round(float(last["Close"]), 2),
        "change": round(change, 2),
        "change_percent": round(change_pct, 2),
        "volume": int(last["Volume"]) if not pd.isna(last["Volume"]) else 0,
        "as_of": datetime.now(timezone.utc).isoformat(),
    }
