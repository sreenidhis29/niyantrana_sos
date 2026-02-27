self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // Simple pass-through
    e.respondWith(fetch(e.request));
});

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data?.text()}"`);

    let title = 'Niyantrana Alert';
    let options = {
        body: 'Emergency Broadcast! Click to open Victim Portal.',
        icon: '/marker-icon-2x-black.png', // Ideally should be a proper icon
        badge: '/marker-icon-2x-violet.png',
        data: {
            url: '/victim'
        }
    };

    if (event.data) {
        try {
            const data = event.data.json();
            if (data.title) title = data.title;
            if (data.message) options.body = data.message;
            if (data.url) options.data.url = data.url;
        } catch (e) {
            options.body = event.data.text();
        }
    }

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click received.');

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/victim';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
