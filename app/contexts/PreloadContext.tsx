'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type PreloadContextType = {
  preloadedPages: Set<string>;
  isPagePreloaded: (path: string) => boolean;
};

const PreloadContext = createContext<PreloadContextType>({
  preloadedPages: new Set(),
  isPagePreloaded: () => false,
});

// Routes to preload
const routesToPreload = [
  '/trending',
  '/music',
  '/tmdb-movies',
  '/immersive-shorts',
  '/liked-videos',
  '/history',
  '/watch-later',
  '/category/gaming',
  '/category/programming',
  '/category/education',
  // Add other important routes here
];

export function PreloadProvider({ children }: { children: ReactNode }) {
  const [preloadedPages] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Function to preload a single route
    const preloadRoute = async (route: string) => {
      try {
        if (!preloadedPages.has(route)) {
          await router.prefetch(route);
          preloadedPages.add(route);
          console.log(`Preloaded: ${route}`);
        }
      } catch (error) {
        console.error(`Failed to preload ${route}:`, error);
      }
    };

    // Function to preload all routes with a delay between each
    const preloadAllRoutes = async () => {
      for (const route of routesToPreload) {
        // Add a small delay between preloads to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 200));
        await preloadRoute(route);
      }
    };

    // Start preloading after a short delay to ensure main page loads first
    const timer = setTimeout(() => {
      preloadAllRoutes();
    }, 1000);

    return () => clearTimeout(timer);
  }, [router, preloadedPages]);

  const isPagePreloaded = (path: string): boolean => {
    return preloadedPages.has(path);
  };

  return (
    <PreloadContext.Provider value={{ preloadedPages, isPagePreloaded }}>
      {children}
    </PreloadContext.Provider>
  );
}

export const usePreload = () => useContext(PreloadContext); 
