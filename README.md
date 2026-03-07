# Vidion - Video Platform

A high-performance full-stack video sharing platform built with Next.js and Fastify.

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Shadcn/UI** - Component library
- **Dark mode** - Glassmorphism UI design

### Backend
- **Fastify 5** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication

## Features

- User authentication (register, login, JWT)
- Video upload and streaming
- Video playback with like/dislike
- Comments and replies
- User profiles and subscriptions
- Dark mode glassmorphism UI
- Responsive mobile-first design

## Getting Started

Install all workspace dependencies from the repository root:

```bash
pnpm install
```

### Prerequisites

- Node.js 24.x
- pnpm 9.x
- PostgreSQL database

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE vidion;
```

2. Update the connection string in `backend/.env`

### Backend Setup

```bash
pnpm install
pnpm --filter vidion-backend db:generate
pnpm --filter vidion-backend db:push  # or pnpm --filter vidion-backend db:migrate
pnpm --filter vidion-backend dev
```

The backend will start on `http://localhost:4000`

### Frontend Setup

```bash
pnpm install
pnpm --filter frontend dev
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Videos
- `GET /api/videos` - List videos (with pagination)
- `GET /api/videos/:id` - Get video details
- `POST /api/videos` - Upload video (protected)
- `PUT /api/videos/:id` - Update video (protected)
- `DELETE /api/videos/:id` - Delete video (protected)
- `POST /api/videos/:id/like` - Like/dislike video
- `GET /api/videos/:id/comments` - Get comments
- `POST /api/videos/:id/comments` - Add comment

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/videos` - Get user videos
- `PUT /api/users/me` - Update profile
- `POST /api/users/:id/subscribe` - Subscribe to user
- `GET /api/users/me/subscriptions` - Get subscriptions

## Project Structure

```
Vidiony/
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   └── lib/        # Utilities
│   └── public/          # Static assets
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── utils/       # Utilities
│   │   └── index.ts     # Main server
│   ├── prisma/          # Database schema
│   └── uploads/         # File storage
└── README.md
```

## Environment Variables

### Backend (.env)
```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/vidion
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

## License

MIT
