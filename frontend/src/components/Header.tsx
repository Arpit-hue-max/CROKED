"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Settings,
  BookOpen,
  HelpCircle,
  User as UserIcon,
  LogIn,
  LogOut,
  LayoutDashboard,
  Gauge,
  Palette,
  Check,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export interface HeaderProps {
  currentTab: "dashboard" | "drift";
  setCurrentTab: (tab: "dashboard" | "drift") => void;
  marketOpen: boolean;
  istTime: string;
  token: string | null;
  user: { email: string } | null;
  handleLogout: () => void;
  setIsAuthOpen: (open: boolean) => void;
  setIsMapOpen: (open: boolean) => void;
  onSelectSymbol: (symbol: string) => void;
  accentColor: "cyan" | "emerald" | "indigo" | "violet";
  setAccentColor: (color: "cyan" | "emerald" | "indigo" | "violet") => void;
  marketType: "stocks" | "fno" | "commodity";
  setMarketType: (type: "stocks" | "fno" | "commodity") => void;
  indexPrices: {
    nifty: { val: number; change: number; pct: number };
    sensex: { val: number; change: number; pct: number };
    banknifty: { val: number; change: number; pct: number };
  };
  // marketMode removed — simulation feature has been removed
}

export const ACCENTS = {
  cyan: {
    primary: "bg-amber-600",
    hoverBg: "hover:bg-amber-500",
    hoverBgLight: "hover:bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    borderFocus: "focus-within:border-amber-500 focus-within:ring-amber-100",
    gradient: "from-amber-600 to-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    lightBg: "bg-amber-50/20",
    ring: "focus:ring-amber-500",
    shadow: "shadow-amber-600/15",
    glow: "shadow-amber-500/10",
  },
  emerald: {
    primary: "bg-emerald-600",
    hoverBg: "hover:bg-emerald-500",
    hoverBgLight: "hover:bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    borderFocus: "focus-within:border-emerald-500 focus-within:ring-emerald-100",
    gradient: "from-emerald-600 to-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    lightBg: "bg-emerald-50/20",
    ring: "focus:ring-emerald-500",
    shadow: "shadow-emerald-600/15",
    glow: "shadow-emerald-500/10",
  },
  indigo: {
    primary: "bg-orange-600",
    hoverBg: "hover:bg-orange-500",
    hoverBgLight: "hover:bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    borderFocus: "focus-within:border-orange-500 focus-within:ring-orange-100",
    gradient: "from-orange-600 to-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-100",
    lightBg: "bg-orange-50/20",
    ring: "focus:ring-orange-500",
    shadow: "shadow-orange-600/15",
    glow: "shadow-orange-500/10",
  },
  violet: {
    primary: "bg-rose-600",
    hoverBg: "hover:bg-rose-500",
    hoverBgLight: "hover:bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    borderFocus: "focus-within:border-rose-500 focus-within:ring-rose-100",
    gradient: "from-rose-600 to-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    lightBg: "bg-rose-50/20",
    ring: "focus:ring-rose-500",
    shadow: "shadow-rose-600/15",
    glow: "shadow-rose-500/10",
  },
};

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "signal" | "macro" | "volatility" | "info";
  read: boolean;
}

export default function Header({
  currentTab,
  setCurrentTab,
  marketOpen,
  istTime,
  user,
  handleLogout,
  setIsAuthOpen,
  setIsMapOpen,
  onSelectSymbol,
  accentColor,
  setAccentColor,
  marketType,
  setMarketType,
  indexPrices,
}: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "nt-1",
      title: "⚡ ML Ensemble Consensus Buy Signal",
      description: "Ensemble predictor estimates 84% bullish direction confidence for Nifty 50 over the next 5 days.",
      time: "Just now",
      type: "signal",
      read: false,
    },
    {
      id: "nt-2",
      title: "🏦 RBI Monetary Policy Updates",
      description: "RBI retains repo rate at 6.50% stating target inflation controls. Positive impact on financial equities.",
      time: "2 hours ago",
      type: "macro",
      read: false,
    },
    {
      id: "nt-3",
      title: "⚠️ High Watchlist Volatility",
      description: "ETERNAL.NS (Zomato) ticking rate spiked +22%. Volume breakout indicator triggered.",
      time: "4 hours ago",
      type: "volatility",
      read: false,
    },
    {
      id: "nt-4",
      title: "💡 Multi-Layer Verification complete",
      description: "Sentiment index registers positive shift (+0.12) as FII net flows turn positive (₹1,420 Cr buy value).",
      time: "Yesterday",
      type: "info",
      read: true,
    },
  ]);

  const activeTheme = ACCENTS[accentColor];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const handleReadNotification = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const settingsRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setIsSettingsOpen(false);
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setIsAlertsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const TOUR_STEPS = [
    { title: "Welcome to CROKED Analytics 🚀", desc: "CROKED is a premium ML forecasting dashboard for Indian equities, commodity futures, and F&O. Let's take a quick tour!" },
    { title: "Real-time NSE/BSE Search 🔍", desc: "Search any SEBI-registered stock, ETF, index or newly listed IPO. It dynamically maps legacy symbols (e.g. Zomato → ETERNAL.NS)." },
    { title: "3D Forecast Direction Gauge 🎯", desc: "Our speedometer gauge shows aggregate forecasting signals and model confidence (strong bullish to strong bearish) in 3D space." },
    { title: "Technical Consensus Scorecard 📊", desc: "Scores EMA crossovers, RSI bounds, MACD signals, and Google News sentiment to flag unified Buy/Sell consensus levels." },
    { title: "Multi-Layer Intelligence 💡", desc: "View Google News sentiment, daily FII/DII institutional flows (Cr INR), macro factors (inflation, USDINR, crude oil), and delivery stats." },
  ];

  const INDEX_CHIPS = [
    { label: "Nifty 50",   symbol: "^NSEI",    val: indexPrices.nifty.val,     pct: indexPrices.nifty.pct,     change: indexPrices.nifty.change },
    { label: "Sensex",     symbol: "^BSESN",   val: indexPrices.sensex.val,    pct: indexPrices.sensex.pct,    change: indexPrices.sensex.change },
    { label: "Nifty Bank", symbol: "^NSEBANK",  val: indexPrices.banknifty.val, pct: indexPrices.banknifty.pct, change: indexPrices.banknifty.change },
  ];

  return (
    <>
      {/* ────────────────────────────────────────────────────
          STICKY HEADER — two-row layout, never wraps
      ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#f8fafc]/90 backdrop-blur-md border-b border-slate-200/80 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ── ROW 1: Logo  ·  Action controls ── */}
          <div className="flex items-center justify-between h-14 gap-3">

            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentTab("dashboard")}
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            >
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${activeTheme.gradient} p-2 text-white flex items-center justify-center shadow-lg ${activeTheme.shadow} transition-all duration-300`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3v18" strokeWidth="1.5" opacity="0.6" />
                  <rect x="4" y="7" width="4" height="9" fill="currentColor" rx="0.5" />
                  <path d="M12 2v20" strokeWidth="1.5" />
                  <rect x="10" y="5" width="4" height="13" fill="currentColor" rx="0.5" />
                  <path d="M18 4v16" strokeWidth="1.5" opacity="0.6" />
                  <rect x="16" y="9" width="4" height="7" fill="none" stroke="currentColor" strokeWidth="2" rx="0.5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-slate-900 leading-none">CROKED</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ML Analytics</span>
              </div>
            </motion.div>

            {/* Right-side controls */}
            <div className="flex items-center gap-1.5">

              {/* Live indicator badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${activeTheme.primary} text-white text-[10px] font-black shadow-sm`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </div>

              {/* IST clock */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 shadow-xs whitespace-nowrap">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${marketOpen ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${marketOpen ? "bg-emerald-500" : "bg-amber-500"}`} />
                </span>
                <span className="hidden lg:inline">NSE {marketOpen ? "OPEN" : "CLOSED"} |</span>
                <span className="font-mono text-slate-700">{istTime || "12:00:00 PM"} IST</span>
              </div>

              {/* Icon: Rebranding map */}
              <button
                onClick={() => setIsMapOpen(true)}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl hover:text-slate-800 transition shadow-sm"
                title="Equities Rebranding Map"
              >
                <BookOpen className="h-4 w-4" />
              </button>

              {/* Icon: Help tour */}
              <button
                onClick={() => { setTourStep(0); setIsTourOpen(true); }}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl hover:text-slate-800 transition shadow-sm"
                title="Feature Walkthrough"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              {/* Notification bell */}
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                  className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl hover:text-slate-800 transition shadow-sm relative"
                  title="Trading Alerts"
                >
                  <Bell className={`h-4 w-4`} />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full ${activeTheme.primary} px-1 text-[8px] font-black text-white ring-2 ring-white`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isAlertsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Bell className={`h-4 w-4 ${activeTheme.text}`} />
                          <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Trading & Market Alerts</h4>
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className={`text-[9px] font-black uppercase ${activeTheme.text} hover:underline`}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleReadNotification(notif.id)}
                            className={`p-2.5 rounded-xl border transition text-left cursor-pointer ${notif.read ? "bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-100" : "bg-slate-50 border-slate-200 hover:bg-white"}`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[10px] font-bold text-slate-800 leading-tight">{notif.title}</span>
                              {!notif.read && <span className={`h-1.5 w-1.5 rounded-full ${activeTheme.primary} shrink-0 mt-1`} />}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal">{notif.description}</p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1.5 block">{notif.time}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Settings */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl hover:text-slate-800 transition shadow-sm"
                  title="Dashboard Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-4"
                    >
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Settings className={`h-4 w-4 ${activeTheme.text}`} />
                        <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Dashboard Settings</h4>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Palette className="h-3.5 w-3.5" /> Accent Color
                        </span>
                        <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                          {(Object.keys(ACCENTS) as Array<keyof typeof ACCENTS>).map((colorKey) => {
                            const kt = ACCENTS[colorKey];
                            const sel = accentColor === colorKey;
                            return (
                              <button
                                key={colorKey}
                                onClick={() => setAccentColor(colorKey)}
                                className={`h-7 rounded-lg flex items-center justify-center border transition-all ${sel ? `bg-white ${kt.border} ${kt.text} shadow-xs` : "border-transparent text-slate-400 hover:text-slate-700"}`}
                                title={colorKey === "cyan" ? "Gold/Amber" : colorKey === "indigo" ? "Sunset Orange" : colorKey === "violet" ? "Crimson Rose" : "Vibrant Green"}
                              >
                                <span className={`h-3 w-3 rounded-full ${kt.primary} flex items-center justify-center`}>
                                  {sel && <Check className="h-2 w-2 text-white" />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Login / User profile */}
              {user ? (
                <div className="flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="hidden xl:inline text-slate-600 truncate max-w-[100px]">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="text-rose-600 hover:text-rose-500 transition flex items-center gap-1 border-l border-slate-200 pl-2 ml-1 text-[11px]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsAuthOpen(true)}
                  className={`flex items-center gap-1.5 rounded-xl ${activeTheme.primary} ${activeTheme.hoverBg} text-white px-3.5 py-2 text-xs font-bold transition shadow-md ${activeTheme.shadow}`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Login</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* ── ROW 2: Nav tabs  ·  Index price chips ── */}
          <div className="flex items-center justify-between gap-3 pb-2 border-t border-slate-100/80">

            {/* Left: page tabs + market type switcher */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-0.5 bg-slate-200/50 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${currentTab === "dashboard" ? `bg-white ${activeTheme.text} shadow-sm` : "text-slate-500 hover:text-slate-800"}`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentTab("drift")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${currentTab === "drift" ? `bg-white ${activeTheme.text} shadow-sm` : "text-slate-500 hover:text-slate-800"}`}
                >
                  <Gauge className="h-3.5 w-3.5" />
                  <span>Drift Monitor</span>
                </button>
              </div>

              {currentTab === "dashboard" && (
                <div className="flex items-center gap-0.5 bg-slate-200/50 p-1 rounded-xl border border-slate-200/50">
                  {[
                    { value: "stocks", label: "Stocks" },
                    { value: "fno", label: "F&O" },
                    { value: "commodity", label: "Commodities" },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMarketType(m.value as "stocks" | "fno" | "commodity")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${marketType === m.value ? `bg-white ${activeTheme.text} shadow-sm` : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: live index price chips */}
            <div className="hidden md:flex items-center gap-1.5 pt-2">
              {INDEX_CHIPS.map(({ label, symbol, val, pct, change }) => (
                <div
                  key={symbol}
                  onClick={() => onSelectSymbol(symbol)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/70 hover:border-slate-300 rounded-xl cursor-pointer shadow-xs hover:bg-slate-50 transition"
                  title={`Click to load ${label}`}
                >
                  <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-800">₹{val.toLocaleString("en-IN")}</span>
                  <span className={`text-[9px] font-mono font-black ${change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {change >= 0 ? "+" : ""}{pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </header>

      {/* ── Guided Feature Tour Overlay ── */}
      <AnimatePresence>
        {isTourOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-5 w-5 ${activeTheme.text}`} />
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Walkthrough · Step {tourStep + 1} of {TOUR_STEPS.length}
                  </span>
                </div>
                <button onClick={() => setIsTourOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 py-2">
                <h3 className="text-lg font-black text-slate-900">{TOUR_STEPS[tourStep].title}</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">{TOUR_STEPS[tourStep].desc}</p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, idx) => (
                    <span key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === tourStep ? `w-4 ${activeTheme.primary}` : "w-1.5 bg-slate-200"}`} />
                  ))}
                </div>
                <div className="flex gap-2">
                  {tourStep > 0 && (
                    <button onClick={() => setTourStep((p) => p - 1)} className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition border border-slate-200">
                      Back
                    </button>
                  )}
                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <button onClick={() => setTourStep((p) => p + 1)} className={`px-4 py-1.5 text-xs font-bold text-white ${activeTheme.primary} ${activeTheme.hoverBg} rounded-xl transition flex items-center gap-1 shadow-sm`}>
                      Next <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <button onClick={() => setIsTourOpen(false)} className={`px-4 py-1.5 text-xs font-bold text-white ${activeTheme.primary} ${activeTheme.hoverBg} rounded-xl transition shadow-sm`}>
                      Finish Tour
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
