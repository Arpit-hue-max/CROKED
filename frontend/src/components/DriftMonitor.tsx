"use client";

import React, { useEffect, useState } from "react";
import { 
  fetchDriftStats, 
  triggerDriftUpdate, 
  type DriftStatsResponse 
} from "@/lib/api";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  LineChart, 
  TrendingUp, 
  AlertCircle,
  Gauge
} from "lucide-react";
import ThreeDCard from "./ThreeDCard";
import { motion, AnimatePresence } from "framer-motion";

export default function DriftMonitor() {
  const [stats, setStats] = useState<DriftStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDriftStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drift stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      // Execute asynchronously outside the synchronous render/effect execution phase
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (active) {
        await loadStats();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setError(null);
    setMsg(null);
    try {
      const res = await triggerDriftUpdate();
      setMsg(res.message);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update drift records");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const overallAcc = stats?.overall_accuracy;
  const showWarning = overallAcc !== null && overallAcc !== undefined && overallAcc < 53.0;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Model Drift & Performance Monitor
          </h2>
          <p className="mt-1 text-slate-500 text-sm">
            Tracks real-world prediction accuracy by matching historical forecasts with actual closing prices.
          </p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-450 ${updating ? "animate-spin" : ""}`} />
          Update Actual Prices
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-xs font-bold flex gap-2 items-center">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          {error}
        </div>
      )}

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-800 text-xs font-bold flex gap-2 items-center">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          {msg}
        </div>
      )}

      {showWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 text-amber-800 text-xs font-medium flex gap-3 shadow-inner">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900">Model Performance Alert</h4>
            <p className="mt-1 leading-relaxed text-amber-700">
              The overall directional accuracy has dropped below 53% ({overallAcc}%). This indicates potential market regime changes or model drift. Retraining model parameters is recommended.
            </p>
          </div>
        </div>
      )}

      {!stats || stats.total_predictions === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <Gauge className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Drift Logs Yet</h3>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            Once you perform forecasting predictions on stock tickers, those forecasts will log here. As days pass, click &quot;Update Actual Prices&quot; to evaluate them.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards with 3D spring tilt */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ThreeDCard className="shadow-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start text-slate-450">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Directional Accuracy</span>
                  <TrendingUp className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                    {overallAcc !== null ? `${overallAcc}%` : "N/A"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Across all models and symbols
                  </p>
                </div>
              </div>
            </ThreeDCard>

            <ThreeDCard className="shadow-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start text-slate-450">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Logged Forecasts</span>
                  <LineChart className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                    {stats.total_predictions}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Evaluated historical points
                  </p>
                </div>
              </div>
            </ThreeDCard>

            <ThreeDCard className="shadow-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start text-slate-450">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Model Coverage</span>
                  <Gauge className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="mt-4">
                  <p className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                    {Object.keys(stats.models).length} Active Models
                  </p>
                  <div className="text-[10px] text-slate-500 font-medium space-y-1.5 border-t border-slate-100 pt-2">
                    {Object.entries(stats.models).map(([m, data]) => (
                      <div key={m} className="flex justify-between items-center">
                        <span className="font-bold text-slate-450">{m}:</span>
                        <span>
                          <strong className="text-slate-800 font-mono">{data.accuracy}%</strong> Acc (MAE: <span className="font-mono">{data.mae}</span>)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ThreeDCard>
          </div>

          {/* Historical Data Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Recent Evaluations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50/20 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Ticker</th>
                    <th className="px-6 py-3.5">Model</th>
                    <th className="px-6 py-3.5">Predicted Price</th>
                    <th className="px-6 py-3.5">Actual Close</th>
                    <th className="px-6 py-3.5">Error %</th>
                    <th className="px-6 py-3.5 text-center">Direction Correct?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  <AnimatePresence>
                    {stats.recent_predictions.map((p, index) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                        whileHover={{ scale: 1.002, x: 2, backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                        key={p.id} 
                        className="hover:bg-slate-50 transition duration-150 cursor-default"
                      >
                        <td className="px-6 py-3.5 font-mono text-slate-400">{p.prediction_date}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">{p.symbol}</td>
                        <td className="px-6 py-3.5">
                          <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200/60 uppercase">
                            {p.model_name}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-800">₹{p.predicted_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-900">₹{p.actual_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-3.5 font-mono text-rose-600 font-bold">
                          {p.error_pct.toFixed(2)}%
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex justify-center">
                            {p.is_correct ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-rose-500" />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
