# Vidion

A modern video streaming platform built with Next.js, offering a rich set of features for video content consumption and management.

🌐 **Live Website**: [https://vidion.vercel.app/](https://vidion.vercel.app/)


## Description

Vidion is a comprehensive educational video streaming platform that provides users with a seamless experience for watching programming tutorials, algorithm explanations, and technical content. The platform includes extensive coverage of programming concepts, data structures, algorithms, and computer science fundamentals.

## Features

- 🎬 Video streaming with support for multiple content types
- 🔍 Advanced search functionality
- 📱 Responsive design for all devices
- 🎨 Modern UI with dark/light theme support
- 📊 User dashboard with viewing history
- ⭐ Favorites and watch later functionality
- 🎯 Comprehensive programming tutorials
- 🔄 Offline mode support
- 📈 Trending content section
- 🏷️ Category-based content organization

## Content Categories

- 💻 Programming Basics
- 📊 Flowcharts & Algorithms
- 🔢 Number Systems
- 📝 Programming Patterns
- 🧮 Math Problems
- 🔍 Complexity Analysis
- 📚 Data Structures
  - Arrays
  - Linked Lists
  - Stacks
  - Queues
  - Trees
- 🎯 Algorithm Topics
  - Sorting Algorithms
  - Searching Algorithms
  - String Algorithms
  - Matrix Algorithms
- 🔧 Advanced Topics
  - Bit Manipulation
  - Pointers
  - Recursion
  - C++ Concepts

## Preview

Here are some screenshots showcasing the main features of Vidion:

### Home Page
![Home Page](./public/previews/home.png)
*The main landing page with featured content and navigation*

### Explore Section
![Explore Section](./public/previews/explore.png)
*Discover new content and trending videos*

### Movies Section
![Movies Section](./public/previews/movies.png)
*Browse and watch movies with detailed information*

### Music Section
![Music Section](./public/previews/music.png)
*Enjoy music videos and playlists*

### Gaming Content
![Gaming Section](./public/previews/gaming.png)
*Dedicated section for gaming-related content*

### History & Trending
![History and Trending](./public/previews/history.png)
*Track your viewing history and discover trending content*

### TMDB Movies Integration
![TMDB Movies](./public/previews/tmdb%20movies.png)
*Seamless integration with TMDB for movie information*

## Tech Stack

### Frontend
- Next.js 15.3.1
- React 19.1.0
- TypeScript
- Tailwind CSS
- Radix UI Components
- Framer Motion
- Zustand (State Management)
- React Hook Form
- Zod (Validation)

### Backend
- Next.js API Routes
- Google APIs Integration

### Development Tools
- TypeScript
- PostCSS
- Sharp (Image Optimization)
- Vercel Analytics & Speed Insights

## Project Structure

```
├── app/                    # Main application directory
│   ├── api/               # API routes
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── movies/            # Movie-related pages
│   ├── shorts/            # Shorts content pages
│   └── ...                # Other feature directories
├── components/            # Shared components
├── public/                # Static assets
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Preetam8873/vidio-v1.0.git
cd vidion
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_YOUTUBE_API_KEYS=your_youtube_api_keys_separated_by_commas
```

For detailed information on setting up and managing YouTube API keys, please refer to [YOUTUBE_API_GUIDE.md](./YOUTUBE_API_GUIDE.md).

4. Run the development server:
```bash
pnpm dev
```

### Using Bun (optional)

If you prefer to use Bun as the project runtime, Bun is supported and configured in `package.json`.

- Install Bun (follow official installer):
```bash
curl -fsSL https://bun.sh/install | bash
# then restart your shell or follow the installer output
```

- Install dependencies with Bun (this generates `bun.lockb`):
```bash
bun install
```

- Common Bun commands (equivalents are configured in `package.json`):
```bash
# Start the development runner (uses run-dev.js under Bun)
bun run dev

# Build with Next via bunx
bunx next build

# Start production
bunx next start

# Run lint
bunx next lint
```

Note: `bunx` executes binaries from the project like `next` using Bun's runner. Using Bun will create `bun.lockb` in the repository; commit it if you want reproducible installs.

## Usage

1. Start the development server using `pnpm dev`
2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Browse and watch educational programming content

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_YOUTUBE_API_KEYS`: Comma-separated list of YouTube Data API v3 keys

## Utility Scripts

- `node check-api-keys.js`: Check the validity of your YouTube API keys
- `node clean-api-keys.js`: Clean up invalid or quota-exceeded YouTube API keys

## Development

- `pnpm dev`: Start development server (using pnpm/node)
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm lint`: Run linting

If using Bun, the following run targets are available (see the `scripts` section in `package.json`):

- `bun run dev` — Start the development runner (`run-dev.js`) under Bun
- `bunx next build` — Build the Next.js app using Bun's `bunx`
- `bunx next start` — Start the production server under Bun

## License

This project is private and proprietary.

## Performance Optimizations

The project includes several performance optimizations:
- Static page generation
- Image optimization
- HTTP/2 Push
- Granular code splitting
- Font optimization
- Modern JavaScript features
- Tree shaking
- Module concatenation 
