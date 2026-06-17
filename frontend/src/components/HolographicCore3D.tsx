"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Cpu, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

interface HolographicCore3DProps {
  isEmailFocused: boolean;
  isPasswordFocused: boolean;
  loading: boolean;
  error: string | null;
  success: boolean;
  accentColor: "cyan" | "emerald" | "indigo" | "violet";
}

const THEME_STYLES = {
  cyan: { // Gold/Amber Accent
    accent: "#eab308",
    accentLight: "#fef3c7",
    glow: "rgba(234, 179, 8, 0.5)",
    glowLight: "rgba(234, 179, 8, 0.15)",
    hudText: "text-amber-500",
    hudBg: "bg-amber-950/10",
    hudBorder: "border-amber-500/20"
  },
  emerald: { // Green Accent
    accent: "#10b981",
    accentLight: "#d1fae5",
    glow: "rgba(16, 185, 129, 0.5)",
    glowLight: "rgba(16, 185, 129, 0.15)",
    hudText: "text-emerald-500",
    hudBg: "bg-emerald-950/10",
    hudBorder: "border-emerald-500/20"
  },
  indigo: { // Orange Accent
    accent: "#f97316",
    accentLight: "#ffedd5",
    glow: "rgba(249, 115, 22, 0.5)",
    glowLight: "rgba(249, 115, 22, 0.15)",
    hudText: "text-orange-500",
    hudBg: "bg-orange-950/10",
    hudBorder: "border-orange-500/20"
  },
  violet: { // Crimson/Rose Accent
    accent: "#f43f5e",
    accentLight: "#ffe4e6",
    glow: "rgba(244, 63, 94, 0.5)",
    glowLight: "rgba(244, 63, 94, 0.15)",
    hudText: "text-rose-500",
    hudBg: "bg-rose-950/10",
    hudBorder: "border-rose-500/20"
  }
};

export default function HolographicCore3D({
  isEmailFocused,
  isPasswordFocused,
  loading,
  error,
  success,
  accentColor
}: HolographicCore3DProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const theme = THEME_STYLES[accentColor] || THEME_STYLES.cyan;

  // Track cursor position to apply dynamic tilting
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Compute 3D rotations based on interaction states
  const coreRotateY = isPasswordFocused ? 180 : isEmailFocused ? 35 : mousePos.x * 50;
  const coreRotateX = isPasswordFocused ? 15 : isEmailFocused ? 20 : mousePos.y * 35;

  // Destabilization wiggles on error, high-speed spin on loading, expand on success
  const coreAnimate = error
    ? { 
        x: [0, -15, 15, -15, 15, -10, 10, 0], 
        y: [0, 8, -8, 8, -8, 5, -5, 0],
        scale: [1, 0.95, 1.05, 0.98, 1.02, 1] 
      }
    : success
      ? { scale: [1, 0.85, 1.25, 1.05, 1], rotate: [0, -45, 180, 360] }
      : loading
        ? { y: [0, -10, 0] }
        : { y: [0, -5, 0] };

  const coreTransition = error
    ? { duration: 0.45 }
    : success
      ? { duration: 0.8, ease: "easeOut" as const }
      : loading
        ? { repeat: Infinity, duration: 1.0, ease: "easeInOut" as const }
        : { repeat: Infinity, repeatType: "reverse" as const, duration: 4.5, ease: "easeInOut" as const };

  return (
    <div 
      className="relative w-full h-[360px] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ perspective: "1500px" }}
    >
      {/* 1. HUD Background Cyber Grid Panels */}
      <div className="absolute inset-4 border border-slate-200/40 rounded-3xl pointer-events-none z-0 overflow-hidden bg-slate-50/10">
        {/* Subtle grid line overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Glowing HUD Tech corners */}
        <div className={`absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 ${theme.hudBorder} ${theme.hudText} opacity-70`} />
        <div className={`absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 ${theme.hudBorder} ${theme.hudText} opacity-70`} />
        <div className={`absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 ${theme.hudBorder} ${theme.hudText} opacity-70`} />
        <div className={`absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 ${theme.hudBorder} ${theme.hudText} opacity-70`} />

        {/* Live System Diagnostics text readouts */}
        <div className="absolute top-4 left-5 flex flex-col gap-1 text-[8px] font-mono tracking-widest font-bold opacity-60">
          <span className={theme.hudText}>SYS_MODE: {isPasswordFocused ? "ENCRYPTED" : isEmailFocused ? "SCANNING" : "STANDBY"}</span>
          <span className="text-slate-400 font-medium">CORE_TEMP: 38.6°C</span>
          <span className="text-slate-400 font-medium">MODEL_RES: Consensus_Ensemble</span>
        </div>

        <div className="absolute top-4 right-5 flex flex-col gap-1 text-[8px] font-mono tracking-widest font-bold text-right opacity-60">
          <span className="text-slate-400 font-medium">SIGNAL_FREQ: 2.0s</span>
          <span className="text-slate-400 font-medium">EPOCH_IT: 10/10</span>
          <span className={theme.hudText}>INTEGRITY: 100%</span>
        </div>
      </div>

      {/* Ambient center neon light core */}
      <div 
        className="absolute w-[240px] h-[240px] rounded-full blur-[45px] opacity-40 transition-all duration-700 pointer-events-none z-0"
        style={{
          background: error 
            ? "radial-gradient(circle, rgba(244,63,94,0.55) 0%, transparent 70%)" 
            : success 
              ? "radial-gradient(circle, rgba(16,185,129,0.55) 0%, transparent 70%)" 
              : `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`
        }}
      />

      {/* 2. MAIN HOLOGRAPHIC ENGINE ASSEMBLY */}
      <motion.div
        animate={coreAnimate}
        transition={coreTransition}
        style={{
          rotateX: coreRotateX,
          rotateY: coreRotateY,
          transformStyle: "preserve-3d"
        }}
        className="relative w-[180px] h-[180px] flex items-center justify-center z-10"
      >
        
        {/* ==================== RING 1: OUTER HIGH-TECH ORBITAL GRID (X-Axis Spin) ==================== */}
        <motion.div
          animate={{ rotateZ: 360 }}
          style={{ 
            transformStyle: "preserve-3d",
            transform: "rotateX(55deg) rotateY(15deg)",
            borderColor: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
            boxShadow: `0 0 15px ${error ? "rgba(244,63,94,0.3)" : success ? "rgba(16,185,129,0.3)" : theme.glowLight}`
          }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute inset-0 border-[2.5px] border-dashed rounded-full flex items-center justify-center pointer-events-none"
        >
          {/* Floating Data Node on Outer Ring */}
          <div 
            style={{ 
              background: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
              boxShadow: `0 0 10px ${error ? "#f43f5e" : success ? "#10b981" : theme.accent}`
            }}
            className="absolute top-0 w-3 h-3 rounded-full border border-white/80" 
          />
          <div 
            style={{ 
              background: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
              boxShadow: `0 0 10px ${error ? "#f43f5e" : success ? "#10b981" : theme.accent}`
            }}
            className="absolute bottom-0 w-3 h-3 rounded-full border border-white/80" 
          />
        </motion.div>


        {/* ==================== RING 2: INTERMEDIATE DATA TRACK (Y-Axis Spin) ==================== */}
        <motion.div
          animate={{ rotateZ: -360 }}
          style={{ 
            transformStyle: "preserve-3d",
            transform: "rotateX(-35deg) rotateY(70deg)",
            borderColor: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
            boxShadow: `0 0 15px ${error ? "rgba(244,63,94,0.3)" : success ? "rgba(16,185,129,0.3)" : theme.glowLight}`
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute inset-4 border-[2px] border-dotted rounded-full flex items-center justify-center pointer-events-none"
        >
          {/* Floating Neon Node */}
          <div 
            style={{ 
              background: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
              boxShadow: `0 0 8px ${error ? "#f43f5e" : success ? "#10b981" : theme.accent}`
            }}
            className="absolute left-0 w-2 h-2 rounded-full border border-white/80" 
          />
          <div 
            style={{ 
              background: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
              boxShadow: `0 0 8px ${error ? "#f43f5e" : success ? "#10b981" : theme.accent}`
            }}
            className="absolute right-0 w-2 h-2 rounded-full border border-white/80" 
          />
        </motion.div>


        {/* ==================== RING 3: INNER SECURE SYSTEM LOCK RING ==================== */}
        <motion.div
          animate={isPasswordFocused ? { rotateY: [0, 180, 360], rotateX: 90 } : { rotateZ: 360 }}
          style={{ 
            transformStyle: "preserve-3d",
            transform: isPasswordFocused ? "rotateX(90deg)" : "rotateX(75deg) rotateY(-45deg)",
            borderColor: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
            boxShadow: `0 0 20px ${error ? "rgba(244,63,94,0.5)" : success ? "rgba(16,185,129,0.5)" : theme.glow}`
          }}
          transition={isPasswordFocused ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { repeat: Infinity, duration: 5, ease: "linear" }}
          className="absolute inset-8 border-[3px] border-double rounded-full flex items-center justify-center pointer-events-none"
        />


        {/* ==================== THE CENTRAL QUANTUM NEURAL CORE ==================== */}
        {/* Double layered glowing sphere simulating physical energy density */}
        <motion.div
          animate={
            loading 
              ? { scale: [1, 1.15, 1], rotate: 360 } 
              : { scale: [1, 1.06, 1] }
          }
          transition={{ repeat: Infinity, duration: loading ? 1.2 : 3.0, ease: "easeInOut" }}
          style={{
            transformStyle: "preserve-3d",
            background: error
              ? "radial-gradient(circle at 35% 30%, #fff 0%, #fda4af 30%, #f43f5e 75%, #9f1239 100%)"
              : success
                ? "radial-gradient(circle at 35% 30%, #fff 0%, #a7f3d0 30%, #10b981 75%, #064e3b 100%)"
                : `radial-gradient(circle at 35% 30%, #ffffff 0%, ${theme.accentLight} 30%, ${theme.accent} 75%, ${theme.accent} 100%)`,
            boxShadow: error
              ? "0 0 25px #f43f5e, inset 2px 2px 5px rgba(255,255,255,0.7), inset -4px -4px 10px rgba(0,0,0,0.5)"
              : success
                ? "0 0 25px #10b981, inset 2px 2px 5px rgba(255,255,255,0.7), inset -4px -4px 10px rgba(0,0,0,0.5)"
                : `0 0 25px ${theme.accent}, inset 2px 2px 5px rgba(255,255,255,0.7), inset -4px -4px 10px rgba(0,0,0,0.5)`
          }}
          className="w-16 h-16 rounded-full border border-white/60 flex items-center justify-center z-20 cursor-pointer relative"
        >
          {/* Internal CPU Core Plate */}
          <div 
            style={{ 
              transform: "translateZ(8px)", 
              background: "rgba(15, 23, 42, 0.8)", 
              boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.7)" 
            }}
            className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-white"
          >
            {isPasswordFocused ? (
              <Lock className="h-4.5 w-4.5 text-cyan-400 drop-shadow-[0_0_4px_#22d3ee]" />
            ) : error ? (
              <AlertTriangle className="h-4.5 w-4.5 text-rose-400 drop-shadow-[0_0_4px_#f43f5e]" />
            ) : success ? (
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400 drop-shadow-[0_0_4px_#10b981]" />
            ) : loading ? (
              <RefreshCw className="h-4.5 w-4.5 text-amber-400 drop-shadow-[0_0_4px_#f59e0b] animate-spin" />
            ) : (
              <Cpu className="h-4.5 w-4.5 text-cyan-400 drop-shadow-[0_0_4px_#22d3ee]" />
            )}
          </div>
        </motion.div>

        {/* ==================== 3D FLOATING DATA CLOUDS (PARALLAX METRICS) ==================== */}
        {/* Floating Node 1 (Consensus Indicator) */}
        <motion.div
          style={{
            transform: "translate3d(-75px, -45px, 40px)",
            transformStyle: "preserve-3d"
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 3.5, ease: "easeInOut" }}
          className="absolute bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-lg shadow-xl text-left pointer-events-none"
        >
          <span className="text-[7px] font-bold text-slate-400 block font-mono">LSTM_CONF</span>
          <span className="text-[9px] font-black text-cyan-400 font-mono tracking-wide">84.2%</span>
        </motion.div>

        {/* Floating Node 2 (XGBoost Classifier) */}
        <motion.div
          style={{
            transform: "translate3d(75px, 45px, 40px)",
            transformStyle: "preserve-3d"
          }}
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 4.0, ease: "easeInOut", delay: 0.5 }}
          className="absolute bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-lg shadow-xl text-left pointer-events-none"
        >
          <span className="text-[7px] font-bold text-slate-400 block font-mono">XGB_PRED</span>
          <span className="text-[9px] font-black text-emerald-400 font-mono tracking-wide">BULLISH</span>
        </motion.div>

        {/* ==================== EMAIL TYPING DATA VORTEX STREAMS ==================== */}
        <AnimatePresence>
          {isEmailFocused && (
            <>
              {/* Particle Stream 1 */}
              <motion.div
                initial={{ opacity: 0, x: -140, y: 30, z: -50, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, z: 0, scale: [0.5, 1, 0.2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                className={`absolute w-1.5 h-1.5 rounded-full ${accentColor === "cyan" ? "bg-amber-400" : accentColor === "emerald" ? "bg-emerald-400" : accentColor === "indigo" ? "bg-orange-400" : "bg-rose-400"} shadow-md`}
              />
              {/* Particle Stream 2 */}
              <motion.div
                initial={{ opacity: 0, x: -140, y: -20, z: -50, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, z: 0, scale: [0.5, 1, 0.2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                className={`absolute w-2 h-2 rounded-full ${accentColor === "cyan" ? "bg-amber-400" : accentColor === "emerald" ? "bg-emerald-400" : accentColor === "indigo" ? "bg-orange-400" : "bg-rose-400"} shadow-md`}
              />
              {/* Particle Stream 3 */}
              <motion.div
                initial={{ opacity: 0, x: -140, y: 10, z: -50, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, z: 0, scale: [0.5, 1, 0.2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                className={`absolute w-1.5 h-1.5 rounded-full ${accentColor === "cyan" ? "bg-amber-400" : accentColor === "emerald" ? "bg-emerald-400" : accentColor === "indigo" ? "bg-orange-400" : "bg-rose-400"} shadow-md`}
              />
            </>
          )}
        </AnimatePresence>

      </motion.div>

      {/* Floating Sparkles/Particles background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ y: [0, -22, 0], x: [0, 8, 0], opacity: [0.25, 0.65, 0.25] }}
          transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
          className="absolute left-[15%] top-[25%] w-2 h-2 rounded-full bg-white opacity-40 blur-[1px]"
        />
        <motion.div 
          animate={{ y: [0, 24, 0], x: [0, -8, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 6.0, ease: "easeInOut", delay: 1.5 }}
          className="absolute right-[15%] bottom-[30%] w-2.5 h-2.5 rounded-full bg-white opacity-30 blur-[1px]"
        />
      </div>
    </div>
  );
}
