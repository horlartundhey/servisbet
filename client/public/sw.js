// iOS Safari Service Worker for Cache Control
const CACHE_NAME = 'servisbeta-v1';
const STATIC_CACHE_NAME = 'servisbeta-static-v1';

// Files to cache (be selective for iOS Safari memory management)
const CACHE_URLS = [
  '/',
  '/manifest.json'
];

// Install event - cache essential files only
self.addEventListener('install', (event) => {
  console.log('Service Worker installing for iOS Safari compatibility');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker caching essential files');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - handle iOS Safari cache issues
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle asset files with cache busting for iOS Safari
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      fetch(request.clone(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      .then((response) => {
        if (response.ok) {
          console.log('Service Worker fetched asset with no-cache:', url.pathname);
          return response;
        }
        throw new Error('Network response was not ok');
      })
      .catch((error) => {
        console.error('Service Worker asset fetch failed:', error);
        // Don't cache failed responses for iOS Safari
        throw error;
      })
    );
    return;
  }
  
  // Handle HTML files - always fetch fresh for iOS Safari
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request.clone(), {
        cache: 'no-store'
      })
      .then((response) => {
        if (response.ok) {
          return response;
        }
        // Fallback to cache if network fails
        return caches.match(request);
      })
      .catch(() => {
        return caches.match(request);
      })
    );
    return;
  }
  
  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          return response;
        }
        return caches.match(request);
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Service Worker clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});