"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";
import type { OHLCVPoint } from "@/lib/api";

interface PriceChartProps {
  data: OHLCVPoint[];
  symbol: string;
  period: string;
  showSMA?: boolean;
  showBollinger?: boolean;
}

function toTime(dateStr: string): Time {
  if (dateStr.includes("T") || dateStr.includes(" ") || dateStr.length > 10) {
    return Math.floor(new Date(dateStr).getTime() / 1000) as Time;
  }
  return dateStr.slice(0, 10) as Time;
}

export default function PriceChart({
  data,
  symbol,
  period,
  showSMA = true,
  showBollinger = true,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // 1. Create chart and series once when symbol or period changes
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
      height: 380,
      timeScale: { borderColor: "#e2e8f0", timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: "#e2e8f0" },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
      title: "Price",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#cbd5e1",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    // Place volume bars in the bottom 20% margin
    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const sma20 = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      title: "SMA 20",
    });

    const sma50 = chart.addSeries(LineSeries, {
      color: "#a78bfa",
      lineWidth: 2,
      title: "SMA 50",
    });

    const bbUpper = chart.addSeries(LineSeries, {
      color: "#94a3b8",
      lineWidth: 1,
      lineStyle: 2,
      title: "BB Upper",
    });

    const bbLower = chart.addSeries(LineSeries, {
      color: "#94a3b8",
      lineWidth: 1,
      lineStyle: 2,
      title: "BB Lower",
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    sma20SeriesRef.current = sma20;
    sma50SeriesRef.current = sma50;
    bbUpperSeriesRef.current = bbUpper;
    bbLowerSeriesRef.current = bbLower;

    // Wait slightly to fit content
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
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
    };
  }, [symbol, period]);

  // 2. Update data dynamically without resetting zoom
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || data.length === 0) return;

    // Filter and map Candlestick data
    const candleData: CandlestickData<Time>[] = data
      .filter((d) => d.open != null && d.high != null && d.low != null && d.close != null)
      .map((d) => ({
        time: toTime(d.date),
        open: d.open!,
        high: d.high!,
        low: d.low!,
        close: d.close!,
      }));

    candlestickSeriesRef.current.setData(candleData);

    // Filter and map Volume data
    if (volumeSeriesRef.current) {
      const volData: HistogramData<Time>[] = data
        .filter((d) => d.volume != null)
        .map((d) => {
          const isUp = d.close != null && d.open != null ? d.close >= d.open : true;
          return {
            time: toTime(d.date),
            value: d.volume!,
            color: isUp ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
          };
        });
      volumeSeriesRef.current.setData(volData);
    }

    // SMAs
    if (sma20SeriesRef.current) {
      sma20SeriesRef.current.setData(
        showSMA
          ? data.filter((d) => d.sma_20 != null).map((d) => ({ time: toTime(d.date), value: d.sma_20! }))
          : []
      );
    }

    if (sma50SeriesRef.current) {
      sma50SeriesRef.current.setData(
        showSMA
          ? data.filter((d) => d.sma_50 != null).map((d) => ({ time: toTime(d.date), value: d.sma_50! }))
          : []
      );
    }

    // Bollinger
    if (bbUpperSeriesRef.current) {
      bbUpperSeriesRef.current.setData(
        showBollinger
          ? data.filter((d) => d.bb_upper != null).map((d) => ({ time: toTime(d.date), value: d.bb_upper! }))
          : []
      );
    }

    if (bbLowerSeriesRef.current) {
      bbLowerSeriesRef.current.setData(
        showBollinger
          ? data.filter((d) => d.bb_lower != null).map((d) => ({ time: toTime(d.date), value: d.bb_lower! }))
          : []
      );
    }
  }, [data, showSMA, showBollinger]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-slate-200 bg-white shadow-sm"
    />
  );
}
