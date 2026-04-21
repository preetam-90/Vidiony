# Draft: Navigation System Redesign (YouTube-Style)

## Requirements (Confirmed)
- **Goal**: Analyze existing sidebar, remove it completely, build YouTube-style responsive navigation
- **Output**: Detailed analysis, clean removal, fully implemented desktop sidebar + mobile bottom nav
- **Animation**: Use Framer Motion (project already uses it, GSAP not found)
- **Styling**: Tailwind CSS with CSS variables from globals.css
- **No user profile section** in the new nav
- **No reusing old sidebar code**

## Existing Sidebar Analysis

### Files to Remove
- `/home/preetam/Downloads/Vidiony/frontend/src/components/layout/sidebar.tsx` - Main sidebar component
- `/home/preetam/Downloads/Vidiony/frontend/src/components/layout/sidebar/navigation/NavItem.tsx` - NavItem component
- `/home/preetam/Downloads/Vidiony/frontend/src/components/layout/sidebar/hooks/useSidebarState.ts` - Sidebar state hook
- `/home/preetam/Downloads/Vidiony/frontend/src/components/layout/sidebar/hooks/useKeyboardShortcuts.ts` - Keyboard shortcuts
- `/home/preetam/Downloads/Vidiony/frontend/src/components/layout/sidebar/hooks/index.ts` - Hook exports
- `/home/preetam/Downloads/Vidiony/frontend/src/contexts/sidebar-context.tsx` - Sidebar context (may need to replace)

### What to RETAIN (Conceptually)
- Navigation data structure (mainNavSections, authRequiredSections) - move to `src/lib/navigation.ts`
- NavItem pattern (icon + label + active state + badges)
- Collapsible behavior concept (expand/collapse states)
- Keyboard shortcuts for power users

### What to REMOVE
- Fixed overlay behavior (replace with push content layout)
- Queue/FloatingQueuePanel (player-specific, not nav)
- User profile dropdown from sidebar
- Heavy re-renders from mixed responsibilities
- Mobile Sheet duplication (will replace with bottom nav)

### Key Issues Identified
1. Mixed responsibilities in sidebar.tsx (nav + queue + user menu + categories)
2. No collapse state persistence (isCollapsed not saved to localStorage)
3. Mobile/desktop nav code duplication (Sheet in navbar vs Sidebar)
4. No tests for sidebar behavior
5. Heavy Tailwind classes in JSX
6. NO TEST INFRASTRUCTURE - 0 tests across ~147 source files

## Technical Decisions

### Animation Library: **Framer Motion**
- Project already uses Framer Motion (ShortsPlayer, ShortsActions)
- GSAP not found in codebase
- Spring-based animations: `{ type: "spring", stiffness: 300, damping: 30 }`

### Breakpoint for Desktop vs Mobile: **[QUESTION - NEED ANSWER]**
- Standard Tailwind breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Based on task description "sidebar disabled" on mobile → likely `lg:` breakpoint
- **Need to confirm**: Should desktop sidebar appear at `lg:` (1024px) or `md:` (768px)?

### Tooltip Behavior for Collapsed Sidebar: **[QUESTION - NEED ANSWER]**
- When sidebar is collapsed (icons only), hover/click should show tooltip
- Options: 1) Tooltip on hover, 2) Tooltip on click, 3) Tooltip on both hover and click
- **Need to confirm preference**

### Theme Consistency
- Colors from globals.css CSS variables: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.
- Glassmorphism: `bg-white/10 backdrop-blur-lg border border-white/20`
- Typography: CSS variables `--font-heading`, `--font-body`

## New Navigation Structure

### Desktop Sidebar
- **Behavior**: Push content (not overlay), visible by default
- **States**: Expanded (240px, icons + labels) | Collapsed (72px, icons only)
- **Toggle**: Button to switch between states
- **Animation**: Smooth width transition with Framer Motion spring physics
- **Design**: Glassmorphism effect with semi-transparent background

### Navigation Items
```
- Home (/)
- Trending (/trending)
- Subscriptions (/subscriptions) [auth required]
- Library section:
  - History (/history)
  - Liked Videos (/liked-videos)
  - Playlists (/playlist)
```

### Mobile Bottom Navigation
- **Behavior**: Fixed bottom bar, primary nav only
- **Items**: Home, Trending, Subscriptions, Library (4 items)
- **Design**: Touch-friendly (44px min touch targets), consistent theme
- **Additional nav**: Less-used options in top menu

## Scope Boundaries
### INCLUDE
- Desktop sidebar with expand/collapse
- Mobile bottom navigation
- Smooth Framer Motion animations
- Active route highlighting
- Glassmorphism design
- Keyboard navigation (desktop)
- ARIA roles and accessibility
- Performance optimization (avoid re-renders)

### EXCLUDE
- User profile section
- Queue/FloatingQueuePanel
- Reusing old sidebar code
- Heavy animation libraries (GSAP - use Framer Motion)

## Open Questions - ANSWERED
1. **Breakpoint**: `lg:` (1024px+) for desktop sidebar ✅
2. **Tooltip behavior**: On hover only ✅
3. **Persistence**: Yes, persist collapse state to localStorage ✅
4. **Test setup**: YES - Set up Vitest for Next.js ✅

## Test Strategy
- **Current state**: NO test infrastructure (0 tests, no framework)
- **Decision**: Set up Vitest test framework
- **Framework**: Vitest + @testing-library/react + MSW
- **Scope**: Setup tests for navigation components specifically
- **QA approach**: Agent-Executed QA still mandatory for all tasks (Playwright for UI verification)

## References Found
- Theme tokens: `frontend/src/app/globals.css`
- Component patterns: `frontend/src/components/ui/button.tsx` (cva + cn pattern)
- Framer Motion examples: `frontend/src/components/video/ShortsPlayer.tsx`
- Animation patterns: Spring physics, AnimatePresence for mount/unmount
- Utility: `frontend/src/lib/utils.ts` (cn function)