"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, Link2, ExternalLink, Trash2, History, RotateCcw } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/permissions';
import RichEditor from './RichEditor';
import CoverImage from './CoverImage';

const AUTOSAVE_MS = 15000;
const NEW_DRAFT_KEY = 'admin:yeni-haber-taslak';
const KIND = { SAVE: 'Kaydedildi', AUTOSAVE: 'Otomatik', RESTORE: 'Geri yüklendi' };

// "2026-11-14T09:30" biçimine (yerel saat) çevir
const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const time = (d) => new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textToHtml = (t) => String(t || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
// Eski düz metin içerik editöre paragraf olarak girsin
const asHtml = (c) => (/<\/?(p|h2|h3|ul|ol|blockquote|figure|div)[\s>]/i.test(c || '') ? c : textToHtml(c));

export default function ArticleForm({ article = null, categories, canPublish, initial = {} }) {
    const router = useRouter();
    const isNew = !article;
    const [form, setForm] = useState({
        title: article?.title ?? initial.title ?? '',
        summary: article?.summary ?? initial.summary ?? '',
        content: asHtml(article?.content ?? initial.content ?? ''),
        image: article?.image ?? initial.image ?? '',
        category: article?.category ?? initial.category ?? categories[0]?.slug ?? '',
        status: article?.status ?? 'DRAFT',
        featured: article?.featured ?? false,
        breaking: article?.breaking ?? false,
        authorName: article?.authorName ?? '',
        sourceUrl: article?.sourceUrl ?? initial.sourceUrl ?? '',
        publishedAt: toLocalInput(article?.publishedAt),
    });
    const [editorKey, setEditorKey] = useState(0); // içerik dışarıdan değişince editörü yeniden kur
    const [fetchUrl, setFetchUrl] = useState(initial.sourceUrl ?? '');
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [autoAt, setAutoAt] = useState(null);
    const [restore, setRestore] = useState(null); // bulunan kaydedilmemiş taslak
    const [revs, setRevs] = useState(null);
    const lastSent = useRef('');

    const update = (patch) => { setForm((f) => ({ ...f, ...patch })); setDirty(true); };
    const set = (k) => (e) => update({ [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const snapshot = (f) => JSON.stringify({ t: f.title, s: f.summary, c: f.content, i: f.image });

    // --- Açılışta kaydedilmemiş taslak var mı?
    useEffect(() => {
        if (isNew) {
            try {
                const d = JSON.parse(localStorage.getItem(NEW_DRAFT_KEY) || 'null');
                // eslint-disable-next-line react-hooks/set-state-in-effect
                if (d && (d.title || d.content) && !initial.title) setRestore({ source: 'local', at: d.at, data: d });
            } catch { /* yoksay */ }
            return;
        }
        fetch(`/api/admin/articles/${article.id}/revisions`).then((r) => r.json()).then(async (d) => {
            const latest = d.revisions?.[0];
            if (latest?.kind === 'AUTOSAVE' && new Date(latest.createdAt) > new Date(article.updatedAt)) {
                const full = await fetch(`/api/admin/articles/${article.id}/revisions?rev=${latest.id}`).then((r) => r.json());
                if (full.revision && (full.revision.content !== article.content || full.revision.title !== article.title)) {
                    setRestore({ source: 'server', at: latest.createdAt, data: full.revision });
                }
            }
        }).catch(() => { });
        // Bu efekt yalnızca açılışta çalışmalı
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Otomatik kayıt
    const autosave = useCallback(async () => {
        const snap = snapshot(form);
        if (snap === lastSent.current || (!form.title && !form.content)) return;
        lastSent.current = snap;
        if (isNew) {
            try { localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify({ ...form, at: new Date().toISOString() })); setAutoAt(new Date()); } catch { /* yoksay */ }
            return;
        }
        const res = await fetch(`/api/admin/articles/${article.id}/autosave`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: form.title, summary: form.summary, content: form.content, image: form.image }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (data?.success) setAutoAt(new Date(data.savedAt));
        else lastSent.current = ''; // başarısızsa bir sonrakinde tekrar dene
    }, [form, isNew, article?.id]);

    useEffect(() => {
        if (!dirty) return;
        const t = setTimeout(autosave, isNew ? 4000 : AUTOSAVE_MS);
        return () => clearTimeout(t);
    }, [form, dirty, autosave, isNew]);

    // Kaydedilmemiş değişiklikle sayfadan çıkarken uyar
    useEffect(() => {
        if (!dirty) return;
        const h = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, [dirty]);

    const applyContent = (data) => {
        setForm((f) => ({ ...f, title: data.title ?? f.title, summary: data.summary ?? f.summary, content: asHtml(data.content ?? f.content), image: data.image ?? f.image }));
        setEditorKey((k) => k + 1);
        setDirty(true);
    };

    // --- Linkten doldur
    const fetchFromUrl = async () => {
        if (!fetchUrl.trim()) return;
        setBusy(true); setMsg(null);
        const res = await fetch('/api/scrape', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: fetchUrl.trim() }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (!data?.success) return setMsg({ type: 'error', text: data?.error || 'İçerik çekilemedi.' });
        const d = data.data;
        setForm((f) => ({
            ...f,
            title: f.title || d.title,
            summary: f.summary || d.description,
            content: f.content && f.content !== '<p></p>' ? f.content : textToHtml(d.content),
            image: f.image || d.image,
            sourceUrl: fetchUrl.trim(),
        }));
        setEditorKey((k) => k + 1);
        setDirty(true);
        setMsg({ type: 'success', text: 'İçerik dolduruldu ve kaynak eklendi. Yayınlamadan önce metni kendi cümlelerinizle yeniden yazın.' });
    };

    // --- Kaydet
    const save = async (e) => {
        e.preventDefault();
        setBusy(true); setMsg(null);
        const payload = { ...form, publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null, feedItemId: initial.feedItemId };
        const res = await fetch(isNew ? '/api/admin/articles' : `/api/admin/articles/${article.id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (!data?.success) return setMsg({ type: 'error', text: data?.message || 'Kaydedilemedi.' });

        setDirty(false);
        lastSent.current = snapshot(form);
        setRevs(null);
        setMsg({ type: 'success', text: !canPublish && form.status !== 'DRAFT' ? 'Taslak olarak kaydedildi. Yayınlanması için editör onayı gerekiyor.' : 'Kaydedildi.' });
        if (isNew) {
            try { localStorage.removeItem(NEW_DRAFT_KEY); } catch { /* yoksay */ }
            router.replace(`/admin/haberler/${data.article.id}`);
        } else router.refresh();
    };

    const remove = async () => {
        if (!confirm('Bu haber kalıcı olarak silinsin mi? Bu işlem geri alınamaz.')) return;
        const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) return setMsg({ type: 'error', text: data?.message || 'Silinemedi.' });
        setDirty(false);
        router.push('/admin/haberler');
        router.refresh();
    };

    const loadRevisions = async () => {
        if (revs) return setRevs(null);
        const d = await fetch(`/api/admin/articles/${article.id}/revisions`).then((r) => r.json()).catch(() => null);
        setRevs(d?.revisions || []);
    };
    const restoreRevision = async (id) => {
        const d = await fetch(`/api/admin/articles/${article.id}/revisions?rev=${id}`).then((r) => r.json()).catch(() => null);
        if (!d?.revision) return;
        applyContent(d.revision);
        setMsg({ type: 'success', text: `${time(d.revision.createdAt)} sürümü yüklendi. Yayına almak için "Kaydet"e basın.` });
    };

    return (
        <form onSubmit={save}>
            {restore && (
                <div className="admin-msg restore-banner" role="status">
                    <span><strong>Kaydedilmemiş bir taslak bulundu</strong> ({time(restore.at)}).</span>
                    <span style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="admin-btn primary" onClick={() => { applyContent(restore.data); setRestore(null); }}><RotateCcw size={14} /> Geri yükle</button>
                        <button type="button" className="admin-btn" onClick={() => { setRestore(null); if (restore.source === 'local') try { localStorage.removeItem(NEW_DRAFT_KEY); } catch { /* yoksay */ } }}>Yok say</button>
                    </span>
                </div>
            )}
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            <div className="admin-form">
                <div>
                    {isNew && (
                        <div className="admin-panel" style={{ marginBottom: 16 }}>
                            <div className="admin-field" style={{ marginBottom: 0 }}>
                                <label htmlFor="src">Linkten doldur (isteğe bağlı)</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input id="src" className="admin-input" type="url" placeholder="https://..." value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} />
                                    <button type="button" className="admin-btn" onClick={fetchFromUrl} disabled={busy}><Link2 size={16} /> Çek</button>
                                </div>
                                <span className="hint">Başlık, özet, görsel ve metin kaynaktan alınır; boş alanlar doldurulur, kaynak bağlantısı habere eklenir.</span>
                            </div>
                        </div>
                    )}

                    <div className="admin-panel">
                        <div className="admin-field">
                            <label htmlFor="title">Başlık <span className="hint">({form.title.length}/200)</span></label>
                            <input id="title" className="admin-input" value={form.title} onChange={set('title')} required maxLength={200} style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600 }} />
                        </div>
                        <div className="admin-field">
                            <label htmlFor="summary">Özet <span className="hint">({form.summary.length}/500)</span></label>
                            <textarea id="summary" className="admin-textarea" rows={3} value={form.summary} onChange={set('summary')} required maxLength={500} />
                            <span className="hint">Haber kartlarında, haberin girişinde ve arama motorlarında görünür.</span>
                        </div>
                        <div className="admin-field" style={{ marginBottom: 0 }}>
                            <label>Haber metni</label>
                            <RichEditor key={editorKey} content={form.content} onChange={(html) => update({ content: html })} />
                        </div>
                    </div>
                </div>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="admin-panel">
                        <div className="admin-field">
                            <label htmlFor="status">Durum</label>
                            <select id="status" className="admin-select" value={form.status} onChange={set('status')}>
                                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                    <option key={k} value={k} disabled={!canPublish && k !== 'DRAFT'}>{v}</option>
                                ))}
                            </select>
                            {!canPublish && <span className="hint">Yazarlar yalnızca taslak kaydedebilir; editör yayınlar.</span>}
                        </div>
                        <div className="admin-field">
                            <label htmlFor="publishedAt">Yayın tarihi</label>
                            <input id="publishedAt" className="admin-input" type="datetime-local" value={form.publishedAt} onChange={set('publishedAt')} />
                            <span className="hint">Boş bırakılırsa yayınlandığı an. İleri bir tarih seçerseniz haber o saatte görünür.</span>
                        </div>
                        {canPublish && (
                            <>
                                <label className="admin-check" style={{ marginBottom: 10 }}>
                                    <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Manşette göster
                                </label>
                                <label className="admin-check" style={{ marginBottom: 16 }}>
                                    <input type="checkbox" checked={form.breaking} onChange={set('breaking')} /> Son dakika şeridinde göster (24 saat)
                                </label>
                            </>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button type="submit" className="admin-btn primary" disabled={busy}><Save size={16} /> {busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
                            {!isNew && article.status === 'PUBLISHED' && (
                                <Link href={`/haber/${article.slug}`} target="_blank" className="admin-btn"><ExternalLink size={16} /> Gör</Link>
                            )}
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <span className={`save-state ${dirty ? 'dirty' : ''}`}>
                                {dirty ? 'Kaydedilmemiş değişiklik var' : 'Tüm değişiklikler kaydedildi'}
                                {autoAt && ` · otomatik kayıt ${time(autoAt)}`}
                            </span>
                        </div>
                    </div>

                    <div className="admin-panel">
                        <div className="admin-field">
                            <label htmlFor="category">Kategori</label>
                            <select id="category" className="admin-select" value={form.category} onChange={set('category')} required>
                                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="admin-field">
                            <label>Kapak görseli</label>
                            <CoverImage value={form.image || ''} onChange={(v) => update({ image: v })} />
                        </div>
                        <div className="admin-field">
                            <label htmlFor="authorName">Görünen yazar adı</label>
                            <input id="authorName" className="admin-input" value={form.authorName} onChange={set('authorName')} placeholder="Boşsa hesabınızdaki ad" maxLength={80} />
                        </div>
                        <div className="admin-field" style={{ marginBottom: 0 }}>
                            <label htmlFor="sourceUrl">Kaynak bağlantısı</label>
                            <input id="sourceUrl" className="admin-input" type="url" value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="Haber başka yerden alındıysa (https://)" />
                        </div>
                    </div>

                    {!isNew && (
                        <div className="admin-panel">
                            <button type="button" className="admin-btn" onClick={loadRevisions} style={{ width: '100%', justifyContent: 'center' }}>
                                <History size={15} /> {revs ? 'Sürüm geçmişini gizle' : 'Sürüm geçmişi'}
                            </button>
                            {revs && (
                                revs.length === 0 ? <p className="hint" style={{ marginTop: 10 }}>Henüz kayıtlı sürüm yok.</p> : (
                                    <div className="rev-list" style={{ marginTop: 10 }}>
                                        {revs.map((r) => (
                                            <div key={r.id} className="rev-item">
                                                <span>
                                                    <span className="rev-kind">{KIND[r.kind]}</span><br />
                                                    {time(r.createdAt)} · {r.user}
                                                </span>
                                                <button type="button" className="admin-btn" style={{ padding: '6px 10px' }} onClick={() => restoreRevision(r.id)}>Yükle</button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {!isNew && (
                        <button type="button" onClick={remove} className="admin-btn danger"><Trash2 size={16} /> Haberi sil</button>
                    )}
                </aside>
            </div>
        </form>
    );
}
