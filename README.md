# CROKED — Indian Stock Market Prediction Web App

ML-powered stock trend analysis for **NSE** and **BSE** (Indian markets). Built from the PRD and Model Accuracy Guide documents in this repo.

> **Disclaimer:** This is an educational tool only. Not financial advice. Not SEBI-registered. Consult a qualified advisor before investing.

## Features

- Search 30+ popular NSE stocks + NIFTY 50, SENSEX, NIFTY Bank indices
- Historical price charts with SMA, Bollinger Bands
- Technical indicators: RSI, MACD
- XGBoost ML predictions (direction + return) with confidence intervals
- Walk-forward backtesting (no data leakage)
- Security: API keys server-side, rate limiting, CORS, input validation

## Architecture

```
Frontend (Next.js)  →  Backend (FastAPI)  →  yfinance (NSE/BSE data)
                              ↓
                     XGBoost ML + Indicators
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux

npm run dev
```

App: http://croked.vercel.app

### 3. Docker (optional)

```bash
docker compose up --build
```

## Indian Stock Symbols

| Exchange | Yahoo Finance format | Example |
|----------|---------------------|---------|
| NSE      | `SYMBOL.NS`         | `RELIANCE.NS`, `TCS.NS` |
| BSE      | `SYMBOL.BO`         | `RELIANCE.BO` |
| Indices  | `^NSEI`, `^BSESN`   | NIFTY 50, SENSEX |

## Security

- **API keys** (`ALPHA_VANTAGE_API_KEY`, `FINNHUB_API_KEY`) stay in `backend/.env` — never exposed to the browser
- **Rate limiting** via SlowAPI (30 req/min general, 10 req/min for predictions)
- **CORS** restricted to configured origins
- **Input validation** — only NSE/BSE ticker formats accepted
- **Security headers** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- `.env` files are gitignored

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stocks/search?q=` | Search Indian stocks |
| GET | `/api/stocks/{symbol}/data?period=1y` | OHLCV + indicators |
| GET | `/api/stocks/{symbol}/predict?days=5` | ML forecast + backtest |

## Roadmap (from PRD)

- [x] Phase 1: Data pipeline + dashboard
- [x] Phase 2: Baseline ML model + backtesting
- [ ] Phase 3: LSTM / ensemble models
- [ ] Phase 4: User accounts + watchlists
- [ ] Phase 5: Production deployment + drift monitoring

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Lightweight Charts |
| Backend | FastAPI, Python 3.13 |
| ML | XGBoost, scikit-learn, walk-forward validation |
| Data | yfinance (NSE/BSE via Yahoo Finance) |
