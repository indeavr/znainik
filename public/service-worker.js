// This service worker handles push notifications

self.addEventListener('push', function(event) {
  console.log('Push event received!', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
      const options = {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'znainik-notification', // Add a tag to group notifications
        requireInteraction: true, // Make notification persist until user interacts with it
        data: {
          url: data.url || self.registration.scope
        },
        timestamp: data.timestamp || Date.now(),
        actions: [
          {
            action: 'open',
            title: 'Open'
          }
        ]
      };
      
      console.log('Showing notification with options:', options);
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
          .then(() => console.log('Notification shown successfully'))
          .catch(err => {
            console.error('Error showing notification:', err);
            // Try a simpler notification as fallback
            return self.registration.showNotification('New notification', {
              body: 'You have a new notification'
            });
          })
      );
    } catch (e) {
      console.error('Error processing push data:', e);
      // Try to show a generic notification
      event.waitUntil(
        self.registration.showNotification('New notification', {
          body: 'You have a new notification'
        })
      );
    }
  } else {
    console.log('Push event has no data');
    // Show a generic notification
    event.waitUntil(
      self.registration.showNotification('New notification', {
        body: 'You have a new notification'
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  console.log('Opening URL:', url);
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  return self.clients.claim();
});