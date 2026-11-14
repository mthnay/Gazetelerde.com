// Gazetelerde service worker: yalnızca bildirimler (önbellekleme yapmaz)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

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
