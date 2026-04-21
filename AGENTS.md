# Vidiony

A video sharing platform built with Next.js, featuring video upload, playback, and social features.

## Code Style

- Use TypeScript for all new files
- Follow ESLint configuration (ESLint config is in `frontend/eslint.config.mjs`)
- Use 2 spaces for indentation (inherited from project defaults)
- Use functional components with hooks over class components
- Use `.tsx` extension for React components, `.ts` for TypeScript files
- Follow React Server Components (RSC) patterns - use "use client" directive only when needed
- Keep components focused and modular

## Architecture

- **Frontend Structure**:
  - `src/app/` - Next.js App Router pages
  - `src/components/` - Reusable React components
  - `src/lib/` - Utility functions
  - `src/components/ui/` - shadcn/ui component library
  - `src/components/video/` - Video-specific components
  - `src/components/auth/` - Authentication components
  - `src/components/layout/` - Layout components (navbar, etc.)

- **Routing**: Use Next.js App Router with file-based routing
- **State Management**: Use React hooks (useState, useEffect, useContext) for local state
- **API Calls**: Use Next.js API routes or external API endpoints
- **Styling**: Use Tailwind CSS (configured in the project)

## Component Guidelines

- Keep components under 300 lines
- Extract reusable logic into custom hooks
- Use composition over inheritance
- Name components descriptively (e.g., `VideoCard`, `Navbar`)
- Co-locate component styles with components when possible

## Testing

- Write unit tests for utility functions in `src/lib/`
- Test React components with React Testing Library
- Ensure new features have corresponding tests

## Security

- Never commit API keys or secrets to the repository
- Validate all user inputs
- Use environment variables for sensitive data (see `.env` files)
- Follow Next.js security best practices

## File Conventions

- **Pages**: `src/app/[route]/page.tsx`
- **Layouts**: `src/app/layout.tsx` (root), `src/app/[route]/layout.tsx` (nested)
- **Components**: `src/components/[domain]/[ComponentName].tsx`
- **Utils**: `src/lib/utils.ts` for shared utilities

## Package Manager

- **Always use pnpm** instead of npm/yarn/bun
- Run `pnpm install` to install dependencies
- Run `pnpm <script>` to execute scripts

## Getting Started

1. Navigate to `frontend/` or `backend/` directory
2. Run `pnpm install` to install dependencies
3. Run `pnpm dev` to start development server (frontend) or `pnpm start` (backend)
4. Access the frontend app at `http://localhost:3000`

## File Search Strategy

**ALWAYS use graphify as the PRIMARY search tool for finding files.** This is non-negotiable.

### Search Order (in parallel):
1. **graphify** - Query the knowledge graph first for fast, indexed file discovery
2. **explore agents** - Spawn in parallel with graphify for contextual codebase grep
3. **librarian agents** - Spawn in parallel for remote repo/doc lookups if needed
4. **direct tools (grep, rg, sg, glob)** - Use directly for simple single-pattern searches

### Fallback Rule:
- If graphify does NOT find the file → THEN fall back to manual search (grep, glob, explore)
- Never skip graphify and search manually first

### Implementation:
When searching for any file, function, component, or pattern:
```
1. Fire graphify skill in parallel with explore/librarian agents
2. Wait for graphify result
3. If graphify finds it → use that result
4. If graphify misses → use explore/librarian results or manual grep
```

## Notes

- This is a frontend-focused project (Next.js)
- API/backend integration may be configured separately
- Follow existing code patterns when adding new features
