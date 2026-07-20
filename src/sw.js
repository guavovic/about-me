// service worker
const CACHE = 'guavovic-v14';

const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/config.js',
    './js/now-playing.js',
    './js/button-animations.js',
    './js/background-parallax.js',
    './js/tilt.js',
    './js/local-time.js',
    './js/weather.js',
    './js/cursor.js',
    './js/favicon.js',
    './js/greeting.js',
    './js/confetti.js',
    './js/easter-egg.js',
    './js/anniversary.js',
    './js/offline.js',
    './js/console-msg.js',
    './js/tab-title.js',

    './js/seasonal.js',
    './js/flappy.js',
    './js/dino.js',
    './js/osu-mania.js',
    './images/profile.jpg',
    './images/favicon.png',
    './images/poster.jpg',
    './images/icons/linkedin.png',
    './images/icons/github.png',
    './images/icons/instagram.png',
    './images/icons/lastfm.png',
    './images/icons/email.png',
    './videos/dj-dachshund-background.mp4'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Só lida com GET do mesmo domínio. Chamadas à API do Last.fm passam direto
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
        return;
    }

    // config.js muda com frequência (edições pessoais): sempre da rede primeiro, caindo pro cache só se estiver offline
    if (req.url.includes('/config.js')) {
        event.respondWith(
            fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((cache) => cache.put(req, copy));
                return res;
            }).catch(() => caches.match(req))
        );
        return;
    }

    // cache-first para os demais assets, com atualização em segundo plano
    event.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req).then((res) => {
                if (res && res.status === 200) {
                    const copy = res.clone();
                    caches.open(CACHE).then((cache) => cache.put(req, copy));
                }
                return res;
            }).catch(() => cached);

            return cached || network;
        })
    );
});
