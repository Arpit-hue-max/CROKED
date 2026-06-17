"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  HistogramData,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  Time,
} from "lightweight-charts";
import type { OHLCVPoint } from "@/lib/api";

interface IndicatorChartProps {
  data: OHLCVPoint[];
  symbol: string;
  period: string;
  type: "rsi" | "macd";
}

function toTime(dateStr: string): Time {
  if (dateStr.includes("T") || dateStr.includes(" ") || dateStr.length > 10) {
    return Math.floor(new Date(dateStr).getTime() / 1000) as Time;
  }
  return dateStr.slice(0, 10) as Time;
}

export default function IndicatorChart({
  data,
  symbol,
  period,
  type,
}: IndicatorChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const signalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const histSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // 1. Create chart and series once when symbol, period or type changes
  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { color: "#f1f5f9" },
        horzLines: { color: "#f1f5f9" },
      },
      width: containerRef.current.clientWidth,
      height: 160,
      timeScale: { borderColor: "#e2e8f0", timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: "#e2e8f0" },
    });

    if (type === "rsi") {
      const rsiSeries = chart.addSeries(LineSeries, {
        color: "#f472b6",
        lineWidth: 2,
        title: "RSI",
      });
      rsiSeries.createPriceLine({
        price: 70,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Overbought",
      });
      rsiSeries.createPriceLine({
        price: 30,
        color: "#22c55e",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Oversold",
      });
      rsiSeriesRef.current = rsiSeries;
    } else {
      const macdLine = chart.addSeries(LineSeries, {
        color: "#38bdf8",
        lineWidth: 2,
        title: "MACD",
      });

      const signalLine = chart.addSeries(LineSeries, {
        color: "#fb923c",
        lineWidth: 1,
        title: "Signal",
      });

      const histSeries = chart.addSeries(HistogramSeries, {
        color: "#6366f1",
        title: "Histogram",
      });

      macdSeriesRef.current = macdLine;
      signalSeriesRef.current = signalLine;
      histSeriesRef.current = histSeries;
    }

    chartRef.current = chart;

    const fitTimer = setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }, 100);

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(fitTimer);
      chart.remove();
      chartRef.current = null;
      rsiSeriesRef.current = null;
      macdSeriesRef.current = null;
      signalSeriesRef.current = null;
      histSeriesRef.current = null;
    };
  }, [symbol, period, type]);

  // 2. Update data dynamically without resetting zoom
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    if (type === "rsi" && rsiSeriesRef.current) {
      const rsiData: LineData<Time>[] = data
        .filter((d) => d.rsi != null)
        .map((d) => ({
          time: toTime(d.date),
          value: d.rsi!,
        }));
      rsiSeriesRef.current.setData(rsiData);
    } else if (type === "macd") {
      if (macdSeriesRef.current) {
        const macdData: LineData<Time>[] = data
          .filter((d) => d.macd != null)
          .map((d) => ({
            time: toTime(d.date),
            value: d.macd!,
          }));
        macdSeriesRef.current.setData(macdData);
      }

      if (signalSeriesRef.current) {
        const sigData: LineData<Time>[] = data
          .filter((d) => d.macd_signal != null)
          .map((d) => ({
            time: toTime(d.date),
            value: d.macd_signal!,
          }));
        signalSeriesRef.current.setData(sigData);
      }

      if (histSeriesRef.current) {
        const histData: HistogramData<Time>[] = data
          .filter((d) => d.macd_hist != null)
          .map((d) => ({
            time: toTime(d.date),
            value: d.macd_hist!,
            color: d.macd_hist! >= 0 ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
          }));
        histSeriesRef.current.setData(histData);
      }
    }
  }, [data, type]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-slate-200 bg-white shadow-sm"
    />
  );
}
