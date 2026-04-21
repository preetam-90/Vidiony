"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { History, Play } from "lucide-react";
import HistoryPageClient from "@/components/history/HistoryPageClient";

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <Sidebar />
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-6 inline-block">
            <History className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Keep track of what you watch</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-[600px] mx-auto">
            Watch history isn't viewable when you're signed out. Sign in to see your recently watched videos on Vidion.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/auth/login" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Sign In
            </a>
            <a href="/" className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-sm">
              Explore
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Sidebar />
      <Navbar />
      <main className={cn("container mx-auto px-4 py-8 max-w-[1920px]")}>
        <HistoryPageClient />
      </main>
    </div>
  );
}