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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${BACKEND_ROOT}/history/continue`, { credentials: "include" }).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${BACKEND_ROOT}/history`, { credentials: "include" }).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([cont, hist]) => {
      if (cont && cont.items) {
        // filter where progress < 90% of duration
        const filtered = (cont.items as HistoryItem[]).filter((it) => (it.duration ?? 0) > 0 ? it.progress < Math.floor((it.duration ?? 0) * 0.9) : true);
        setContinueItems(filtered);
      }
      if (hist && hist.items) setHistoryItems(hist.items as HistoryItem[]);
    }).finally(() => setLoading(false));
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Continue Watching</h2>
      {continueItems.length === 0 ? (
        <div className="text-muted-foreground">No continue watching items</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {continueItems.map((it) => (
            <Link key={it.videoId} href={`/watch/${it.videoId}`} className="flex gap-3 items-center bg-card p-3 rounded-lg">
              <div className="relative w-40 h-24 rounded overflow-hidden">
                {it.thumbnail ? (
                  <Image src={it.thumbnail} alt={it.title || ""} fill className="object-cover" />
                ) : (
                  <div className="bg-muted w-full h-full" />
                )}
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{formatTime(it.progress)} / {formatTime(it.duration ?? 0)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold line-clamp-2">{it.title}</div>
                <div className="text-sm text-muted-foreground">{it.channelName}</div>
                <div className="mt-2 h-2 w-full bg-muted rounded overflow-hidden"><div style={{ width: `${Math.round(((it.progress ?? 0) / Math.max(1, (it.duration ?? 1))) * 100)}%`}} className="h-full bg-primary" /></div>
              </div>
            </Link>
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
            <div key={it.videoId} className="bg-card rounded-lg overflow-hidden">
              <Link href={`/watch/${it.videoId}`} className="flex gap-3 p-3 items-center">
                <div className="relative w-40 h-24 rounded overflow-hidden">
                  {it.thumbnail ? (
                    <Image src={it.thumbnail} alt={it.title || ""} fill className="object-cover" />
                  ) : (
                    <div className="bg-muted w-full h-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold line-clamp-2">{it.title}</div>
                  <div className="text-sm text-muted-foreground">{it.channelName}</div>
                  <div className="mt-2 h-2 w-full bg-muted rounded overflow-hidden"><div style={{ width: `${Math.round(((it.progress ?? 0) / Math.max(1, (it.duration ?? 1))) * 100)}%`}} className="h-full bg-primary" /></div>
                  <div className="mt-1 text-xs text-muted-foreground">Last watched: {new Date(it.watchedAt).toLocaleString()}</div>
                </div>
              </Link>
              <div className="p-3 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{formatTime(it.progress)} / {formatTime(it.duration ?? 0)}</div>
                <div>
                  <button onClick={() => removeOne(it.videoId)} className="btn btn-ghost">Remove</button>
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
