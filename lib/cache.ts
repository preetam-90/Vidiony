import { cache } from 'react';

// Server-side caching using React's cache function
export const getCachedData = cache(async (key: string) => {
  // This will be cached on the server
  return null;
});

// Client-side caching using localStorage
export const clientCache = {
  set: (key: string, data: any) => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Error setting cache:', error);
      }
    }
  },

  get: (key: string) => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error getting cache:', error);
        return null;
      }
    }
    return null;
  },

  remove: (key: string) => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing cache:', error);
      }
    }
  },

  clear: () => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  }
};

// Cache keys
export const CACHE_KEYS = {
  USER_HISTORY: 'user_history',
  WATCH_LATER: 'watch_later',
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches',
  PAGE_CONTENT: 'page_content'
};

// Cache duration in milliseconds (24 hours)
export const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Helper function to check if cache is expired
export const isCacheExpired = (timestamp: number) => {
  return Date.now() - timestamp > CACHE_DURATION;
}; 