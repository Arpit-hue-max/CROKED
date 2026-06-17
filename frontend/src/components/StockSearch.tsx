"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, X, Loader2 } from "lucide-react";
import type { StockSearchResult } from "@/lib/api";
import { searchStocks } from "@/lib/api";

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  selectedSymbol: string;
  marketType?: "stocks" | "fno" | "commodity";
}

const POPULAR = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "^NSEI", "GC=F", "CL=F"];

const isCommodity = (s: string) => s.endsWith("=F") || s.includes("BEES.NS") || ["GC=F", "CL=F", "SI=F", "NG=F", "HG=F"].includes(s);
const isFNOIndex  = (s: string) => s.startsWith("^");

export default function StockSearchBar({ onSelect, selectedSymbol, marketType = "stocks" }: StockSearchProps) {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const popularFiltered = POPULAR.filter((sym) => {
    if (marketType === "stocks")    return !isCommodity(sym) && !isFNOIndex(sym);
    if (marketType === "fno")       return isFNOIndex(sym) || (!isCommodity(sym) && ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"].includes(sym));
    if (marketType === "commodity") return isCommodity(sym);
    return true;
  });

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const data = await searchStocks(query);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 260);
    return () => { clearTimeout(timer); setLoading(false); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredResults = results.filter((stock) => {
    const sym = stock.symbol.toUpperCase();
    if (marketType === "stocks")    return !isCommodity(sym) && !isFNOIndex(sym);
    if (marketType === "fno")       return isFNOIndex(sym) || (!isCommodity(sym) && ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "SBIN.NS"].includes(sym));
    if (marketType === "commodity") return isCommodity(sym);
    return true;
  });

  const selectSymbol = (sym: string, name?: string) => {
    onSelect(sym);
    setQuery(name ?? sym);
    setOpen(false);
    setFocused(false);
  };

  const clearQuery = () => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl z-30">
      {/* Search input box */}
      <motion.div
        animate={focused ? { boxShadow: "0 0 0 3px rgba(251,191,36,0.18)" } : { boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        transition={{ duration: 0.18 }}
        className={`flex items-center gap-2.5 rounded-2xl border bg-white px-4 py-3 transition-colors duration-150 ${
          focused ? "border-amber-400/70" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <motion.div animate={focused ? { rotate: 0, scale: 1.1 } : { rotate: 0, scale: 1 }} transition={{ duration: 0.18 }}>
          {loading
            ? <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
            : <Search className={`h-4 w-4 transition-colors ${focused ? "text-amber-600" : "text-slate-400"}`} />
          }
        </motion.div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (!val.trim()) {
              setResults([]);
              setOpen(false);
              setLoading(false);
            } else {
              setLoading(true);
            }
          }}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              let sym = query.trim().toUpperCase();
              if (!sym.includes(".") && !sym.startsWith("^") && !sym.endsWith("=F")) sym = `${sym}.NS`;
              selectSymbol(sym);
            }
            if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
          }}
          placeholder="Search NSE/BSE stocks (e.g. RELIANCE, TCS, NIFTY 50)…"
          className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none text-sm font-medium"
          aria-label="Search Indian stocks"
          autoComplete="off"
        />

        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              type="button"
              onClick={clearQuery}
              className="text-slate-400 hover:text-slate-600 transition shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dropdown results */}
      <AnimatePresence>
        {open && filteredResults.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100"
          >
            {filteredResults.map((stock, i) => (
              <motion.li
                key={stock.symbol}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.14 }}
              >
                <button
                  type="button"
                  onClick={() => selectSymbol(stock.symbol, stock.name)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-amber-50/50 transition-colors duration-100 group"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-amber-700 transition-colors">{stock.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wide">{stock.symbol} · {stock.sector}</p>
                  </div>
                  <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 border border-amber-100 uppercase tracking-wider shrink-0 ml-3">
                    {stock.exchange}
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Popular quick chips */}
      <motion.div
        className="mt-2.5 flex flex-wrap gap-1.5"
        initial={false}
      >
        {popularFiltered.map((sym, i) => (
          <motion.button
            key={sym}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => selectSymbol(sym)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border transition-all duration-150 shadow-xs ${
              selectedSymbol === sym
                ? "bg-amber-50 border-amber-300 text-amber-700 shadow-amber-100"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <TrendingUp className="h-2.5 w-2.5" />
            {sym.replace(".NS", "").replace("^", "")}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
