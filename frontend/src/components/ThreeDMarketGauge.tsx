"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Gauge } from "lucide-react";

interface ThreeDMarketGaugeProps {
  predictedDirection: string | null;
  confidence: number | null;
  modelName: string;
}

export default function ThreeDMarketGauge({
  predictedDirection,
  confidence,
  modelName,
}: ThreeDMarketGaugeProps) {
  // Center is 0 degrees (Neutral).
  // Bullish (up) maps to positive angle: e.g. 30 to 75 degrees depending on confidence.
  // Bearish (down) maps to negative angle: e.g. -30 to -75 degrees depending on confidence.
  let targetAngle = 0;
  if (predictedDirection === "up") {
    const confFactor = confidence ? (confidence - 50) / 50 : 0.5; // range 0 to 1
    targetAngle = 30 + confFactor * 45; // 30 to 75 deg
  } else if (predictedDirection === "down") {
    const confFactor = confidence ? (confidence - 50) / 50 : 0.5;
    targetAngle = -30 - confFactor * 45; // -30 to -75 deg
  }

  const needleRotation = useMotionValue(0);
  const springRotation = useSpring(needleRotation, {
    stiffness: 80,
    damping: 12,
    mass: 1,
  });

  useEffect(() => {
    needleRotation.set(targetAngle);
  }, [targetAngle, needleRotation]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full p-4">
      <div className="flex items-center gap-1.5 mb-4">
        <Gauge className="h-4 w-4 text-cyan-600 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Market Momentum</span>
      </div>

      {/* SVG 3D-like Dial */}
      <div className="relative w-full max-w-[180px] aspect-[2/1] overflow-hidden flex items-end justify-center">
        {/* Arc Background */}
        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" /> {/* Red / Bearish */}
              <stop offset="35%" stopColor="#fca5a5" />
              <stop offset="50%" stopColor="#cbd5e1" /> {/* Gray / Neutral */}
              <stop offset="65%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#22c55e" /> {/* Green / Bullish */}
            </linearGradient>
            <filter id="gauge-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
            </filter>
          </defs>
          
          {/* Main Dial Arc */}
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#gauge-shadow)"
          />

          {/* Core Hub */}
          <circle cx="50" cy="50" r="5" fill="#475569" className="z-10" />
          <circle cx="50" cy="50" r="2.5" fill="#cbd5e1" className="z-20" />
        </svg>

        {/* Rotating Needle */}
        <motion.div
          style={{
            rotate: springRotation,
            transformOrigin: "bottom center",
          }}
          className="absolute bottom-0 w-1 h-14 bg-slate-700 rounded-full shadow-md flex flex-col items-center justify-start z-10"
        >
          {/* Needle Tip Arrow */}
          <div className="w-2.5 h-2.5 bg-cyan-600 rounded-full -mt-1 shadow-sm border border-white" />
        </motion.div>
      </div>

      {/* Stats and text display */}
      <div className="mt-4 text-center">
        {predictedDirection ? (
          <div className="space-y-1">
            <p className={`text-sm font-black tracking-tight ${predictedDirection === "up" ? "text-emerald-600" : "text-rose-600"}`}>
              {predictedDirection === "up" ? "BULLISH FORECAST" : "BEARISH FORECAST"}
            </p>
            <p className="text-[10px] text-slate-450 font-semibold tracking-wide uppercase">
              {confidence}% Confidence · {modelName}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-400">NO ACTIVE SIGNAL</p>
            <p className="text-[10px] text-slate-450 font-semibold tracking-wide">Select ticker to load model metrics</p>
          </div>
        )}
      </div>
    </div>
  );
}
