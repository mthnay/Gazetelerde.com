"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

export default function NotificationBell() {
    const pathname = usePathname();
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Sayfa değiştikçe ve 2 dakikada bir yenile
    useEffect(() => {
        let alive = true;
        const load = () => fetch('/api/notifications')
            .then((r) => r.json())
            .then((d) => { if (alive && d.success) setData(d); })
            .catch(() => { });
        load();
        const t = setInterval(load, 120000);
        return () => { alive = false; clearInterval(t); };
    }, [pathname]);

    // Dışarı tıklayınca / Esc ile kapan
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
    }, [open]);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && data?.unread) {
            fetch('/api/notifications/seen', { method: 'POST' }).catch(() => { });
            setData({ ...data, unread: 0 }); // "yeni" işaretleri bu açılışta görünmeye devam eder
        }
    };

    const unread = data?.unread ?? 0;

    return (
        <div className="notif" ref={ref}>
            <button
                className="icon-btn"
                onClick={toggle}
                aria-label={unread ? `Bildirimler, ${unread} yeni` : 'Bildirimler'}
                aria-expanded={open}
            >
                <Bell size={18} />
                {unread > 0 && <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>}
            </button>

            {open && (
                <div className="notif-panel" role="dialog" aria-label="Bildirimler">
                    <div className="notif-head"><span className="kicker">Takip ettiğin kategoriler</span></div>
                    {!data || data.following === 0 ? (
                        <p className="notif-empty">
                            Henüz bir kategori takip etmiyorsun. Kategori sayfalarındaki <strong>Takip et</strong> butonuyla yeni haberlerden haberdar ol.
                        </p>
                    ) : data.items.length === 0 ? (
                        <p className="notif-empty">Takip ettiğin kategorilerde henüz haber yok.</p>
                    ) : (
                        <ul>
                            {data.items.map((n) => (
                                <li key={n.id}>
                                    <Link href={`/haber/${n.slug}`} onClick={() => setOpen(false)} className={n.isNew ? 'is-new' : ''}>
                                        <span className="notif-meta">{n.category} · {formatShortDate(n.publishedAt)}{n.isNew && <b> · Yeni</b>}</span>
                                        <span className="notif-title">{n.title}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Link href="/profile?sekme=takip" className="notif-foot" onClick={() => setOpen(false)}>Takip ettiklerimi yönet</Link>
                </div>
            )}
        </div>
    );
}
