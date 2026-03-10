// Helper for history API calls used by the VideoPlayer
const BACKEND_ROOT = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") : "";

export async function fetchHistoryEntry(videoId: string) {
  try {
    const res = await fetch(`${BACKEND_ROOT}/history/video/${encodeURIComponent(videoId)}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store", // Ensure we always get the fresh resume position
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.entry ?? null;
  } catch {
    return null;
  }
}

export async function postHistoryUpdate(videoId: string, position: number, duration: number, meta?: { title?: string; thumbnail?: string; channelName?: string }) {
  // Prevent NaN or Infinity which crashes backend Zod validation
  const safePosition = Number.isFinite(position) ? Math.max(0, Math.floor(position)) : 0;
  const safeDuration = Number.isFinite(duration) ? Math.max(0, Math.floor(duration)) : 0;

  try {
    await fetch(`${BACKEND_ROOT}/history/update`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, position: safePosition, duration: safeDuration, ...meta }),
    });
  } catch {
    // ignore network errors
  }
}
