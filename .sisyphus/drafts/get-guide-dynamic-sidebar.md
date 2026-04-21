# Draft: getGuide() Dynamic Sidebar Integration

## Requirements (confirmed)
- User wants: implement a `getGuide()`-based feature.
- Feature intent: return exact categories/subscriptions/library links seen in YouTube sidebar.
- Expected benefit: render sidebar dynamically instead of hardcoded items (Home/Trending/Music).

## Technical Decisions
- Planning mode only (no direct implementation in this session).
- Need to verify where `getGuide()` comes from (existing code vs external library/API).

## Research Findings
- **Source**: `getGuide()` is provided by the `youtubei.js` library (Innertube client), which is already a dependency in `backend/package.json`.
- **Backend Integration**: The `Innertube` singleton in `backend/src/innertube.ts` is already configured with `YT_COOKIE` support, enabling personalized guide data when valid cookies are provided.
- **Mapping Strategy**: Since `youtubei.js` returns internal YouTube icon identifiers, the frontend will use a static `ICON_MAP` to translate these into `lucide-react` components.
- **Personalization**: The feature will strictly follow the user's intent:
  - **Signed-in**: Display personalized subscriptions, library links, and categories.
  - **Guest**: Display regional/generic categories (Trending, Music, Gaming) and standard navigation.

## Scope Boundaries
- INCLUDE: Backend `/api/yt/guide` endpoint, frontend `useYouTubeGuide` hook, and dynamic `Sidebar` rendering.
- EXCLUDE: Modification of the core `Innertube` singleton (use existing configuration).

## Open Questions - ANSWERED
- **Source**: `youtubei.js` via `Innertube` client. ✅
- **Fetching Strategy**: Server-side fetch via backend API to handle auth/cookies securely. ✅
- **Auth Behavior**: Personalization for signed-in users; generic regional guide for guests. ✅
- **Fallback**: Static hardcoded nav items if the API fetch fails. ✅
