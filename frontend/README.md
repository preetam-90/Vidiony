# Frontend (Vidiony)

Next.js 16 frontend for Vidiony, focused on video discovery, playback, user personalization, and responsive UI flows.

## Tech Stack

| Layer | Technology |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Data fetching | TanStack Query + custom API client |
| Forms/validation | React Hook Form + Zod |

## Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Run frontend in development:

```bash
pnpm --filter frontend dev
```

## Common Commands

```bash
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend lint
pnpm --filter frontend start
pnpm --filter frontend test
```

## Project Structure (Frontend)

```text
frontend/
├── src/app/              # App Router pages
├── src/components/       # Shared UI and domain components
├── src/contexts/         # React context providers
├── src/hooks/            # Custom hooks
├── src/lib/              # API client and utility helpers
└── src/styles/           # Additional styling modules
```

## Backend Dependency

Frontend routes expect backend services on:

```text
http://localhost:4000
```

Ensure the backend server is running before validating auth/video flows.

## Troubleshooting

### Backend requests fail in UI
- Confirm backend is running (`pnpm --filter vidion-backend dev`).
- Check CORS config in backend env (`FRONTEND_URL`).

### Build/lint failures
- Run `pnpm --filter frontend lint` and fix issues incrementally.
- Verify Node.js and pnpm versions match project expectations.

### Auth redirects not working
- Verify backend OAuth env values and callback URLs.
- Clear stale browser cookies and retry login.
