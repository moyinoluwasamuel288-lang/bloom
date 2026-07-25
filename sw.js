const CACHE_NAME = 'bloom-v2.1-cache';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/core/SafeStorage.js',
  './src/core/CycleEngine.js',
  './src/core/CalendarEngine.js',
  './src/core/TaskEngine.js',
  './src/core/Storage.js',
  './src/core/RewardEngine.js',
  './src/core/NotificationManager.js',
  './src/views/TodayView.js',
  './src/views/CalendarView.js',
  './src/views/InsightsView.js',
  './src/views/GardenView.js',
  './src/views/SettingsView.js',
  './src/components/CheckInModal.js',
  './src/components/Toast.js',
  './src/components/ConfirmDialog.js',
  './src/components/WelcomeGate.js',
  './src/styles/tokens.css',
  './src/styles/themes.css',
  './src/styles/base.css',
  './src/styles/animations.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.warn('Bloom SW: precache failed', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match('./index.html'));

      return cached || networkFetch;
    })
  );
});

// Clicking a reminder notification focuses/opens the app on the Today screen.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
