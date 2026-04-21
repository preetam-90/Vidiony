# Plan: getGuide() Dynamic Sidebar Integration

## Goal
Implement a dynamic sidebar that fetches navigation categories, subscriptions, and library links using `youtubei.js`'s `getGuide()` method. The sidebar should be personalized for signed-in users and show generic/regional options for guests.

## Current State
- **Frontend**: `Sidebar` component (`src/components/layout/sidebar.tsx`) has hardcoded `PRIMARY_NAV`, `LIBRARY_NAV`, and `PERSONAL_NAV` arrays.
- **Backend**: `Innertube` singleton is already configured with `YT_COOKIE` support. `YouTubeService` and `youtube.routes.ts` handle metadata but lack a `/guide` endpoint.
- **Library**: `youtubei.js` v16 is present and includes `getGuide()`.

## Implementation Steps

### 1. Backend: Expose getGuide API
- **Service Update**: Add `getGuide()` to `backend/src/services/youtube.service.ts`.
  - It should call `yt.getGuide()`.
  - Parse the `Guide` object into a clean JSON structure (Sections -> Items).
- **Route Update**: Add `GET /api/yt/guide` to `backend/src/modules/youtube/youtube.routes.ts`.
  - Should be accessible by both guests and authenticated users.
  - If authenticated (via `YT_COOKIE` in singleton), `youtubei.js` handles personalization.

### 2. Frontend: Dynamic Data Fetching
- **Navigation Hook**: Create `src/hooks/useYouTubeGuide.ts` to fetch from `/api/yt/guide`.
  - Use `react-query` or similar if present, or a simple `useEffect` with state.
  - Handle loading/error states with hardcoded fallbacks.
- **Mapping Logic**: Create a utility to map `youtubei.js` Guide items to `Sidebar`'s `NavItem` shape.
  - Map icon keys (if provided by API) or labels to `lucide-react` components.

### 3. Frontend: Sidebar Component Integration
- **Refactor Sidebar**: Modify `SidebarContent` in `sidebar.tsx` to consume dynamic data.
- **State Logic**:
  - Signed-in: Show subscriptions and personalized sections from `getGuide()`.
  - Guest: Show "Best of YouTube", "Explore", and standard "Home/Trending" sections.
- **Persistence**: Ensure sidebar collapse state remains preserved in `sidebar-context.tsx`.

## Technical Details
- **Icon Mapping**: Since the API returns string identifiers or labels, we need a static map in the frontend:
  ```typescript
  const ICON_MAP = {
    'Home': Home,
    'Trending': TrendingUp,
    'Subscriptions': PlaySquare,
    // ...
  };
  ```
- **Caching**: Backend should cache the guide response for ~1 hour for guests and ~10 minutes for authenticated users.

## Verification
- **Guest Test**: Open in Incognito. Verify "Trending", "Music", "Gaming" categories appear.
- **Auth Test**: Sign in. Verify "Subscriptions" section appears with actual channel names/icons.
- **Performance**: Ensure no layout shift when sidebar items load (use skeletons).

## Constraints
- Do NOT break existing keyboard shortcuts.
- Maintain glassmorphism styling.
- Ensure "Push content" layout remains intact on desktop.
