/**
 * Prefetch worker — run periodically (cron / systemd / kubernetes) to warm Redis cache.
 *
 * Usage:
 *   pnpm --filter vidion-backend exec tsx src/scripts/prefetch.ts
 */
import "dotenv/config";
import * as ytService from "../services/youtube.service.js";

async function prefetch() {
  try {
    console.log("Prefetch: fetching feed to warm cache...");
    await ytService.getFeed();
    console.log("Prefetch: feed cached.");

    // Optionally prefetch a few popular search queries
    const popular = ["music", "news", "comedy", "sports"]; // customize
    for (const q of popular) {
      try {
        console.log(`Prefetch: searching '${q}'`);
        await ytService.search(q);
      } catch (err) {
        console.warn("Prefetch search failed", q, err);
      }
    }

    console.log("Prefetch complete");
  } catch (err) {
    console.error("Prefetch worker error:", err);
  } finally {
    process.exit(0);
  }
}

prefetch();
