/**
 * Prometheus metrics plugin.
 * Exposes `fastify.metrics` (the registry) and registers core HTTP metrics.
 * The /metrics endpoint is added in app.ts.
 */

import fp from "fastify-plugin";
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";
import type { FastifyPluginAsync } from "fastify";

export let registry: Registry;

// Exported so other modules can increment them
export let httpRequestsTotal: Counter<string>;
export let httpRequestDuration: Histogram<string>;
export let youtubeRequestsTotal: Counter<string>;
export let cacheHitRatio: Gauge<string>;
export let activeLiveChats: Gauge<string>;
export let downloadQueueSize: Gauge<string>;
export let trendingRefreshTimestamp: Gauge<string>;

const metricsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  registry = new Registry();
  registry.setDefaultLabels({ app: "vidion" });

  collectDefaultMetrics({ register: registry });

  httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });

  httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration",
    labelNames: ["method", "route", "status"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
  });

  youtubeRequestsTotal = new Counter({
    name: "youtube_requests_total",
    help: "YouTube API requests",
    labelNames: ["type", "cache"],
    registers: [registry],
  });

  cacheHitRatio = new Gauge({
    name: "cache_hit_ratio",
    help: "Cache hit ratio (0-1)",
    labelNames: ["cache_type"],
    registers: [registry],
  });

  activeLiveChats = new Gauge({
    name: "active_live_chats",
    help: "Number of active live chat rooms",
    registers: [registry],
  });

  downloadQueueSize = new Gauge({
    name: "download_queue_size",
    help: "Downloads in the queue",
    registers: [registry],
  });

  trendingRefreshTimestamp = new Gauge({
    name: "trending_refresh_timestamp",
    help: "Unix timestamp of last trending refresh",
    registers: [registry],
  });

  fastify.decorate("metrics", registry);

  // Track every request
  fastify.addHook("onResponse", (req, reply, done) => {
    const route = req.routeOptions?.url ?? req.url.split("?")[0];
    const labels = { method: req.method, route, status: String(reply.statusCode) };
    httpRequestsTotal.inc(labels);
    done();
  });

  fastify.log.info("Prometheus metrics initialised");
}, {
  name: "metrics-plugin",
});

export default metricsPlugin;
