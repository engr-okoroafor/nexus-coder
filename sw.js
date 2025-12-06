
// sw.js - Service Worker for PWA
const CACHE_NAME = 'nexus-coder-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install event: cache the application shell and force skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip service worker for API calls to avoid CORS issues
  if (url.origin !== self.origin || 
      url.pathname.includes('/api/') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('groq.com') ||
      url.hostname.includes('duckduckgo.com')) {
    // Let the browser handle API requests directly
    return;
  }

  // Cache-first strategy for app assets only
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).catch(() => {
          // If offline and not in cache, return a basic offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
