"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUp, ArrowDown, X, Send, Clock, FlaskConical, Trash2, Ban, RefreshCw, Search } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

const STATUS = { DRAFT: 'Taslak', SCHEDULED: 'Zamanlandı', SENDING: 'Gönderiliyor', SENT: 'Gönderildi', CANCELLED: 'İptal edildi' };
const toLocalInput = (d) => {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
};

async function api(url, method = 'GET', body) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    const data = await res?.json().catch(() => null);
    return data || { success: false, message: 'Sunucuya ulaşılamadı.' };
}

export default function NewsletterEditor({ initial, meEmail, recipients }) {
    const router = useRouter();
    const [issue, setIssue] = useState(initial);
    const [articles, setArticles] = useState({}); // id -> kart bilgisi
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [saving, setSaving] = useState('saved');
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const [testTo, setTestTo] = useState(meEmail);
    const [when, setWhen] = useState(() => toLocalInput(initial.scheduledAt || Date.now() + 60 * 60 * 1000));
    const [previewKey, setPreviewKey] = useState(0);
    const [previewHtml, setPreviewHtml] = useState('');
    const editable = issue.status === 'DRAFT' || issue.status === 'SCHEDULED';
    const timer = useRef(null);

    // Seçili haberlerin bilgileri
    useEffect(() => {
        if (!initial.articleIds.length) return;
        api(`/api/admin/newsletters/articles?ids=${initial.articleIds.join(',')}`).then((d) => {
            if (d.articles) setArticles((m) => ({ ...m, ...Object.fromEntries(d.articles.map((a) => [a.id, a])) }));
        });
    }, [initial.articleIds]);

    // Önizleme HTML'i (kayıttan sonra yenilenir)
    useEffect(() => {
        let alive = true;
        fetch(`/api/admin/newsletters/${initial.id}/preview`, { cache: 'no-store' })
            .then((r) => r.text()).then((h) => { if (alive) setPreviewHtml(h); }).catch(() => {});
        return () => { alive = false; };
    }, [initial.id, previewKey]);

    // Haber arama (300 ms gecikmeli)
    useEffect(() => {
        const t = setTimeout(() => {
            api(`/api/admin/newsletters/articles?q=${encodeURIComponent(q)}`).then((d) => {
                setResults(d.articles || []);
                if (d.articles) setArticles((m) => ({ ...m, ...Object.fromEntries(d.articles.map((a) => [a.id, a])) }));
            });
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    // Otomatik kaydetme
    const save = useCallback(async (next) => {
        setSaving('saving');
        const d = await api(`/api/admin/newsletters/${next.id}`, 'PATCH', {
            subject: next.subject, preheader: next.preheader, intro: next.intro, articleIds: next.articleIds,
        });
        setSaving(d.success ? 'saved' : 'error');
        if (!d.success) setMsg({ type: 'error', text: d.message });
        else setPreviewKey((k) => k + 1);
    }, []);

    const update = (patch) => {
        const next = { ...issue, ...patch };
        setIssue(next);
        setSaving('dirty');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => save(next), 700);
    };
    useEffect(() => () => clearTimeout(timer.current), []);

    const flush = async () => {
        if (saving === 'dirty') { clearTimeout(timer.current); await save(issue); }
    };

    const move = (i, dir) => {
        const ids = [...issue.articleIds];
        const j = i + dir;
        if (j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        update({ articleIds: ids });
    };

    const action = async (body, confirmText) => {
        if (confirmText && !confirm(confirmText)) return;
        await flush();
        setBusy(true); setMsg(null);
        const d = await api(`/api/admin/newsletters/${issue.id}/action`, 'POST', body);
        setBusy(false);
        setMsg({ type: d.success ? 'success' : 'error', text: d.message || (d.success ? 'Tamam.' : 'İşlem başarısız.') });
        if (d.success && body.action !== 'test') router.refresh();
    };

    // Sunucudaki durum değişince (router.refresh) yerel durumu güncelle
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIssue((x) => ({ ...x, status: initial.status, scheduledAt: initial.scheduledAt, sentAt: initial.sentAt, recipients: initial.recipients, sentCount: initial.sentCount, failedCount: initial.failedCount }));
    }, [initial.status, initial.scheduledAt, initial.sentAt, initial.recipients, initial.sentCount, initial.failedCount]);

    // Gönderim sürerken ilerlemeyi her 5 sn'de bir tazele
    useEffect(() => {
        if (issue.status !== 'SENDING' && issue.status !== 'SCHEDULED') return;
        const t = setInterval(() => router.refresh(), 5000);
        return () => clearInterval(t);
    }, [issue.status, router]);

    const remove = async () => {
        if (!confirm('Bu bülten silinsin mi?')) return;
        const d = await api(`/api/admin/newsletters/${issue.id}`, 'DELETE');
        if (d.success) router.push('/admin/bulten');
        else setMsg({ type: 'error', text: d.message });
    };

    const pct = issue.recipients ? Math.round(((issue.sentCount + issue.failedCount) / issue.recipients) * 100) : 0;

    return (
        <>
            <header className="admin-header">
                <div>
                    <Link href="/admin/bulten" className="hint" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><ArrowLeft size={14} /> Bültenler</Link>
                    <h1>{issue.subject || 'Bülten'}</h1>
                    <p>
                        <span className="badge">{STATUS[issue.status]}</span>{' '}
                        {editable && <span className="hint">{saving === 'saving' ? 'Kaydediliyor…' : saving === 'dirty' ? 'Değişiklikler kaydedilecek' : saving === 'error' ? 'Kaydedilemedi' : 'Kaydedildi'}</span>}
                    </p>
                </div>
                {(issue.status === 'DRAFT' || issue.status === 'CANCELLED') && (
                    <button type="button" className="admin-btn danger" onClick={remove}><Trash2 size={15} /> Sil</button>
                )}
            </header>

            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            <div className="nl-editor">
                <div style={{ display: 'grid', gap: 16 }}>
                    {(issue.status === 'SENDING' || issue.status === 'SENT' || issue.status === 'CANCELLED') && issue.recipients > 0 && (
                        <section className="admin-panel nl-send">
                            <strong>Gönderim</strong>
                            <div className="nl-progress" aria-label={`%${pct} tamamlandı`}><span style={{ width: `${pct}%` }} /></div>
                            <span className="hint">{issue.sentCount} / {issue.recipients} gönderildi{issue.failedCount ? ` · ${issue.failedCount} başarısız` : ''}{issue.sentAt ? ` · ${formatShortDate(issue.sentAt)}` : ''}</span>
                            {issue.status === 'SENDING' && <button type="button" className="admin-btn danger" onClick={() => action({ action: 'cancel' }, 'Gönderim durdurulsun mu? Giden e-postalar geri alınamaz.')} disabled={busy}><Ban size={15} /> Gönderimi durdur</button>}
                        </section>
                    )}

                    <section className="admin-panel">
                        <label className="admin-field"><span>Konu</span>
                            <input className="admin-input" value={issue.subject} maxLength={150} disabled={!editable} onChange={(e) => update({ subject: e.target.value })} />
                        </label>
                        <label className="admin-field"><span>Ön metin <small className="hint">(gelen kutusunda konunun yanında görünür)</small></span>
                            <input className="admin-input" value={issue.preheader} maxLength={200} disabled={!editable} onChange={(e) => update({ preheader: e.target.value })} />
                        </label>
                        <label className="admin-field"><span>Giriş yazısı</span>
                            <textarea className="admin-textarea" rows={4} value={issue.intro} maxLength={2000} disabled={!editable} onChange={(e) => update({ intro: e.target.value })} />
                        </label>
                    </section>

                    <section className="admin-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <strong>Haberler ({issue.articleIds.length}/12)</strong>
                            <span className="hint">İlk haber manşet olarak büyük görünür.</span>
                        </div>
                        {!issue.articleIds.length ? <p className="hint">Aşağıdan haber ekleyin.</p> : (
                            <ol className="nl-picked">
                                {issue.articleIds.map((id, i) => {
                                    const a = articles[id];
                                    return (
                                        <li key={id}>
                                            <span className="n">{i + 1}</span>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {a?.image ? <img src={a.image} alt="" /> : <img alt="" />}
                                            <span className="t">{a?.title || `#${id}`}<small>{a?.category}</small></span>
                                            {editable && <>
                                                <button type="button" className="admin-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı"><ArrowUp size={14} /></button>
                                                <button type="button" className="admin-icon-btn" onClick={() => move(i, 1)} disabled={i === issue.articleIds.length - 1} aria-label="Aşağı taşı"><ArrowDown size={14} /></button>
                                                <button type="button" className="admin-icon-btn danger" onClick={() => update({ articleIds: issue.articleIds.filter((x) => x !== id) })} aria-label="Çıkar"><X size={14} /></button>
                                            </>}
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                        {editable && issue.articleIds.length < 12 && (
                            <div style={{ marginTop: 14 }}>
                                <div className="admin-search" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Search size={15} />
                                    <input className="admin-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Haber ara (boşsa en yeniler)…" aria-label="Haber ara" />
                                </div>
                                <div className="nl-results">
                                    {results.filter((a) => !issue.articleIds.includes(a.id)).map((a) => (
                                        <button type="button" key={a.id} onClick={() => update({ articleIds: [...issue.articleIds, a.id] })}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {a.image ? <img src={a.image} alt="" /> : <img alt="" />}
                                            <span className="t">{a.title}<small>{a.category} · {formatShortDate(a.publishedAt)} · {a.views} okunma</small></span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {editable && (
                        <section className="admin-panel nl-send">
                            <strong>Test e-postası</strong>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input className="admin-input" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} aria-label="Test adresi" />
                                <button type="button" className="admin-btn" onClick={() => action({ action: 'test', to: testTo })} disabled={busy}><FlaskConical size={15} /> Gönder</button>
                            </div>

                            <strong style={{ marginTop: 8 }}>Gönder</strong>
                            <span className="hint">{recipients} onaylı aboneye gidecek.</span>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button type="button" className="admin-btn primary" disabled={busy || !issue.articleIds.length || !recipients}
                                    onClick={() => action({ action: 'send' }, `Bülten şimdi ${recipients} aboneye gönderilsin mi?`)}><Send size={15} /> Şimdi gönder</button>
                                <input className="admin-input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={{ width: 'auto' }} aria-label="Gönderim zamanı" />
                                <button type="button" className="admin-btn" disabled={busy || !issue.articleIds.length}
                                    onClick={() => action({ action: 'schedule', scheduledAt: new Date(when).toISOString() })}><Clock size={15} /> Zamanla</button>
                            </div>
                            {issue.status === 'SCHEDULED' && (
                                <p className="hint">
                                    {formatShortDate(issue.scheduledAt)} için zamanlandı.{' '}
                                    <button type="button" className="admin-btn" onClick={() => action({ action: 'cancel' })} disabled={busy}>Zamanlamayı kaldır</button>
                                </p>
                            )}
                        </section>
                    )}
                </div>

                <section className="admin-panel nl-preview">
                    <div className="nl-preview-bar">
                        <strong>E-posta önizlemesi</strong>
                        <button type="button" className="admin-icon-btn" onClick={() => setPreviewKey((k) => k + 1)} aria-label="Önizlemeyi yenile"><RefreshCw size={14} /></button>
                    </div>
                    <iframe title="Bülten önizlemesi" srcDoc={previewHtml} sandbox="allow-popups allow-popups-to-escape-sandbox" />
                </section>
            </div>
        </>
    );
}
