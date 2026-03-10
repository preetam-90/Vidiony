"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
        const contRes = await fetch(`${BACKEND_ROOT}/history/continue`, { credentials: "include" });
        if (!contRes.ok) {
          if (contRes.status === 401) throw new Error("unauthorized");
          throw new Error(`continue fetch failed: ${contRes.status}`);
        }
        const cont = await contRes.json();

        const histRes = await fetch(`${BACKEND_ROOT}/history`, { credentials: "include" });
        if (!histRes.ok) {
          if (histRes.status === 401) throw new Error("unauthorized");
          throw new Error(`history fetch failed: ${histRes.status}`);
        }
        const hist = await histRes.json();

        if (cont && cont.items) {
          const filtered = (cont.items as HistoryItem[]).filter((it) => (it.duration ?? 0) > 0 ? it.progress < Math.floor((it.duration ?? 0) * 0.9) : true);
          setContinueItems(filtered);
        }

        if (hist && hist.items) setHistoryItems(hist.items as HistoryItem[]);
      } catch (err: any) {
        if (err?.message === "unauthorized") {
          setError("unauthorized");
        } else {
          console.error("History fetch error", err);
          setError(err?.message ?? "Failed to load history");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function removeOne(videoId: string) {
    await fetch(`${BACKEND_ROOT}/history/${encodeURIComponent(videoId)}`, { method: "DELETE", credentials: "include" });
    setHistoryItems((s) => s.filter((i) => i.videoId !== videoId));
    setContinueItems((s) => s.filter((i) => i.videoId !== videoId));
  }

  async function clearAll() {
    await fetch(`${BACKEND_ROOT}/history`, { method: "DELETE", credentials: "include" });
    setHistoryItems([]);
    setContinueItems([]);
  }

  if (loading) return <div className="p-6">Loading history...</div>;

  if (error === "unauthorized") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Watch History</h2>
        <div className="text-muted-foreground">Please sign in to view your watch history.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Watch History</h2>
        <div className="text-red-500">Error loading history: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Continue Watching</h2>
      {continueItems.length === 0 ? (
        <div className="text-muted-foreground">No continue watching items</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {continueItems.map((it) => (
            <div key={it.videoId} className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative group">
                <Link href={`/watch/${it.videoId}`} className="block w-full h-0 pb-[56.25%] relative">
                  {it.thumbnail ? (
                    <Image src={it.thumbnail} alt={it.title || ""} fill className="object-cover" />
                  ) : (
                    <div className="bg-muted w-full h-full absolute inset-0" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <div className="absolute left-3 bottom-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{formatTime(it.progress)} / {formatTime(it.duration ?? 0)}</div>
                <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/watch/${it.videoId}`} className="bg-white/90 text-black px-2 py-1 rounded text-sm">Resume</Link>
                  <button onClick={() => removeOne(it.videoId)} className="bg-black/60 text-white px-2 py-1 rounded text-sm">Remove</button>
                </div>
              </div>

              <div className="p-3">
                <div className="font-semibold line-clamp-2">{it.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{it.channelName}</div>
                <div className="mt-3 h-2 w-full bg-muted rounded overflow-hidden"><div style={{ width: `${Math.round(((it.progress ?? 0) / Math.max(1, (it.duration ?? 1))) * 100)}%`}} className="h-full bg-gradient-to-r from-primary to-emerald-500" /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Watch History</h2>
        <div>
          <button onClick={clearAll} className="btn btn-danger">Clear all</button>
        </div>
      </div>

      {historyItems.length === 0 ? (
        <div className="mt-4 text-muted-foreground">No history yet</div>
      ) : (
        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {historyItems.map((it) => (
            <div key={it.videoId} className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <Link href={`/watch/${it.videoId}`} className="block">
                <div className="relative w-full h-0 pb-[56.25%]">
                  {it.thumbnail ? (
                    <Image src={it.thumbnail} alt={it.title || ""} fill className="object-cover" />
                  ) : (
                    <div className="bg-muted w-full h-full absolute inset-0" />
                  )}
                </div>
              </Link>

              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold line-clamp-2">{it.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{it.channelName}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(it.watchedAt).toLocaleDateString()}</div>
                </div>

                <div className="mt-3 h-2 w-full bg-muted rounded overflow-hidden"><div style={{ width: `${Math.round(((it.progress ?? 0) / Math.max(1, (it.duration ?? 1))) * 100)}%`}} className="h-full bg-gradient-to-r from-primary to-emerald-500" /></div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{formatTime(it.progress)} / {formatTime(it.duration ?? 0)}</div>
                  <div className="flex items-center gap-2">
                    <Link href={`/watch/${it.videoId}`} className="text-sm px-3 py-1 rounded bg-white/90 text-black">Watch</Link>
                    <button onClick={() => removeOne(it.videoId)} className="text-sm px-3 py-1 rounded bg-transparent border border-gray-200">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(s?: number) {
  if (!s) return "0:00";
  const sec = Math.floor(s);
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
