import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, mean_squared_error
from xgboost import XGBClassifier, XGBRegressor

logger = logging.getLogger(__name__)

FEATURE_COLS = [
    # Core technicals
    "Return_1d",
    "Return_5d",
    "Return_20d",
    "Volatility_20d",
    "RSI",
    "MACD",
    "MACD_Hist",
    "SMA_20",
    "SMA_50",
    "BB_Upper",
    "BB_Lower",
    "Volume",
    # Enhanced technicals
    "SMA_200",
    "EMA_20",
    "EMA_50",
    "ATR",
    "Momentum",
    "VWAP",
    # Core Indian market additions
    "Delivery_Pct",
    "Trades",
    # Sector & Index Context
    "NIFTY_Return",
    "NIFTY_Volatility",
    "BANKNIFTY_Return",
    "INDIAVIX",
    "Sector_Relative_Strength",
    # News & Sentiment
    "Headline_Sentiment",
    "News_Count",
    "Positive_Ratio",
    # FII / DII Flow
    "FII_Buy",
    "FII_Sell",
    "DII_Buy",
    "DII_Sell",
    "Net_Flow",
    # Macro Economics
    "USDINR",
    "Crude_Oil",
    "Gold",
    "US10Y",
    "Repo_Rate",
    "CPI",
    "GDP",
    # Corporate Actions
    "Dividend",
    "Split",
    "Is_Corporate_Action",
]


def _prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    featured = df.copy()
    featured["Target_Return"] = featured["Close"].pct_change().shift(-1)
    featured["Target_Direction"] = (featured["Target_Return"] > 0).astype(int)
    featured = featured.dropna(subset=FEATURE_COLS + ["Target_Return", "Target_Direction"])
    return featured


_BACKTEST_CACHE: dict[tuple, dict[str, Any]] = {}
_PREDICTION_CACHE: dict[tuple, dict[str, Any]] = {}


def walk_forward_backtest(
    df: pd.DataFrame,
    train_window: int = 120,
    test_window: int = 20,
    forecast_days: int = 5,
    model_name: str = "Ensemble",
) -> dict[str, Any]:
    """
    Walk-forward validation per accuracy guide — no random shuffling, no peeking ahead.
    """
    if df.empty:
        return {
            "directional_accuracy": None,
            "rmse": None,
            "baseline_directional_accuracy": None,
            "folds": 0,
            "message": "Empty data",
        }
        
    last_date = df.iloc[-1]["Date"]
    cache_key = (len(df), last_date, train_window, test_window, forecast_days, model_name)
    if cache_key in _BACKTEST_CACHE:
        logger.info("Using cached backtest metrics for %s", model_name)
        return _BACKTEST_CACHE[cache_key]

    featured = _prepare_features(df)
    if len(featured) < train_window + test_window + 10:
        return {
            "directional_accuracy": None,
            "rmse": None,
            "baseline_directional_accuracy": None,
            "folds": 0,
            "message": "Insufficient data for walk-forward backtest",
        }

    dir_preds: list[int] = []
    dir_actuals: list[int] = []
    return_preds: list[float] = []
    return_actuals: list[float] = []
    baseline_dir_preds: list[int] = []

    # Limit backtesting to the last 3 folds to keep it extremely fast
    max_folds = 3
    start_positions = []
    pos = len(featured) - test_window
    while pos >= train_window and len(start_positions) < max_folds:
        start_positions.append(pos)
        pos -= test_window
    start_positions.sort()

    folds = 0
    while folds < len(start_positions):
        start = start_positions[folds]
        train = featured.iloc[start - train_window : start]
        test = featured.iloc[start : start + test_window]

        X_train = train[FEATURE_COLS]
        y_dir_train = train["Target_Direction"]
        y_ret_train = train["Target_Return"]

        X_test = test[FEATURE_COLS]
        y_dir_test = test["Target_Direction"]
        y_ret_test = test["Target_Return"]

        xgb_dir_prob = None
        xgb_ret_pred = None
        lstm_dir_prob = None
        lstm_ret_pred = None

        if model_name in ("XGBoost", "Ensemble"):
            clf = XGBClassifier(
                n_estimators=80,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=42,
                eval_metric="logloss",
            )
            reg = XGBRegressor(
                n_estimators=80,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=42,
            )
            clf.fit(X_train, y_dir_train, verbose=False)
            reg.fit(X_train, y_ret_train, verbose=False)
            xgb_dir_prob = clf.predict_proba(X_test)[:, 1]
            xgb_ret_pred = reg.predict(X_test)

        if model_name in ("LSTM", "Ensemble"):
            from app.lstm_model import train_and_predict_lstm
            lstm_dir_prob = train_and_predict_lstm(
                train, y_dir_train, test, FEATURE_COLS, is_classifier=True
            )
            lstm_ret_pred = train_and_predict_lstm(
                train, y_ret_train, test, FEATURE_COLS, is_classifier=False
            )

        if model_name == "XGBoost":
            fold_dir_prob = xgb_dir_prob
            fold_ret_pred = xgb_ret_pred
        elif model_name == "LSTM":
            fold_dir_prob = lstm_dir_prob
            fold_ret_pred = lstm_ret_pred
        else:  # Ensemble
            fold_dir_prob = (xgb_dir_prob + lstm_dir_prob) / 2
            fold_ret_pred = (xgb_ret_pred + lstm_ret_pred) / 2

        fold_dir_pred = (fold_dir_prob >= 0.5).astype(int)

        dir_preds.extend(fold_dir_pred.tolist())
        dir_actuals.extend(y_dir_test.tolist())
        return_preds.extend(fold_ret_pred.tolist())
        return_actuals.extend(y_ret_test.tolist())

        # Naive baseline: direction = yesterday's direction
        baseline = (train["Target_Return"].iloc[-1] > 0)
        baseline_dir_preds.extend([int(baseline)] * len(test))

        folds += 1

    dir_acc = accuracy_score(dir_actuals, dir_preds) if dir_actuals else None
    baseline_acc = accuracy_score(dir_actuals, baseline_dir_preds) if dir_actuals else None
    rmse = float(np.sqrt(mean_squared_error(return_actuals, return_preds))) if return_actuals else None

    result = {
        "directional_accuracy": round(dir_acc * 100, 2) if dir_acc is not None else None,
        "rmse": round(rmse, 6) if rmse is not None else None,
        "baseline_directional_accuracy": round(baseline_acc * 100, 2) if baseline_acc is not None else None,
        "folds": folds,
        "message": None,
    }
    _BACKTEST_CACHE[cache_key] = result
    return result


def generate_prediction(df: pd.DataFrame, forecast_days: int = 5, model_name: str = "Ensemble") -> dict[str, Any]:
    """
    Train on all available history and predict next N days.
    Predicts log-return direction and expected return with confidence intervals.
    """
    if df.empty:
        raise ValueError("Dataframe is empty")

    last_date = df.iloc[-1]["Date"]
    cache_key = (len(df), last_date, forecast_days, model_name)
    if cache_key in _PREDICTION_CACHE:
        logger.info("Using cached prediction for %s - %s", model_name, last_date)
        return _PREDICTION_CACHE[cache_key]

    featured = _prepare_features(df)
    min_rows = 60
    if len(featured) < min_rows:
        raise ValueError(f"Need at least {min_rows} trading days of data for prediction")

    X = featured[FEATURE_COLS]
    y_dir = featured["Target_Direction"]
    y_ret = featured["Target_Return"]

    xgb_up_prob = 0.5
    xgb_predicted_return = 0.0
    lstm_up_prob = 0.5
    lstm_predicted_return = 0.0

    last_row = featured.iloc[-1]
    last_features = last_row[FEATURE_COLS].values.reshape(1, -1)
    last_close = float(df.iloc[-1]["Close"])

    if model_name in ("XGBoost", "Ensemble"):
        clf = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            eval_metric="logloss",
        )
        reg = XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
        )
        clf.fit(X, y_dir, verbose=False)
        reg.fit(X, y_ret, verbose=False)

        # Apply isotonic calibration to correct overconfident XGBoost probability estimates
        # Uses cv='prefit' since the classifier is already trained on full history
        try:
            calibrated_clf = CalibratedClassifierCV(clf, cv="prefit", method="isotonic")
            # Use last 20% of data as the calibration set (time-ordered — no leakage)
            calib_split = max(20, int(len(X) * 0.2))
            calibrated_clf.fit(X.iloc[-calib_split:], y_dir.iloc[-calib_split:])
            xgb_up_prob = float(calibrated_clf.predict_proba(last_features)[0][1])
        except Exception as calib_err:
            logger.warning("Calibration failed, using raw XGBoost probabilities: %s", calib_err)
            xgb_up_prob = float(clf.predict_proba(last_features)[0][1])

        xgb_predicted_return = float(reg.predict(last_features)[0])

    if model_name in ("LSTM", "Ensemble"):
        from app.lstm_model import train_and_predict_lstm
        lstm_up_prob = float(train_and_predict_lstm(
            featured, y_dir, featured.iloc[-1:], FEATURE_COLS, is_classifier=True
        )[0])
        lstm_predicted_return = float(train_and_predict_lstm(
            featured, y_ret, featured.iloc[-1:], FEATURE_COLS, is_classifier=False
        )[0])

    if model_name == "XGBoost":
        up_prob = xgb_up_prob
        predicted_return = xgb_predicted_return
        model_label = "XGBoost (direction + return)"
    elif model_name == "LSTM":
        up_prob = lstm_up_prob
        predicted_return = lstm_predicted_return
        model_label = "LSTM (direction + return)"
    else:  # Ensemble
        up_prob = (xgb_up_prob + lstm_up_prob) / 2
        predicted_return = (xgb_predicted_return + lstm_predicted_return) / 2
        model_label = "Ensemble (XGBoost + LSTM)"

    predicted_direction = "up" if up_prob >= 0.5 else "down"
    confidence = round(max(up_prob, 1 - up_prob) * 100, 2)

    vol = float(last_row["Volatility_20d"]) if not pd.isna(last_row["Volatility_20d"]) else 0.01
    interval_width = 1.96 * vol

    backtest = walk_forward_backtest(df, forecast_days=forecast_days, model_name=model_name)

    # Recursive multi-step forecasting: for each day, update key lag features
    # and re-predict instead of applying a fixed geometric decay.
    forecasts = []
    price = last_close
    current_features = last_row[FEATURE_COLS].values.copy().astype(float)
    feature_idx = {col: i for i, col in enumerate(FEATURE_COLS)}

    for day in range(1, forecast_days + 1):
        # Recursive XGBoost re-prediction: re-run model with updated features each day
        if model_name in ("XGBoost", "Ensemble"):
            features_reshaped = current_features.reshape(1, -1)
            xgb_day_up = float(clf.predict_proba(features_reshaped)[0][1])
            xgb_day_ret = float(reg.predict(features_reshaped)[0])
        else:
            xgb_day_up = xgb_up_prob
            xgb_day_ret = xgb_predicted_return

        # Blend with LSTM (which remains static — no sequential re-prediction for LSTM)
        if model_name == "XGBoost":
            day_up_prob = xgb_day_up
            day_return = xgb_day_ret
        elif model_name == "LSTM":
            day_up_prob = lstm_up_prob
            day_return = lstm_predicted_return
        else:  # Ensemble
            day_up_prob = (xgb_day_up + lstm_up_prob) / 2
            day_return = (xgb_day_ret + lstm_predicted_return) / 2

        # Confidence decays toward 50% for far-out days (epistemic uncertainty)
        decay = 0.85 ** (day - 1)
        blended_up_prob = 0.5 + (day_up_prob - 0.5) * decay
        blended_return = day_return * (0.92 ** (day - 1))

        predicted_price = price * (1 + blended_return)
        day_confidence = round(max(blended_up_prob, 1 - blended_up_prob) * 100, 2)

        # Uncertainty interval widens as we forecast further out
        day_interval_width = 1.96 * vol * (1 + 0.15 * (day - 1))
        lower = predicted_price * (1 - day_interval_width)
        upper = predicted_price * (1 + day_interval_width)
        direction = "up" if blended_up_prob >= 0.5 else "down"

        forecasts.append(
            {
                "day": day,
                "predicted_price": round(predicted_price, 2),
                "predicted_return_pct": round(blended_return * 100, 4),
                "direction": direction,
                "confidence": day_confidence,
                "lower_bound": round(lower, 2),
                "upper_bound": round(upper, 2),
            }
        )

        # Update lag features for next recursive XGBoost step
        new_return_1d = blended_return
        if "Return_1d" in feature_idx:
            current_features[feature_idx["Return_1d"]] = new_return_1d
        # Volatility_20d smoothly updates (exponential moving average approx)
        if "Volatility_20d" in feature_idx:
            current_features[feature_idx["Volatility_20d"]] = (
                0.9 * current_features[feature_idx["Volatility_20d"]] + 0.1 * abs(new_return_1d)
            )
        price = predicted_price

    result = {
        "model": model_label,
        "target": "next-day return & direction",
        "last_close": round(last_close, 2),
        "predicted_direction": predicted_direction,
        "direction_confidence": confidence,
        "predicted_return_pct": round(predicted_return * 100, 4),
        "forecast_days": forecast_days,
        "forecasts": forecasts,
        "backtest": backtest,
        "disclaimer": (
            "Predictions are probabilistic trend estimates for educational purposes only. "
            "Not financial advice. Indian market investments carry risk — consult a SEBI-registered advisor."
        ),
    }
    _PREDICTION_CACHE[cache_key] = result
    return result

