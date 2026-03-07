# Tech Context

## Technologies Used

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Package Manager**: Bun
- **Linting**: ESLint

## Development Setup

1. Navigate to `frontend/` directory
2. Run `bun install` to install dependencies
3. Run `bun run dev` to start development server
4. Access the app at `http://localhost:3000`

## Dependencies

Key packages in `frontend/package.json`:
- next: ^14.0.0
- react: ^18.0.0
- react-dom: ^18.0.0
- typescript: ^5.0.0
- tailwindcss: ^3.4.0
- Various shadcn/ui components (button, card, dialog, etc.)

## Technical Constraints

- Must use Bun as package manager (not npm/yarn/pnpm)
- ESLint configuration in `frontend/eslint.config.mjs`
- 2 spaces for indentation
- React Server Components pattern preferred

## Tool Usage Patterns

- Use `bun install` for dependency management
- Use `bun run dev` for development
- Use `bun run build` for production builds
- Use `bun run lint` for linting

## Project Structure

```
/home/pk/Downloads/Vidiony/
├── AGENTS.md
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   ├── package.json
│   └── tsconfig.json
└── backend/              # To be implemented
```
