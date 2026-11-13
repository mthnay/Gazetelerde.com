"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FilePlus, ExternalLink, EyeOff, Undo2, RefreshCw } from 'lucide-react';

const when = (d) => d ? new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function FeedInbox({ items, status, hasSources }) {
    const router = useRouter();
    const [busy, setBusy] = useState(null);
    const [msg, setMsg] = useState(null);

    const setStatus = async (id, s) => {
        setBusy(id);
        await fetch(`/api/admin/feed-items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) }).catch(() => null);
        setBusy(null);
        router.refresh();
    };

    const runNow = async () => {
        setBusy('run'); setMsg(null);
        const d = await fetch('/api/admin/feeds/run', { method: 'POST' }).then((r) => r.json()).catch(() => null);
        setBusy(null);
        if (!d?.success) return setMsg({ type: 'error', text: 'Tarama başarısız.' });
        if (d.throttled) return setMsg({ type: 'error', text: 'Çok sık tarama istendi; birkaç dakika sonra tekrar deneyin.' });
        const added = d.results.reduce((n, r) => n + (r.added || 0), 0);
        const errors = d.results.filter((r) => r.error).length;
        setMsg({ type: errors ? 'error' : 'success', text: `${d.results.length} kaynak tarandı, ${added} yeni haber.${errors ? ` ${errors} kaynakta hata var (Kaynaklar sekmesine bakın).` : ''}` });
        router.refresh();
    };

    const draftHref = (i) => {
        const p = new URLSearchParams({ kaynak: i.link, baslik: i.title, ozet: i.summary.slice(0, 480), oge: String(i.id) });
        if (i.image) p.set('gorsel', i.image);
        if (i.category) p.set('kategori', i.category);
        return `/admin/haberler/yeni?${p}`;
    };

    return (
        <>
            <div className="admin-toolbar">
                <span className="hint" style={{ color: 'var(--muted)', fontSize: 13 }}>Kaynaklar 30 dakikada bir otomatik taranır.</span>
                <button className="admin-btn" onClick={runNow} disabled={busy === 'run' || !hasSources}>
                    <RefreshCw size={15} className={busy === 'run' ? 'spin' : ''} /> Şimdi tara
                </button>
            </div>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            {!hasSources ? (
                <div className="admin-panel admin-empty">
                    Henüz kaynak eklenmemiş. <Link href="/admin/icerik-cek?sekme=kaynaklar" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'underline' }}>Kaynaklar</Link> sekmesinden bir RSS adresi ekleyin.
                </div>
            ) : items.length === 0 ? (
                <div className="admin-panel admin-empty">{status === 'NEW' ? 'Gelen kutusu boş. Yeni haberler tarandıkça burada görünecek.' : 'Bu listede öğe yok.'}</div>
            ) : (
                <div className="admin-panel" style={{ padding: 0 }}>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead><tr><th></th><th>Başlık</th><th>Kaynak</th><th>Tarih</th><th></th></tr></thead>
                            <tbody>
                                {items.map((i) => (
                                    <tr key={i.id} style={{ opacity: i.status === 'IGNORED' ? 0.55 : 1 }}>
                                        <td style={{ width: 84 }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {i.image ? <img src={i.image} alt="" loading="lazy" style={{ width: 72, height: 46, objectFit: 'cover', borderRadius: 6 }} /> : null}
                                        </td>
                                        <td className="title-cell">
                                            {i.title}
                                            {i.summary && <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--muted)', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{i.summary}</div>}
                                            {i.article && <div style={{ fontSize: 12, marginTop: 4 }}>→ <Link href={`/admin/haberler/${i.article.id}`} style={{ textDecoration: 'underline' }}>Taslağa git</Link></div>}
                                        </td>
                                        <td className="muted">{i.sourceName}</td>
                                        <td className="muted">{when(i.publishedAt || i.createdAt)}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <a href={i.link} target="_blank" rel="noopener noreferrer" className="admin-icon-btn" title="Kaynağı aç" aria-label="Kaynağı aç"><ExternalLink size={15} /></a>
                                                {i.status === 'NEW' && (
                                                    <>
                                                        <button className="admin-icon-btn" title="Yok say" aria-label="Yok say" disabled={busy === i.id} onClick={() => setStatus(i.id, 'IGNORED')}><EyeOff size={15} /></button>
                                                        <Link className="admin-btn primary" href={draftHref(i)}><FilePlus size={15} /> Taslak oluştur</Link>
                                                    </>
                                                )}
                                                {i.status === 'IGNORED' && (
                                                    <button className="admin-btn" disabled={busy === i.id} onClick={() => setStatus(i.id, 'NEW')}><Undo2 size={15} /> Geri al</button>
                                                )}
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
