// This service worker handles push notifications

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          url: self.registration.scope
        },
        timestamp: data.timestamp || Date.now()
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      console.error('Error showing notification:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  return self.clients.claim();
});