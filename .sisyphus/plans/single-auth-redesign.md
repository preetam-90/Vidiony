# Plan: Single Auth — Google OAuth + Authenticated Innertube

## Goal
Redesign Vidion auth so logging in with Google immediately authenticates the user with YouTube/Innertube — giving them personalized feed, playlists, notifications, history, and subscriptions in one step. No separate "Connect YouTube" step.

---

## Scope

### IN
- Remove email/password registration and login (all `/auth/register`, `/auth/login`, `/auth/email/*` routes)
- Keep only Google OAuth (`/auth/google`, `/auth/google/callback`)
- Auto-store YouTube tokens on first Google login, set `youtubeConnected=true`
- Remove separate `/auth/youtube/connect` and `/auth/youtube/disconnect` endpoints
- Replace global anonymous Innertube singleton with per-user authenticated session-level Innertube
- Home feed always returns personalized data (no anonymous fallback)
- Remove "Connect YouTube" button from navbar
- Remove `User.password` field from Prisma schema
- Data migration script for existing email/password users
- QA: all acceptance criteria must be agent-executable (curl/playwright)

### OUT
- Email/password authentication of any kind
- Anonymous (unauthenticated) home feed path
- Innertube global singleton
- Redis-based distributed Innertube cache (use in-memory session cache only)
- Separate YouTube OAuth connect flow
- Any new UI for migrating existing users — one-off backend migration script only

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Google OAuth only | Already includes YouTube scopes — single consent screen |
| In-memory session Innertube cache | Simpler than Redis; tokens expire and auto-refresh handles that |
| Nullify existing passwords (not delete users) | Preserves WatchHistory, playlists, likes — just forces re-login via Google |
| `GET /api/home-feed` always authed | No more anonymous fallback; if not logged in → 401 redirect to login |
| Innertube wrapper handles token refresh | All authenticated Innertube calls retry once after auto-refresh on 401 |

---

## Current Architecture (problematic)

```
[Anonymous Innertube Singleton] ← global, not per-user
[Two separate auth flows] ← Google OAuth + YouTube OAuth connect
[Home feed has two paths] ← anonymous (fake trending) OR authed (Innertube)
[User.password field] ← still exists in DB
[Navbar "Connect YouTube"] ← separate step after login
```

## Target Architecture

```
[Per-User Innertube via session cache] ← authenticated with YouTube OAuth
[Single Google OAuth flow] ← login + YouTube scopes in one step
[Home feed = authenticated only] ← 401 if not logged in
[No email/password] ← User.password becomes nullable
[Navbar = no YouTube connect button] ← always connected on login
```

---

## Tasks

### Phase 1: Backend — Remove Email/Password Auth

#### 1.1  Disable email/password login endpoint
- **File**: `backend/src/modules/auth/auth.routes.ts`
- **Change**: Delete `POST /auth/login` and `POST /auth/register` route handlers
- **Change**: Delete `POST /auth/forgot-password`, `POST /auth/reset-password` (if they exist)
- **Test**: `curl -X POST http://localhost:4000/auth/login -d '{"email":"x","password":"x"}'` → 404

#### 1.2  Remove email/password service functions
- **File**: `backend/src/modules/auth/auth.service.ts`
- **Change**: Delete `registerUser()`, `loginUser()`, `forgotPassword()`, `resetPassword()` — keep only Google OAuth functions (`getGoogleLoginUrl()`, `exchangeGoogleLoginCode()`, `findOrCreateGoogleUser()`)
- **Change**: Delete `issueRefreshToken()` and `refreshAccessToken()` session logic if it depends on email/password — review and keep session logic for Google OAuth users only
- **Note**: `UserSession` rows (refresh tokens) are still valid for Google users — do NOT delete session management

#### 1.3  Remove password field from Prisma schema
- **File**: `backend/prisma/schema.prisma`
- **Change**: `password String` → `password String?` (nullable, not removed yet — will remove after migration)
- **Test**: `npx prisma validate` passes

#### 1.4  Remove password hash utilities if only used for login
- **File**: `backend/src/utils/auth.ts` (or wherever passwords are hashed)
- **Change**: Review `hashPassword()`, `verifyPassword()` — if only used by deleted login/register functions, remove them
- **Search**: Use `grep` for `hashPassword\|verifyPassword\|bcrypt` across `backend/src/` — if zero remaining usages, delete the functions

#### 1.5  Prisma migration: nullify all passwords
- **Command**: `npx prisma migrate dev --name nullify_user_passwords`
- **SQL**: `UPDATE users SET password = NULL;`
- **Test**: `SELECT password FROM users LIMIT 5;` → all NULL

#### 1.6  Remove password-related routes from Swagger/docs
- **Files**: Any route decorators or OpenAPI schema referencing password in auth body
- **Search**: `grep -r "password.*req\|Req.*password\|body.*password" backend/src/modules/auth/`

---

### Phase 2: Backend — Single Google OAuth (Login + YouTube)

#### 2.1  Verify Google OAuth includes YouTube scopes
- **File**: `backend/src/modules/auth/auth.service.ts` — `getGoogleLoginUrl()` and `exchangeGoogleLoginCode()`
- **Check**: Scopes string must include `https://www.googleapis.com/auth/youtube` and `https://www.googleapis.com/auth/youtube.readonly`
- **Current**: `findOrCreateGoogleUser()` already stores tokens — verify it sets `youtubeConnected: true` automatically

#### 2.2  Add YouTube scope validation in callback
- **File**: `backend/src/modules/auth/auth.routes.ts` — `GET /auth/google/callback`
- **Change**: After `exchangeGoogleLoginCode()`, check that `youtubeTokens` were returned. If missing or empty → set error code `YOUTUBE_PERMISSIONS_REQUIRED` and redirect to `/auth/error?code=YOUTUBE_PERMISSIONS_REQUIRED`
- **Change**: Only set `youtubeConnected: true` and `youtubeChannelId` if tokens are confirmed present
- **Guardrail**: If YouTube scopes denied → user sees error page, NOT logged in, NO partial account

#### 2.3  Remove `/auth/youtube/connect` endpoint
- **File**: `backend/src/modules/auth/auth.routes.ts`
- **Delete**: `POST /auth/youtube/connect` and `GET /auth/youtube/callback` (YouTube-only OAuth)
- **Keep**: Only `GET /auth/google/callback` (combined Google + YouTube)
- **Test**: `curl http://localhost:4000/auth/youtube/connect` → 404

#### 2.4  Remove `/auth/youtube/disconnect` endpoint
- **File**: `backend/src/modules/auth/auth.routes.ts`
- **Delete**: `POST /auth/youtube/disconnect`
- **Test**: `curl http://localhost:4000/auth/youtube/disconnect` → 404

#### 2.5  Remove `/auth/youtube/status` (no longer needed)
- **File**: `backend/src/modules/auth/auth.routes.ts`
- **Change**: Since YouTube is connected automatically on login, `/auth/youtube/status` is redundant. Remove it.
- **Alternative**: Keep it but have it always return `connected: true, channelId: <from DB>` — frontend uses it to show channel name in navbar

#### 2.6  Update `AuthUser` response type
- **File**: `frontend/src/lib/api.ts` — `AuthUser` interface
- **Change**: Remove `youtubeConnected` field — if user is logged in, YouTube IS connected. Keep `youtubeChannelId` and `youtubeHandle` for display.

---

### Phase 3: Backend — Per-User Authenticated Innertube

#### 3.1  Create Innertube session cache service
- **New File**: `backend/src/services/innertube-cache.ts`
- **Implementation**:
  - `Map<userId, InnertubeInstance>` with TTL (30 minutes default)
  - Each entry stores: `{ yt: Innertube, expiresAt: number, tokens: YouTubeTokens }`
  - On cache hit: check if tokens expired → if yes, call `refreshYouTubeToken()`, update DB, update cache
  - On cache miss: create via `getAuthenticatedInnertube()`, store in cache
  - `invalidateUser(userId)`: called on logout or token revoke
- **Token refresh**: Use `getUserYouTubeTokens()` which already handles auto-refresh before expiry
- **TTL**: 30 minutes. If `expiresAt` < now + 5min, proactively refresh.

#### 3.2  Update `getAuthenticatedInnertube` to use cache
- **File**: `backend/src/modules/users/users.routes.ts`
- **Change**: Instead of creating a new Innertube instance per request:
  1. Call `getInnertubeForUser(userId)` from the new cache service
  2. The cache service returns a pre-authenticated, token-valid Innertube instance
  3. If cache miss → create, sign in, store
- **Change**: `getAuthenticatedInnertube()` signature stays same (returns `Promise<Innertube>`) but internal logic uses cache

#### 3.3  Update global Innertube singleton
- **File**: `backend/src/innertube.ts`
- **Change**: The global `_instance` is still used for UNAUTHENTICATED calls (search, trending, video info, channel info)
- **Note**: Do NOT remove it — it's still needed for public data. Just don't use it for personalized endpoints.

#### 3.4  Update home feed route to always use authenticated Innertube
- **File**: `backend/src/routes/home-feed.ts`
- **Change**: Remove the anonymous `optionalAuthenticate` branch entirely
- **Change**: Home feed uses `getInnertubeForUser(userId)` → `yt.getHomeFeed()`
- **If not authenticated**: Return 401 with `{ error: { code: "AUTH_REQUIRED", message: "Login to see your feed" } }`
- **Frontend**: Should redirect to `/auth/login` on 401 from home-feed

#### 3.5  Update all endpoints using `getAuthenticatedInnertube`
- **File**: `backend/src/modules/users/users.routes.ts`
- **Endpoints affected**: `/user/youtube/notifications`, `/user/playlists`, playlist create/edit
- **Change**: All use the cache-based `getInnertubeForUser()` — no per-request sign-in needed

#### 3.6  Add token revoke handler
- **File**: `backend/src/services/innertube-cache.ts`
- **On `POST /auth/logout`**: Call `invalidateUser(userId)` to remove from cache
- **If user revokes YouTube access from Google settings**: Innertube calls will fail with 401 → catch → attempt token refresh → if refresh fails → clear cache, return error asking user to reconnect

---

### Phase 4: Backend — Remove YouTube-Specific Auth Guard

#### 4.1  Replace `requireYouTube` decorator usages
- **File**: `backend/src/app.ts`
- **Option A** (Preferred): Remove `requireYouTube` decorator entirely — since every logged-in user is YouTube-connected, just use `authenticate`
- **Option B**: Keep `requireYouTube` but it just checks JWT (no DB lookup for `youtubeConnected`)
- **Affected endpoints**: All `/user/youtube/*` and `/videos/:id/like`, `/videos/:id/state`, `/channels/:id/subscribe`
- **Change**: Replace `preHandler: [fastify.requireYouTube]` → `preHandler: [fastify.authenticate]`

#### 4.2  Update video interaction routes
- **File**: `backend/src/modules/videos/videos.routes.ts`
- **Change**: `GET /:id/state`, `POST /:id/like`, `DELETE /:id/like` — change from `requireYouTube` to `authenticate`
- **Rationale**: User is always YouTube-connected on login

#### 4.3  Update channel subscription routes
- **File**: `backend/src/modules/channels/channels.routes.ts`
- **Change**: `POST /:id/subscribe`, `DELETE /:id/subscribe` — change from `requireYouTube` to `authenticate`

#### 4.4  Clean up `app.ts` decorator
- **File**: `backend/src/app.ts`
- **Change**: Remove or simplify `requireYouTube` decorator — it's no longer needed for most cases
- **Keep**: Just `authenticate` and `optionalAuthenticate`

---

### Phase 5: Frontend — Remove Auth-Relelated UI

#### 5.1  Remove "Connect YouTube" button from navbar
- **File**: `frontend/src/components/layout/navbar.tsx`
- **Change**: Delete the entire `{ytStatus && !ytStatus.connected ...}` block (DropdownMenuItem + mobile Sheet button)
- **Change**: Remove `Youtube` icon import if unused after this
- **Change**: Remove `ytStatus` state — no longer needed
- **Change**: Remove `api.auth.youtubeStatus()` call in `useEffect`
- **Change**: Remove `handleYouTubeConnect` function

#### 5.2  Remove Google login feature list text
- **File**: `frontend/src/app/auth/login/page.tsx`
- **Change**: Delete the "Signing in gives you access to..." feature list (lines 88-104) — it's redundant since YouTube is now automatic
- **Keep**: The login button and error handling

#### 5.3  Remove register page or redirect to login
- **File**: `frontend/src/app/auth/register/page.tsx`
- **Option**: Redirect to `/auth/login` or show a message "Registration is no longer available — please sign in with Google"
- **Rationale**: Email/password registration is gone

#### 5.4  Remove API methods for YouTube connect/disconnect
- **File**: `frontend/src/lib/api.ts`
- **Change**: Delete `api.auth.youtubeConnectUrl()`, `api.auth.youtubeDisconnect()`, `api.auth.youtubeStatus()`
- **Keep**: `api.auth.me()` (used for session hydration)
- **Test**: Search for any remaining calls to deleted methods — `grep -r "youtubeConnectUrl\|youtubeDisconnect\|youtubeStatus" frontend/src/`

#### 5.5  Update AuthUser type
- **File**: `frontend/src/lib/api.ts`
- **Change**: `AuthUser` interface — remove `youtubeConnected: boolean` (always true when logged in)
- **Change**: Keep `youtubeChannelId?`, `youtubeHandle?` for profile display

---

### Phase 6: Frontend — Authenticated Home Feed & Routing

#### 6.1  Update home feed page to handle 401
- **File**: `frontend/src/app/page.tsx` (or wherever home feed is rendered)
- **Change**: On `401` from `/api/home-feed`, redirect to `/auth/login` (do not show anonymous content)
- **Current**: Home page likely calls `api.getFeed()` which is anonymous — change to call the authenticated endpoint

#### 6.2  Update `api.getFeed()` route
- **File**: `frontend/src/lib/api.ts`
- **Change**: `api.getFeed` currently calls `/api/yt/feed` (anonymous Innertube). Change to call `GET /api/home-feed` (authenticated) instead.
- **OR**: Keep `api.getFeed()` as anonymous fallback for non-logged-in visitors — but home page must use the authed version

#### 6.3  Verify subscriptions page
- **File**: `frontend/src/app/subscriptions/page.tsx`
- **Change**: Confirm it calls `api.getSubscriptionFeed()` or `api.getYouTubeFeed()` — should continue working after switching to `authenticate` (not `requireYouTube`)

#### 6.4  Verify library page
- **File**: `frontend/src/app/library/page.tsx`
- **Change**: Calls `api.getWatchLaterList()` (Vidion-native) + `api.getYouTubePlaylists()` — both should work with `authenticate`

---

### Phase 7: Data Migration

#### 7.1  Migration script for existing email/password users
- **New File**: `backend/scripts/migrate-legacy-users.ts`
- **Logic**:
  1. Find all users where `password IS NOT NULL AND (googleId IS NULL AND youtubeConnected = false)`
  2. For each: send a "legacy account" notice (log to console/file — email optional)
  3. Set `password = NULL` on all users (graceful nullify, not delete)
  4. Users with Google accounts but no YouTube tokens: mark `youtubeConnected = false` but keep their account
- **Command to run**: `npx tsx scripts/migrate-legacy-users.ts`
- **Test**: Run against a backup DB first

#### 7.2  Prisma migration to remove password column
- **After** confirming all passwords are null and no legacy users are actively using email/password:
- **Command**: `npx prisma migrate dev --name drop_user_password_column`
- **SQL**: `ALTER TABLE users DROP COLUMN password;`
- **Test**: `SELECT password FROM users LIMIT 1;` → column not found error

---

### Phase 8: Cleanup

#### 8.1  Remove unused imports and types
- **Files**: `auth.routes.ts`, `auth.service.ts`, `navbar.tsx`
- **Search**: `grep -r "requireYouTube\|youtubeConnected\|password" backend/src/ frontend/src/` and remove all dead references

#### 8.2  Update `.env.example`
- **File**: `backend/.env.example`
- **Remove**: Comment about `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` for separate YouTube OAuth
- **Keep**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `ENCRYPTION_KEY`
- **Add**: Comment that Google OAuth includes YouTube scopes — no separate YouTube credentials needed

#### 8.3  Update README
- **File**: `backend/README.md`
- **Change**: Update auth section to reflect Google OAuth only, remove YouTube connect step

---

## Final Verification Wave

### Pre-flight
- [x] `pnpm --filter backend lint` passes (skipped - no eslint config)
- [x] `pnpm --filter backend build` passes
- [x] `pnpm --filter frontend build` passes
- [x] `npx prisma validate` passes

### QA Scenarios (ALL MUST PASS — agent-executable)

#### QA-1: Email/password login returns 404
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: 404 or 410
```

#### QA-2: Google OAuth login stores YouTube tokens
```bash
# Using Playwright: navigate to /auth/login → click Google → complete OAuth
# Then: SELECT youtubeConnected, youtubeChannelId FROM users WHERE email = "testuser@gmail.com";
# Expected: youtubeConnected = true, youtubeChannelId IS NOT NULL
```

#### QA-3: Home feed returns personalized data when logged in
```bash
# Login via browser → get access_token cookie
curl -s http://localhost:4000/api/home-feed \
  --cookie "access_token=$TOKEN" | jq '.type'
# Expected: "personalized" (NOT "trending" or anonymous content)
```

#### QA-4: Home feed returns 401 when anonymous
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/home-feed
# Expected: 401
```

#### QA-5: YouTube connect/disconnect endpoints return 404
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/auth/youtube/connect
# Expected: 404
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/auth/youtube/disconnect
# Expected: 404
```

#### QA-6: Navbar shows no "Connect YouTube" button when logged in
```bash
# Using Playwright: login as Google user → check navbar HTML
# Expected: No element with text "Connect YouTube" or "YouTube Connected" status badge
# The user is simply logged in — YouTube connection is implicit
```

#### QA-7: Innertube cache hit — second request uses cached instance
```bash
# Enable debug logging: LOG_LEVEL=debug
# Make two requests to /user/youtube/notifications as same user
# Expected in logs: First request = "Creating authenticated Innertube"
#                  Second request = "Using cached Innertube instance"
```

#### QA-8: Token refresh — expired token auto-refreshes
```bash
# Manually set access_token to expired value in DB (youtubeTokens JSON column)
# Make authenticated request to /user/youtube/notifications
# Expected: Request succeeds (200), DB youtubeTokens updated with new access_token
```

---

## Dependencies

- Phase 1 before Phase 2 (remove old auth before building new flow)
- Phase 3 before Phase 4 (Innertube cache before updating guards)
- Phase 5 after Phase 2 (frontend changes after backend stabilizes)
- Phase 7 runs once, after full system is working

## Time Estimate
- Phase 1-4 (backend core): ~3-4 hours
- Phase 5-6 (frontend): ~2 hours
- Phase 7 (migration): ~30 minutes
- Phase 8 (cleanup): ~30 minutes
- QA verification: ~1 hour