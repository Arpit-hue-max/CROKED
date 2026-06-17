"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  IndianRupee, 
  RefreshCw, 
  Star, 
  Newspaper, 
  Coins, 
  Globe, 
  Percent, 
  LineChart, 
  BookOpen
} from "lucide-react";
import IndicatorChart from "@/components/IndicatorChart";
import PredictionPanel from "@/components/PredictionPanel";
import PriceChart from "@/components/PriceChart";
import StockSearchBar from "@/components/StockSearch";
import HolographicCore3D from "@/components/HolographicCore3D";
import DriftMonitor from "@/components/DriftMonitor";
import ThreeDCard from "@/components/ThreeDCard";
import ThreeDMarketGauge from "@/components/ThreeDMarketGauge";
import Header, { ACCENTS } from "@/components/Header";
import {
  fetchPrediction,
  fetchStockData,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getMe,
  fetchStockQuotes,
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  type PredictionResponse,
  type StockDataResponse,
  type WatchlistStock,
  type OHLCVPoint,
} from "@/lib/api";



const MODELS = [
  { value: "Ensemble", label: "Ensemble (XGBoost + LSTM)" },
  { value: "XGBoost", label: "XGBoost Only" },
  { value: "LSTM", label: "LSTM Only" },
];

const EXPIRATIONS = ["18-Jun-2026", "25-Jun-2026", "02-Jul-2026", "09-Jul-2026"];

const TICKER_SYMBOLS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
  "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
  "LT.NS", "AXISBANK.NS", "BAJFINANCE.NS", "ASIANPAINT.NS", "MARUTI.NS",
  "TITAN.NS", "SUNPHARMA.NS", "WIPRO.NS", "ULTRACEMCO.NS", "NESTLEIND.NS",
  "POWERGRID.NS", "NTPC.NS", "ONGC.NS", "TATAMOTORS.NS", "ADANIENT.NS",
  "HCLTECH.NS", "TECHM.NS", "M&M.NS", "BAJAJFINSV.NS", "JSWSTEEL.NS",
  "ETERNAL.NS", "JIOFIN.NS", "NYKAA.NS", "IREDA.NS", "HUDCO.NS",
  "GOLDBEES.NS", "SILVERBEES.NS"
];




export default function Dashboard() {
  const [symbol, setSymbol] = useState("RELIANCE.NS");
  const [period, setPeriod] = useState("5d");
  const [model, setModel] = useState("Ensemble");
  const [stockData, setStockData] = useState<StockDataResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predError, setPredError] = useState<string | null>(null);

  // Authentication & Watchlist states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [currentTab, setCurrentTab] = useState<"dashboard" | "drift">("dashboard");
  const [subTab, setSubTab] = useState<"news" | "institutional" | "macro" | "delivery">("news");

  // Dashboard Settings
  const [marketType, setMarketType] = useState<"stocks" | "fno" | "commodity">("stocks");
  const [liveData, setLiveData] = useState<OHLCVPoint[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<"cyan" | "emerald" | "indigo" | "violet">("cyan");

  // Ticking watchlist stocks for Best/Worst calculation
  const [tickerStocks, setTickerStocks] = useState([
    { symbol: "RELIANCE.NS", name: "Reliance", price: 2450.50, originalClose: 2421.44, pct: 1.20 },
    { symbol: "TCS.NS", name: "TCS", price: 3920.00, originalClose: 3951.61, pct: -0.80 },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank", price: 1620.15, originalClose: 1615.30, pct: 0.30 },
    { symbol: "INFY.NS", name: "Infosys", price: 1480.00, originalClose: 1510.20, pct: -2.00 },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank", price: 1080.00, originalClose: 1070.00, pct: 0.93 },
    { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", price: 2400.00, originalClose: 2380.00, pct: 0.84 },
    { symbol: "ITC.NS", name: "ITC", price: 420.00, originalClose: 418.00, pct: 0.48 },
    { symbol: "SBIN.NS", name: "SBI", price: 830.45, originalClose: 815.15, pct: 1.88 },
    { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", price: 1120.00, originalClose: 1100.00, pct: 1.82 },
    { symbol: "KOTAKBANK.NS", name: "Kotak Bank", price: 1780.00, originalClose: 1795.00, pct: -0.84 },
    { symbol: "LT.NS", name: "L&T", price: 3450.00, originalClose: 3400.00, pct: 1.47 },
    { symbol: "AXISBANK.NS", name: "Axis Bank", price: 1050.00, originalClose: 1040.00, pct: 0.96 },
    { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", price: 6800.00, originalClose: 6900.00, pct: -1.45 },
    { symbol: "ASIANPAINT.NS", name: "Asian Paints", price: 2850.00, originalClose: 2890.00, pct: -1.38 },
    { symbol: "MARUTI.NS", name: "Maruti Suzuki", price: 11500.00, originalClose: 11400.00, pct: 0.88 },
    { symbol: "TITAN.NS", name: "Titan", price: 3600.00, originalClose: 3580.00, pct: 0.56 },
    { symbol: "SUNPHARMA.NS", name: "Sun Pharma", price: 1540.00, originalClose: 1520.00, pct: 1.32 },
    { symbol: "WIPRO.NS", name: "Wipro", price: 480.00, originalClose: 475.00, pct: 1.05 },
    { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", price: 9700.00, originalClose: 9600.00, pct: 1.04 },
    { symbol: "NESTLEIND.NS", name: "Nestle India", price: 2500.00, originalClose: 2520.00, pct: -0.79 },
    { symbol: "POWERGRID.NS", name: "Power Grid", price: 275.00, originalClose: 270.00, pct: 1.85 },
    { symbol: "NTPC.NS", name: "NTPC", price: 345.00, originalClose: 340.00, pct: 1.47 },
    { symbol: "ONGC.NS", name: "ONGC", price: 265.00, originalClose: 262.00, pct: 1.15 },
    { symbol: "TATAMOTORS.NS", name: "Tata Motors", price: 950.00, originalClose: 940.00, pct: 1.06 },
    { symbol: "ADANIENT.NS", name: "Adani Enterprises", price: 3150.00, originalClose: 3100.00, pct: 1.61 },
    { symbol: "HCLTECH.NS", name: "HCL Tech", price: 1550.00, originalClose: 1565.00, pct: -0.96 },
    { symbol: "TECHM.NS", name: "Tech Mahindra", price: 1250.00, originalClose: 1240.00, pct: 0.81 },
    { symbol: "M&M.NS", name: "M&M", price: 1950.00, originalClose: 1930.00, pct: 1.04 },
    { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", price: 1580.00, originalClose: 1600.00, pct: -1.25 },
    { symbol: "JSWSTEEL.NS", name: "JSW Steel", price: 830.00, originalClose: 825.00, pct: 0.61 },
    { symbol: "ETERNAL.NS", name: "Zomato", price: 185.20, originalClose: 177.22, pct: 4.50 },
    { symbol: "JIOFIN.NS", name: "Jio Financial", price: 350.00, originalClose: 345.00, pct: 1.45 },
    { symbol: "NYKAA.NS", name: "Nykaa", price: 165.00, originalClose: 162.00, pct: 1.85 },
    { symbol: "IREDA.NS", name: "IREDA", price: 175.00, originalClose: 170.00, pct: 2.94 },
    { symbol: "HUDCO.NS", name: "HUDCO", price: 210.00, originalClose: 205.00, pct: 2.44 },
    { symbol: "GOLDBEES.NS", name: "Gold BeES", price: 60.50, originalClose: 59.80, pct: 1.17 },
    { symbol: "SILVERBEES.NS", name: "Silver BeES", price: 78.20, originalClose: 77.50, pct: 0.90 }
  ]);

  const [selectedExpiration, setSelectedExpiration] = useState("18-Jun-2026");

  const [indexPrices, setIndexPrices] = useState({
    nifty: { val: 22450.15, change: 145.30, pct: 0.65 },
    sensex: { val: 73910.20, change: 425.80, pct: 0.58 },
    banknifty: { val: 48210.80, change: -202.40, pct: -0.42 }
  });

  const periodOptions = marketType === "stocks"
    ? [
        { value: "1d", label: "1D" },
        { value: "5d", label: "5D" },
        { value: "1mo", label: "1M" },
        { value: "3mo", label: "3M" },
        { value: "6mo", label: "6M" },
        { value: "1y", label: "1Y" },
        { value: "2y", label: "2Y" },
      ]
    : [
        { value: "3mo", label: "3M" },
        { value: "6mo", label: "6M" },
        { value: "1y", label: "1Y" },
        { value: "2y", label: "2Y" },
        { value: "5y", label: "5Y" },
      ];

  // Live market clock states
  const [istTime, setIstTime] = useState("");
  const [marketOpen, setMarketOpen] = useState(false);

  // Live ticking quote simulation state
  const [tickedPrice, setTickedPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);

  const symbolRef = useRef(symbol);
  const watchlistRef = useRef(watchlist);

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  useEffect(() => {
    watchlistRef.current = watchlist;
  }, [watchlist]);

  // Authentication form states for embedded Landing Page
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authShowPassword, setAuthShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup" | "forgot" | "verify" | "reset-success">("signin");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Forgot Password / Verify Code States
  const [authVerifyCode, setAuthVerifyCode] = useState("");
  const [authEnteredCode, setAuthEnteredCode] = useState("");
  const [authNewPassword, setAuthNewPassword] = useState("");
  const [authShowNewPassword, setAuthShowNewPassword] = useState(false);
  
  // Mascot focus states
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Ref to focus email input
  const authEmailInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAuth = () => {
    setAuthTab("signin");
    setAuthError(null);
    setTimeout(() => {
      authEmailInputRef.current?.focus();
      authEmailInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(false);
    try {
      const data = await loginUser(authEmail, authPassword);
      localStorage.setItem("token", data.access_token);
      setAuthSuccess(true);
      setTimeout(() => {
        setToken(data.access_token);
        setAuthSuccess(false);
        setAuthEmail("");
        setAuthPassword("");
      }, 1100);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setTimeout(() => setAuthLoading(false), 1100);
    }
  };

  const handleAuthRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }
    if (authPassword.length < 8) {
      setAuthError("Password must be at least 8 characters");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(false);
    try {
      await registerUser(authEmail, authPassword);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        setAuthTab("signin");
        setAuthPassword("");
        setAuthConfirmPassword("");
        setAuthError(null);
      }, 1100);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setTimeout(() => setAuthLoading(false), 1100);
    }
  };

  const handleAuthForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) { setAuthError("Please enter your email address"); return; }
    setAuthLoading(true);
    setAuthError(null);
    try {
      await forgotPassword(authEmail);
      setAuthVerifyCode(""); // Code is NOT returned from API (security) — user checks email/console
      setAuthTab("verify");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to generate verification code");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authNewPassword.length < 8) {
      setAuthError("New password must be at least 8 characters");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      await resetPassword(authEmail, authEnteredCode, authNewPassword);
      setAuthTab("reset-success");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setAuthLoading(false);
    }
  };

  // Load settings and token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token");
      const savedAccent = localStorage.getItem("accentColor") as "cyan" | "emerald" | "indigo" | "violet" | null;
      setTimeout(() => {
        setToken(savedToken);
        if (savedAccent && ["cyan", "emerald", "indigo", "violet"].includes(savedAccent)) {
          setAccentColor(savedAccent);
        }
      }, 0);
    }
  }, []);

  const handleSetAccentColor = (color: "cyan" | "emerald" | "indigo" | "violet") => {
    setAccentColor(color);
    if (typeof window !== "undefined") {
      localStorage.setItem("accentColor", color);
    }
  };

  // Clock effect
  useEffect(() => {
    const updateClock = () => {
      const options = { timeZone: "Asia/Kolkata", hour12: true, hour: "numeric", minute: "numeric", second: "numeric" } as const;
      try {
        const formatter = new Intl.DateTimeFormat([], options);
        setIstTime(formatter.format(new Date()));
      } catch {
        setIstTime(new Date().toLocaleTimeString());
      }

      const now = new Date();
      const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const day = istDate.getDay();
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const timeVal = hours * 100 + minutes;

      const isWeekday = day >= 1 && day <= 5;
      const isTradingHours = timeVal >= 915 && timeVal <= 1530;
      setMarketOpen(isWeekday && isTradingHours);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch me and watchlist on token update
  const loadUserData = useCallback(async () => {
    if (!token) {
      setUser(null);
      setWatchlist([]);
      return;
    }
    try {
      const me = await getMe();
      setUser({ email: me.email });
      const list = await fetchWatchlist();
      setWatchlist(list);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
    }
  }, [token]);

  // Load actual live prices for ticker stocks and index prices in one fast batch request
  const loadLiveMarketRates = useCallback(async () => {
    try {
      const currentSymbol = symbolRef.current;
      const indexSymbols = ["^NSEI", "^BSESN", "^NSEBANK"];
      const tickerSymbols = TICKER_SYMBOLS;
      const watchlistSymbols = watchlistRef.current.map(w => w.symbol);
      const allSymbols = Array.from(new Set([...indexSymbols, ...tickerSymbols, ...watchlistSymbols, currentSymbol]));
      
      const quotes = await fetchStockQuotes(allSymbols);
      
      const nifty = quotes["^NSEI"];
      const sensex = quotes["^BSESN"];
      const banknifty = quotes["^NSEBANK"];

      if (nifty || sensex || banknifty) {
        setIndexPrices({
          nifty: nifty && nifty.price > 0 ? { val: nifty.price, change: nifty.change, pct: nifty.change_percent } : { val: 22450.15, change: 145.30, pct: 0.65 },
          sensex: sensex && sensex.price > 0 ? { val: sensex.price, change: sensex.change, pct: sensex.change_percent } : { val: 73910.20, change: 425.80, pct: 0.58 },
          banknifty: banknifty && banknifty.price > 0 ? { val: banknifty.price, change: banknifty.change, pct: banknifty.change_percent } : { val: 48210.80, change: -202.40, pct: -0.42 }
        });
      }

      setTickerStocks(prev => {
        return prev.map(s => {
          const q = quotes[s.symbol];
          if (!q || q.price <= 0) return s;
          return {
            ...s,
            price: q.price,
            originalClose: q.price - q.change,
            pct: q.change_percent
          };
        });
      });

      // Update active symbol's ticked price
      const activeQuote = quotes[currentSymbol];
      if (activeQuote && activeQuote.price > 0) {
        setTickedPrice(activeQuote.price);
        setStockData(prev => {
          if (!prev) return null;
          // Avoid updating if symbol changed in the meantime (race condition prevention)
          if (prev.symbol.toUpperCase() !== currentSymbol.toUpperCase()) return prev;
          return {
            ...prev,
            quote: activeQuote
          };
        });
      }

      // Update watchlist items
      setWatchlist(prev => {
        return prev.map(w => {
          const q = quotes[w.symbol];
          if (!q || q.price <= 0) return w;
          return {
            ...w,
            price: q.price,
            change: q.change,
            change_percent: q.change_percent
          };
        });
      });

    } catch (err) {
      console.warn("Failed to fetch live market rates, using fallback values.", err);
    }
  }, []);

  // Poll live market rates every 15 seconds for fresh updates
  useEffect(() => {
    loadLiveMarketRates();
    const interval = setInterval(() => {
      loadLiveMarketRates();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadLiveMarketRates]);

  useEffect(() => {
    setTimeout(() => {
      loadUserData();
    }, 0);
  }, [loadUserData]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setWatchlist([]);
  };

  // Dynamic default symbol and period on marketType changes
  useEffect(() => {
    setTimeout(() => {
      if (marketType === "stocks") {
        setPeriod("5d");
        setSymbol("RELIANCE.NS");
      } else if (marketType === "fno") {
        setPeriod("1y");
        setSymbol("^NSEI");
      } else {
        setPeriod("1y");
        setSymbol("GC=F");
      }
    }, 0);
  }, [marketType]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    let apiPeriod = period;
    let apiInterval = "1d";
    if (marketType === "stocks") {
      // Use 5m intraday interval only for 1d/5d, use 1d for longer periods
      if (period === "1d" || period === "5d") {
        apiInterval = "5m";
      } else {
        apiInterval = "1d";
      }
      apiPeriod = period;
    } else {
      apiPeriod = period === "1d" || period === "5d" ? "1y" : period;
      apiInterval = "1d";
    }

    try {
      const data = await fetchStockData(symbol, apiPeriod, apiInterval);
      setStockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock data");
      setStockData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, period, marketType]);

  const loadPrediction = useCallback(async () => {
    setPredLoading(true);
    setPredError(null);

    let apiPeriod = period;
    let apiInterval = "1d";
    if (marketType === "stocks") {
      // Use 5m intraday interval only for 1d/5d; use 1d for all longer periods
      if (period === "1d" || period === "5d") {
        apiInterval = "5m";
        apiPeriod = period;
      } else {
        apiInterval = "1d";
        apiPeriod = period;
      }
    } else {
      apiPeriod = period === "1d" || period === "5d" ? "1y" : period;
      apiInterval = "1d";
    }

    try {
      // For prediction, ensure at least 2y of data for the model to have enough samples
      const predPeriod = ["1d", "5d", "1mo", "3mo"].includes(apiPeriod) ? "2y" : apiPeriod;
      const pred = await fetchPrediction(symbol, predPeriod, 5, model, apiInterval === "5m" ? "5m" : "1d");
      setPrediction(pred);
    } catch (err) {
      setPredError(err instanceof Error ? err.message : "Prediction failed");
      setPrediction(null);
    } finally {
      setPredLoading(false);
    }
  }, [symbol, period, model, marketType]);

  useEffect(() => {
    setTimeout(() => {
      loadData();
    }, 0);
  }, [loadData]);

  useEffect(() => {
    setTimeout(() => {
      loadPrediction();
    }, 0);
  }, [loadPrediction]);

  // Update liveData from stockData — no simulation tick
  useEffect(() => {
    const data = stockData?.data ?? [];
    setTimeout(() => {
      setLiveData(data);
    }, 0);
  }, [stockData]);

  // Live ticking price display when market is open (real polling, no fake simulation)
  useEffect(() => {
    if (!stockData || !stockData.quote) return;
    const price = stockData.quote.price;
    setTimeout(() => {
      setTickedPrice(price);
      setPriceDirection(null);
    }, 0);
  }, [stockData]);

  const canonicalSymbol = stockData?.symbol ?? symbol;
  const activeTheme = ACCENTS[accentColor];

  const handleToggleWatchlist = async () => {
    if (!token) {
      handleOpenAuth();
      return;
    }

    const isWatchlisted = watchlist.some((w) => w.symbol.toUpperCase() === canonicalSymbol.toUpperCase());
    try {
      if (isWatchlisted) {
        await removeFromWatchlist(canonicalSymbol);
      } else {
        await addToWatchlist(canonicalSymbol);
      }
      const list = await fetchWatchlist();
      setWatchlist(list);
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
    }
  };

  const quote = stockData?.quote;
  const originalClose = quote ? quote.price - quote.change : null;
  const currentTickedPrice = tickedPrice ?? quote?.price ?? 0;
  const tickedChange = originalClose ? currentTickedPrice - originalClose : quote?.change ?? 0;
  const tickedChangePct = originalClose ? (tickedChange / originalClose) * 100 : quote?.change_percent ?? 0;
  const isTickedPositive = tickedChange >= 0;
  const isCurrentlyWatchlisted = watchlist.some((w) => w.symbol.toUpperCase() === canonicalSymbol.toUpperCase());

  const getCallLtp = (strike: number) => {
    const spot = currentTickedPrice || 100;
    const intrinsic = Math.max(0, spot - strike);
    const dist = Math.abs(spot - strike);
    let strikeStep = 50;
    if (symbol === "^NSEI") strikeStep = 50;
    else if (symbol === "^NSEBANK") strikeStep = 100;
    else if (symbol === "RELIANCE.NS") strikeStep = 20;
    else if (symbol === "TCS.NS") strikeStep = 50;
    else if (symbol === "INFY.NS") strikeStep = 20;
    else strikeStep = 50;
    const timeValue = Math.max(5, strikeStep * 2.5 - dist * 0.25);
    return parseFloat((intrinsic + timeValue).toFixed(2));
  };

  const getPutLtp = (strike: number) => {
    const spot = currentTickedPrice || 100;
    const intrinsic = Math.max(0, strike - spot);
    const dist = Math.abs(spot - strike);
    let strikeStep = 50;
    if (symbol === "^NSEI") strikeStep = 50;
    else if (symbol === "^NSEBANK") strikeStep = 100;
    else if (symbol === "RELIANCE.NS") strikeStep = 20;
    else if (symbol === "TCS.NS") strikeStep = 50;
    else if (symbol === "INFY.NS") strikeStep = 20;
    else strikeStep = 50;
    const timeValue = Math.max(5, strikeStep * 2.5 - dist * 0.25);
    return parseFloat((intrinsic + timeValue).toFixed(2));
  };

  const getCallChg = (strike: number) => {
    const spot = currentTickedPrice || 100;
    const ltp = getCallLtp(strike);
    const delta = strike < spot ? 0.75 : 0.25;
    const chg = tickedChangePct * (spot / Math.max(1, ltp)) * delta;
    return parseFloat(Math.min(500, Math.max(-99, chg)).toFixed(2));
  };

  const getPutChg = (strike: number) => {
    const spot = currentTickedPrice || 100;
    const ltp = getPutLtp(strike);
    const delta = strike > spot ? 0.75 : 0.25;
    const chg = -tickedChangePct * (spot / Math.max(1, ltp)) * delta;
    return parseFloat(Math.min(500, Math.max(-99, chg)).toFixed(2));
  };

  const getMockOI = (strike: number, isCall: boolean) => {
    const seed = strike + (isCall ? 100000 : 200000);
    const rawVal = (Math.sin(seed) * 10000) % 100;
    const absVal = Math.abs(rawVal);
    let strikeStep = 50;
    if (symbol === "^NSEI") strikeStep = 50;
    else if (symbol === "^NSEBANK") strikeStep = 100;
    else if (symbol === "RELIANCE.NS") strikeStep = 20;
    else if (symbol === "TCS.NS") strikeStep = 50;
    else if (symbol === "INFY.NS") strikeStep = 20;
    else strikeStep = 50;
    const spot = currentTickedPrice || 100;
    const atmStrike = Math.round(spot / strikeStep) * strikeStep;
    const distToAtm = Math.abs(strike - atmStrike) / strikeStep;
    const factor = Math.max(0.1, 1 - distToAtm * 0.2);
    return parseFloat((absVal * factor + 5).toFixed(1));
  };

  const getMockVolume = (strike: number, isCall: boolean) => {
    const seed = strike + (isCall ? 300000 : 400000);
    const rawVal = (Math.cos(seed) * 500000) % 100000;
    const absVal = Math.abs(rawVal);
    let strikeStep = 50;
    if (symbol === "^NSEI") strikeStep = 50;
    else if (symbol === "^NSEBANK") strikeStep = 100;
    else if (symbol === "RELIANCE.NS") strikeStep = 20;
    else if (symbol === "TCS.NS") strikeStep = 50;
    else if (symbol === "INFY.NS") strikeStep = 20;
    else strikeStep = 50;
    const spot = currentTickedPrice || 100;
    const atmStrike = Math.round(spot / strikeStep) * strikeStep;
    const distToAtm = Math.abs(strike - atmStrike) / strikeStep;
    const factor = Math.max(0.1, 1 - distToAtm * 0.2);
    return Math.floor(absVal * factor + 1000);
  };

  const bestStock = [...tickerStocks].sort((a, b) => b.pct - a.pct)[0];
  const worstStock = [...tickerStocks].sort((a, b) => a.pct - b.pct)[0];

  const dynamicTickerItems = [
    { symbol: "^NSEI", name: "NIFTY 50", price: indexPrices.nifty.val.toLocaleString("en-IN"), pct: `${indexPrices.nifty.change >= 0 ? "+" : ""}${indexPrices.nifty.pct.toFixed(2)}%`, isPositive: indexPrices.nifty.change >= 0 },
    { symbol: "^BSESN", name: "SENSEX", price: indexPrices.sensex.val.toLocaleString("en-IN"), pct: `${indexPrices.sensex.change >= 0 ? "+" : ""}${indexPrices.sensex.pct.toFixed(2)}%`, isPositive: indexPrices.sensex.change >= 0 },
    { symbol: "^NSEBANK", name: "NIFTY BANK", price: indexPrices.banknifty.val.toLocaleString("en-IN"), pct: `${indexPrices.banknifty.change >= 0 ? "+" : ""}${indexPrices.banknifty.pct.toFixed(2)}%`, isPositive: indexPrices.banknifty.change >= 0 },
    { symbol: bestStock.symbol, name: `🔥 BEST STOCK: ${bestStock.name}`, price: bestStock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }), pct: `${bestStock.pct >= 0 ? "+" : ""}${bestStock.pct.toFixed(2)}%`, isPositive: true },
    { symbol: worstStock.symbol, name: `💀 WORST STOCK: ${worstStock.name}`, price: worstStock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }), pct: `${worstStock.pct >= 0 ? "+" : ""}${worstStock.pct.toFixed(2)}%`, isPositive: false },
    { symbol: "CL=F", name: "Crude Oil", price: "78.45", pct: "-1.44%", isPositive: false }
  ];

  return (
    <div className="w-full bg-transparent text-slate-800">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        marketOpen={marketOpen}
        istTime={istTime}
        token={token}
        user={user}
        handleLogout={handleLogout}
        setIsAuthOpen={handleOpenAuth}
        setIsMapOpen={setIsMapOpen}
        onSelectSymbol={setSymbol}
        accentColor={accentColor}
        setAccentColor={handleSetAccentColor}
        marketType={marketType}
        setMarketType={setMarketType}
        indexPrices={indexPrices}
      />

      {/* Live ticking stock tape */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="w-full overflow-hidden bg-white border border-slate-200/80 rounded-2xl py-2 relative z-10 shadow-xs">
        <motion.div
          animate={{ x: [0, -1080] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
          className="flex gap-4 whitespace-nowrap w-max px-4"
        >
          {[...dynamicTickerItems, ...dynamicTickerItems, ...dynamicTickerItems].map((item, index) => (
            <div
              key={`${item.symbol}-${index}`}
              onClick={() => {
                setSymbol(item.symbol);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50/60 border border-slate-200/80 cursor-pointer shadow-xs transition select-none ${
                accentColor === "cyan" 
                  ? "hover:border-amber-300 hover:bg-amber-50/15" 
                  : accentColor === "emerald" 
                    ? "hover:border-emerald-300 hover:bg-emerald-50/15" 
                    : accentColor === "indigo" 
                      ? "hover:border-orange-300 hover:bg-orange-50/15" 
                      : "hover:border-rose-300 hover:bg-rose-50/15"
              }`}
            >
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide">{item.name}</span>
              <span className="text-[10px] font-mono font-bold text-slate-800">₹{item.price}</span>
              <span className={`text-[9px] font-mono font-black ${item.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {item.pct}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
      </div>

      {/* Main Content Area with 3D Revolving Tab Transitions */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 space-y-4">
      <AnimatePresence mode="wait">
        {!token ? (
          <motion.div 
            key="auth-gate"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch py-8"
          >
            {/* Left Column: Product Showcase & 3D Interactive Mascot */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200/80 rounded-3xl p-8 relative overflow-hidden shadow-xs">
              <div className="space-y-4">
                {/* Logo and Tagline */}
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${activeTheme.gradient} p-2 text-white flex items-center justify-center shadow-md ${activeTheme.shadow}`}>
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20" strokeWidth="2" />
                      <rect x="10" y="5" width="4" height="13" fill="currentColor" rx="0.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">CROKED</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${activeTheme.text}`}>Stock Intelligence App</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    Machine Learning Powered <br/>
                    <span className={`bg-gradient-to-r ${activeTheme.gradient} bg-clip-text text-transparent`}>
                      Indian Stock Market Analytics
                    </span>
                  </h1>
                  <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                    Access forward-looking predictive modeling, real-time news sentiment parsing, and walk-forward validated analytics for NSE/BSE equities.
                  </p>
                </div>
              </div>

              {/* 3D Animated Robot Mascot - Centerpiece */}
              <div className="w-full h-[280px] my-4 relative">
                <HolographicCore3D
                  isEmailFocused={isEmailFocused}
                  isPasswordFocused={isPasswordFocused}
                  loading={authLoading}
                  error={authError}
                  success={authSuccess}
                  accentColor={accentColor}
                />
              </div>

              {/* Sleek Features Showcase Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                    Ensemble Predictors
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Combines XGBoost classifiers & LSTM regressors for trend estimates.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-50"></span>
                    Live Sentiment
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Lexicon-based sentiment extraction from Google News RSS.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                    Drift Monitor
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Walk-forward error logging and real-time accuracy scoring.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Embedded Login/Signup Card */}
            <div className="lg:col-span-5 flex flex-col justify-center bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs relative overflow-hidden min-h-[480px]">
              {/* Tabs Switcher - only visible on signin/signup */}
              {(authTab === "signin" || authTab === "signup") && (
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 mb-6">
                  <button
                    onClick={() => { setAuthTab("signin"); setAuthError(null); }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                      authTab === "signin"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthTab("signup"); setAuthError(null); }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                      authTab === "signup"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Headers for non-signin/signup states */}
              {authTab === "forgot" && (
                <div className="flex items-center gap-2 mb-5">
                  <button onClick={() => { setAuthTab("signin"); setAuthError(null); }} className="text-slate-400 hover:text-slate-600 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight">Reset Password</h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Verification code will be logged to console</p>
                  </div>
                </div>
              )}

              {authTab === "verify" && (
                <div className="flex items-center gap-2 mb-5">
                  <button onClick={() => { setAuthTab("forgot"); setAuthError(null); }} className="text-slate-400 hover:text-slate-600 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight">Enter Code</h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Check console / screen for code</p>
                  </div>
                </div>
              )}

              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-600 font-semibold text-center leading-normal"
                >
                  {authError}
                </motion.div>
              )}

              {authSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-600 font-semibold text-center leading-normal"
                >
                  {authTab === "signin" ? "✓ Success! Logging you in..." : "✓ Success! Account created, redirecting to login..."}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {authTab === "signin" && (
                  <motion.form
                    key="signin-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleAuthLogin}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                      <input
                        ref={authEmailInputRef}
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={authShowPassword ? "text" : "password"}
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 pl-4 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setAuthShowPassword(v => !v)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-655 transition"
                        >
                          {authShowPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L17.772 17.772m0 0a9.043 9.043 0 01-5.772 1.728 9.043 9.043 0 01-5.772-1.728m0 0l-3.21-3.21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644 10.542 10.542 0 0110.485-5.322 10.542 10.542 0 0110.485 5.322 1.012 1.012 0 010 .644 10.543 10.543 0 01-10.485 5.322 10.543 10.543 0 01-10.485-5.322z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="text-right mt-1.5">
                        <button
                          type="button"
                          onClick={() => { setAuthTab("forgot"); setAuthError(null); }}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={authLoading}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${activeTheme.primary} ${activeTheme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xs`}
                    >
                      {authLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : "Sign In to Dashboard"}
                    </motion.button>
                  </motion.form>
                )}

                {authTab === "signup" && (
                  <motion.form
                    key="signup-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleAuthRegister}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        placeholder="Min. 8 characters"
                        className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-medium"
                      />
                      {authConfirmPassword && (
                        <p className={`text-[10px] font-semibold mt-1.5 ${authPassword === authConfirmPassword ? "text-emerald-600" : "text-rose-600"}`}>
                          {authPassword === authConfirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                        </p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={authLoading}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${activeTheme.primary} ${activeTheme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xs`}
                    >
                      {authLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : "Create Free Account"}
                    </motion.button>
                  </motion.form>
                )}

                {authTab === "forgot" && (
                  <motion.form
                    key="forgot-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleAuthForgotSubmit}
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-450 shrink-0 mt-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                      </svg>
                      <p className="leading-relaxed">
                        Enter your registered email and we will generate a 6-digit verification code to reset your password.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-medium"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={authLoading}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${activeTheme.primary} ${activeTheme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`}
                    >
                      {authLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : "Send Reset Code"}
                    </motion.button>
                  </motion.form>
                )}

                {authTab === "verify" && (
                  <motion.form
                    key="verify-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleAuthVerifySubmit}
                    className="space-y-4"
                  >
                    {authVerifyCode ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-450 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Demo Reset Code</p>
                          <p className="text-lg font-black font-mono text-slate-800 tracking-widest mt-0.5">{authVerifyCode}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <div>
                          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">Check Your Email</p>
                          <p className="text-xs font-semibold text-amber-800 mt-0.5">The 6-digit code was sent to your email or logged to the server console.</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Verification Code</label>
                      <input
                        type="text"
                        required
                        value={authEnteredCode}
                        onChange={(e) => setAuthEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit code"
                        maxLength={6}
                        className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-mono tracking-[0.3em] text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={authShowNewPassword ? "text" : "password"}
                          required
                          value={authNewPassword}
                          onChange={(e) => setAuthNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full rounded-xl border border-slate-250 bg-slate-50/50 py-3 pl-4 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-450 focus:border-slate-450 transition-all duration-200 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setAuthShowNewPassword(v => !v)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-655 transition"
                        >
                          {authShowNewPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L17.772 17.772m0 0a9.043 9.043 0 01-5.772 1.728 9.043 9.043 0 01-5.772-1.728m0 0l-3.21-3.21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644 10.542 10.542 0 0110.485-5.322 10.542 10.542 0 0110.485 5.322 1.012 1.012 0 010 .644 10.543 10.543 0 01-10.485 5.322 10.543 10.543 0 01-10.485-5.322z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={authLoading}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition ${activeTheme.primary} ${activeTheme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`}
                    >
                      {authLoading ? (
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : "Reset Password"}
                    </motion.button>
                  </motion.form>
                )}

                {authTab === "reset-success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 space-y-4"
                  >
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">Password Updated</h3>
                      <p className="text-xs text-slate-500 mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                        Your password has been successfully updated. You can now sign in using your new password.
                      </p>
                    </div>
                    <button
                      onClick={() => { setAuthTab("signin"); setAuthError(null); }}
                      className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition ${activeTheme.primary} ${activeTheme.hoverBg} shadow-sm`}
                    >
                      Back to Sign In
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : currentTab === "drift" ? (
          <motion.div
            key="drift-tab"
            initial={{ opacity: 0, rotateY: -35, z: -100 }}
            animate={{ opacity: 1, rotateY: 0, z: 0 }}
            exit={{ opacity: 0, rotateY: 35, z: -100 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" as const, perspective: 1000 }}
          >
            <DriftMonitor />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-tab"
            initial={{ opacity: 0, rotateY: 35, z: -100 }}
            animate={{ opacity: 1, rotateY: 0, z: 0 }}
            exit={{ opacity: 0, rotateY: -35, z: -100 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" as const, perspective: 1000 }}
            className="grid gap-8 lg:grid-cols-4 items-start"
          >
            {/* Left Watchlist Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <ThreeDCard className="shadow-sm">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Star className={`h-4 w-4 ${activeTheme.text} fill-current/10`} />
                    My Watchlist
                  </h3>
                  
                  {watchlist.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center leading-normal">
                      Your watchlist is empty. Click the star next to any stock symbol to add it here.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {watchlist.map((item) => {
                        const positive = item.change >= 0;
                        return (
                          <motion.div
                            whileHover={{ x: 2, backgroundColor: "rgba(241, 245, 249, 0.6)" }}
                            key={item.symbol}
                            onClick={() => setSymbol(item.symbol)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors ${
                              symbol === item.symbol
                                ? "bg-slate-100 border-slate-350 text-slate-900 font-semibold"
                                : "bg-slate-50/40 border-slate-100 hover:bg-slate-100/55 text-slate-650 hover:text-slate-800"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold uppercase tracking-wide">{item.symbol}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold text-slate-900">
                                ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </p>
                              <p className={`text-[10px] font-mono font-bold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
                                {positive ? "+" : ""}{item.change_percent.toFixed(2)}%
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ThreeDCard>
            </div>

            {/* Main Dashboard Content */}
            <div className="lg:col-span-3 space-y-8">
              <motion.header 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${activeTheme.text}`}>
                    <LineChart className="h-3.5 w-3.5 animate-pulse" />
                    NSE · BSE · India F&O & Commodities
                  </p>
                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    CROKED Stock Intelligence
                  </h1>
                  <p className="mt-2 text-slate-500 text-xs font-medium">
                    ML-powered trend analysis for Indian equities, indexes, and commodities. Probabilistic forecasts with
                    walk-forward validated accuracy — not financial advice.
                  </p>
                </div>
                {!marketOpen && (
                  <div className="rounded-2xl border border-amber-250 bg-amber-50/45 p-4 text-amber-800 text-xs font-semibold flex items-start gap-3 shadow-xs">
                    <span className="relative flex h-2 w-2 shrink-0 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <div>
                      <p className="font-black text-amber-950 leading-tight">Live Indian Markets are Closed</p>
                      <p className="text-[10px] text-amber-800 mt-1 leading-normal font-medium">
                        Trading hours are Monday - Friday, 9:15 AM - 3:30 PM IST. Prices shown represent the latest market close data.
                      </p>
                    </div>
                  </div>
                )}
                <StockSearchBar onSelect={setSymbol} selectedSymbol={symbol} marketType={marketType} />
              </motion.header>

              {loading && (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className={`h-8 w-8 animate-spin ${activeTheme.text}`} />
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-250 bg-rose-50 p-6 text-rose-700 font-bold text-xs shadow-sm">
                  {error}
                </div>
              )}

              {stockData && !loading && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    {/* Symbol Profile & 3D Gauge Section */}
                    <section className="grid gap-6 md:grid-cols-3 border-t border-slate-200 pt-6 items-center">
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-slate-900">{stockData.name}</h2>
                          <button
                            onClick={handleToggleWatchlist}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCurrentlyWatchlisted
                                ? activeTheme.badge
                                : "bg-white border-slate-200 text-slate-450 hover:text-slate-700 hover:bg-slate-50 shadow-sm"
                            }`}
                            title={isCurrentlyWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                          >
                            <Star className={`h-4 w-4 ${isCurrentlyWatchlisted ? `fill-current ${activeTheme.text}` : ""}`} />
                          </button>
                        </div>
                        <p className="text-slate-550 text-xs font-bold uppercase tracking-wide">
                          {stockData.symbol} · {stockData.sector} · {stockData.exchange}
                        </p>

                        {/* Live Ticking Price Box */}
                        <div className="flex items-center gap-1.5">
                          <motion.div 
                            animate={priceDirection ? { scale: [1, 1.03, 1] } : {}}
                            transition={{ duration: 0.4 }}
                            className={`flex items-baseline gap-3 px-5 py-3 rounded-2xl border transition-all duration-700 ${
                              priceDirection === "up" 
                                ? "bg-emerald-50 border-emerald-250 text-emerald-700 shadow-md shadow-emerald-500/5 scale-[1.015]" 
                                : priceDirection === "down" 
                                  ? "bg-rose-50 border-rose-250 text-rose-700 shadow-md shadow-rose-500/5 scale-[1.015]" 
                                  : "bg-white border-slate-200 text-slate-900 shadow-sm"
                            }`}
                          >
                            <IndianRupee className="h-5 w-5 text-slate-400" />
                            <span className="text-3xl font-mono font-black tracking-tight">
                              {currentTickedPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`text-sm font-bold font-mono ${isTickedPositive ? "text-emerald-600" : "text-rose-600"}`}
                            >
                              {isTickedPositive ? "+" : ""}
                              {tickedChange.toFixed(2)} ({tickedChangePct.toFixed(2)}%)
                            </span>
                          </motion.div>
                        </div>
                      </div>

                      {/* 3D Gauge Card */}
                      <div className="md:col-span-1 h-full flex items-center">
                        <ThreeDCard className="shadow-sm w-full">
                          <div className="bg-white rounded-2xl border border-slate-200">
                            <ThreeDMarketGauge
                              predictedDirection={prediction?.predicted_direction ?? null}
                              confidence={prediction?.direction_confidence ?? null}
                              modelName={prediction?.model ?? "Ensemble"}
                            />
                          </div>
                        </ThreeDCard>
                      </div>
                    </section>

                    {/* Actions & Model Selector Bar */}
                    <div className="flex flex-wrap items-center gap-4 justify-between border-b border-slate-200 pb-4">
                      {/* Period selection */}
                      <div className="flex items-center gap-2">
                        {periodOptions.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setPeriod(p.value)}
                            className={`rounded-lg px-3.5 py-2 text-xs font-semibold border transition ${
                              period === p.value
                                ? `text-white shadow-sm border-transparent ${activeTheme.primary}`
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Model selection & Refresh */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                          {MODELS.map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => setModel(m.value)}
                              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition ${
                                model === m.value
                                  ? `bg-white border-slate-200 shadow-sm ${activeTheme.text}`
                                  : "border-transparent text-slate-450 hover:text-slate-700"
                              }`}
                            >
                              {m.value}
                            </button>
                          ))}
                        </div>

                        <motion.button
                           whileTap={{ scale: 0.95 }}
                           type="button"
                           onClick={() => {
                             loadData();
                             loadPrediction();
                           }}
                           className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-655 hover:bg-slate-50 transition shadow-sm"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-slate-450" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Charts and Predictors Wrapper */}
                    <div className="space-y-6">
                      {/* 3D Price Chart Card */}
                      <ThreeDCard className="shadow-sm">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Activity className={`h-4 w-4 ${activeTheme.text}`} />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Price & Moving Averages</h3>
                          </div>
                          <PriceChart data={liveData} symbol={symbol} period={period} />
                        </div>
                      </ThreeDCard>

                      {/* 3D Indicator Charts Grid */}
                      <div className="grid gap-6 lg:grid-cols-2">
                        <ThreeDCard className="shadow-sm">
                          <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h3 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">RSI (14)</h3>
                            <IndicatorChart data={liveData} type="rsi" symbol={symbol} period={period} />
                          </div>
                        </ThreeDCard>
                        
                        <ThreeDCard className="shadow-sm">
                          <div className="rounded-2xl border border-slate-205 bg-white p-6">
                            <h3 className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">MACD</h3>
                            <IndicatorChart data={liveData} type="macd" symbol={symbol} period={period} />
                          </div>
                        </ThreeDCard>
                      </div>

                      {/* F&O Option Chain (Live Chains) Section */}
                      {marketType === "fno" && (() => {
                        let strikeStep = 50;
                        if (symbol === "^NSEI") strikeStep = 50;
                        else if (symbol === "^NSEBANK") strikeStep = 100;
                        else if (symbol === "RELIANCE.NS") strikeStep = 20;
                        else if (symbol === "TCS.NS") strikeStep = 50;
                        else if (symbol === "INFY.NS") strikeStep = 20;
                        else strikeStep = 50;

                        const spot = currentTickedPrice || 100;
                        const atmStrike = Math.round(spot / strikeStep) * strikeStep;
                        const strikes: number[] = [];
                        for (let i = -4; i <= 4; i++) {
                          strikes.push(atmStrike + i * strikeStep);
                        }

                        return (
                          <ThreeDCard className="shadow-sm">
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Live Option Chain (Live Chains)
                                  </h3>
                                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                                    Underlying: {symbol} · Spot: ₹{spot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-700 uppercase tracking-wide">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                    Simulated Data
                                  </span>
                                </div>
                                
                                {/* Expiration selection */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider">EXPIRY DATE</span>
                                  <select
                                    value={selectedExpiration}
                                    onChange={(e) => setSelectedExpiration(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-cyan-500"
                                  >
                                    {EXPIRATIONS.map((exp) => (
                                      <option key={exp} value={exp}>{exp}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-455 tracking-wider border-b border-slate-200">
                                      <th colSpan={4} className="py-2.5 border-r border-slate-200 text-emerald-600 bg-emerald-50/20">CALLS</th>
                                      <th className="py-2.5 px-4 font-black text-slate-600 bg-slate-100">STRIKE</th>
                                      <th colSpan={4} className="py-2.5 border-l border-slate-200 text-rose-600 bg-rose-50/20">PUTS</th>
                                    </tr>
                                    <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-200">
                                      <th className="py-2 px-1">OI (Lakhs)</th>
                                      <th className="py-2 px-1">Volume</th>
                                      <th className="py-2 px-1">LTP (₹)</th>
                                      <th className="py-2 px-1 border-r border-slate-200">Net Chg %</th>
                                      <th className="py-2 px-4 font-black text-slate-655 bg-slate-100">STRIKE PRICE</th>
                                      <th className="py-2 px-1 border-l border-slate-200">Net Chg %</th>
                                      <th className="py-2 px-1">LTP (₹)</th>
                                      <th className="py-2 px-1">Volume</th>
                                      <th className="py-2 px-1">OI (Lakhs)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {strikes.map((strike) => {
                                      const callLtp = getCallLtp(strike);
                                      const callChg = getCallChg(strike);
                                      const callOI = getMockOI(strike, true);
                                      const callVol = getMockVolume(strike, true);
                                      
                                      const putLtp = getPutLtp(strike);
                                      const putChg = getPutChg(strike);
                                      const putOI = getMockOI(strike, false);
                                      const putVol = getMockVolume(strike, false);
                                      
                                      const isCallITM = strike < spot;
                                      const isPutITM = strike > spot;
                                      const isATM = Math.abs(strike - atmStrike) < 0.1;
                                      
                                      return (
                                        <tr key={strike} className="border-b border-slate-150 hover:bg-slate-50/50 transition">
                                          <td className={`py-2 px-1 font-mono text-slate-550 ${isCallITM ? "bg-emerald-50/10" : ""}`}>{callOI.toLocaleString("en-IN")} L</td>
                                          <td className={`py-2 px-1 font-mono text-slate-550 ${isCallITM ? "bg-emerald-50/10" : ""}`}>{callVol.toLocaleString("en-IN")}</td>
                                          <td className={`py-2 px-1 font-mono font-bold text-slate-800 ${isCallITM ? "bg-emerald-50/20" : ""}`}>
                                            ₹{callLtp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className={`py-2 px-1 font-mono font-black border-r border-slate-250 ${isCallITM ? "bg-emerald-50/10" : ""} ${callChg >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {callChg >= 0 ? "+" : ""}{callChg}%
                                          </td>
                                          
                                          <td className={`py-2 px-4 font-mono font-extrabold text-slate-900 bg-slate-100/80 ${isATM ? "ring-2 ring-cyan-500 rounded-md shadow-xs z-10 relative" : ""}`}>
                                            {strike.toLocaleString("en-IN")}
                                          </td>
                                          
                                          <td className={`py-2 px-1 font-mono font-black border-l border-slate-250 ${isPutITM ? "bg-rose-50/10" : ""} ${putChg >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {putChg >= 0 ? "+" : ""}{putChg}%
                                          </td>
                                          <td className={`py-2 px-1 font-mono font-bold text-slate-800 ${isPutITM ? "bg-rose-50/20" : ""}`}>
                                            ₹{putLtp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className={`py-2 px-1 font-mono text-slate-550 ${isPutITM ? "bg-rose-50/10" : ""}`}>{putVol.toLocaleString("en-IN")}</td>
                                          <td className={`py-2 px-1 font-mono text-slate-550 ${isPutITM ? "bg-rose-50/10" : ""}`}>{putOI.toLocaleString("en-IN")} L</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </ThreeDCard>
                        );
                      })()}

                      {(() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const latestPoint = stockData && stockData.data.length > 0 ? (stockData.data[stockData.data.length - 1] as any) : null;
                        const rsiVal = latestPoint?.rsi ?? 50;
                        const macdVal = latestPoint?.macd ?? 0;
                        const macdSignal = latestPoint?.macd_signal ?? 0;
                        const sma20 = latestPoint?.sma_20;
                        const sma50 = latestPoint?.sma_50;
                        const sentiment = latestPoint?.headline_sentiment ?? 0;

                        let smaStatus = "Neutral";
                        let smaColor = "text-slate-500";
                        let smaBarBg = "bg-slate-200";
                        let smaStrength = 50;
                        if (sma20 && sma50) {
                          if (sma20 > sma50) {
                            smaStatus = "Bullish Cross";
                            smaColor = "text-emerald-600";
                            smaBarBg = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                            smaStrength = 75;
                          } else {
                            smaStatus = "Bearish Cross";
                            smaColor = "text-rose-600";
                            smaBarBg = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]";
                            smaStrength = 25;
                          }
                        }

                        let rsiStatus = "Neutral";
                        let rsiColor = "text-slate-500";
                        let rsiBarBg = "bg-slate-200";
                        let rsiStrength = 50;
                        if (rsiVal < 30) {
                          rsiStatus = "Oversold (Buy)";
                          rsiColor = "text-emerald-600";
                          rsiBarBg = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                          rsiStrength = 85;
                        } else if (rsiVal > 70) {
                          rsiStatus = "Overbought (Sell)";
                          rsiColor = "text-rose-600";
                          rsiBarBg = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]";
                          rsiStrength = 15;
                        } else {
                          rsiStatus = `Neutral (${rsiVal.toFixed(0)})`;
                          rsiStrength = rsiVal;
                        }

                        let macdStatus = "Bearish";
                        let macdColor = "text-rose-600";
                        let macdBarBg = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]";
                        let macdStrength = 30;
                        if (macdVal > macdSignal) {
                          macdStatus = "Bullish Crossover";
                          macdColor = "text-emerald-600";
                          macdBarBg = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                          macdStrength = 70;
                        }

                        let sentStatus = "Neutral";
                        let sentColor = "text-slate-500";
                        let sentBarBg = "bg-slate-200";
                        let sentStrength = 50;
                        if (sentiment > 0.05) {
                          sentStatus = "Bullish Sentiment";
                          sentColor = "text-emerald-600";
                          sentBarBg = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                          sentStrength = 75;
                        } else if (sentiment < -0.05) {
                          sentStatus = "Bearish Sentiment";
                          sentColor = "text-rose-600";
                          sentBarBg = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]";
                          sentStrength = 25;
                        }

                        let bullishSignals = 0;
                        const totalSignals = 4;
                        if (smaStatus.includes("Bullish")) bullishSignals++;
                        if (rsiStatus.includes("Oversold")) bullishSignals++;
                        if (macdStatus.includes("Bullish")) bullishSignals++;
                        if (sentStatus.includes("Bullish")) bullishSignals++;

                        let bearishSignals = 0;
                        if (smaStatus.includes("Bearish")) bearishSignals++;
                        if (rsiStatus.includes("Overbought")) bearishSignals++;
                        if (macdStatus.includes("Bearish")) bearishSignals++;
                        if (sentStatus.includes("Bearish")) bearishSignals++;

                        const signalScore = totalSignals > 0 ? (bullishSignals / totalSignals) * 100 : 50;
                        let consensusLabel = "NEUTRAL";
                        let consensusColor = "text-slate-600 border-slate-200 bg-slate-50";
                        if (signalScore >= 75) {
                          consensusLabel = "STRONG BUY";
                          consensusColor = "text-emerald-700 border-emerald-200 bg-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                        } else if (signalScore >= 50) {
                          consensusLabel = "BUY";
                          consensusColor = "text-emerald-600 border-emerald-100 bg-emerald-50/50";
                        } else if (signalScore <= 25) {
                          consensusLabel = "STRONG SELL";
                          consensusColor = "text-rose-700 border-rose-200 bg-rose-50 shadow-[0_0_12px_rgba(244,63,94,0.15)]";
                        } else if (signalScore <= 45) {
                          consensusLabel = "SELL";
                          consensusColor = "text-rose-600 border-rose-100 bg-rose-50/50";
                        }

                        return (
                          <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                              <PredictionPanel
                                prediction={prediction}
                                loading={predLoading}
                                error={predError}
                              />
                            </div>
                            <div className="lg:col-span-1">
                              <ThreeDCard className="shadow-sm h-full">
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 h-full flex flex-col justify-between">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Technical Scorecard</h3>
                                      <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wider border ${consensusColor}`}>
                                        {consensusLabel}
                                      </span>
                                    </div>

                                    {/* Score meter bar */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>SIGNAL SCORE</span>
                                        <span>{signalScore}% BULLISH</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-1000 ${
                                            signalScore >= 50 ? "bg-emerald-500" : "bg-rose-500"
                                          }`} 
                                          style={{ width: `${signalScore}%` }} 
                                        />
                                      </div>
                                    </div>

                                    {/* Individual Indicator List */}
                                    <div className="space-y-3.5 pt-2">
                                      {/* Moving Averages */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                          <span className="text-slate-550">EMA 20 / EMA 50</span>
                                          <span className={smaColor}>{smaStatus}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-1000 ${smaBarBg}`} style={{ width: `${smaStrength}%` }} />
                                        </div>
                                      </div>

                                      {/* RSI */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                          <span className="text-slate-550">RSI Indicator</span>
                                          <span className={rsiColor}>{rsiStatus}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-1000 ${rsiBarBg}`} style={{ width: `${rsiStrength}%` }} />
                                        </div>
                                      </div>

                                      {/* MACD Crossover */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                          <span className="text-slate-550">MACD Crossover</span>
                                          <span className={macdColor}>{macdStatus}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-1000 ${macdBarBg}`} style={{ width: `${macdStrength}%` }} />
                                        </div>
                                      </div>

                                      {/* Sentiment score */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                          <span className="text-slate-550">News Sentiment</span>
                                          <span className={sentColor}>{sentStatus}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-1000 ${sentBarBg}`} style={{ width: `${sentStrength}%` }} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3 flex justify-between items-center">
                                    <span>BULLISH: {bullishSignals} / {totalSignals}</span>
                                    <span>BEARISH: {bearishSignals} / {totalSignals}</span>
                                  </div>
                                </div>
                              </ThreeDCard>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Multi-Layer Market Intelligence Section */}
                      {(() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const latestDataPoint = stockData && stockData.data.length > 0 ? (stockData.data[stockData.data.length - 1] as any) : null;
                        return (
                          <ThreeDCard className="shadow-sm">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${activeTheme.primary}`} />
                                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Multi-Layer Market Intelligence</h3>
                                </div>
                                
                                {/* Sub-tabs */}
                                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                                  {([
                                    { id: "news", label: "News & Sentiment" },
                                    { id: "institutional", label: "FII/DII Flows" },
                                    { id: "macro", label: "Macro Context" },
                                    { id: "delivery", label: "Delivery & Volatility" },
                                  ] as const).map((tab) => (
                                    <button
                                      key={tab.id}
                                      onClick={() => setSubTab(tab.id)}
                                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                        subTab === tab.id
                                          ? `bg-white border-slate-200 shadow-sm ${activeTheme.text}`
                                          : "border-transparent text-slate-500 hover:text-slate-855"
                                      }`}
                                    >
                                      {tab.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Tab Content with 3D Rotate Transition */}
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={subTab}
                                  initial={{ opacity: 0, rotateX: 10, z: -30 }}
                                  animate={{ opacity: 1, rotateX: 0, z: 0 }}
                                  exit={{ opacity: 0, rotateX: -10, z: -30 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  style={{ transformStyle: "preserve-3d" as const }}
                                  className="w-full"
                                >
                                  {subTab === "news" && (
                                    <div className="space-y-4">
                                      {/* Sentiment Stats Row */}
                                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-center shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Headline Sentiment</p>
                                          <p className={`text-xl font-bold mt-1 ${
                                            latestDataPoint?.headline_sentiment > 0.05 
                                              ? "text-emerald-600" 
                                              : latestDataPoint?.headline_sentiment < -0.05 
                                                ? "text-rose-600" 
                                                : "text-slate-655"
                                          }`}>
                                            {latestDataPoint?.headline_sentiment > 0.05 ? "Bullish" : (latestDataPoint?.headline_sentiment < -0.05 ? "Bearish" : "Neutral")}
                                            <span className="text-xs font-normal ml-1.5 font-mono text-slate-400">
                                              ({latestDataPoint?.headline_sentiment?.toFixed(2)})
                                            </span>
                                          </p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-center shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Positive Ratio</p>
                                          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                                            {latestDataPoint?.positive_ratio != null ? `${(latestDataPoint.positive_ratio * 100).toFixed(0)}%` : "0%"}
                                          </p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-center shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Daily News Count</p>
                                          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                                            {latestDataPoint?.news_count ?? 0}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Headlines List */}
                                      <div className="space-y-3 mt-4">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                          <Newspaper className={`h-3.5 w-3.5 ${activeTheme.text}`} />
                                          Market Headlines
                                        </h4>
                                        {stockData.news && stockData.news.length > 0 ? (
                                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                            {stockData.news.map((item, idx) => (
                                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50/40 border border-slate-150 rounded-xl gap-2 hover:bg-slate-50 transition shadow-inner">
                                                <div className="space-y-1">
                                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className={`text-xs font-semibold text-slate-800 transition line-clamp-1 ${
                                                    accentColor === "cyan" 
                                                      ? "hover:text-amber-600" 
                                                      : accentColor === "emerald" 
                                                        ? "hover:text-emerald-600" 
                                                        : accentColor === "indigo" 
                                                          ? "hover:text-orange-600" 
                                                          : "hover:text-rose-600"
                                                  }`}>
                                                    {item.headline}
                                                  </a>
                                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                    <span>{item.publisher}</span>
                                                    <span>·</span>
                                                    <span>{item.date}</span>
                                                  </div>
                                                </div>
                                                <span className={`self-start sm:self-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                  item.sentiment === "positive" 
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                                    : item.sentiment === "negative" 
                                                      ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                      : "bg-slate-100 text-slate-500 border-slate-200"
                                                }`}>
                                                  {item.sentiment}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-400 italic py-4">No recent headlines found.</p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {subTab === "institutional" && (
                                    <div className="space-y-4 animate-fade-in">
                                      {/* FII DII Stats */}
                                      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">FII BUY</p>
                                          <p className="text-sm font-mono font-bold text-slate-800 mt-1">
                                            ₹{latestDataPoint?.fii_buy?.toLocaleString("en-IN")} Cr
                                          </p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">FII SELL</p>
                                          <p className="text-sm font-mono font-bold text-slate-800 mt-1">
                                            ₹{latestDataPoint?.fii_sell?.toLocaleString("en-IN")} Cr
                                          </p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DII BUY</p>
                                          <p className="text-sm font-mono font-bold text-slate-800 mt-1">
                                            ₹{latestDataPoint?.dii_buy?.toLocaleString("en-IN")} Cr
                                          </p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DII SELL</p>
                                          <p className="text-sm font-mono font-bold text-slate-800 mt-1">
                                            ₹{latestDataPoint?.dii_sell?.toLocaleString("en-IN")} Cr
                                          </p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center col-span-2 md:col-span-1 shadow-inner">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                            <Coins className={`h-3 w-3 ${activeTheme.text}`} />
                                            NET FLOW
                                          </p>
                                          <p className={`text-sm font-mono font-bold mt-1 ${latestDataPoint?.net_flow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {latestDataPoint?.net_flow >= 0 ? "+" : ""}
                                            ₹{latestDataPoint?.net_flow?.toLocaleString("en-IN")} Cr
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-700 uppercase tracking-wide">
                                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                          Simulated Data
                                        </span>
                                        <p className="text-[10px] text-slate-400 italic">
                                          FII/DII flows are statistically modelled (not real NSDL/SEBI data). For educational purposes only.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {subTab === "macro" && (
                                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 animate-fade-in">
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">USD-INR Rate</p>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                          ₹{latestDataPoint?.usdinr?.toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1 flex items-center gap-1">
                                          <Globe className="h-3 w-3 text-slate-400" /> Currency volatility
                                        </p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Crude Oil Price</p>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                          ${latestDataPoint?.crude_oil?.toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Per barrel (WTI Crude)</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gold Price (Ounce)</p>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                          ${latestDataPoint?.gold?.toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Global safe-haven asset</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">US 10-Yr Yield</p>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                          {latestDataPoint?.us10y?.toFixed(2)}%
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Global yield baseline</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RBI Repo Rate</p>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                          {latestDataPoint?.repo_rate?.toFixed(2)}%
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Indian benchmark rate</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CPI Inflation</p>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                          {latestDataPoint?.cpi?.toFixed(2)}%
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Indian inflation (CPI)</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 col-span-2 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">India GDP Growth</p>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                          +{latestDataPoint?.gdp?.toFixed(2)}%
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Quarterly growth projection</p>
                                      </div>
                                    </div>
                                  )}

                                  {subTab === "delivery" && (
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 animate-fade-in">
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Delivery Percentage</p>
                                        <p className="text-xl font-mono font-bold text-slate-900 mt-1">
                                          {latestDataPoint?.delivery_pct != null ? `${(latestDataPoint.delivery_pct * 100).toFixed(1)}%` : "N/A"}
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Delivery proportion of total volume.</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Daily Trades Count</p>
                                        <p className="text-xl font-mono font-bold text-slate-900 mt-1">
                                          {latestDataPoint?.trades?.toLocaleString("en-IN") ?? "N/A"}
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Total transaction count executed.</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">VWAP (20-day)</p>
                                        <p className="text-xl font-mono font-bold text-slate-900 mt-1">
                                          ₹{latestDataPoint?.vwap?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "N/A"}
                                        </p>
                                        <p className="text-[10px] text-slate-450 mt-1">Volume Weighted Average Price.</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-inner">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                          <Percent className={`h-3.5 w-3.5 ${activeTheme.text}`} />
                                          Corporate Action
                                        </p>
                                        <p className={`text-xl font-bold mt-1 ${latestDataPoint?.is_corporate_action ? activeTheme.text : "text-slate-450"}`}>
                                          {latestDataPoint?.is_corporate_action ? "Active Event" : "No Active Event"}
                                        </p>
                                        {latestDataPoint?.dividend > 0 && (
                                          <p className="text-[10px] text-emerald-600 mt-1 font-bold">Dividend: ₹{latestDataPoint.dividend}</p>
                                        )}
                                        {latestDataPoint?.split !== 1 && latestDataPoint?.split != null && (
                                          <p className={`text-[10px] mt-1 font-bold font-mono ${activeTheme.text}`}>Split: {latestDataPoint.split}:1</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </ThreeDCard>
                        );
                      })()}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>{/* end max-w-7xl content container */}



      {/* Directory redirects directory modal map overlay */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className={`h-5 w-5 ${activeTheme.text}`} />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Indian Stock Rebranding Directory</h3>
              </div>
              <button onClick={() => setIsMapOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono">Close</button>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              Some Indian stock tickers have merged or rebranded. Search mapping helps redirect legacy queries to SEBI registered symbols.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {[
                { old: "ZOMATO", newSymbol: "ETERNAL.NS", name: "Zomato Ltd ➔ Eternal Ltd" },
                { old: "MINDTREE", newSymbol: "LTIM.NS", name: "Mindtree Ltd ➔ LTIMindtree" },
                { old: "ADANITRANS", newSymbol: "ADANIENSOL.NS", name: "Adani Transmission ➔ Adani Energy Solutions" },
                { old: "GOLD", newSymbol: "GC=F", name: "Gold Commodities" },
                { old: "CRUDE", newSymbol: "CL=F", name: "Crude Oil Futures" },
                { old: "NIFTYFUT", newSymbol: "^NSEI", name: "Nifty Futures ➔ Nifty 50 Index" },
              ].map((item) => (
                <div 
                  key={item.old}
                  onClick={() => {
                    setSymbol(item.newSymbol);
                    setIsMapOpen(false);
                  }}
                  className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-105 border border-slate-150 hover:border-slate-200 cursor-pointer transition"
                >
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 font-mono block">SEARCH KEY: {item.old}</span>
                    <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase font-mono ${activeTheme.text}`}>{item.newSymbol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
