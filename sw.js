// Service Worker for Code_d_Code Website
// Enhanced Performance and Offline Capabilities

const CACHE_NAME = 'codedcode-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/pages/about.html',
    '/pages/courses.html',
    '/pages/events.html',
    '/pages/membership.html',
    '/pages/contact.html',
    '/styles/main.css',
    '/scripts/main.js',
    '/Images/Code_D_Code Logo.png',
    '/site.webmanifest',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Event - Cache Static Resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static resources');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch Event - Serve from cache with network fallback
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.startsWith('https://cdn.jsdelivr.net') &&
        !event.request.url.startsWith('https://cdnjs.cloudflare.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response for caching
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
            .catch(() => {
                // Fallback for offline scenarios
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
                if (event.request.destination === 'image') {
                    return caches.match('/Images/Code_D_Code Logo.png');
                }
            })
    );
});

// Background Sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Handle offline form submissions when connection is restored
    return new Promise((resolve, reject) => {
        // Implement your background sync logic here
        console.log('Background sync triggered');
        resolve();
    });
}

// Push Notifications (for future implementation)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/Images/Code_D_Code Logo.png',
            badge: '/Images/Code_D_Code Logo.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Explore',
                    icon: '/Images/Code_D_Code Logo.png'
                },
                {
                    action: 'close',
                    title: 'Close',
                    icon: '/Images/Code_D_Code Logo.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('https://www.codedcode.tech')
        );
    }
});
