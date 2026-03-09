"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/api";
import { Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      router.replace(`/auth/login?error=${encodeURIComponent(error ?? "no_token")}`);
      return;
    }

    // Store the token
    setAccessToken(token);

    // Full page reload so AuthProvider re-mounts and picks up the token from localStorage
    const redirect = sessionStorage.getItem("vidion_login_redirect") ?? "/";
    sessionStorage.removeItem("vidion_login_redirect");
    window.location.href = redirect;
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f0f0f]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 ring-1 ring-violet-500/30">
        <svg viewBox="0 0 40 40" className="h-8 w-8 text-violet-400" fill="none">
          <path d="M10 30V10L20 22L30 10V30" stroke="currentColor" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Signing you in…</span>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
