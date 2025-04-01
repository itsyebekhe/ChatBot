// service-worker.js
const CACHE_NAME = 'gemma-chat-pwa-cache-v1';
const URLS_TO_CACHE = [
  './', // Alias for index.html
  './index.html', // Explicitly cache index.html
  './manifest.json',
  './style.css', // Assuming you might extract CSS later
  './app.js',   // Assuming you might extract JS later
  './icons/icon-192x192.png', // Add paths to ALL your icons
  './icons/icon-512x512.png',
  './icons/maskable_icon.png',
  './icons/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js', // Cache libraries too
  'https://cdnjs.cloudflare.com/ajax/libs/markdown-it/14.0.0/markdown-it.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css' // Cache CSS theme
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to cache resources during install:', err);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of clients immediately
});

// Fetch event: Serve cached assets, fetch others
self.addEventListener('fetch', event => {
  // Skip OpenRouter API calls and external resources not explicitly cached
  if (event.request.url.startsWith('https://openrouter.ai/') ||
      !URLS_TO_CACHE.some(url => event.request.url.endsWith(url.replace('./','/')) || event.request.url === new URL(url, self.location.origin).href)) {
    // console.log('SW Fetch - Skipping non-cached/API request:', event.request.url);
    event.respondWith(fetch(event.request));
    return;
   }

  // console.log('SW Fetch - Handling:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          // console.log('SW Fetch - Cache hit:', event.request.url);
          return response;
        }
        // Not in cache - fetch from network
        // console.log('SW Fetch - Cache miss, fetching:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Optional: Cache fetched resource if needed dynamically (be careful)
            return networkResponse;
          }
        ).catch(err => {
           console.error("SW Fetch error:", err);
           // You could return a generic offline fallback page here if desired
        });
      })
  );
});
