export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
}

export interface Quote {
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  as_of: string;
}

export interface OHLCVPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  sma_20?: number;
  sma_50?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_mid?: number;
  bb_lower?: number;
}

export interface NewsStory {
  date: string;
  headline: string;
  publisher: string;
  link: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
}

export interface StockDataResponse {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  sector: string;
  period: string;
  quote: Quote;
  data: OHLCVPoint[];
  news?: NewsStory[];
}

export interface ForecastPoint {
  day: number;
  predicted_price: number;
  predicted_return_pct: number;
  direction: string;
  confidence: number;
  lower_bound: number;
  upper_bound: number;
}

export interface BacktestMetrics {
  directional_accuracy: number | null;
  rmse: number | null;
  baseline_directional_accuracy: number | null;
  folds: number;
  message: string | null;
}

export interface PredictionResponse {
  model: string;
  target: string;
  last_close: number;
  predicted_direction: string;
  direction_confidence: number;
  predicted_return_pct: number;
  forecast_days: number;
  forecasts: ForecastPoint[];
  backtest: BacktestMetrics;
  disclaimer: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  return res.json();
}

export function searchStocks(query: string) {
  return apiFetch<StockSearchResult[]>(
    `/api/stocks/search?q=${encodeURIComponent(query)}`,
  );
}

export function fetchStockData(symbol: string, period: string, interval: string = "1d") {
  return apiFetch<StockDataResponse>(
    `/api/stocks/${encodeURIComponent(symbol)}/data?period=${period}&interval=${interval}`,
  );
}

export function fetchPrediction(symbol: string, period: string, days: number, model: string = "Ensemble", interval: string = "1d") {
  return apiFetch<PredictionResponse>(
    `/api/stocks/${encodeURIComponent(symbol)}/predict?period=${period}&days=${days}&model=${model}&interval=${interval}`,
  );
}

export interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
}

export function registerUser(email: string, password: string) {
  return apiFetch<{ id: number; email: string }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function loginUser(email: string, password: string) {
  return apiFetch<{ access_token: string; token_type: string }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ status: string; message: string }>("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return apiFetch<{ status: string; message: string }>("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });
}

export function getMe() {
  return apiFetch<{ id: number; email: string }>("/api/auth/me");
}

export function fetchWatchlist() {
  return apiFetch<WatchlistStock[]>("/api/watchlist");
}

export function addToWatchlist(symbol: string) {
  return apiFetch<{ status: string; symbol: string }>("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
}

export function removeFromWatchlist(symbol: string) {
  return apiFetch<{ status: string; symbol: string }>(`/api/watchlist/${encodeURIComponent(symbol)}`, {
    method: "DELETE",
  });
}

export interface DriftStatsResponse {
  total_predictions: number;
  overall_accuracy: number | null;
  models: {
    [key: string]: {
      total: number;
      accuracy: number;
      mae: number;
    };
  };
  recent_predictions: Array<{
    id: number;
    symbol: string;
    model_name: string;
    prediction_date: string;
    predicted_price: number;
    actual_price: number;
    is_correct: boolean;
    error_pct: number;
  }>;
}

export function fetchDriftStats() {
  return apiFetch<DriftStatsResponse>("/api/monitoring/drift");
}

export function triggerDriftUpdate() {
  return apiFetch<{ updated: number; message: string }>("/api/monitoring/update", {
    method: "POST",
  });
}

export interface QuoteMap {
  [symbol: string]: Quote;
}

export function fetchStockQuotes(symbols: string[]): Promise<QuoteMap> {
  return apiFetch<QuoteMap>(
    `/api/stocks/quotes?symbols=${encodeURIComponent(symbols.join(","))}`
  );
}

