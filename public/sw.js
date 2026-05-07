self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'AI Digest', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';
  event.waitUntil(clients.openWindow(url));
});
