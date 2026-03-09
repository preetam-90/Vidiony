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
    <div className="w-full max-w-sm space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 ring-1 ring-violet-500/30">
            <svg viewBox="0 0 40 40" className="h-7 w-7 text-violet-400" fill="none">
              <path d="M10 30V10L20 22L30 10V30" stroke="currentColor" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">Vidion</span>
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-semibold">Sign in to Vidion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your YouTube account, supercharged</p>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Google button */}
      <div className="space-y-4">
        <button
          onClick={handleGoogleLogin}
          disabled={isRedirecting}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium transition-all hover:bg-white/[0.08] hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRedirecting
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <GoogleLogo className="h-5 w-5 flex-shrink-0" />
          }
          <span>{isRedirecting ? "Redirecting to Google…" : "Continue with Google"}</span>
        </button>

        {/* What you unlock */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Signing in gives you access to
          </p>
          {[
            { icon: "🎬", text: "Your real YouTube watch history" },
            { icon: "👍", text: "Liked videos & Watch Later" },
            { icon: "📋", text: "Your playlists & subscriptions" },
            { icon: "🔔", text: "YouTube notifications" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground/50">
        By signing in you agree to our{" "}
        <Link href="/terms" className="underline hover:text-muted-foreground">Terms</Link>{" "}and{" "}
        <Link href="/privacy" className="underline hover:text-muted-foreground">Privacy Policy</Link>.
        Vidion does not store your Google password.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.15),transparent)]" />
      </div>
      <Suspense fallback={
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
