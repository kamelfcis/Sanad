/* eslint-disable no-restricted-globals */
// PWA shell cache + Web Push (registered from PwaShell / usePushNotifications).

const CACHE_VERSION =
  typeof self !== 'undefined' && self.__BUILD_ID__
    ? `sanad-shell-${self.__BUILD_ID__}`
    : 'sanad-shell-v2';
const SHELL_URLS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/sounds/alert-loud.wav',
  '/sounds/notification.wav',
];

const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>سند — غير متصل</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fafafa; color: #0f172a; padding: 1.5rem; text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #475569; line-height: 1.6; }
  </style>
</head>
<body>
  <div>
    <h1>أنت غير متصل بالإنترنت</h1>
    <p>تحقق من الشبكة وحاول مرة أخرى.<br />You are offline. Check your connection and retry.</p>
  </div>
</body>
</html>`;

const LOUD_PUSH_TYPES = new Set(['booking_assigned', 'booking_accepted', 'booking_completed']);

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

function shouldNeverCache(url) {
  return url.pathname.startsWith('/api/') || url.pathname.includes('/auth/');
}

function offlineResponse() {
  return new Response(OFFLINE_FALLBACK_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function resolveOfflineNavigation() {
  const offline = await caches.match('/offline');
  if (offline) return offline;
  const home = await caches.match('/');
  if (home) return home;
  return offlineResponse();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldNeverCache(url)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => resolveOfflineNavigation()),
    );
    return;
  }

  if (SHELL_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {
    title: 'Sanad',
    message: '',
    url: '/',
    notificationId: '',
    type: '',
    alert: false,
  };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.message = event.data.text();
  }

  const loud =
    payload.alert === true ||
    (payload.type && LOUD_PUSH_TYPES.has(payload.type));

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.message,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      silent: !loud,
      vibrate: loud ? [250, 120, 250, 120, 300] : undefined,
      data: {
        url: payload.url,
        notificationId: payload.notificationId,
        sound: '/sounds/alert-loud.wav',
      },
      tag: payload.notificationId || undefined,
      renotify: loud,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          if ('navigate' in client) {
            return client.navigate(url).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    }),
  );
});
