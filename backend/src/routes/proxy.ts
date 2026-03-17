/**
 * Stream proxy — /proxy/stream?url=<encodedYouTubeUrl>
 *
 * YouTube CDN (googlevideo.com) rejects direct browser requests due to CORS
 * and missing Referer.  This endpoint pipes every byte through the server so
 * the browser <video> element can play it without any CORS issues.
 *
 * How to use from the frontend:
 *   const { proxyUrl } = await fetch(`/api/yt/stream/${videoId}`).then(r => r.json());
 *   videoElement.src = proxyUrl;   // "/proxy/stream?url=https%3A%2F%2F..."
 *
 * Range requests (seek / scrub) are transparently forwarded so the browser
 * can jump to any position without buffering the whole file.
 *
 * NOTE: Uses Node's native fetch, NOT the Innertube session client.
 * The CDN URLs produced by yt-dlp are pre-signed — they don't need YouTube
 * API credentials, and adding them would actually break the request.
 *
 * SECURITY: Rate limited to prevent DoS attacks. Each IP/user is limited
 * to 100 requests per minute for streaming endpoints.
 */

import type { FastifyPluginAsync } from "fastify";

const STRIP_HEADERS = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "content-encoding",  // Node fetch already decompresses
]);

const ALLOWED_DOMAINS = [
  "googlevideo.com",
  "youtube.com",
  "ytimg.com",
  "ggpht.com",
];

const proxyRoutes: FastifyPluginAsync = async (fastify) => {
  // Rate limit for streaming proxy - higher limit for authenticated users
  const streamRateLimit = fastify.rateLimit({
    max: 100, // 100 requests per minute
    timeWindow: 60 * 1000,
    keyGenerator: (req: any) => {
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : req.ip;
    },
    skipOnError: true,
  });

  fastify.route({
    method: ["GET", "HEAD"],
    url: "/stream",
    preHandler: [streamRateLimit],
    handler: async (req, reply) => {
      const { url } = req.query as { url?: string };

      if (!url) {
        return reply.status(400).send({ error: '"url" query param is required' });
      }

      let decodedUrl: string;
      try {
        decodedUrl = decodeURIComponent(url);
        const parsed = new URL(decodedUrl);
        if (!ALLOWED_DOMAINS.some((d) => parsed.hostname.endsWith(d))) {
          return reply.status(403).send({ error: "Proxying this domain is not allowed" });
        }
      } catch {
        return reply.status(400).send({ error: "Invalid URL" });
      }

      const upstreamHeaders: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.youtube.com",
        Referer: "https://www.youtube.com/",
      };

      if (req.headers.range) {
        upstreamHeaders["Range"] = req.headers.range as string;
      }

      let upstream: Response;
      try {
        upstream = await fetch(decodedUrl, {
          method: req.method,
          headers: upstreamHeaders,
        });
      } catch (err: unknown) {
        fastify.log.error({ err }, "Proxy fetch failed");
        return reply.status(502).send({ error: "Failed to reach upstream" });
      }

      reply.status(upstream.status);

      upstream.headers.forEach((value, key) => {
        if (!STRIP_HEADERS.has(key.toLowerCase())) {
          reply.header(key, value);
        }
      });

      reply.header("Accept-Ranges", "bytes");

      if (req.method === "HEAD" || !upstream.body) {
        return reply.send();
      }

      return reply.send(upstream.body);
    },
  });
};

export default proxyRoutes;
