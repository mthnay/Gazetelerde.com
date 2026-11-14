"use client";
import { useEffect, useState } from 'react';

// Service worker önbelleğindeki haber sayfaları (başlıkları sayfanın kendisinden okunur)
export default function OfflineList() {
    const [items, setItems] = useState(null);
    useEffect(() => {
        const back = () => location.reload();
        window.addEventListener('online', back);
        (async () => {
            try {
                const cache = await caches.open('gz-sayfalar-v1');
                const reqs = (await cache.keys()).filter((r) => new URL(r.url).pathname.startsWith('/haber/'));
                const list = await Promise.all(reqs.slice(-30).reverse().map(async (r) => {
                    const html = await (await cache.match(r)).text();
                    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/ \| Gazetelerde$/, '') || new URL(r.url).pathname;
                    return { url: new URL(r.url).pathname, title: title.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"') };
                }));
                setItems(list);
            } catch { setItems([]); }
        })();
        return () => window.removeEventListener('online', back);
    }, []);
    if (!items) return null;
    if (!items.length) return <p className="field-hint">Henüz çevrimdışı okunabilecek haber yok. Okuduğunuz haberler burada birikir.</p>;
    return (
        <ul className="offline-list">
            {/* Önbellekteki tam sayfaya gitmek için düz bağlantı (istemci yönlendirmesi ağ ister) */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            {items.map((i) => <li key={i.url}><a href={i.url}>{i.title}</a></li>)}
        </ul>
    );
}
