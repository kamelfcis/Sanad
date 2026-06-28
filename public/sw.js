/* eslint-disable no-restricted-globals */
// Service worker for browser Web Push notifications.
// Registered from usePushNotifications hook.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = { title: 'Sanad', message: '', url: '/', notificationId: '' };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.message = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: payload.url, notificationId: payload.notificationId },
      tag: payload.notificationId || undefined,
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
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    }),
  );
});
