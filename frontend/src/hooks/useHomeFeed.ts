/**
 * Returns videos for the active homepage category.
 *
 * "all"  → tries getFeed first; falls back to search("technology programming AI")
 *           if feed returns 0 videos (getTrending/getHomeFeed often fails without
 *           a YT_COOKIE set — search is always reliable).
 * others → searches the backend with a category-scoped query.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const CATEGORY_QUERIES: Record<string, string> = {
  ai:              "artificial intelligence machine learning deep learning 2025",
  programming:     "programming tutorial coding best practices 2025",
  "system-design": "system design interview architecture scalability",
  cybersecurity:   "cybersecurity ethical hacking network security",
  cloud:           "cloud computing aws azure kubernetes devops",
  "data-science":  "data science analytics python pandas machine learning",
  devops:          "devops ci cd docker kubernetes infrastructure automation",
};

// Broad tech query used as fallback when feed returns 0 videos
const FEED_FALLBACK_QUERY = "technology programming AI engineering 2025";

export function useHomeFeed(category: string) {
  const isAll = category === "all";

  return useQuery({
    queryKey: ["home-feed", category],
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      if (isAll) {
        // ── Try getFeed first (trending / home feed) ──────────────
        try {
          const page1 = await api.getFeed(1, 16);
          if (page1.videos.length > 0) {
            return page1.videos;
          }
        } catch {
          // feed endpoint failed — fall through to search
        }

        // ── Fallback: broad tech search (always works) ────────────
        const fallback = await api.search(FEED_FALLBACK_QUERY);
        return fallback.videos;
      }

      // ── Specific category — search ─────────────────────────────
      const query = CATEGORY_QUERIES[category] ?? category;
      const result = await api.search(query);
      return result.videos;
    },
  });
}
