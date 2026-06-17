"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mail, Lock, Loader2, Sparkles, Eye, EyeOff,
  ArrowLeft, KeyRound, CheckCircle2, ShieldCheck
} from "lucide-react";
import { loginUser, registerUser, forgotPassword, resetPassword } from "@/lib/api";
import PredictionBot3D from "@/components/PredictionBot3D";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  accentColor?: "cyan" | "emerald" | "indigo" | "violet";
}

type AuthStep = "login" | "register" | "forgot" | "verify" | "reset-success";

const ACCENT_MAP = {
  cyan:    { btn: "bg-amber-600 hover:bg-amber-500",   ring: "focus:ring-amber-500/40 focus:border-amber-500", text: "text-amber-500", link: "text-amber-400 hover:text-amber-300" },
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-500", ring: "focus:ring-emerald-500/40 focus:border-emerald-500", text: "text-emerald-500", link: "text-emerald-400 hover:text-emerald-300" },
  indigo:  { btn: "bg-orange-600 hover:bg-orange-500",  ring: "focus:ring-orange-500/40 focus:border-orange-500",  text: "text-orange-500", link: "text-orange-400 hover:text-orange-300" },
  violet:  { btn: "bg-rose-600 hover:bg-rose-500",    ring: "focus:ring-rose-500/40 focus:border-rose-500",    text: "text-rose-500",   link: "text-rose-400 hover:text-rose-300" },
};

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 font-medium";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  accentColor = "cyan",
}: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>("login");
  const [direction, setDirection] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mascot states
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [success, setSuccess] = useState(false);

  const theme = ACCENT_MAP[accentColor];

  const navigate = (next: AuthStep, dir = 1) => {
    setDirection(dir);
    setError(null);
    setStep(next);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.access_token);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(data.access_token);
        setSuccess(false);
        onClose();
        resetForm();
      }, 1100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setTimeout(() => setLoading(false), 1100);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerUser(email, password);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("login", -1);
        setPassword("");
        setConfirmPassword("");
      }, 1100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setTimeout(() => setLoading(false), 1100);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setVerifyCode(""); // Code is NOT returned from API (security) — user checks email/console
      navigate("verify", 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email, enteredCode, newPassword);
      navigate("reset-success", 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirmPassword("");
    setVerifyCode(""); setEnteredCode(""); setNewPassword("");
    setError(null); setSuccess(false); setStep("login"); setDirection(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md md:max-w-3xl overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl relative grid grid-cols-1 md:grid-cols-2"
      >
        {/* Close */}
        <button
          onClick={() => { onClose(); resetForm(); }}
          className="absolute right-4 top-4 z-20 text-slate-500 hover:text-slate-200 transition p-1 rounded-full hover:bg-slate-800"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left: 3D Mascot */}
        <div className="hidden md:flex flex-col items-center justify-center bg-slate-950/40 border-r border-slate-800/60 p-8 relative select-none">
          <div className="absolute top-5 left-5">
            <span className={`text-[8px] font-black uppercase ${theme.text} tracking-widest bg-slate-800/60 border border-slate-700 px-2.5 py-1 rounded-lg`}>
              AI Security Guard
            </span>
          </div>
          <div className="w-full h-[260px]">
            <PredictionBot3D
              isEmailFocused={isEmailFocused}
              isPasswordFocused={isPasswordFocused}
              loading={loading}
              error={error}
              success={success}
              accentColor={accentColor}
            />
          </div>
          <div className="text-center px-4 space-y-1 mt-2">
            <h4 className="text-xs font-bold text-slate-300">Meet Crokee, your prediction helper</h4>
            <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
              Crokee monitors predictions, evaluates accuracy, and guards your login.
            </p>
          </div>

          {/* Decorative glow orb */}
          <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-${accentColor === "cyan" ? "amber" : accentColor === "indigo" ? "orange" : accentColor}-900/10 to-transparent pointer-events-none`} />
        </div>

        {/* Right: Form */}
        <div className="p-8 flex flex-col justify-center min-h-[480px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ── LOGIN ── */}
            {step === "login" && (
              <motion.div
                key="login"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-5"
              >
                <div className="text-center space-y-1 mb-2">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 ${theme.text} mb-2`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-white">Welcome Back</h2>
                  <p className="text-xs text-slate-400">Sign in to your CROKED account</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 text-center font-semibold"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        placeholder="you@example.com"
                        className={`${inputClass} ${theme.ring}`}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"} required value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        placeholder="••••••••"
                        className={`${inputClass} ${theme.ring}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-right mt-1.5">
                      <button
                        type="button"
                        onClick={() => navigate("forgot", 1)}
                        className={`text-[10px] font-semibold ${theme.link} transition`}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    type="submit" disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl ${theme.btn} px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg`}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                  </motion.button>
                </form>

                <p className="text-center text-xs text-slate-500 font-medium">
                  New to CROKED?{" "}
                  <button onClick={() => navigate("register", 1)} className={`font-bold ${theme.link} transition`} type="button">
                    Create an account
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── REGISTER ── */}
            {step === "register" && (
              <motion.div
                key="register"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => navigate("login", -1)} className="text-slate-500 hover:text-slate-300 transition">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-white">Create Account</h2>
                    <p className="text-[10px] text-slate-400">Join CROKED — it&apos;s free</p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 text-center font-semibold"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        placeholder="you@example.com"
                        className={`${inputClass} ${theme.ring}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"} required value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        placeholder="Min. 8 characters"
                        className={`${inputClass} ${theme.ring}`}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? "text" : "password"} required value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className={`${inputClass} ${theme.ring}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password match indicator */}
                    {confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`text-[10px] font-semibold mt-1 ${password === confirmPassword ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    type="submit" disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl ${theme.btn} px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                  </motion.button>
                </form>

                <p className="text-center text-xs text-slate-500 font-medium">
                  Already have an account?{" "}
                  <button onClick={() => navigate("login", -1)} className={`font-bold ${theme.link} transition`} type="button">
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {step === "forgot" && (
              <motion.div
                key="forgot"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => navigate("login", -1)} className="text-slate-500 hover:text-slate-300 transition">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-white">Reset Password</h2>
                    <p className="text-[10px] text-slate-400">We&apos;ll send a code to your email</p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 text-center font-semibold"
                  >
                    {error}
                  </motion.div>
                )}

                <div className={`flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700`}>
                  <KeyRound className={`h-4 w-4 ${theme.text} shrink-0 mt-0.5`} />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your registered email and we&apos;ll generate a 6-digit verification code to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        placeholder="you@example.com"
                        className={`${inputClass} ${theme.ring}`}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    type="submit" disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl ${theme.btn} px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Verification Code"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── VERIFY CODE + NEW PASSWORD ── */}
            {step === "verify" && (
              <motion.div
                key="verify"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => navigate("forgot", -1)} className="text-slate-500 hover:text-slate-300 transition">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-white">Enter Code</h2>
                    <p className="text-[10px] text-slate-400">Check your email for the 6-digit code</p>
                  </div>
                </div>

                {/* Security: code no longer shown in UI. Show email prompt instead. */}
                {verifyCode ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center gap-3`}
                  >
                    <ShieldCheck className={`h-4 w-4 ${theme.text} shrink-0`} />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Demo — Your Code</p>
                      <p className="text-lg font-black font-mono text-white tracking-[0.25em] mt-0.5">{verifyCode}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-xl bg-amber-900/30 border border-amber-700/50 flex items-center gap-3"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Check Your Email</p>
                      <p className="text-xs text-amber-200 mt-0.5 leading-relaxed">A 6-digit code was sent to your email or logged to the server console.</p>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 text-center font-semibold"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleVerifySubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Verification Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text" required value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit code"
                        maxLength={6}
                        className={`${inputClass} ${theme.ring} tracking-[0.3em] font-mono text-center`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type={showNewPassword ? "text" : "password"} required value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className={`${inputClass} ${theme.ring}`}
                      />
                      <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition">
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                    type="submit" disabled={loading}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl ${theme.btn} px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── RESET SUCCESS ── */}
            {step === "reset-success" && (
              <motion.div
                key="reset-success"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="flex flex-col items-center justify-center py-8 space-y-5 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-black text-white">Password Reset!</h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                    Your password has been successfully updated. You can now sign in.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                  onClick={() => navigate("login", -1)}
                  className={`px-6 py-2.5 rounded-xl ${theme.btn} text-sm font-bold text-white transition shadow-lg`}
                >
                  Back to Sign In
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
