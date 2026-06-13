const CACHE = 'prozess-tracker-v1';

const SHELL = [
    './',
    './index.html',
    './manifest.json',
    './style.css',
    './styles/header.css',
    './pages/header.html',
    './js/app.js',
    './js/dialog.js',
    './js/dragdrop.js',
    './js/firebase.js',
    './js/notifications.js',
    './img/logo-cyber-d20.png',
    './img/icons/plus-icon.svg',
    './img/icons/bin-icon.svg',
    './img/icons/speech-bubble.svg',
    './img/icons/drag-handle.svg',
    './img/icons/inbox.svg',
    './img/icons/gear.svg',
    './img/icons/truck.svg',
    './img/icons/checkmark.svg',
    './img/icons/printer.svg',
    './assets/fonts/Figtree-ExtraBold.ttf',
    './assets/fonts/Figtree-Regular.ttf',
    './assets/fonts/Figtree-Light.ttf',
    './assets/fonts/Figtree-Medium.ttf',
    './assets/fonts/Figtree-SemiBold.ttf',
    './assets/fonts/Figtree-Bold.ttf',
    './assets/fonts/EncodeSansSemiExpanded-Regular.ttf',
    './assets/fonts/EncodeSansSemiExpanded-Bold.ttf'
];

async function precacheShell() {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map((url) => cache.add(url)));
}

async function removeOldCaches() {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
        throw err;
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(removeOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    if (new URL(request.url).origin !== self.location.origin) return;
    event.respondWith(cacheFirst(request));
});
