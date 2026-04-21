import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/yt\/?$/, "") ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "*.ggpht.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "yt3.ggpht.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },

  // Proxy /api/* and /proxy/* to the Fastify backend.
  // This means the browser always talks to :3000, so there are zero CORS issues
  // and the proxy URL returned by the stream endpoint works without modification.
  async rewrites() {
    return [
      // User routes (profile, avatar, etc.)
      {
        source: "/user/:path*",
        destination: `${BACKEND}/user/:path*`,
      },
      // Auth routes
      {
        source: "/auth/:path*",
        destination: `${BACKEND}/auth/:path*`,
      },
      // ⚠️ More specific rules FIRST — /api/v2/* must come before /api/*
      // All new backend routes (auth, search, trending, videos, user, live, channels)
      {
        source: "/api/v2/:path*",
        destination: `${BACKEND}/:path*`,
      },
      // Legacy youtubei.js routes
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
      // CORS-safe proxy for YouTube CDN URLs
      {
        source: "/proxy/:path*",
        destination: `${BACKEND}/proxy/:path*`,
      },
    ];
  },
};

export default nextConfig;
