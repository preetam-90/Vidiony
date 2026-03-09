/**
 * Live chat service — manages per-video polling rooms.
 *
 * Each room polls YouTube's live chat via youtubei.js VideoInfo.getLiveChat()
 * and broadcasts messages to all connected WebSocket clients.
 */

import { EventEmitter } from "node:events";
import { getInnertube } from "../../innertube.js";

export interface LiveChatMessage {
  id: string;
  author: {
    name: string;
    channelId: string | null;
    avatar: string | null;
  };
  text: string;
  timestamp: string;
  isOwner: boolean;
  isModerator: boolean;
  isVerified: boolean;
  isMember: boolean;
  amount: string | null;
  color: string | null;
}

export interface ViewerCountUpdate {
  type: "viewer_count";
  count: number;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

class LiveChatRoom extends EventEmitter {
  readonly videoId: string;
  private clientCount = 0;
  private polling = false;
  private stopSignal = false;

  constructor(videoId: string) {
    super();
    this.videoId = videoId;
  }

  addClient(): void {
    this.clientCount++;
    this.emit("viewer_count", { type: "viewer_count", count: this.clientCount });
    if (!this.polling) this.startPolling().catch(() => {});
  }

  removeClient(): void {
    this.clientCount = Math.max(0, this.clientCount - 1);
    this.emit("viewer_count", { type: "viewer_count", count: this.clientCount });
    if (this.clientCount === 0) this.stopSignal = true;
  }

  get isEmpty(): boolean { return this.clientCount === 0; }

  private async startPolling(): Promise<void> {
    this.polling = true;
    this.stopSignal = false;

    try {
      const yt = await getInnertube();
      const info = await yt.getInfo(this.videoId);

      if (!info.basic_info.is_live) {
        console.log(`[LiveChat:${this.videoId}] Not a live stream, stopping poll`);
        this.emit("not_live");
        return;
      }

      // Get live chat continuation from VideoInfo
      const livechat = info.getLiveChat();

      livechat.on("chat-update", (action: any) => {
        if (this.stopSignal) return;

        const msg = this.parseAction(action);
        if (msg) this.emit("message", msg);
      });

      livechat.on("end", () => {
        console.log(`[LiveChat:${this.videoId}] Live chat ended`);
        this.emit("end");
      });

      livechat.on("error", (err: Error) => {
        console.error(`[LiveChat:${this.videoId}] Error:`, err.message);
        this.emit("error", err);
      });

      livechat.start();

      // Stop polling when no more clients
      while (!this.stopSignal && this.clientCount > 0) {
        await sleep(5000);
      }

      livechat.stop();
    } catch (err) {
      console.error(`[LiveChat:${this.videoId}] Init error:`, (err as Error).message);
      this.emit("error", err);
    } finally {
      this.polling = false;
    }
  }

  private parseAction(action: any): LiveChatMessage | null {
    const getText = (val: any): string => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (val.text) return val.text;
      if (Array.isArray(val.runs)) return val.runs.map((x: any) => x.text ?? "").join("");
      return String(val);
    };

    try {
      const item = action?.item;
      if (!item) return null;

      const renderer = item.as?.("LiveChatTextMessageRenderer") ??
                       item.as?.("LiveChatPaidMessageRenderer") ??
                       item;

      if (!renderer) return null;

      return {
        id: renderer.id ?? crypto.randomUUID(),
        author: {
          name: getText(renderer.author_name),
          channelId: renderer.author_external_channel_id ?? null,
          avatar: renderer.author_photo?.thumbnails?.[0]?.url ?? null,
        },
        text: getText(renderer.message),
        timestamp: new Date().toISOString(),
        isOwner: renderer.author_badges?.some((b: any) => b.icon?.icon_type === "OWNER") ?? false,
        isModerator: renderer.author_badges?.some((b: any) => b.icon?.icon_type === "MODERATOR") ?? false,
        isVerified: renderer.author_badges?.some((b: any) => b.icon?.icon_type === "VERIFIED") ?? false,
        isMember: renderer.author_badges?.some((b: any) => b.custom_thumbnail) ?? false,
        amount: renderer.purchase_amount_text ? getText(renderer.purchase_amount_text) : null,
        color: renderer.header_background_color
          ? `#${renderer.header_background_color.toString(16).slice(-6).toUpperCase()}`
          : null,
      };
    } catch {
      return null;
    }
  }
}

// ─── Room registry ────────────────────────────────────────────────────────────

const rooms = new Map<string, LiveChatRoom>();

export function joinRoom(videoId: string): LiveChatRoom {
  let room = rooms.get(videoId);
  if (!room) {
    room = new LiveChatRoom(videoId);
    rooms.set(videoId, room);
    updateMetrics();
  }
  room.addClient();
  return room;
}

export function leaveRoom(videoId: string): void {
  const room = rooms.get(videoId);
  if (!room) return;
  room.removeClient();
  if (room.isEmpty) {
    rooms.delete(videoId);
    updateMetrics();
  }
}

function updateMetrics(): void {
  try {
    import("../../plugins/metrics.js").then(({ activeLiveChats }) => {
      activeLiveChats.set(rooms.size);
    }).catch(() => {});
  } catch {}
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
