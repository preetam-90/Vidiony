# System Patterns

## Architecture

### Frontend Structure
```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── video/        # Video-specific components
│   │   ├── auth/         # Authentication components
│   │   └── layout/       # Layout components (navbar, etc.)
│   └── lib/              # Utility functions
```

### Routing Pattern
- File-based routing using Next.js App Router
- Dynamic routes use `[id]` folder naming convention (e.g., `video/[id]/page.tsx`)

## Component Patterns

### React Server Components
- Default to server components for better performance
- Use "use client" directive only when client-side interactivity is needed (hooks, event handlers, browser APIs)

### Component Structure
- Keep components focused and under 300 lines
- Extract reusable logic into custom hooks
- Use composition over inheritance
- Name components descriptively (e.g., `VideoCard`, `Navbar`)

### shadcn/ui Components
- UI components are in `src/components/ui/`
- Components are copied from shadcn/ui library
- Custom components extend the base UI components

## State Management

### Local State
- Use React hooks (useState, useEffect, useContext)
- Keep state as close to where it's used as possible

### Server State
- Use Next.js API routes for server-side logic
- Fetch data in server components when possible

## Styling

### Tailwind CSS
- Use Tailwind CSS for all styling
- Follow 2-space indentation for JSX
- Use utility classes for responsive design
- Custom styles in `globals.css` for global overrides

## API Integration

### Backend Communication
- API routes in Next.js for backend proxy
- Environment variables for API endpoints
- Validate all user inputs on both client and server
