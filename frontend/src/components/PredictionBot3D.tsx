"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Shield, TrendingUp, TrendingDown } from "lucide-react";

interface PredictionBot3DProps {
  isEmailFocused: boolean;
  isPasswordFocused: boolean;
  loading: boolean;
  error: string | null;
  success: boolean;
  accentColor: "cyan" | "emerald" | "indigo" | "violet";
}

// Color palettes tailored for each theme accent
const THEME_STYLES = {
  cyan: { // Gold/Amber Accent
    accent: "#eab308",
    glow: "rgba(234, 179, 8, 0.45)",
    glowLight: "rgba(234, 179, 8, 0.15)",
    shadow: "rgba(180, 100, 0, 0.3)",
    accentCyan: "#22d3ee" // Default cyan details on the robot
  },
  emerald: { // Green Accent
    accent: "#10b981",
    glow: "rgba(16, 185, 129, 0.45)",
    glowLight: "rgba(16, 185, 129, 0.15)",
    shadow: "rgba(0, 100, 50, 0.3)",
    accentCyan: "#34d399"
  },
  indigo: { // Orange Accent
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.45)",
    glowLight: "rgba(249, 115, 22, 0.15)",
    shadow: "rgba(150, 50, 0, 0.3)",
    accentCyan: "#fb923c"
  },
  violet: { // Crimson/Rose Accent
    accent: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.45)",
    glowLight: "rgba(244, 63, 94, 0.15)",
    shadow: "rgba(150, 0, 50, 0.3)",
    accentCyan: "#fda4af"
  }
};

export default function PredictionBot3D({
  isEmailFocused,
  isPasswordFocused,
  loading,
  error,
  success,
  accentColor
}: PredictionBot3DProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const theme = THEME_STYLES[accentColor] || THEME_STYLES.cyan;

  // Track cursor position to tilt the mascot
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5; // -0.5 to 0.5
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Determine target rotations based on form interactions
  const headRotateY = isPasswordFocused ? 180 : isEmailFocused ? 24 : mousePos.x * 40;
  const headRotateX = isPasswordFocused ? 6 : isEmailFocused ? 18 : mousePos.y * 24;

  const torsoRotateY = isPasswordFocused ? 20 : isEmailFocused ? 10 : mousePos.x * 15;
  const torsoRotateX = isPasswordFocused ? 2 : isEmailFocused ? 8 : mousePos.y * 10;

  // Determine eyes offset inside the visor (gives an "alive" look)
  const eyeX = isEmailFocused ? 8 : mousePos.x * 18;
  const eyeY = isEmailFocused ? 6 : mousePos.y * 10;

  // Mascot dynamic bobbing / shakes / jumps
  const botBouncing = success
    ? { y: [0, -32, 0], scaleY: [1, 0.82, 1.05, 1] }
    : error
      ? { x: [0, -10, 10, -10, 10, 0] }
      : loading
        ? { y: [0, -8, 0] }
        : { y: [0, -4, 0] };

  const bounceTransition = success
    ? { duration: 0.65, ease: "easeOut" as const }
    : error
      ? { duration: 0.38 }
      : loading
        ? { repeat: Infinity, duration: 1.0, ease: "easeInOut" as const }
        : { repeat: Infinity, repeatType: "reverse" as const, duration: 4.2, ease: "easeInOut" as const };

  // Arms joint motion configurations
  // When password focused, arms move up to cover the visor screen
  const leftArmAnimate = isPasswordFocused
    ? { 
        rotateZ: 45, 
        rotateX: -15, 
        x: -28, 
        y: -50,
        z: 80 // Bring forward to cover visor
      }
    : isEmailFocused
      ? { 
          rotateZ: [5, -15, 5], 
          x: -42, 
          y: 2, 
          z: 20 
        } // typing pose
      : { 
          rotateZ: [0, 8, 0], 
          y: [0, 3, 0],
          z: 0 
        }; // standard float

  const rightArmAnimate = isPasswordFocused
    ? { 
        rotateZ: -45, 
        rotateX: -15, 
        x: 28, 
        y: -50,
        z: 80 
      }
    : isEmailFocused
      ? { 
          rotateZ: [-5, 15, -5], 
          x: 42, 
          y: 2, 
          z: 20 
        } // typing pose
      : { 
          rotateZ: [0, -8, 0], 
          y: [0, -3, 0],
          z: 0 
        }; // standard float

  const leftArmTransition = isPasswordFocused
    ? { duration: 0.45, ease: "easeOut" as const }
    : isEmailFocused
      ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" as const }
      : { repeat: Infinity, repeatType: "reverse" as const, duration: 3.5, ease: "easeInOut" as const };

  const rightArmTransition = isPasswordFocused
    ? { duration: 0.45, ease: "easeOut" as const }
    : isEmailFocused
      ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" as const, delay: 0.15 }
      : { repeat: Infinity, repeatType: "reverse" as const, duration: 3.8, ease: "easeInOut" as const };

  return (
    <div 
      className="relative w-full h-[350px] flex flex-col items-center justify-center select-none"
      style={{ perspective: "1200px" }}
    >
      {/* Ambient glowing background orb */}
      <div 
        className="absolute w-[220px] h-[220px] rounded-full blur-[40px] opacity-35 transition-all duration-700 pointer-events-none z-0"
        style={{
          background: error 
            ? "radial-gradient(circle, rgba(244,63,94,0.45) 0%, transparent 70%)" 
            : success 
              ? "radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)" 
              : `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`
        }}
      />

      {/* Tilted 3D Orbit Ring */}
      <motion.div
        animate={{ rotate: 360, rotateX: 72, rotateY: 10 }}
        style={{ transformStyle: "preserve-3d" }}
        transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
        className="absolute w-[280px] h-[280px] border border-dashed border-slate-300/40 rounded-full flex items-center justify-center pointer-events-none z-0"
      >
        <div className="absolute top-0 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full shadow-sm transform -translate-y-1/2 translate-z-[12px] flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          <span className="text-[8px] font-black text-emerald-600">BULL</span>
        </div>
        <div className="absolute bottom-0 bg-rose-50 border border-rose-250 px-2 py-0.5 rounded-full shadow-sm transform translate-y-1/2 translate-z-[12px] flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-rose-500" />
          <span className="text-[8px] font-black text-rose-600">BEAR</span>
        </div>
      </motion.div>

      {/* Neck Segment */}
      <motion.div
        style={{
          rotateX: torsoRotateX * 0.7,
          rotateY: torsoRotateY * 0.7,
          transformStyle: "preserve-3d"
        }}
        className="absolute bottom-[104px] w-5 h-8 bg-slate-300 border border-slate-200 rounded-full shadow-inner z-10"
      />

      {/* Main Robot Structure */}
      <motion.div
        animate={botBouncing}
        transition={bounceTransition}
        style={{ transformStyle: "preserve-3d" }}
        className="relative flex flex-col items-center justify-center"
      >
        {/* ==================== 1. HEAD (WHITE SPHERICAL HELMET) ==================== */}
        <motion.div
          style={{
            rotateX: headRotateX,
            rotateY: headRotateY,
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom -10px"
          }}
          transition={{ type: "spring", stiffness: 90, damping: 15 }}
          className="relative w-[150px] h-[125px] z-20 cursor-pointer"
        >
          {/* Main Helmet Spherical Shape */}
          <div 
            style={{ 
              background: "radial-gradient(circle at 35% 30%, #ffffff 0%, #f8fafc 40%, #e2e8f0 85%, #cbd5e1 100%)",
              boxShadow: "inset 6px 8px 18px rgba(255, 255, 255, 1), inset -8px -10px 18px rgba(148, 163, 184, 0.4), 0 14px 28px rgba(15, 23, 42, 0.12)",
              transform: "translateZ(0px)",
              transformStyle: "preserve-3d"
            }}
            className="absolute inset-0 rounded-[3rem] border border-white/50 flex items-center justify-center overflow-visible"
          >
            {/* Glossy highlight line */}
            <div className="absolute top-1.5 left-8 right-8 h-4 rounded-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

            {/* FRONT VISOR PANEL */}
            <div 
              style={{
                background: error 
                  ? "radial-gradient(circle at 30% 30%, #9f1239, #881337, #4c0519)" 
                  : "radial-gradient(circle at 30% 30%, #334155 0%, #0f172a 65%, #020617 100%)",
                boxShadow: "inset 2px 4px 8px rgba(0,0,0,0.85), inset -2px -2px 4px rgba(255,255,255,0.06), 0 4px 10px rgba(0,0,0,0.2)",
                border: "2.5px solid #cbd5e1",
                transform: "translateZ(10px) scale(0.95)",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden" as const
              }}
              className="w-[115px] h-[82px] rounded-[1.8rem] relative flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Visor specular glare */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-10" />

              {/* Glowing Interactive Visor Details */}
              <motion.div 
                style={{ x: eyeX, y: eyeY, transform: "translateZ(4px)" }}
                className="flex flex-col items-center justify-center gap-1.5 transition-all duration-150"
              >
                {/* Eyes Rendering based on state */}
                {error ? (
                  // Error: Crossed Eyes (X X)
                  <div className="flex gap-5">
                    <svg className="w-5 h-5 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.95)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <svg className="w-5 h-5 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.95)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                ) : success ? (
                  // Success: Happy Curved Eyes (^ ^)
                  <div className="flex gap-5">
                    <svg className="w-5.5 h-5.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    <svg className="w-5.5 h-5.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                ) : loading ? (
                  // Loading: Squinting Loading Bars
                  <div className="flex gap-5 items-center">
                    <div className="w-6 h-2 rounded-full bg-cyan-400 animate-pulse drop-shadow-[0_0_5px_#22d3ee]" />
                    <div className="w-6 h-2 rounded-full bg-cyan-400 animate-pulse drop-shadow-[0_0_5px_#22d3ee]" />
                  </div>
                ) : isPasswordFocused ? (
                  // Password cover state: tiny lock icon inside visor
                  <Lock className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_6px_#22d3ee] animate-pulse" />
                ) : (
                  // Normal: Glowing Cyan Circles
                  <div className="flex gap-5 items-center">
                    <div className="w-4.5 h-4.5 rounded-full bg-cyan-400 border border-cyan-300 drop-shadow-[0_0_7px_#22d3ee]" />
                    <div className="w-4.5 h-4.5 rounded-full bg-cyan-400 border border-cyan-300 drop-shadow-[0_0_7px_#22d3ee]" />
                  </div>
                )}

                {/* Smile / Mouth (shown when normal/success, hidden/sad on loading/error) */}
                {!loading && !isPasswordFocused && (
                  <motion.div 
                    animate={success ? { y: [0, -1, 0] } : {}}
                    className={`w-7 h-2.5 border-b-[3.5px] rounded-b-full transition-colors duration-300 ${
                      error ? "border-rose-500 drop-shadow-[0_0_4px_#f43f5e] rotate-180" : "border-cyan-400 drop-shadow-[0_1px_3px_#22d3ee]"
                    }`}
                  />
                )}
              </motion.div>
            </div>

            {/* BACK SECURITY PANEL (Visible when Y rotation is 180deg) */}
            <div 
              style={{
                background: "radial-gradient(circle at 50% 50%, #e2e8f0, #cbd5e1, #94a3b8)",
                boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.7), inset -3px -3px 6px rgba(0,0,0,0.15)",
                transform: "rotateY(180deg) translateZ(8px)",
                backfaceVisibility: "hidden" as const
              }}
              className="absolute inset-0 rounded-[3rem] border border-white/40 flex flex-col items-center justify-center p-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg">
                <Lock className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_4px_#22d3ee]" />
              </div>
              <span className="text-[7.5px] font-black font-mono tracking-widest text-slate-500 mt-2 uppercase">Secure Lock</span>
            </div>
          </div>

          {/* LEFT EAR HEADPHONE */}
          <div 
            style={{ 
              background: "#ffffff",
              boxShadow: "inset 3px 2px 5px rgba(255,255,255,0.9), inset -4px -3px 6px rgba(148,163,184,0.4), -4px 6px 12px rgba(0,0,0,0.08)",
              transform: "rotateY(-90deg) translateZ(75px)",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden" as const
            }}
            className="absolute left-[calc(50%-10px)] top-[calc(50%-30px)] w-[20px] h-[60px] rounded-full border border-slate-200 z-10 flex items-center justify-center"
          >
            {/* Concentric blue light detail */}
            <div 
              style={{ background: `radial-gradient(circle, ${theme.accentCyan}, transparent)` }}
              className="w-2.5 h-10 rounded-full opacity-80 blur-[1px] shadow-[0_0_6px_#22d3ee]" 
            />
          </div>

          {/* RIGHT EAR HEADPHONE */}
          <div 
            style={{ 
              background: "#ffffff",
              boxShadow: "inset -3px 2px 5px rgba(255,255,255,0.9), inset 4px -3px 6px rgba(148,163,184,0.4), 4px 6px 12px rgba(0,0,0,0.08)",
              transform: "rotateY(90deg) translateZ(75px)",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden" as const
            }}
            className="absolute right-[calc(50%-10px)] top-[calc(50%-30px)] w-[20px] h-[60px] rounded-full border border-slate-200 z-10 flex items-center justify-center"
          >
            <div 
              style={{ background: `radial-gradient(circle, ${theme.accentCyan}, transparent)` }}
              className="w-2.5 h-10 rounded-full opacity-80 blur-[1px] shadow-[0_0_6px_#22d3ee]" 
            />
          </div>
        </motion.div>

        {/* ==================== 2. TORSO / BODY (WHITE CAPSULE WITH CYAN STRIP) ==================== */}
        <motion.div
          style={{
            rotateX: torsoRotateX,
            rotateY: torsoRotateY,
            transformStyle: "preserve-3d",
            transformOrigin: "center top",
            y: 24
          }}
          transition={{ type: "spring", stiffness: 80, damping: 16 }}
          className="relative w-[100px] h-[100px] z-10"
        >
          {/* Main White Body Capsule */}
          <div 
            style={{
              background: "radial-gradient(circle at 35% 30%, #ffffff 0%, #f8fafc 45%, #e2e8f0 85%, #cbd5e1 100%)",
              boxShadow: "inset 4px 6px 15px rgba(255,255,255,1), inset -6px -8px 15px rgba(148,163,184,0.45), 0 10px 20px rgba(0,0,0,0.08)",
              transform: "translateZ(0px)",
              transformStyle: "preserve-3d"
            }}
            className="absolute inset-0 rounded-[2.5rem] border border-white/50 flex flex-col items-center overflow-visible"
          >
            {/* Specular body highlight */}
            <div className="absolute top-1 left-5 right-5 h-3 rounded-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

            {/* Glowing horizontal Cyan stripe */}
            <div 
              style={{
                boxShadow: "0 0 8px #22d3ee, inset 0 1px 2px rgba(255,255,255,0.4)"
              }}
              className="absolute top-[35px] w-full h-[6px] bg-cyan-400/95 z-10" 
            />

            {/* Shield Logo on Chest */}
            <div 
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                transform: "translateZ(5px)"
              }}
              className="absolute bottom-5 w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center shadow-md z-15"
            >
              <Shield 
                className="h-4 w-4" 
                style={{
                  color: error ? "#f43f5e" : success ? "#10b981" : theme.accent,
                  filter: `drop-shadow(0 0 2px ${error ? "#f43f5e" : success ? "#10b981" : theme.accent})`
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* ==================== 3. FLEXIBLE ORANGE ARMS WITH METAL CLAWS ==================== */}
        {/* LEFT ARM */}
        <motion.div
          animate={leftArmAnimate}
          transition={leftArmTransition}
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "right center -5px",
            x: -42,
            y: 6
          }}
          className="absolute z-25 w-[50px] h-[55px] flex items-center justify-start pointer-events-none"
        >
          {/* Flexible Orange rubber sleeve */}
          <div 
            style={{
              background: "linear-gradient(135deg, #fdba74, #f97316)",
              boxShadow: "inset 1px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.15), -2px 4px 6px rgba(0,0,0,0.06)",
              borderRadius: "12px 0 0 12px",
              transform: "rotateY(-15deg)"
            }}
            className="w-[30px] h-[16px]"
          />

          {/* Cyan wrist cuff */}
          <div 
            style={{
              boxShadow: "0 0 5px #22d3ee, inset 1px 1px 2px rgba(255,255,255,0.5)"
            }}
            className="w-[10px] h-[20px] bg-cyan-400 rounded-sm"
          />

          {/* Mechanical Grey Claw */}
          <div className="w-[12px] h-[18px] relative flex flex-col justify-between items-start pl-0.5">
            {/* Top Claw prong */}
            <div className="w-[8px] h-[3px] bg-slate-400 rounded-sm rotate-45 transform origin-left border-r border-slate-500" />
            {/* Middle hub */}
            <div className="w-[5px] h-[8px] bg-slate-550 rounded-xs" />
            {/* Bottom Claw prong */}
            <div className="w-[8px] h-[3px] bg-slate-400 rounded-sm -rotate-45 transform origin-left border-r border-slate-500" />
          </div>
        </motion.div>

        {/* RIGHT ARM */}
        <motion.div
          animate={rightArmAnimate}
          transition={rightArmTransition}
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "left center -5px",
            x: 42,
            y: 6
          }}
          className="absolute z-25 w-[50px] h-[55px] flex items-center justify-end pointer-events-none"
        >
          {/* Mechanical Grey Claw */}
          <div className="w-[12px] h-[18px] relative flex flex-col justify-between items-end pr-0.5">
            {/* Top Claw prong */}
            <div className="w-[8px] h-[3px] bg-slate-400 rounded-sm -rotate-45 transform origin-right border-l border-slate-500" />
            {/* Middle hub */}
            <div className="w-[5px] h-[8px] bg-slate-550 rounded-xs" />
            {/* Bottom Claw prong */}
            <div className="w-[8px] h-[3px] bg-slate-400 rounded-sm rotate-45 transform origin-right border-l border-slate-500" />
          </div>

          {/* Cyan wrist cuff */}
          <div 
            style={{
              boxShadow: "0 0 5px #22d3ee, inset 1px 1px 2px rgba(255,255,255,0.5)"
            }}
            className="w-[10px] h-[20px] bg-cyan-400 rounded-sm"
          />

          {/* Flexible Orange rubber sleeve */}
          <div 
            style={{
              background: "linear-gradient(135deg, #fdba74, #f97316)",
              boxShadow: "inset -1px 2px 4px rgba(255,255,255,0.4), inset 2px -2px 4px rgba(0,0,0,0.15), 2px 4px 6px rgba(0,0,0,0.06)",
              borderRadius: "0 12px 12px 0",
              transform: "rotateY(15deg)"
            }}
            className="w-[30px] h-[16px]"
          />
        </motion.div>
      </motion.div>

      {/* Floating Sparkles around robot */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ y: [0, -18, 0], x: [0, 6, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 5.0, ease: "easeInOut" }}
          className="absolute left-[12%] top-[25%] w-2 h-2 rounded-full bg-white opacity-40 blur-[1px]"
        />
        <motion.div 
          animate={{ y: [0, 20, 0], x: [0, -6, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.0 }}
          className="absolute right-[12%] bottom-[30%] w-2.5 h-2.5 rounded-full bg-white opacity-35 blur-[1px]"
        />
      </div>
    </div>
  );
}
