/**
 * Innertube singleton — one instance shared across the entire process.
 *
 * Used ONLY for metadata calls (search, feed, video info, channel, comments).
 * Stream URL deciphering is handled by yt-dlp (see youtube.service.ts) because
 * youtubei.js v16.0.1 cannot parse the current YouTube player's XOR-obfuscated
 * cipher algorithm (changed in early 2026).
 *
 * The vm eval shim is still required — youtubei.js calls it during player
 * initialisation to extract the signature timestamp used in API requests.
 * Without it the library throws on startup.
 */

import vm from "node:vm";
import { Innertube, UniversalCache, Platform } from "youtubei.js";

// ─── Minimal JavaScript evaluator ────────────────────────────────────────────
// youtubei.js calls Platform.shim.eval to run snippets from the YouTube player
// script.  For metadata the only value it needs is `rawValues.signatureTimestamp`.
// The evaluator below captures that correctly; the sig/n cipher functions are
// not extractable from the current player (they're XOR-obfuscated) but that
// doesn't affect metadata endpoints — only stream URL deciphering, which is
// delegated to yt-dlp.
Platform.shim.eval = (data, env) => {
  // The script assigns the IIFE result to `const exportedVars`.
  // `const` is not leaked to the vm context object, but vm.runInContext returns
  // the value of the last evaluated expression — so appending `; exportedVars;`
  // captures it.
  const context = vm.createContext({
    ...env,
    globalThis: {},
    Object, String, Array, Math, JSON, RegExp, Number, Boolean,
  });

  try {
    const exportedVars = vm.runInContext(data.output + "\n; exportedVars;", context);
    if (exportedVars && typeof exportedVars === "object") {
      const result: Record<string, unknown> = {};
      for (const name of data.exported) {
        result[name] = exportedVars[name];
      }
      return result;
    }
  } catch {
    // Ignore evaluation errors — the library logs its own warnings
  }
  return {};
};

// ─── Singleton ────────────────────────────────────────────────────────────────
let _instance: Innertube | null = null;

export async function getInnertube(): Promise<Innertube> {
  if (!_instance) {
    console.log("[Innertube] Creating singleton instance...");
    _instance = await Innertube.create({
      cache: new UniversalCache(true, "./.cache"),
      cookie: process.env.YT_COOKIE || undefined,
    });
    console.log("[Innertube] Ready. logged_in:", _instance.session.logged_in);
  }
  return _instance;
}

export function resetInnertube(): void {
  _instance = null;
}
