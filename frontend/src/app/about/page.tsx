import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About CROKED — Methodology, Data Sources & Disclaimer",
  description:
    "Learn about CROKED's ML methodology, data sources, model architecture, and important disclaimers about its educational purpose.",
};

const sections = [
  {
    id: "methodology",
    title: "ML Methodology",
    icon: "🧠",
    content: [
      {
        heading: "Ensemble Model (XGBoost + LSTM)",
        body: "CROKED uses an Ensemble of an XGBoost gradient-boosting classifier/regressor and an LSTM (Long Short-Term Memory) neural network. The ensemble averages their probability outputs for direction prediction and return estimates, which typically outperforms either model alone.",
      },
      {
        heading: "Walk-Forward Backtesting",
        body: "All accuracy metrics are computed using walk-forward validation — the gold standard for time-series ML. Training data never includes future dates. Folds are computed on the most recent 3 windows of data to keep latency low.",
      },
      {
        heading: "Calibrated Confidence Scores",
        body: "XGBoost probabilities are calibrated using isotonic regression (Platt scaling) to reduce overconfidence. Confidence naturally decays toward 50% for further-out forecast days, representing increasing epistemic uncertainty.",
      },
      {
        heading: "Recursive Multi-Step Forecasting",
        body: "For each forecast day beyond day 1, the model updates its feature inputs based on the predicted price (rather than repeating the same input), providing a more realistic diverging uncertainty cone.",
      },
    ],
  },
  {
    id: "features",
    title: "Feature Set (40+ Signals)",
    icon: "📊",
    content: [
      {
        heading: "Technical Indicators",
        body: "RSI (14), MACD with histogram, SMA 20/50/200, EMA 20/50, Bollinger Bands (20, 2σ), ATR (14), VWAP (20-day), 1/5/20-day returns, 20-day volatility, Momentum (10-day).",
      },
      {
        heading: "Indian Market Context",
        body: "NIFTY 50 returns & volatility, Bank Nifty returns, India VIX (fear index), sector relative strength (IT, Banking, Auto, NBFC), Delivery % and Trades (simulated from volume).",
      },
      {
        heading: "News Sentiment",
        body: "Real-time Google News RSS + yfinance news headlines analysed by a financial lexicon model. Sentiment scores are aggregated by date and contribute to the ML feature set.",
      },
      {
        heading: "FII/DII Flows",
        body: "Institutional buy/sell flows in Crores INR, correlated with NIFTY returns. These are statistically modelled approximations — not actual NSDL/SEBI data.",
      },
      {
        heading: "Macroeconomics",
        body: "USD/INR exchange rate, Crude Oil (WTI), Gold (spot), US 10-Year Treasury yield (real-time via yfinance), plus static RBI Repo Rate, CPI, and GDP (quarterly snapshots).",
      },
      {
        heading: "Corporate Actions",
        body: "Dividends and stock splits sourced from yfinance are mapped to dates and propagated to nearby trading days.",
      },
    ],
  },
  {
    id: "data",
    title: "Data Sources",
    icon: "🔌",
    content: [
      {
        heading: "Market Data",
        body: "All OHLCV (open, high, low, close, volume) price data is sourced from Yahoo Finance via the yfinance library. NSE stocks use the .NS suffix; BSE stocks use .BO.",
      },
      {
        heading: "Caching",
        body: "A SQLite-based cache stores yfinance responses to avoid rate-limiting. Intraday data is cached for 60 seconds; daily data for equities is cached for 15 minutes; indices and macro tickers are cached for 8 hours.",
      },
      {
        heading: "News",
        body: "Headlines are sourced from yfinance's built-in news API and Google News RSS feeds. Sentiment is computed via a local financial lexicon — not a cloud NLP API.",
      },
    ],
  },
  {
    id: "simulated",
    title: "Simulated Data Disclosure",
    icon: "⚠️",
    isWarning: true,
    content: [
      {
        heading: "FII/DII Institutional Flows",
        body: "FII and DII buy/sell flow figures shown in the 'Institutional' sub-tab are statistically modelled and correlated with NIFTY returns. They are NOT real data from NSDL, CDSL, or SEBI disclosures.",
      },
      {
        heading: "Delivery % and Trades Count",
        body: "Delivery percentage and daily trade count are derived algorithmically from volume data. They are approximations, not exchange-sourced figures.",
      },
      {
        heading: "F&O Options Chain",
        body: "The Options Chain in the F&O tab uses computed Black-Scholes-inspired approximations for LTP, OI, and volume. This is NOT live NSE Options data.",
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-300/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-indigo-300/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20" strokeWidth="2" />
                <rect x="10" y="5" width="4" height="13" fill="currentColor" rx="0.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">CROKED</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Indian Stock Intelligence Platform</p>
            </div>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
            CROKED is an educational web application that applies machine learning to Indian stock market data. 
            This page documents our methodology, data sources, and important disclaimers.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={`rounded-2xl border p-8 ${
                section.isWarning
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-slate-200 bg-white"
              } shadow-sm`}
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl">{section.icon}</span>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">{section.title}</h2>
              </div>

              <div className="space-y-5">
                {section.content.map((item, idx) => (
                  <div key={idx}>
                    <h3 className="text-sm font-bold text-slate-800 mb-1.5">{item.heading}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Disclaimer */}
          <section id="disclaimer" className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-100">
              <span className="text-2xl">🚨</span>
              <h2 className="text-base font-black text-rose-800 uppercase tracking-wide">Important Disclaimer</h2>
            </div>
            <div className="space-y-3 text-xs text-rose-700 leading-relaxed">
              <p className="font-semibold">
                CROKED is an <strong>educational tool only</strong>. Nothing on this platform constitutes financial advice, 
                investment advice, trading advice, or any other advice of a financial nature.
              </p>
              <p>
                CROKED is <strong>not registered with SEBI</strong> (Securities and Exchange Board of India) as an Investment Adviser 
                or Research Analyst. All ML predictions are probabilistic estimates with inherent uncertainty. 
                Past backtesting performance is not indicative of future results.
              </p>
              <p>
                Indian equity markets involve substantial risk of loss. Never invest money you cannot afford to lose. 
                Always consult a SEBI-registered financial advisor before making investment decisions.
              </p>
              <p className="text-rose-500 font-bold">
                © 2025 CROKED. All predictions for educational demonstration only.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
