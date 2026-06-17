import type { PredictionResponse } from "@/lib/api";
import { AlertTriangle, BarChart3, Target, TrendingDown, TrendingUp } from "lucide-react";
import ThreeDCard from "./ThreeDCard";
import { motion } from "framer-motion";

interface PredictionPanelProps {
  prediction: PredictionResponse | null;
  loading: boolean;
  error: string | null;
  disabled3D?: boolean;
}

export default function PredictionPanel({
  prediction,
  loading,
  error,
  disabled3D = false,
}: PredictionPanelProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-slate-100" />
          <div className="h-20 rounded bg-slate-100" />
          <div className="h-32 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-250 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <p className="font-bold">Prediction unavailable</p>
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      </div>
    );
  }

  if (!prediction) return null;

  const isUp = prediction.predicted_direction === "up";
  const backtest = prediction.backtest;

  return (
    <div className="space-y-4">
      <ThreeDCard disabled={disabled3D} className="shadow-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Target className="h-5 w-5 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">ML Forecast Metrics</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200/60">
              {prediction.model}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className={`rounded-xl p-4 border transition-all ${
                isUp 
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-800" 
                  : "bg-rose-50/60 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isUp ? "bg-emerald-100" : "bg-rose-100"}`}>
                  {isUp ? (
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-rose-600" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Next-day direction</p>
                  <p className={`text-2xl font-black capitalize ${isUp ? "text-emerald-700" : "text-rose-700"}`}>
                    {prediction.predicted_direction}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs">
                <p className="text-slate-500 font-medium">
                  Confidence: <span className="text-slate-800 font-bold font-mono">{prediction.direction_confidence}%</span>
                </p>
                <p className="text-slate-500 font-medium">
                  Expected return:{" "}
                  <span className={`font-bold font-mono ${prediction.predicted_return_pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {prediction.predicted_return_pct >= 0 ? "+" : ""}{prediction.predicted_return_pct}%
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50/60 p-4 border border-slate-200 text-slate-700 shadow-inner">
              <div className="flex items-center gap-2 border-b border-slate-150 pb-2 mb-2">
                <BarChart3 className="h-4 w-4 text-cyan-600" />
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-550">Walk-forward backtest</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Directional accuracy</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {backtest.directional_accuracy != null ? `${backtest.directional_accuracy}%` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Baseline accuracy</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {backtest.baseline_directional_accuracy != null
                      ? `${backtest.baseline_directional_accuracy}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RMSE (returns)</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {backtest.rmse != null ? backtest.rmse.toFixed(6) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validation folds</span>
                  <span className="font-mono text-slate-800 font-bold">{backtest.folds}</span>
                </div>
              </div>
              {backtest.message && (
                <p className="mt-2 text-[10px] text-amber-700 font-semibold">{backtest.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-2 pr-4">Day</th>
                  <th className="pb-2 pr-4">Price (₹)</th>
                  <th className="pb-2 pr-4">Return %</th>
                  <th className="pb-2 pr-4">Lower Bound</th>
                  <th className="pb-2">Upper Bound</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {prediction.forecasts.map((f) => (
                  <motion.tr 
                    whileHover={{ scale: 1.005, x: 2, backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                    key={f.day} 
                    className="hover:bg-slate-50 transition duration-150 cursor-default"
                  >
                    <td className="py-2.5 pr-4 font-semibold text-slate-500">+{f.day} Day</td>
                    <td className="py-2.5 pr-4 font-mono font-bold text-slate-900">
                      ₹{f.predicted_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono font-bold ${f.predicted_return_pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {f.predicted_return_pct >= 0 ? "+" : ""}{f.predicted_return_pct}%
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-slate-400">
                      ₹{f.lower_bound.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">
                      ₹{f.upper_bound.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ThreeDCard>

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-amber-800 shadow-inner">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed font-medium">{prediction.disclaimer}</p>
      </div>
    </div>
  );
}
