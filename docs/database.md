# Database Schema Guide

The backend uses **PostgreSQL** with **Prisma** as the ORM.

- Prisma schema source: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/`

## Core Entities

## Users

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `email` | `String` | Unique user email |
| `username` | `String` | Unique username |
| `password` | `String?` | Nullable password (OAuth-first flow supported) |
| `youtubeConnected` | `Boolean` | Indicates YouTube account linkage |
| `createdAt` | `DateTime` | Creation timestamp |

## Videos

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `title` | `String` | Video title |
| `description` | `String?` | Optional description |
| `videoUrl` | `String` | Video source URL |
| `views` | `Int` | View counter |
| `userId` | `String` | Owner reference to `User` |

## Watch History

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `userId` | `String` | Related user |
| `videoId` | `String` | Video identifier |
| `progress` | `Int` | Playback progress |
| `watchedAt` | `DateTime` | Last watched timestamp |

## Comments

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String (UUID)` | Primary key |
| `content` | `String` | Comment body |
| `userId` | `String` | Author reference |
| `videoId` | `String` | Target video reference |
| `parentId` | `String?` | Optional parent for threaded replies |

## Relationships

- A **User** has many **Videos**.
- A **User** has many **Comments**.
- A **User** has many **WatchHistory** entries.
- A **Video** has many **Comments**.
- A **Video** has many **Likes**.
- A **Subscription** links one user (subscriber) to another user (creator).
- **Playlist** and **PlaylistVideo** model a one-to-many composition for saved video collections.

## Enums in Use

- `TrendingCategory`: TRENDING, MUSIC, GAMING, MOVIES, NEWS
- `InteractionType`: LIKE, DISLIKE, COMMENT, SHARE, SUBSCRIBE, SAVE, SKIP
- `DownloadStatus`: PENDING, PROCESSING, COMPLETED, FAILED
- `Visibility`: PUBLIC, PRIVATE, UNLISTED
- `LikeType`: LIKE, DISLIKE
- `PlaylistPrivacy`: PUBLIC, PRIVATE, UNLISTED

## Practical Notes

- IDs are UUID strings to simplify distributed-safe key generation.
- Watch history and watch-later models include indexes for user-centric querying.
- Composite unique constraints prevent duplicate user/video pairs in key tables.
