'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    workbox: any;
  }
}

interface ServiceWorkerEvent extends Event {
  type: string;
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Service workers aggressively cache and frequently break Next.js dev
    // (stale JS chunks -> client-side exceptions / blank screens).
    // In development, proactively unregister any existing SW and skip registration.
    if (process.env.NODE_ENV !== 'production') {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => {});

        // Best-effort cache cleanup to avoid serving stale HTML/chunks.
        if ('caches' in window) {
          caches.keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .catch(() => {});
        }
      }
      return;
    }

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      
      // Add event listeners
      wb.addEventListener('installed', (event: ServiceWorkerEvent) => {
        console.log(`Service Worker installed: ${event.type}`);
      });

      wb.addEventListener('controlling', (event: ServiceWorkerEvent) => {
        console.log(`Service Worker controlling: ${event.type}`);
      });

      wb.addEventListener('activated', (event: ServiceWorkerEvent) => {
        console.log(`Service Worker activated: ${event.type}`);
      });

      // Register the service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      }

      // Start the service worker
      wb.register();
    }
  }, []);

  return null;
} 
