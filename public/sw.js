// Service worker minimal: syarat Chrome buat nawarin "Install app".
// Semua request tetap lewat network, ngga ada cache biar scraper selalu fresh.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
