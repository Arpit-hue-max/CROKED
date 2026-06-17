from typing import Any, Optional

from pydantic import BaseModel, Field


class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: str


class OHLCVPoint(BaseModel):
    date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None
    sma_20: Optional[float] = Field(None, alias="sma_20")
    sma_50: Optional[float] = Field(None, alias="sma_50")
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = Field(None, alias="macd_signal")
    macd_hist: Optional[float] = Field(None, alias="macd_hist")
    bb_upper: Optional[float] = Field(None, alias="bb_upper")
    bb_mid: Optional[float] = Field(None, alias="bb_mid")
    bb_lower: Optional[float] = Field(None, alias="bb_lower")

    model_config = {"populate_by_name": True}


class Quote(BaseModel):
    price: float
    change: float
    change_percent: float
    volume: int
    as_of: str


class BacktestMetrics(BaseModel):
    directional_accuracy: Optional[float] = None
    rmse: Optional[float] = None
    baseline_directional_accuracy: Optional[float] = None
    folds: int = 0
    message: Optional[str] = None


class ForecastPoint(BaseModel):
    day: int
    predicted_price: float
    predicted_return_pct: float
    direction: str
    confidence: float
    lower_bound: float
    upper_bound: float


class PredictionResponse(BaseModel):
    model: str
    target: str
    last_close: float
    predicted_direction: str
    direction_confidence: float
    predicted_return_pct: float
    forecast_days: int
    forecasts: list[ForecastPoint]
    backtest: BacktestMetrics
    disclaimer: str


class StockDataResponse(BaseModel):
    symbol: str
    name: str
    currency: str
    exchange: str
    sector: str
    period: str
    quote: Quote
    data: list[dict[str, Any]]
    news: Optional[list[dict[str, Any]]] = None


class HealthResponse(BaseModel):
    status: str
    market: str
    version: str


class UserRegister(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class WatchlistAdd(BaseModel):
    symbol: str


class WatchlistResponse(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

