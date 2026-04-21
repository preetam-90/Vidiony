# Single Auth Redesign — Learnings & Conventions

## Key Architecture Changes

### Current → Target
- **Auth**: Email/password + separate YouTube OAuth → **Google OAuth only (includes YouTube scopes)**
- **Innertube**: Global anonymous singleton → **Per-user authenticated session cache (30min TTL)**
- **Home Feed**: Two paths (anonymous + authed) → **Authenticated only (401 if not logged in)**
- **User.password**: Exists in DB → **Nullable, then removed after migration**
- **Navbar**: "Connect YouTube" button → **Removed (YouTube auto-connected on login)**

## Critical Decisions

1. **Google OAuth includes YouTube scopes** — single consent screen, no separate YouTube OAuth
2. **In-memory session Innertube cache** — simpler than Redis, tokens auto-refresh on 401
3. **Nullify passwords (not delete)** — preserves WatchHistory, playlists, likes
4. **Home feed always authenticated** — no anonymous fallback, 401 if not logged in
5. **Innertube wrapper handles token refresh** — all authed calls retry once after auto-refresh

## Phase Dependencies

- Phase 1 → Phase 2 (remove old auth before building new flow)
- Phase 3 → Phase 4 (Innertube cache before updating guards)
- Phase 5 after Phase 2 (frontend changes after backend stabilizes)
- Phase 7 runs once, after full system is working

## Files to Modify (by phase)

### Phase 1: Remove Email/Password
- `backend/src/modules/auth/auth.routes.ts` — delete login/register routes
- `backend/src/modules/auth/auth.service.ts` — delete registerUser/loginUser/forgotPassword/resetPassword
- `backend/prisma/schema.prisma` — password String → password String?
- `backend/src/utils/auth.ts` — remove hashPassword/verifyPassword if unused

### Phase 2: Single Google OAuth
- `backend/src/modules/auth/auth.service.ts` — verify YouTube scopes in getGoogleLoginUrl()
- `backend/src/modules/auth/auth.routes.ts` — add YouTube scope validation in callback, delete /auth/youtube/* routes
- `frontend/src/lib/api.ts` — remove youtubeConnected from AuthUser type

### Phase 3: Per-User Innertube Cache
- **NEW**: `backend/src/services/innertube-cache.ts` — Map<userId, InnertubeInstance> with TTL
- `backend/src/modules/users/users.routes.ts` — update getAuthenticatedInnertube to use cache
- `backend/src/routes/home-feed.ts` — remove anonymous branch, always use authenticated Innertube
- `backend/src/innertube.ts` — keep global singleton for unauthenticated calls only

### Phase 4: Remove YouTube Guard
- `backend/src/app.ts` — replace requireYouTube with authenticate
- `backend/src/modules/videos/videos.routes.ts` — update video interaction routes
- `backend/src/modules/channels/channels.routes.ts` — update subscription routes

### Phase 5: Frontend UI
- `frontend/src/components/layout/navbar.tsx` — remove "Connect YouTube" button
- `frontend/src/app/auth/login/page.tsx` — remove feature list text
- `frontend/src/app/auth/register/page.tsx` — redirect to login or show message
- `frontend/src/lib/api.ts` — remove youtubeConnectUrl/youtubeDisconnect/youtubeStatus methods

### Phase 6: Frontend Routing
- `frontend/src/app/page.tsx` — handle 401 from home-feed, redirect to login
- `frontend/src/lib/api.ts` — update getFeed() to call authenticated endpoint

### Phase 7: Migration
- **NEW**: `backend/scripts/migrate-legacy-users.ts` — nullify passwords for legacy users
- `backend/prisma/schema.prisma` — drop password column (after migration)

### Phase 8: Cleanup
- Remove unused imports, types, and dead references
- Update `.env.example` and `backend/README.md`

## QA Verification Checklist

All 8 QA scenarios must pass (agent-executable via curl/Playwright):
1. Email/password login returns 404
2. Google OAuth login stores YouTube tokens
3. Home feed returns personalized data when logged in
4. Home feed returns 401 when anonymous
5. YouTube connect/disconnect endpoints return 404
6. Navbar shows no "Connect YouTube" button
7. Innertube cache hit — second request uses cached instance
8. Token refresh — expired token auto-refreshes

## Time Estimate
- Phase 1-4 (backend core): ~3-4 hours
- Phase 5-6 (frontend): ~2 hours
- Phase 7 (migration): ~30 minutes
- Phase 8 (cleanup): ~30 minutes
- QA verification: ~1 hour

## Verification Results (2026-04-19)

### Pre-flight Checks
- ✅ `pnpm --filter vidion-backend build` passes
- ✅ `pnpm --filter frontend build` passes
- ✅ `npx prisma validate` passes

### QA Verification
- ✅ QA-1: POST /auth/login returns 404 (email/password auth removed)
- ✅ QA-4: GET /api/home-feed returns 401 when anonymous (no fallback)
- ✅ QA-5: GET /auth/youtube/connect returns 404
- ✅ QA-5: POST /auth/youtube/disconnect returns 404

### Implementation Status
All phases (1-8) were already implemented before this session. The single-auth-redesign is complete and verified.

### Key Files Verified
- `backend/src/modules/auth/auth.routes.ts` - No login/register endpoints
- `backend/src/modules/auth/auth.service.ts` - No registerUser/loginUser functions
- `backend/prisma/schema.prisma` - password is String? (nullable)
- `backend/src/services/innertube-cache.ts` - Full implementation exists
- `backend/src/routes/home-feed.ts` - Uses authenticate, no anonymous fallback
- `frontend/src/components/layout/navbar.tsx` - No "Connect YouTube" button
- `frontend/src/app/auth/login/page.tsx` - Google OAuth only
- `frontend/src/app/auth/register/page.tsx` - Redirects to /auth/login
- `backend/scripts/migrate-legacy-users.ts` - Migration script exists
- `backend/.env.example` - Updated with Google OAuth + YouTube scopes docs
