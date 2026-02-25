import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// List of all routes that should be preloaded
const routesToPreload = [
  '/trending',
  '/music',
  '/tmdb-movies',
  '/immersive-shorts',
  '/liked-videos',
  '/history',
  '/watch-later',
  // Add category routes
  '/category/gaming',
  '/category/flowcharts',
  '/category/programming',
  // Add other category routes as needed
];

export function usePagePreloader() {
  const router = useRouter();

  useEffect(() => {
    // Function to preload a single route
    const preloadRoute = async (route: string) => {
      try {
        // Use Next.js router prefetch
        await router.prefetch(route);
        console.log(`Preloaded: ${route}`);
      } catch (error) {
        console.error(`Failed to preload ${route}:`, error);
      }
    };

    // Function to preload all routes with a delay between each
    const preloadAllRoutes = async () => {
      for (const route of routesToPreload) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Add small delay between preloads
        await preloadRoute(route);
      }
    };

    // Start preloading after a short delay to ensure main page loads first
    const timer = setTimeout(() => {
      preloadAllRoutes();
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);
} 
