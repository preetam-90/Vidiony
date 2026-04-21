# YouTube History Sync

## TL;DR

> **Quick Summary**: Implement one-way sync of watch history to YouTube using the user's Google OAuth tokens via `youtubei.js`. Add backend routes and frontend UI to access the user's real YouTube history and library.
> 
> **Deliverables**:
> - Authenticated `getHistory` and `getLibrary` methods in `youtube.service.ts`
> - `GET /api/yt/history` and `GET /api/yt/library` backend endpoints
> - Non-blocking, debounced YouTube history sync triggered by `POST /history/update`
> - Frontend UI updates to display native YouTube history/library
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 & Task 3 → Task 4

---

## Context

### Original Request
Implement `getLibrary()` and `getHistory()` to sync video history so videos watched on Vidiony appear in a user's real YouTube "Recently Watched" list. Use Google OAuth for authentication.

### Interview Summary
**Key Discussions**:
- **Auth Strategy**: Confirmed use of Google OAuth (tokens currently in DB) rather than session cookies.

**Research Findings**:
- Tokens are stored encrypted in the DB (`youtubeTokens`).
- `youtube.service.ts` uses `youtubei.js` (Innertube).
- The frontend video player polls `POST /history/update` every 10 seconds.

### Metis Review
**Identified Gaps** (addressed):
- **Rate Limiting/Spam**: Polling every 10 seconds will exhaust YouTube API limits. *Resolved: Implemented debouncing/throttling logic in the backend.*
- **Resilience**: YouTube API failures must not break local history. *Resolved: Sync operations are wrapped in try/catch and execute asynchronously.*
- **Data Integrity**: Video ID matching to ensure we only push valid YouTube video IDs. *Resolved: Added validation before syncing.*
- **Token Expiry**: Handled by existing auth service refresh logic, but integrated gracefully here.

---

## Work Objectives

### Core Objective
Allow authenticated users to view their native YouTube Library and Watch History directly within Vidiony, and automatically push local Vidiony watch events back to their YouTube watch history.

### Concrete Deliverables
- Service layer methods for `getHistory`, `getLibrary`, and `addHistory`.
- Express/Fastify routes exposing these capabilities.
- Async worker/debounce logic for the local `POST /history/update` route.
- React components/hooks consuming the new endpoints.

### Definition of Done
- [ ] User can view their YouTube history via the UI.
- [ ] Watching a video on Vidiony successfully registers a view on YouTube without interrupting playback.

### Must Have
- Background/async execution for the YouTube sync to avoid blocking the main local history update.
- Graceful error handling for missing/expired tokens.

### Must NOT Have (Guardrails)
- NO blocking of `POST /history/update` if YouTube API fails.
- NO syncing to YouTube every 10 seconds (debounce must be applied).
- NO two-way sync (YouTube history -> Vidiony DB).

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO dedicated test suite detected for these routes.
- **Automated tests**: None (Agent-Executed QA only).
- **Agent-Executed QA**: ALWAYS. curl for APIs, tmux for backend scripts, Playwright for UI.

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately - Core Service & Logic):
├── Task 1: Extend `youtube.service.ts` with authenticated methods [unspecified-high]
└── Task 2: Implement smart async sync in `history.ts` route [deep]

Wave 2 (After Wave 1 - API and Frontend Integration):
├── Task 3: Create API endpoints for History & Library [quick]
└── Task 4: Frontend Integration & UI Updates [visual-engineering]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 3 → Task 4 → F1-F4

### Agent Dispatch Summary
- Wave 1: T1 → `unspecified-high`, T2 → `deep`
- Wave 2: T3 → `quick`, T4 → `visual-engineering`
- FINAL: F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

- [ ] 1. **Add Authenticated `getHistory`, `getLibrary`, and `addHistory` Methods**

  **What to do**:
  - Extend `backend/src/services/youtube.service.ts` to support initializing `Innertube` with OAuth credentials.
  - Implement `getHistory()` to fetch the user's YouTube watch history.
  - Implement `getLibrary()` to fetch the user's YouTube library (Playlists/Liked Videos).
  - Implement `addHistory(videoId)` (or equivalent in `youtubei.js`, e.g., `account.history.add(videoId)`) to register a view.

  **Must NOT do**:
  - Do not hardcode tokens. Always fetch/pass `youtubeTokens` securely.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires solid backend Node.js and OAuth integration knowledge with `youtubei.js`.
  - **Skills**: `["git-master"]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (Must be completed first)
  - **Blocks**: [Task 2, Task 3]

  **References**:
  - `backend/src/services/youtube.service.ts` - Existing Innertube setup.
  - `backend/src/modules/auth/auth.service.ts:getUserYouTubeTokens` - Fetching decrypted tokens.

  **Acceptance Criteria**:
  - [ ] `youtube.service.ts` successfully authenticates an Innertube instance using a user's DB tokens.

  **QA Scenarios**:
  ```
  Scenario: Initialize Innertube with valid token and fetch history
    Tool: Bash (ts-node / bun)
    Preconditions: Create a dummy script `test-yt-auth.ts` that mocks a user's token and calls `getHistory()`.
    Steps:
      1. Run `bun run test-yt-auth.ts`.
      2. Assert it returns an array of history items (or fails gracefully if the token is invalid, but parsing logic must not crash).
    Expected Result: Script executes without crashing, logging history output or a controlled 401 message.
    Failure Indicators: Unhandled promise rejection or Innertube crash.
    Evidence: .sisyphus/evidence/task-1-auth-history.txt
  ```

- [ ] 2. **Implement Smart Debounced YouTube Sync in `POST /history/update`**

  **What to do**:
  - Update `backend/src/routes/history.ts` (`POST /history/update`).
  - Read the user's `youtubeConnected` status and tokens.
  - If connected, call `youtubeService.addHistory(videoId)` asynchronously.
  - **CRITICAL**: Implement debouncing or threshold logic. E.g., only sync if this is the first update for this `videoId` in this session, or only when progress > 80%, or track last synced timestamp in Redis/DB to prevent calling YouTube every 10 seconds.
  - Wrap the YouTube API call in a `try/catch` so failures don't break local history.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Needs careful async handling, debouncing, and preventing race conditions in Fastify endpoints.
  - **Skills**: `["git-master"]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Blocked By**: [Task 1]

  **References**:
  - `backend/src/routes/history.ts:POST /update` - Target endpoint.
  - `backend/src/services/youtube.service.ts` - New `addHistory` method.

  **Acceptance Criteria**:
  - [ ] YouTube sync is triggered asynchronously.
  - [ ] Sync logic includes a debounce/throttle mechanism to avoid rate limits.
  - [ ] Local DB updates continue working even if YouTube sync throws an error.

  **QA Scenarios**:
  ```
  Scenario: Local history updates successfully even if YouTube sync fails
    Tool: Bash (curl)
    Preconditions: Ensure a test user exists in the DB with `youtubeConnected = true` but invalid tokens.
    Steps:
      1. Send `curl -X POST http://localhost:3000/history/update -H "Content-Type: application/json" -d '{"videoId": "test_id", "progress": 50, "duration": 100}' -H "Cookie: session=..."`
    Expected Result: HTTP 200 OK. The local DB is updated. The backend console logs a YouTube sync error but doesn't crash the request.
    Failure Indicators: HTTP 500 or timeout.
    Evidence: .sisyphus/evidence/task-2-sync-fail-safe.txt
  ```

- [ ] 3. **Expose `/api/yt/history` and `/api/yt/library` Routes**

  **What to do**:
  - Add `GET /history` and `GET /library` to `backend/src/modules/youtube/youtube.routes.ts` (or create a dedicated router).
  - Use `authService.getUserYouTubeTokens` middleware to secure the routes.
  - Call the methods from Task 1 and map responses to the frontend's expected format.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Fastify route creation calling existing service methods.
  - **Skills**: `["git-master"]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Blocked By**: [Task 1]

  **References**:
  - `backend/src/modules/youtube/youtube.routes.ts`

  **Acceptance Criteria**:
  - [ ] Endpoints return 200 with JSON payload of history/library.

  **QA Scenarios**:
  ```
  Scenario: Fetch YouTube History via API
    Tool: Bash (curl)
    Preconditions: Authenticated user with YouTube tokens.
    Steps:
      1. `curl -s -X GET http://localhost:3000/api/yt/history -H "Cookie: session=..."`
    Expected Result: JSON response containing an array of video items.
    Failure Indicators: HTTP 500 or undefined payload.
    Evidence: .sisyphus/evidence/task-3-yt-api.txt
  ```

- [ ] 4. **Frontend Integration & UI Updates**

  **What to do**:
  - Update `frontend/src/lib/api.ts` to include the new endpoints.
  - Modify `frontend/src/components/home/ContinueWatchingSection.tsx` (or create a dedicated `YouTubeHistory` component) to display the native YouTube history if the user is connected.
  - Add a toggle/indicator to show that sync is active.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: React component modification and App Router integration.
  - **Skills**: `["git-master", "playwright"]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: [Task 3]

  **References**:
  - `frontend/src/lib/api.ts`
  - `frontend/src/components/home/ContinueWatchingSection.tsx`

  **Acceptance Criteria**:
  - [ ] User can see their native YouTube history in the UI.

  **QA Scenarios**:
  ```
  Scenario: View YouTube History on Dashboard
    Tool: Playwright
    Preconditions: Authenticated user with YouTube connected.
    Steps:
      1. Navigate to `/` or `/history`.
      2. Locate the "YouTube History" or "Recently Watched on YouTube" section.
      3. Assert the presence of video cards originating from the new API.
    Expected Result: Video cards render correctly.
    Failure Indicators: Section is missing or shows an error state unexpectedly.
    Evidence: .sisyphus/evidence/task-4-ui-history.png
  ```

---

## Final Verification Wave (MANDATORY)

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run linter/tsc. Review changed files for AI slop, correct error handling, and unused imports.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario. Test cross-task integration.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Verify 1:1 compliance with the plan. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(backend): add youtube authenticated service methods` - backend/src/services/youtube.service.ts
- **2**: `feat(backend): implement debounced youtube history sync` - backend/src/routes/history.ts
- **3**: `feat(backend): expose youtube library and history routes` - backend/src/modules/youtube/youtube.routes.ts
- **4**: `feat(frontend): integrate native youtube history UI` - frontend/src/...

---

## Success Criteria

### Verification Commands
```bash
curl -X GET "http://localhost:3000/api/yt/history" -H "Cookie: session=..."
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All QA scenarios passed
