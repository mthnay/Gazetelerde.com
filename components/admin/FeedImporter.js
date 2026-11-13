"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rss, FilePlus, ExternalLink, X } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

const STORAGE_KEY = 'admin:feeds';

export default function FeedImporter() {
    const [url, setUrl] = useState('');
    const [saved, setSaved] = useState([]);
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Son kullanılan akışlar bu tarayıcıda hatırlanır
    useEffect(() => {
        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSaved(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
        } catch { /* yoksay */ }
    }, []);

    const remember = (list) => {
        setSaved(list);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* yoksay */ }
    };

    const load = async (feedUrl = url) => {
        const u = feedUrl.trim();
        if (!u) return;
        setUrl(u);
        setLoading(true);
        setError('');
        setItems([]);
        const res = await fetch('/api/automation', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setLoading(false);
        if (!data?.success) return setError(data?.error || 'Akış okunamadı.');
        if (!data.items.length) return setError('Bu adreste haber bulunamadı. Bir RSS/Atom akışı olduğundan emin olun.');
        setItems(data.items);
        if (!saved.includes(u)) remember([u, ...saved].slice(0, 8));
    };

    const safeDate = (d) => {
        const t = new Date(d);
        return Number.isNaN(t.getTime()) ? '' : formatShortDate(t);
    };

    return (
        <>
            <div className="admin-panel" style={{ marginBottom: 16 }}>
                <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 8 }}>
                    <input className="admin-input" type="url" placeholder="https://ornek.com/rss" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Akış adresi" required />
                    <button className="admin-btn primary" disabled={loading}><Rss size={16} /> {loading ? 'Okunuyor…' : 'Getir'}</button>
                </form>
                {saved.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        {saved.map((s) => (
                            <span key={s} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                <button type="button" onClick={() => load(s)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                                    {s.replace(/^https?:\/\//, '').slice(0, 40)}
                                </button>
                                <button type="button" aria-label="Listeden çıkar" onClick={() => remember(saved.filter((x) => x !== s))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <p className="hint" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
                    Not: Başka sitelerin içeriğini birebir kopyalamak telif sorunu doğurabilir. Taslağı kendi cümlelerinizle yeniden yazıp kaynağı belirtin.
                </p>
            </div>

            {error && <div className="admin-msg error">{error}</div>}

            {items.length > 0 && (
                <div className="admin-panel" style={{ padding: 0 }}>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead><tr><th></th><th>Başlık</th><th>Tarih</th><th></th></tr></thead>
                            <tbody>
                                {items.map((it, i) => (
                                    <tr key={`${it.link}-${i}`}>
                                        <td style={{ width: 72 }}>
                                            {it.image ? <img src={it.image} alt="" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : null}
                                        </td>
                                        <td className="title-cell">{it.title}</td>
                                        <td className="muted">{safeDate(it.pubDate)}</td>
                                        <td>
                                            <div className="admin-actions">
                                                {it.link && (
                                                    <a href={it.link} target="_blank" rel="noopener noreferrer" className="admin-icon-btn" title="Kaynağı aç" aria-label="Kaynağı aç">
                                                        <ExternalLink size={15} />
                                                    </a>
                                                )}
                                                <Link
                                                    className="admin-btn"
                                                    href={`/admin/haberler/yeni?kaynak=${encodeURIComponent(it.link || '')}&baslik=${encodeURIComponent(it.title || '')}`}
                                                >
                                                    <FilePlus size={15} /> Taslak oluştur
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
