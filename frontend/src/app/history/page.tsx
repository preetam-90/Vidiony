"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { History, Play, Trash2, Clock, AlertCircle } from "lucide-react";

const BACKEND_ROOT = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") : "";

type HistoryItem = {
  id: string;
  videoId: string;
  title?: string;
  thumbnail?: string;
  channelName?: string;
  duration?: number;
  progress: number;
  watchedAt: string;
};

// Beautiful relative time formatter
function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

function formatTime(s?: number) {
  if (!s || isNaN(s)) return "0:00";
  const sec = Math.floor(s);
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function HistoryPage() {
  const [continueItems, setContinueItems] = useState<HistoryItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const fetchOpts = { credentials: "include" as RequestCredentials, cache: "no-store" as RequestCache };
        
        const contRes = await fetch(`${BACKEND_ROOT}/history/continue`, fetchOpts);
        if (!contRes.ok) {
          if (contRes.status === 401) throw new Error("unauthorized");
          throw new Error(`Failed to load continue watching: ${contRes.status}`);
        }
        const cont = await contRes.json();

        const histRes = await fetch(`${BACKEND_ROOT}/history`, fetchOpts);
        if (!histRes.ok) {
          if (histRes.status === 401) throw new Error("unauthorized");
          throw new Error(`Failed to load watch history: ${histRes.status}`);
        }
        const hist = await histRes.json();

        if (cont?.items) {
          const filtered = (cont.items as HistoryItem[]).filter((it) => 
            (it.duration ?? 0) > 0 ? it.progress < Math.floor((it.duration ?? 0) * 0.9) : true
          );
          setContinueItems(filtered);
        }

        if (hist?.items) setHistoryItems(hist.items as HistoryItem[]);
      } catch (err: any) {
        if (err?.message === "unauthorized") setError("unauthorized");
        else setError(err?.message ?? "An error occurred while loading history.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function removeOne(videoId: string) {
    try {
      await fetch(`${BACKEND_ROOT}/history/${encodeURIComponent(videoId)}`, { method: "DELETE", credentials: "include" });
      setHistoryItems((s) => s.filter((i) => i.videoId !== videoId));
      setContinueItems((s) => s.filter((i) => i.videoId !== videoId));
    } catch {
      alert("Failed to remove item.");
    }
  }

  async function clearAll() {
    if (!confirm("Are you sure you want to clear your entire watch history? This cannot be undone.")) return;
    try {
      await fetch(`${BACKEND_ROOT}/history`, { method: "DELETE", credentials: "include" });
      setHistoryItems([]);
      setContinueItems([]);
    } catch {
      alert("Failed to clear history.");
    }
  }

  // --- RENDERING STATES ---

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin opacity-80" />
        <p className="text-muted-foreground animate-pulse font-medium">Loading your history...</p>
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="bg-muted/50 p-6 rounded-full mb-6">
          <History className="h-16 w-16 text-muted-foreground/60" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-3">Keep track of what you watch</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-[400px]">
          Watch history isn't viewable when you're signed out. Sign in to see your recently watched videos.
        </p>
        <Link 
          href="/auth/login" 
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-destructive/20 bg-destructive/5 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const hasNoHistory = historyItems.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 space-y-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Watch History
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Pick up right where you left off.
          </p>
        </div>
        {!hasNoHistory && (
          <button 
            onClick={clearAll} 
            className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-secondary/50 text-secondary-foreground hover:bg-destructive/10 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            Clear all history
          </button>
        )}
      </div>

      {hasNoHistory ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-muted/30 p-8 rounded-full mb-6">
            <History className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No videos here</h2>
          <p className="text-muted-foreground max-w-sm">
            Videos you watch will appear here so you can easily find them later.
          </p>
        </div>
      ) : (
        <>
          {/* CONTINUE WATCHING SECTION */}
          {continueItems.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight border-b border-border/40 pb-2">Continue Watching</h2>
              <div className="flex flex-col gap-3">
                {continueItems.map((it) => (
                  <HistoryCard key={it.videoId} item={it} onRemove={() => removeOne(it.videoId)} isContinue />
                ))}
              </div>
            </section>
          )}

          {/* FULL HISTORY SECTION */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-border/40 pb-2">All History</h2>
            <div className="flex flex-col gap-3">
              {historyItems.map((it) => (
                <HistoryCard key={it.videoId} item={it} onRemove={() => removeOne(it.videoId)} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// Sub-component for rendering the beautiful history cards
function HistoryCard({ item, onRemove, isContinue = false }: { item: HistoryItem, onRemove: () => void, isContinue?: boolean }) {
  const percent = Math.min(100, Math.max(0, Math.round(((item.progress ?? 0) / Math.max(1, (item.duration ?? 1))) * 100)));

  return (
    <div className="group relative flex flex-col sm:flex-row gap-4 p-3 pr-4 rounded-2xl hover:bg-card/60 transition-colors duration-300 border border-transparent hover:border-border/50">
      
      {/* THUMBNAIL AREA */}
      <Link href={`/watch/${item.videoId}`} className="block relative w-full sm:w-64 md:w-72 shrink-0 aspect-video rounded-xl overflow-hidden bg-muted">
        {item.thumbnail ? (
          // Using unoptimized to prevent Next.js domain whitelist errors for random YouTube image hosts
          <Image src={item.thumbnail} alt={item.title || "Video"} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><Play className="w-10 h-10" /></div>
        )}

        {/* TIME OVERLAY */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded tracking-wide">
          {formatTime(item.progress)} {item.duration ? ` / ${formatTime(item.duration)}` : ''}
        </div>

        {/* PROGRESS BAR */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
          <div className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" style={{ width: `${percent}%` }} />
        </div>

        {/* HOVER PLAY OVERLAY */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center transform group-hover:-translate-y-1">
            <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
          </div>
        </div>
      </Link>

      {/* METADATA AREA */}
      <div className="flex flex-col flex-1 min-w-0 py-1 sm:py-2">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/watch/${item.videoId}`} className="flex-1 min-w-0 group-hover:text-primary transition-colors">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-1.5" title={item.title}>{item.title}</h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
              <span className="truncate text-foreground/80 font-medium">{item.channelName}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5" />
                {getRelativeTime(item.watchedAt)}
              </span>
            </div>
            
            {/* Short description/extra info placeholder - typical in list layouts */}
            {isContinue && (
              <p className="mt-3 text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded-md">
                Resume playing
              </p>
            )}
          </Link>
          
          {/* REMOVE BUTTON */}
          <button 
            onClick={(e) => { e.preventDefault(); onRemove(); }}
            className="shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-4 right-4 sm:static sm:opacity-100 bg-background/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none"
            title="Remove from history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
