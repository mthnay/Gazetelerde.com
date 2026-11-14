// Gazetelerde service worker
// - Bildirimler (push)
// - Çevrimdışı okuma: ziyaret edilen sayfalar önbelleğe alınır (önce ağ, ağ yoksa önbellek)
// - Statik dosyalar (JS/CSS/yazı tipi) ve görseller: önce önbellek
// Yönetim paneli ve API istekleri asla önbelleğe alınmaz.
const PAGES = 'gz-sayfalar-v1';
const ASSETS = 'gz-dosyalar-v1';
const MEDIA = 'gz-gorseller-v1';
const OFFLINE = '/cevrimdisi';
const MAX_PAGES = 60, MAX_MEDIA = 150;

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(PAGES).then((c) => c.add(new Request(OFFLINE, { cache: 'reload' }))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    const keep = [PAGES, ASSETS, MEDIA];
    event.waitUntil((async () => {
        for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
        if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
        await self.clients.claim();
    })());
});

async function trim(name, max) {
    const c = await caches.open(name);
    const keys = await c.keys();
    for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/login') || url.searchParams.has('_rsc')) return;

    // Sayfalar: önce ağ (3 sn zaman aşımı), olmazsa önbellek, o da yoksa çevrimdışı sayfası
    if (req.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const preload = await event.preloadResponse;
                const res = preload || await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('zaman aşımı')), 3000))]);
                if (res.ok && !url.pathname.startsWith('/profile')) {
                    const copy = res.clone();
                    event.waitUntil(caches.open(PAGES).then((c) => c.put(url.pathname, copy)).then(() => trim(PAGES, MAX_PAGES)));
                }
                return res;
            } catch {
                return (await caches.match(url.pathname)) || (await caches.match(OFFLINE)) || Response.error();
            }
        })());
        return;
    }

    // Derlenmiş dosyalar (adları içerik özeti taşır, değişmez): önce önbellek
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
            if (res.ok) { const copy = res.clone(); caches.open(ASSETS).then((c) => c.put(req, copy)); }
            return res;
        })));
        return;
    }

    // Görseller: önbellekte varsa hemen, arkada tazele
    if (url.pathname.startsWith('/media/') || url.pathname.startsWith('/_next/image')) {
        event.respondWith((async () => {
            const cache = await caches.open(MEDIA);
            const hit = await cache.match(req);
            const net = fetch(req).then((res) => { if (res.ok) { cache.put(req, res.clone()); trim(MEDIA, MAX_MEDIA); } return res; }).catch(() => hit);
            return hit || net;
        })());
    }
});

// ---------------------------------------------------------------- Bildirimler
self.addEventListener('push', (event) => {
    let d = {};
    try { d = event.data ? event.data.json() : {}; } catch { d = { title: 'Gazetelerde', body: event.data?.text() }; }
    event.waitUntil(self.registration.showNotification(d.title || 'Gazetelerde', {
        body: d.body || '',
        icon: '/icon',
        badge: '/icon',
        tag: d.tag,
        renotify: Boolean(d.tag),
        data: { url: d.url || '/' },
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const raw = event.notification.data?.url || '/';
    const url = new URL(raw, self.location.origin);
    url.searchParams.set('utm_source', 'push');
    event.waitUntil((async () => {
        const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const w of wins) {
            if (new URL(w.url).origin === url.origin && 'focus' in w) { await w.navigate(url.href).catch(() => {}); return w.focus(); }
        }
        return self.clients.openWindow(url.href);
    })());
});
