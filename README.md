<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                              V I D I O N Y                                   ║
║                     Next-Gen Video Streaming Platform                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->

<div align="center">

![Vidiony](./public/logo.png)

# 🚀 Vidiony

### A next-generation video streaming platform built for the future

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-7C3AED?style=for-the-badge)](./LICENSE)

**Live Website**: [vidion.vercel.app](https://vidion.vercel.app)

*Modern • Fast • Beautiful*

</div>

---

## ✨ Features

| Core Features | User Experience | Content & Discovery |
|:-------------|:----------------|:--------------------|
| 🎬 High-quality video streaming | 🎨 Dark/Light theme support | 📈 Trending content |
| 🔍 Intelligent search | 📱 Fully responsive design | 🏷️ Category organization |
| ⏩ Smooth playback controls | ⚡ Blazing fast performance | 🎯 Curated tutorials |
| 📺 Multiple content types | ✨ Smooth animations | 🔥 Hot & trending |
| 💾 Watch history tracking | 🎯 Intuitive navigation | 📊 View analytics |

### Content Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  💻 Programming      📊 Algorithms      📝 Patterns      🔢 Number Systems  │
│  🧮 Math Problems   🔍 Complexity      📚 Data Structures (Arrays,         │
│     Linked Lists, Stacks, Queues, Trees, Graphs)                          │
│  🎯 Advanced Topics (Sorting, Searching, String & Matrix Algorithms,     │
│     Bit Manipulation, Pointers, Recursion, C++)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
|:------|:-------------|
| **Framework** | Next.js 16.1.6 • React 19.1.0 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3.4 • CSS Modules |
| **UI Components** | Radix UI • Lucide Icons |
| **Animation** | Framer Motion 12.7.1 |
| **State Management** | Zustand 5.0.3 |
| **Forms & Validation** | React Hook Form • Zod 3.24 |
| **Database** | Neon (PostgreSQL) • Drizzle ORM |
| **APIs** | YouTube Data API v3 • TMDB |
| **Deployment** | Vercel • Edge Runtime |

</div>

---

## 📁 Project Structure

```
Vidiony/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main content pages
│   ├── movies/            # Movie streaming
│   ├── shorts/            # Short-form videos
│   └── ...
├── components/            # Reusable UI components
│   ├── ui/               # Base components
│   └── ...               # Feature components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utilities & helpers
├── public/               # Static assets
│   ├── previews/         # Screenshots
│   └── icons/           # PWA icons
├── styles/               # Global styles
├── types/                # TypeScript definitions
└── scripts/              # Build & utility scripts
```

---

## 🚦 Getting Started

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| Node.js | ≥ 20.0.0 |
| Bun | ≥ 1.0.0 (recommended) |
| pnpm | ≥ 8.0.0 (alternative) |

### Installation

```bash
# Clone the repository
git clone https://github.com/preetam-90/Vidiony.git
cd Vidiony

# Install dependencies (Bun - recommended)
bun install

# Or using pnpm
pnpm install

# Or using npm
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Required
NEXT_PUBLIC_YOUTUBE_API_KEYS=your_api_key_1,your_api_key_2

# Optional - for additional features
TMDB_API_KEY=your_tmdb_api_key
DATABASE_URL=your_neon_database_url
```

> 📖 For detailed API setup instructions, see [YOUTUBE_API_GUIDE.md](./YOUTUBE_API_GUIDE.md)

### Development

```bash
# Start development server (Bun)
bun run dev

# Or with pnpm
pnpm dev

# Open in browser
# http://localhost:3000
```

### Build & Deploy

```bash
# Production build
bun run build

# Start production server
bun run start

# Lint code
bun run lint
```

---

## 🎯 Available Scripts

| Command | Description |
|:--------|:-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run generate-pwa-assets` | Generate PWA icons |

### Utility Scripts

```bash
# Check API key validity
node check-api-keys.js

# Clean invalid/quota-exceeded keys
node clean-api-keys.js
```

---

## 📸 Preview

| Home Page | Explore | Movies |
|:----------|:--------|:-------|
| ![Home](./public/previews/home.png) | ![Explore](./public/previews/explore.png) | ![Movies](./public/previews/movies.png) |

| Music | Gaming | History |
|:------|:-------|:--------|
| ![Music](./public/previews/music.png) | ![Gaming](./public/previews/gaming.png) | ![History](./public/previews/history.png) |

---

## 🔧 Performance Optimizations

- ⚡ Edge Runtime support
- 🖼️ Image optimization with Sharp
- 📦 Granular code splitting
- 🎨 Font optimization
- 🌳 Tree shaking
- 📑 Route prefetching
- 💾 Static generation where applicable
- 📊 Vercel Analytics & Speed Insights

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🤝 Connect

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-Preetam--90-black?style=for-the-badge&logo=github)](https://github.com/preetam-90)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com)

*Built with ❤️ using Next.js*

---

**⭐ Star this repo if you find it useful!**

</div>

<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║                              Built with                                     ║
║     ⚡ Next.js    🦄 React    🎨 Tailwind    🔵 TypeScript    💚 Bun        ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->