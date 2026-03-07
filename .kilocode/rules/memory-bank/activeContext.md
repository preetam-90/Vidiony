# Active Context

## Current Work Focus

- Initial project setup and core feature implementation
- Setting up the frontend foundation with Next.js

## Recent Changes

- Created AGENTS.md with project configuration for AI agents
- Initialized Next.js frontend with TypeScript
- Set up shadcn/ui component library
- Created authentication pages (login/register)
- Created video upload and video viewing pages

## Next Steps

1. Connect frontend to backend API
2. Implement video upload functionality
3. Add user authentication flow
4. Build video feed/discovery page
5. Implement video playback features

## Active Decisions

- Using Bun as package manager (not npm/yarn/pnpm)
- Following Next.js App Router patterns
- Using functional components with hooks
- Keeping components modular and under 300 lines

## Important Patterns

- React Server Components by default, use "use client" only when needed
- File-based routing in `src/app/`
- Co-locate component styles when possible
- Use Tailwind CSS for styling

## Learnings

- Project uses shadcn/ui for component library
- ESLint is configured in `frontend/eslint.config.mjs`
- 2 spaces for indentation
