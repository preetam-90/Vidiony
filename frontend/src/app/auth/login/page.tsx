"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  google_failed:  "Google sign-in failed. Please try again.",
  missing_code:   "Google did not return an authorisation code. Please try again.",
  access_denied:  "You denied access. Please try again.",
  missing_config: "Google login is not configured on this server.",
  no_token:       "Authentication failed. Please try again.",
};

function CloudPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none text-red-100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="chinese-cloud" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <path d="M30 40c0-11 9-20 20-20s20 9 20 20c11 0 20 9 20 20s-9 20-20 20H30c-11 0-20-9-20-20s9-20 20-20z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 40c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#chinese-cloud)" />
    </svg>
  );
}

function LatticeDivider() {
  return (
    <div className="flex items-center justify-center w-full my-8 opacity-60">
      <div className="h-px bg-gradient-to-r from-transparent via-red-800 to-transparent flex-1" />
      <div className="mx-4 flex gap-1.5">
        <div className="w-1.5 h-1.5 rotate-45 border border-red-500" />
        <div className="w-2 h-2 rotate-45 border border-amber-500 bg-amber-500/20" />
        <div className="w-1.5 h-1.5 rotate-45 border border-red-500" />
      </div>
      <div className="h-px bg-gradient-to-r from-red-800 via-transparent to-transparent flex-1" />
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const error = searchParams.get("error");
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? `Sign-in error: ${error}`) : null;

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/google`;
  };

  if (isLoading) return null;

  return (
    <div className="relative w-full max-w-md mx-auto p-10 sm:p-12 rounded-lg overflow-hidden border border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl">
      {/* Decorative lattice corners */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-red-800/40 opacity-70 pointer-events-none">
        <div className="absolute top-1.5 left-1.5 w-8 h-8 border-t border-l border-amber-600/30" />
      </div>
      <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-red-800/40 opacity-70 pointer-events-none">
        <div className="absolute top-1.5 right-1.5 w-8 h-8 border-t border-r border-amber-600/30" />
      </div>
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-red-800/40 opacity-70 pointer-events-none">
        <div className="absolute bottom-1.5 left-1.5 w-8 h-8 border-b border-l border-amber-600/30" />
      </div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-red-800/40 opacity-70 pointer-events-none">
        <div className="absolute bottom-1.5 right-1.5 w-8 h-8 border-b border-r border-amber-600/30" />
      </div>

      {/* Logo & Header */}
      <div className="relative flex flex-col items-center gap-5 z-10">
        <Link href="/" className="flex flex-col items-center gap-5 group">
          <div className="flex h-14 w-14 items-center justify-center border-2 border-red-700 bg-red-950/40 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all duration-500 group-hover:shadow-[0_0_35px_rgba(220,38,38,0.4)] group-hover:bg-red-900/50" style={{ borderRadius: '4px' }}>
            <span className="font-serif font-bold text-2xl tracking-tighter">V</span>
          </div>
          <span className="text-2xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-red-600 uppercase ml-[0.3em]">
            Vidion
          </span>
        </Link>
        <div className="text-center mt-2">
          <h1 className="text-[0.95rem] tracking-[0.2em] text-slate-300 font-medium uppercase">Enter the Realm</h1>
          <p className="mt-2 text-sm tracking-wide text-slate-500">Your visual journey awaits</p>
        </div>
      </div>

      <LatticeDivider />

      {/* Error banner */}
      {errorMsg && (
        <div className="relative z-10 mb-6 rounded border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300 text-center tracking-wide shadow-inner shadow-red-900/20">
          {errorMsg}
        </div>
      )}

      {/* Action Area */}
      <div className="relative z-10 space-y-6">
        <button
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
          className="group relative flex w-full items-center justify-center gap-4 rounded bg-gradient-to-b from-[#1a0f0f] to-[#120a0a] border border-red-900/60 px-6 py-4 text-[0.8rem] tracking-[0.15em] font-medium text-slate-200 transition-all duration-300 hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(220,38,38,0.15)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:transform-none disabled:cursor-not-allowed overflow-hidden uppercase"
        >
          {/* Subtle animated gloss effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-red-600/10 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
          
          {isRedirecting
            ? <Loader2 className="h-5 w-5 animate-spin text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]" />
            : <GoogleLogo className="h-5 w-5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          }
          <span className="mt-[2px]">{isRedirecting ? "Opening Gates..." : "Continue with Google"}</span>
        </button>
      </div>

      <div className="relative z-10 mt-8 text-center text-xs tracking-wide text-slate-600 leading-relaxed font-light">
        <p>By crossing this threshold, you accept our</p>
        <p className="mt-1">
          <Link href="/terms" className="text-amber-700 hover:text-amber-500 transition-colors underline decoration-amber-900/50 underline-offset-4">Terms</Link>
          <span className="mx-2 text-slate-700">·</span>
          <Link href="/privacy" className="text-amber-700 hover:text-amber-500 transition-colors underline decoration-amber-900/50 underline-offset-4">Privacy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-[#030303] text-slate-200 overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.02); }
        }
        @keyframes pulse-lantern {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
      `}} />
      
      {/* Universal Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CloudPattern />
        {/* Soft center lantern glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12)_0%,rgba(180,83,9,0.05)_40%,transparent_70%)] animate-[pulse-lantern_8s_ease-in-out_infinite]" />
      </div>

      {/* Left Panel - Dramatic Illustration Motif (Hidden on mobile) */}
      <div className="hidden lg:flex relative w-[55%] border-r border-red-950/40 flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-[#050303] via-[#0a0505] to-[#050202]">
        {/* Deep ink wash textures using radial gradients */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_60%)]" />
          <div className="w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.08),transparent_60%)]" />
        </div>

        {/* Floating Motif Illustration */}
        <div className="relative z-10 w-full max-w-[500px] aspect-square animate-[float_12s_ease-in-out_infinite]">
          <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_40px_rgba(220,38,38,0.15)]">
            <defs>
              <radialGradient id="sun-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#991B1B" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="mount-front" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0a0a0a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#450a0a" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="mount-back" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#022c22" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="mist" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#050505" stopOpacity="1" />
                <stop offset="100%" stopColor="#050505" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Glowing Sun */}
            <circle cx="200" cy="180" r="110" fill="url(#sun-grad)" />

            {/* Distant jade peaks */}
            <path d="M-50,320 Q100,180 220,270 T480,200 L480,400 L-50,400 Z" fill="url(#mount-back)" stroke="#059669" strokeWidth="0.5" strokeOpacity="0.4" />
            
            {/* Front dark peaks */}
            <path d="M-20,400 Q150,220 260,300 T450,400 Z" fill="url(#mount-front)" stroke="#DC2626" strokeWidth="1" strokeOpacity="0.4" />
            <path d="M120,400 Q220,290 300,340 T450,400 Z" fill="#030303" stroke="#D97706" strokeWidth="0.5" strokeOpacity="0.5" />
            
            {/* Base Mist to blend with background */}
            <rect x="0" y="300" width="400" height="100" fill="url(#mist)" />

            {/* Stylized Minimalist Clouds */}
            <g stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4">
              <path d="M110,140 Q130,120 150,140 Q170,120 190,140" />
              <path d="M260,100 Q280,80 300,100 Q320,80 340,100" />
              <path d="M70,220 Q90,200 110,220 Q130,200 150,220" />
            </g>
          </svg>
        </div>


      </div>

      {/* Right Panel - Form Area */}
      <div className="relative w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 z-10">
        <Suspense fallback={
          <div className="flex flex-col items-center gap-4 text-red-600/80">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="tracking-[0.3em] text-xs uppercase font-medium">Entering...</span>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
