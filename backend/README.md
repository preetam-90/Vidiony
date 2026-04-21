# Vidion Backend

A full-featured YouTube-clone backend built with **Fastify 5 + TypeScript + youtubei.js**.  
Acts as a sophisticated proxy/wrapper around YouTube's internal API with a clean REST + WebSocket interface.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Framework | Fastify 5.x |
| Language | TypeScript (strict mode, ESM) |
| YouTube API | youtubei.js v16 + yt-dlp |
| Database | PostgreSQL 15+ via Prisma 5 |
| Cache | Redis 7+ via ioredis |
| WebSocket | @fastify/websocket |
| Jobs | BullMQ (Redis-backed) |
| Metrics | Prometheus (prom-client) |
| Logging | Pino (pretty in dev) |
| Validation | Zod v3 |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Start Postgres + Redis
pnpm docker:up

# 4. Generate Prisma client & run migrations
pnpm db:generate
pnpm db:migrate

# 5. Start the dev server
pnpm dev

# 6. (Optional) Start background job workers
pnpm dev:worker
```

Server starts at **http://localhost:4000**

## Environment Variables

See `.env.example` for the full list. Key variables:

```env
PORT=4000
DATABASE_URL=postgresql://vidion:vidion_secret@localhost:5432/vidion
REDIS_HOST=localhost
JWT_SECRET=<min 32 chars>
ENCRYPTION_KEY=<64 hex chars — for OAuth token encryption>

# YouTube OAuth2 (for connected YouTube accounts)
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=http://localhost:4000/auth/youtube/callback

# Optional: Your YouTube cookie (improves stream reliability)
YT_COOKIE=...
YTDLP_PATH=yt-dlp
```

## API Reference

### Health & Monitoring
```
GET  /health          → system status (database, redis, youtube_api)
GET  /metrics         → Prometheus metrics
GET  /docs            → Swagger UI (OpenAPI documentation)
```

### Authentication (`/auth`)
```
GET  /auth/google                → Start Google OAuth login (includes YouTube scopes)
GET  /auth/google/callback       → OAuth callback, creates session cookies
POST /auth/refresh               → Rotate refresh token → new JWT
POST /auth/logout                → Invalidate session
POST /auth/logout-all            → Invalidate all sessions
GET  /auth/me                    → Current user (JWT required)
GET  /auth/sessions              → List active sessions
DELETE /auth/session/:id         → Revoke one session
DELETE /auth/sessions            → Revoke all sessions
```

### Videos (`/videos`)
```
GET  /videos/:id                 → Full video info + related videos
GET  /videos/:id/stream          → Direct stream URL (for proxy player)
GET  /videos/:id/adaptive        → Separate video + audio URLs (HLS/DASH)
GET  /videos/:id/download        → Download stream (JWT required)
GET  /videos/:id/transcript      → WebVTT captions (?lang=en&kind=asr)
GET  /videos/:id/comments        → Video comments
POST /videos/:id/comments        → Post comment (YouTube auth required)
POST /videos/:id/like            → Like video (YouTube auth required)
POST /videos/:id/dislike         → Dislike video (YouTube auth required)
DELETE /videos/:id/like          → Remove rating (YouTube auth required)
```

### Search (`/search`)
```
GET  /search?q=...               → Search with filters
       &type=video|channel|playlist|all
       &sort=relevance|upload_date|view_count|rating
       &upload_date=hour|today|week|month|year
       &duration=short|medium|long
GET  /search/suggestions?q=...   → Autocomplete suggestions
```

### Channels (`/channels`)
```
GET  /channels/:id               → Channel info
GET  /channels/:id/videos        → Channel videos (?tab=videos|shorts|live|playlists)
```

### Trending (`/trending`)
```
GET  /trending?category=music&region=US   → Trending videos (DB cached)
     categories: trending|music|gaming|movies|news
POST /trending/refresh                    → Force refresh (JWT required)
```

### Live Streams (`/live`)
```
GET  /live/:videoId              → Live stream info + HLS/DASH manifest URLs
WS   /live/:videoId/chat         → WebSocket live chat relay
```

### User Actions (`/user`)
```
GET    /user/history             → Watch history
POST   /user/history             → Record watch event
DELETE /user/history/clear       → Clear all history
DELETE /user/history/:videoId    → Remove specific entry

GET    /user/subscriptions       → List subscriptions (YouTube auth)
POST   /user/subscriptions/:id   → Subscribe (YouTube auth)
DELETE /user/subscriptions/:id   → Unsubscribe (YouTube auth)
GET    /user/subscriptions/feed  → Latest from subscribed channels

GET    /user/playlists           → List playlists (YouTube auth)
POST   /user/playlists           → Create playlist (YouTube auth)
DELETE /user/playlists/:id       → Delete playlist (YouTube auth)
POST   /user/playlists/:id/videos        → Add video to playlist
DELETE /user/playlists/:id/videos/:vid   → Remove video
```

### YouTube API Proxy (`/api/yt`)
```
GET  /api/yt/feed                → Home feed / trending
GET  /api/yt/search              → Search
GET  /api/yt/video/:id           → Video details
GET  /api/yt/video/:id/related   → Related videos
GET  /api/yt/video/:id/comments  → Comments
GET  /api/yt/channel/:id         → Channel info
GET  /api/yt/stream/:videoId     → Stream URL (combined)
GET  /api/yt/merged-stream/:id   → Real-time ffmpeg merge (adaptive → browser)
GET  /api/yt/captions/:videoId   → WebVTT caption file
```

### Proxy (`/proxy`)
```
GET  /proxy/stream?url=...       → CORS-safe YouTube CDN proxy (for <video> element)
```

## Authentication Flow

### Single Auth Model

**Google OAuth only**:
- Sign in once with Google (YouTube scopes requested in same consent screen)
- JWT access token (15 min) + httpOnly refresh token cookie (7 days)
- YouTube tokens encrypted with AES-256-GCM and stored in DB on login
- If YouTube permissions are denied, login is rejected with `YOUTUBE_PERMISSIONS_REQUIRED`

### WebSocket Live Chat

```javascript
const ws = new WebSocket('ws://localhost:4000/live/VIDEO_ID/chat');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'message') {
    // msg.data: { id, author, text, timestamp, isOwner, isModerator, ... }
  }
  
  if (msg.type === 'viewer_count') {
    // msg.count: number
  }
};

// Send chat message (requires JWT in header — connect with YouTube auth)
ws.send(JSON.stringify({ type: 'send_message', text: 'Hello!' }));
```

## Background Jobs

Workers run separately from the HTTP server:

```bash
pnpm dev:worker
```

| Job | Schedule | Description |
|-----|----------|-------------|
| `trending-refresh` | Every 6 hours | Refreshes all trending categories in PostgreSQL |
| `token-refresh` | On demand | Proactively refreshes expiring YouTube OAuth tokens |
| `daily-cleanup` | 3 AM daily | Removes expired user sessions |

## Architecture

```
src/
├── config/          env.ts — Zod-validated environment
├── modules/
│   ├── auth/        JWT auth + YouTube OAuth2
│   ├── videos/      Video info, stream URLs, download, transcript
│   ├── search/      Search with filters + suggestions
│   ├── channels/    Channel info + video listing
│   ├── trending/    DB-cached trending (refreshed by BullMQ)
│   ├── live/        Live stream info + WebSocket chat relay
│   ├── users/       History, subscriptions, playlists (YouTube auth)
│   └── youtube/     Core youtubei.js routes (feed, stream, captions)
├── plugins/
│   ├── prisma.ts    Fastify-scoped Prisma client
│   ├── redis.ts     ioredis singleton + Fastify decorator
│   └── metrics.ts   Prometheus counters/gauges/histograms
├── jobs/
│   ├── queue.ts     BullMQ queue definitions
│   ├── trending.job.ts
│   ├── token-refresh.job.ts
│   ├── cleanup.job.ts
│   └── worker.ts    Worker process entry point
├── services/
│   ├── cache.service.ts     Redis → in-memory LRU fallback
│   └── youtube.service.ts   youtubei.js + yt-dlp stream URLs
├── utils/
│   ├── crypto.ts    AES-256-GCM encryption for OAuth tokens
│   └── errors.ts    Typed error classes + toErrorResponse()
├── types/
│   └── fastify.d.ts Fastify type augmentation
├── innertube.ts     Innertube singleton with vm shim
├── app.ts           Fastify app factory
└── index.ts         Server entry point
```

## Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| Video info | Redis | 2 hours |
| Related videos | Redis | 5 minutes |
| Search results | Redis | 30 minutes |
| Search suggestions | Redis | 15 minutes |
| Channel info | Redis | 4 hours |
| Trending | PostgreSQL + Redis | 6 hours / 10 minutes |
| Comments | Redis | 5 minutes |
| Captions/transcript | Redis | 24 hours |
| Live info | Redis | 30 seconds |

## Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VIDEO_NOT_FOUND",
    "message": "Human-readable description",
    "details": {}
  }
}
```

Common error codes: `UNAUTHORIZED`, `YOUTUBE_AUTH_REQUIRED`, `YOUTUBE_RATE_LIMIT`,
`VIDEO_NOT_FOUND`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`

## Rate Limiting

- Global: 100 req/min per IP (or per authenticated user)
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`

## Database Schema

Key models:
- `User` — Vidion accounts with optional YouTube OAuth tokens (AES-encrypted)
- `UserSession` — Refresh token store (bcrypt-hashed)
- `TrendingVideo` — YouTube trending cache (all 5 categories)
- `WatchHistory` — Per-user video progress tracking
- `DownloadQueue` — Download request audit log
- `Video`, `Comment`, `Like`, `Subscription` — Native Vidion platform content
