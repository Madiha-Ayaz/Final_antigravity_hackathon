// Service Worker for SilentSiren PWA - Enhanced for Mobile App
const CACHE_NAME = 'silentsiren-v2';
const STATIC_CACHE = 'silentsiren-static-v2';
const DYNAMIC_CACHE = 'silentsiren-dynamic-v2';

// Only cache static assets and the shell — dynamic Next.js pages are cached on first visit
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API requests - network only
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets - cache first
  if (
    event.request.url.includes('/_next/static/') ||
    event.request.url.includes('/icon') ||
    event.request.url.includes('.png') ||
    event.request.url.includes('.svg') ||
    event.request.url.includes('.css')
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request).then((networkResponse) => {
          const cache = caches.open(STATIC_CACHE);
          cache.then((c) => c.put(event.request, networkResponse.clone()));
          return networkResponse;
        });
      })
    );
    return;
  }

  // Pages - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) return response;
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Push notification event - Emergency alerts
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 Emergency Alert';
  const options = {
    body: data.body || 'Emergency detected - SilentSiren AI',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'emergency-alert',
    requireInteraction: true,
    actions: [
      { action: 'view', title: '🚨 View Emergency' },
      { action: 'safe', title: '✅ I am Safe' },
    ],
    data: {
      url: data.url || '/crisis',
      timestamp: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'safe') {
    // Send "I am safe" signal
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'I_AM_SAFE' });
        });
      })
    );
    return;
  }

  // Open the emergency page
  const urlToOpen = data?.url || '/crisis';

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// Background sync for offline alerts
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-alert') {
    event.waitUntil(
      // Retry sending emergency alerts when back online
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'RETRY_ALERT' });
        });
      })
    );
  }
});

// Periodic background sync for monitoring (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'monitor-check') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length === 0) {
          // App is in background, check for emergencies
          self.clients.openWindow('/monitor');
        }
      })
    );
  }
});
