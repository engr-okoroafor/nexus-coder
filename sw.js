
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

// Fetch event: serve from cache, proxy API, or fetch from network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Proxy for Groq API to bypass CORS
  if (url.origin === self.origin && url.pathname.startsWith('/groq-api/')) {
    // Correctly reconstruct the target URL for the Groq API
    // Ensure we strip /groq-api but keep everything else
    const targetPath = url.pathname.substring('/groq-api'.length);
    const apiUrl = `https://api.groq.com${targetPath}`;
    
    const proxyRequest = new Request(apiUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.body,
        redirect: 'follow',
    });

    event.respondWith(
        fetch(proxyRequest)
            .then(response => {
                return response;
            })
            .catch(error => {
                console.error('Groq proxy fetch failed:', error);
                // Return a JSON error so the app can handle it gracefully instead of HTML 404
                return new Response(JSON.stringify({ error: `Proxy Error: ${error.message}` }), { 
                    status: 502, 
                    headers: { 'Content-Type': 'application/json' }
                });
            })
    );
    return;
  }

  // Original cache-first strategy for app assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request);
      }
    )
  );
});
