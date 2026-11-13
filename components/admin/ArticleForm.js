"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, Link2, ExternalLink, Trash2 } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/permissions';

// "2026-11-14T09:30" biçimine (yerel saat) çevir
const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ArticleForm({ article = null, categories, canPublish, initial = {} }) {
    const router = useRouter();
    const isNew = !article;
    const [form, setForm] = useState({
        title: article?.title ?? initial.title ?? '',
        summary: article?.summary ?? initial.summary ?? '',
        content: article?.content ?? initial.content ?? '',
        image: article?.image ?? initial.image ?? '',
        category: article?.category ?? categories[0]?.slug ?? '',
        status: article?.status ?? 'DRAFT',
        featured: article?.featured ?? false,
        breaking: article?.breaking ?? false,
        authorName: article?.authorName ?? '',
        publishedAt: toLocalInput(article?.publishedAt),
    });
    const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl ?? '');
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const fetchFromUrl = async () => {
        if (!sourceUrl.trim()) return;
        setBusy(true);
        setMsg(null);
        const res = await fetch('/api/scrape', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: sourceUrl.trim() }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (!data?.success) return setMsg({ type: 'error', text: data?.error || 'İçerik çekilemedi.' });
        const d = data.data;
        setForm((f) => ({
            ...f,
            title: f.title || d.title,
            summary: f.summary || d.description,
            content: f.content || `${d.content}\n\nKaynak: ${sourceUrl.trim()}`,
            image: f.image || d.image,
        }));
        setMsg({ type: 'success', text: 'İçerik dolduruldu. Yayınlamadan önce metni kontrol edip kendi cümlelerinizle düzenleyin.' });
    };

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const payload = { ...form, publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null };
        const res = await fetch(isNew ? '/api/admin/articles' : `/api/admin/articles/${article.id}`, {
            method: isNew ? 'POST' : 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (!data?.success) return setMsg({ type: 'error', text: data?.message || 'Kaydedilemedi.' });

        if (!canPublish && form.status !== 'DRAFT') {
            setMsg({ type: 'success', text: 'Taslak olarak kaydedildi. Yayınlanması için editör onayı gerekiyor.' });
        } else {
            setMsg({ type: 'success', text: 'Kaydedildi.' });
        }
        if (isNew) router.replace(`/admin/haberler/${data.article.id}`);
        else router.refresh();
    };

    const remove = async () => {
        if (!confirm('Bu haber kalıcı olarak silinsin mi? Bu işlem geri alınamaz.')) return;
        const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) return setMsg({ type: 'error', text: data?.message || 'Silinemedi.' });
        router.push('/admin/haberler');
        router.refresh();
    };

    const paragraphCount = form.content.split(/\n\s*\n/).filter((p) => p.trim()).length;

    return (
        <form onSubmit={save}>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            <div className="admin-form">
                <div>
                    {isNew && (
                        <div className="admin-panel" style={{ marginBottom: 16 }}>
                            <div className="admin-field" style={{ marginBottom: 0 }}>
                                <label htmlFor="src">Linkten doldur (isteğe bağlı)</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input id="src" className="admin-input" type="url" placeholder="https://..." value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
                                    <button type="button" className="admin-btn" onClick={fetchFromUrl} disabled={busy}><Link2 size={16} /> Çek</button>
                                </div>
                                <span className="hint">Başlık, özet, görsel ve metin sayfadan otomatik alınır; boş alanlar doldurulur.</span>
                            </div>
                        </div>
                    )}

                    <div className="admin-panel">
                        <div className="admin-field">
                            <label htmlFor="title">Başlık</label>
                            <input id="title" className="admin-input" value={form.title} onChange={set('title')} required maxLength={200} />
                        </div>
                        <div className="admin-field">
                            <label htmlFor="summary">Özet <span className="hint">({form.summary.length}/500)</span></label>
                            <textarea id="summary" className="admin-textarea" rows={3} value={form.summary} onChange={set('summary')} required maxLength={500} />
                            <span className="hint">Haber kartlarında ve arama motorlarında görünür.</span>
                        </div>
                        <div className="admin-field" style={{ marginBottom: 0 }}>
                            <label htmlFor="content">Haber metni <span className="hint">({paragraphCount} paragraf)</span></label>
                            <textarea id="content" className="admin-textarea" rows={18} value={form.content} onChange={set('content')} required />
                            <span className="hint">Paragrafları boş bir satırla ayırın.</span>
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
                            <label className="admin-check" style={{ marginBottom: 16 }}>
                                <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Manşette göster
                            </label>
                        )}
                        {canPublish && (
                            <label className="admin-check" style={{ marginBottom: 16 }}>
                                <input type="checkbox" checked={form.breaking} onChange={set('breaking')} /> Son dakika şeridinde göster (24 saat)
                            </label>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="submit" className="admin-btn primary" disabled={busy}><Save size={16} /> {busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
                            {!isNew && article.status === 'PUBLISHED' && (
                                <Link href={`/haber/${article.slug}`} target="_blank" className="admin-btn"><ExternalLink size={16} /> Gör</Link>
                            )}
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
                            <label htmlFor="authorName">Görünen yazar adı</label>
                            <input id="authorName" className="admin-input" value={form.authorName} onChange={set('authorName')} placeholder="Boşsa hesabınızdaki ad" maxLength={80} />
                        </div>
                        <div className="admin-field" style={{ marginBottom: 0 }}>
                            <label htmlFor="image">Kapak görseli (URL)</label>
                            <input id="image" className="admin-input" type="url" value={form.image} onChange={set('image')} placeholder="https://..." />
                            {form.image && /^https?:\/\//.test(form.image) && (
                                <img src={form.image} alt="Önizleme" className="admin-preview-img" style={{ marginTop: 8 }} />
                            )}
                        </div>
                    </div>

                    {!isNew && (
                        <button type="button" onClick={remove} className="admin-btn danger"><Trash2 size={16} /> Haberi sil</button>
                    )}
                </aside>
            </div>
        </form>
    );
}
