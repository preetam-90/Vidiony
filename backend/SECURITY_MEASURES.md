# Security Measures & Configuration

## Overview

This document outlines the security measures implemented in the Vidiony backend, focusing on SQL injection prevention, rate limiting, input validation, and caching strategies.

---

## 1. SQL Injection Prevention

### Parameterized Queries

All raw SQL queries use Prisma's parameterized query methods:

- `$executeRaw` - for write operations
- `$queryRaw` - for read operations

**Example from analytics.routes.ts (lines 117-121):**
```typescript
await fastify.prisma.$executeRaw`
  UPDATE watch_history
  SET progress = GREATEST(progress, ${watchTime})
  WHERE "userId" = ${userId} AND "videoId" = ${videoId}
`;
```

The `${variable}` syntax in Prisma's template literals automatically creates prepared statements, preventing SQL injection.

### Fixed Bug: Column Name Mismatch

**File:** `backend/src/modules/analytics/analytics.routes.ts` (line 200)

**Issue:** The query used `user_id` instead of the correct column name `"userId"` (camelCase with quotes for Postgres).

**Fix:**
```typescript
// Before (incorrect - would cause DB error):
WHERE user_id = ${userId} AND category IS NOT NULL

// After (correct):
WHERE "userId" = ${userId} AND category IS NOT NULL
```

---

## 2. Rate Limiting Strategy

### Global Rate Limit

Configured in `backend/src/app.ts`:
- **Default limit:** `env.RATE_LIMIT_MAX` (configurable)
- **Time window:** `env.RATE_LIMIT_WINDOW_MS` (configurable)
- **Key generation:** Uses user ID for authenticated requests, IP address for unauthenticated
- **Redis support:** Uses Redis as backend when available for distributed rate limiting

### Route-Specific Rate Limits

#### `/api/yt/stream/*` Endpoint

**Rate limit:** 60 requests per minute per user/IP

**Why needed:** This endpoint performs expensive YouTube API deciphering operations. Without rate limiting, it could be exploited to:
- Exhaust YouTube API quotas
- Consume server resources
- Perform DoS attacks

**Implementation:** `backend/src/modules/youtube/youtube.routes.ts`
```typescript
const streamUrlRateLimit = fastify.rateLimit({
  max: 60,
  timeWindow: 60 * 1000,
  keyGenerator: (req: any) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : req.ip;
  },
  skipOnError: true,
});
```

#### `/proxy/stream` Endpoint

**Rate limit:** 100 requests per minute per user/IP

**Why needed:** This endpoint proxies video streams from YouTube's CDN. While it needs higher limits than API endpoints (due to video playback patterns), it still requires protection against:
- Bandwidth exhaustion attacks
- Server resource consumption
- CDN cost abuse

**Implementation:** `backend/src/routes/proxy.ts`
```typescript
const streamRateLimit = fastify.rateLimit({
  max: 100, // 100 requests per minute
  timeWindow: 60 * 1000,
  keyGenerator: (req: any) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : req.ip;
  },
  skipOnError: true,
});
```

---

## 3. Caching Strategy

### Stream URL Caching

**Endpoint:** `/api/yt/stream/*`

**Cache TTL:** 5 minutes (300 seconds)

**Why:** Stream URL deciphering is expensive and the results are stable for a given video/quality combination. Caching reduces:
- YouTube API calls
- Server CPU usage
- Response latency

**Implementation:**
```typescript
const cacheKey = `yt_stream:${videoId}:${quality ?? 'best'}`;
const cached = await getCachedData<StreamResponse>(cacheKey);
if (cached) {
  return reply.send(cached);
}

// ... fetch and process ...

await setCachedData(cacheKey, responseData, 300);
```

### Recommendation Caching

**Cache keys:**
- `user_recommendations:${userId}` - TTL: 10 minutes

**Invalidation:** Cache is invalidated when:
- User records a watch event
- User performs a DISLIKE or SKIP interaction

---

## 4. Input Validation

All endpoints use Zod schemas for comprehensive input validation:

### Example Schemas

**Watch event validation** (`analytics.routes.ts`):
```typescript
const watchSchema = z.object({
  videoId:         z.string().min(1).max(64),
  watchTime:       z.number().int().min(0),
  watchPercentage: z.number().min(0).max(100),
  duration:        z.number().int().min(0).optional(),
  title:           z.string().max(500).optional(),
  thumbnail:       z.string().url().optional().or(z.literal("")),
  channelId:       z.string().max(64).optional(),
  channelName:     z.string().max(200).optional(),
  category:        z.string().max(100).optional(),
  tags:            z.array(z.string().max(100)).max(30).optional(),
  device:          z.string().max(50).optional(),
});
```

**Stream parameters** (`youtube.schemas.ts`):
```typescript
export const StreamParamsSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  itag: z.coerce.number().int().positive().optional(),
});

export const StreamQuerySchema = z.object({
  quality: z.string()
    .optional()
    .default("360p")
    .transform((q) => {
      const match = q.match(/^(\d+p)/);
      return match ? match[1] : q;
    }),
});
```

### Validation Enforcement

All route handlers use:
```typescript
const parsed = schema.safeParse(req.body || req.params || req.query);
if (!parsed.success) {
  return reply.status(400).send({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid payload",
      details: parsed.error.flatten(),
    },
  });
}
```

---

## 5. Rate Limiting Bypass Justification

### Historical Context

Previously, the global rate limit configuration had an `allowList` that completely bypassed rate limiting for `/proxy/` and `/live/` endpoints:

```typescript
allowList: (req) => req.url.startsWith('/proxy/') || req.url.startsWith('/live/'),
```

This was problematic because:
- No protection against DoS attacks on proxy endpoints
- Could be exploited to exhaust bandwidth and server resources
- No per-endpoint rate controls

### Current Solution

The `allowList` has been **removed** from global configuration. Instead:

1. **Route-specific rate limits** are applied directly to endpoints that need special handling
2. **Higher limits** for streaming endpoints (100/min for proxy, 60/min for stream API) vs standard API endpoints
3. **Caching** reduces the actual number of requests that hit the backend
4. **Authenticated users** get consistent rate limiting based on user ID, not IP

### Why Not Global Rate Limit for All?

- **HLS streaming:** Video players make frequent requests (every 5-10 seconds) for stream info
- **Quality switching:** Users may request multiple quality levels simultaneously
- **Range requests:** Video seeking generates additional requests
- **User experience:** Too restrictive limits would break video playback

The current configuration balances security with functionality by:
- Applying appropriate limits per endpoint type
- Using caching to reduce actual load
- Allowing higher limits for streaming while still preventing abuse

---

## 6. Security Headers & Middleware

### Helmet Configuration

```typescript
await app.register(helmet, {
  crossOriginResourcePolicy: false, // allow media proxying
  contentSecurityPolicy: false,     // managed by frontend
});
```

### CORS Configuration

```typescript
await app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});
```

---

## 7. Authentication & Authorization

### JWT-based Authentication

- Access tokens stored in HTTP-only cookies
- JWT verification via `@fastify/jwt`
- Custom `authenticate` decorator for protected routes
- `optionalAuthenticate` for endpoints that work with or without auth

### YouTube Connection Guard

The `requireYouTube` decorator ensures users have connected their YouTube account before accessing YouTube-specific features:

```typescript
app.decorate("requireYouTube", async function (req, reply) {
  // Verify JWT
  const payload = app.jwt.verify(token);
  req.user = payload;

  // Check database for youtubeConnected status
  const dbUser = await app.prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { youtubeConnected: true },
  });

  if (!dbUser?.youtubeConnected) {
    return reply.status(403).send({
      success: false,
      error: {
        code: "YOUTUBE_AUTH_REQUIRED",
        message: "A connected YouTube account is required.",
      },
    });
  }
});
```

---

## 8. Environment Configuration

### Required Security Variables

```env
# Rate Limiting
RATE_LIMIT_MAX=100           # Default max requests per time window
RATE_LIMIT_WINDOW_MS=60000   # Time window in milliseconds (1 minute)

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis (optional, for rate limiting & caching)
REDIS_URL=redis://...

# YouTube API (optional)
YT_COOKIE=...
```

---

## 9. Recommendations for Future Hardening

1. **Implement IP blocking** for repeated rate limit violations
2. **Add request size limits** to prevent large payload attacks
3. **Enable audit logging** for sensitive operations
4. **Add CSRF protection** for state-changing operations
5. **Implement request signing** for critical API endpoints
6. **Add anomaly detection** for unusual access patterns
7. **Regular security audits** of dependencies (use `npm audit` / `bun audit`)
8. **Implement content security policy** headers
9. **Add input sanitization** for XSS prevention
10. **Enable database connection pooling** with proper limits

---

## 10. Monitoring & Alerts

### Metrics Endpoint

`GET /metrics` - Prometheus metrics including:
- Request rates
- Error rates
- Response times
- Rate limit hits

### Health Check

`GET /health` - System health check including:
- Database connectivity
- Redis connectivity
- YouTube API status

---

## Summary

The backend implements defense-in-depth security:
- ✅ Parameterized queries prevent SQL injection
- ✅ Comprehensive input validation with Zod
- ✅ Route-specific rate limiting with appropriate limits
- ✅ Caching reduces load and prevents abuse
- ✅ Authentication and authorization guards
- ✅ Security headers via Helmet
- ✅ CORS properly configured
- ✅ Detailed logging for audit trail

All security measures are documented and configurable via environment variables.
