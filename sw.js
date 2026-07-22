const CACHE = 'bloom-cache-v2';
const FILES = [
  './', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './src/styles/tokens.css', './src/styles/components.css',
  './src/app/main.js', './src/app/render.js', './src/app/events.js', './src/app/actions.js', './src/app/state.js',
  './src/data/themes.js', './src/data/tasks.js', './src/data/reminders.js',
  './src/services/storage.js',
  './src/features/cycle/dateUtils.js', './src/features/cycle/cycleEngine.js',
  './src/features/bloom/gamification.js',
  './src/features/notifications/notifications.js',
  './src/components/header.js', './src/components/heroCard.js', './src/components/statsRow.js',
  './src/components/xpSection.js', './src/components/taskList.js', './src/components/gardenSection.js',
  './src/components/badgeRow.js', './src/components/historySection.js', './src/components/reminderCard.js',
  './src/components/modals.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
