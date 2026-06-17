import Dashboard from "@/components/Dashboard";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Premium ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-300/20 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-[40%] right-[-10%] h-[600px] w-[600px] rounded-full bg-rose-300/15 blur-[140px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-[10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-orange-300/15 blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Dashboard />
        <footer className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 border-t border-slate-200/80 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-700">CROKED</span>
              <span>·</span>
              <span>Indian Stock Market ML Analytics Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <span>© 2025 CROKED</span>
              <span>·</span>
              <Link href="/about" className="hover:text-slate-800 transition underline underline-offset-2">Methodology &amp; Disclaimer</Link>
              <span>·</span>
              <span className="text-amber-600 font-semibold">For educational purposes only</span>
              <span>·</span>
              <span>Not SEBI-registered investment advice</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
