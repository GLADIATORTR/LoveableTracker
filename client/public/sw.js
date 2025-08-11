const CACHE_NAME = 're-tracker-v1';
const STATIC_CACHE = 're-tracker-static-v1';
const DYNAMIC_CACHE = 're-tracker-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/investments',
  '/api/categories',
  '/api/dashboard/stats',
  '/api/activities'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE &&
              cacheName.startsWith('re-tracker')
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  if (request.method === 'GET') {
    try {
      // Try network first
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Cache successful responses
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
  }
  
  // For non-GET requests or when offline, return appropriate response
  if (!navigator.onLine && request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Offline - changes will sync when online' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return fetch(request);
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If it's a navigation request, return the cached index.html
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Get pending actions from IndexedDB and sync them
  // This would be implemented based on your offline storage strategy
  console.log('Syncing offline actions...');
}

// Push notifications (for future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'investment-update'
      })
    );
  }
});