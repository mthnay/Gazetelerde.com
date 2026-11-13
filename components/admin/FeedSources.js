"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

const when = (d) => d ? new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'henüz taranmadı';

export default function FeedSources({ sources, categories, canManage }) {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', url: '', category: categories[0]?.slug || '' });
    const [busy, setBusy] = useState(null);
    const [msg, setMsg] = useState(null);

    const call = async (url, method, body) => {
        const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
        return r?.json().catch(() => null);
    };

    const add = async (e) => {
        e.preventDefault();
        setBusy('add'); setMsg(null);
        const d = await call('/api/admin/feeds', 'POST', form);
        setBusy(null);
        if (!d?.success) return setMsg({ type: 'error', text: d?.message || 'Eklenemedi.' });
        setMsg(d.poll?.error
            ? { type: 'error', text: `Kaynak eklendi ama okunamadı: ${d.poll.error}` }
            : { type: 'success', text: `Kaynak eklendi; ${d.poll.found} haber bulundu, ${d.poll.added} tanesi gelen kutusuna düştü.` });
        setForm({ ...form, name: '', url: '' });
        router.refresh();
    };

    const toggle = async (s) => { setBusy(s.id); await call(`/api/admin/feeds/${s.id}`, 'PATCH', { active: !s.active }); setBusy(null); router.refresh(); };
    const setCat = async (s, category) => { setBusy(s.id); await call(`/api/admin/feeds/${s.id}`, 'PATCH', { category }); setBusy(null); router.refresh(); };
    const pollOne = async (s) => {
        setBusy(s.id); setMsg(null);
        const d = await call(`/api/admin/feeds/${s.id}`, 'PATCH', { poll: true });
        setBusy(null);
        setMsg(d?.poll?.error ? { type: 'error', text: `${s.name}: ${d.poll.error}` } : { type: 'success', text: `${s.name}: ${d?.poll?.added ?? 0} yeni haber.` });
        router.refresh();
    };
    const remove = async (s) => {
        if (!confirm(`"${s.name}" kaynağı ve gelen kutusundaki ${s.items} öğesi silinsin mi? Bu kaynaktan oluşturulmuş haber taslakları silinmez.`)) return;
        setBusy(s.id); await call(`/api/admin/feeds/${s.id}`, 'DELETE'); setBusy(null); router.refresh();
    };

    return (
        <>
            {canManage && (
                <form onSubmit={add} className="admin-panel" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 10, alignItems: 'end' }}>
                    <label className="admin-field" style={{ margin: 0 }}><span>Kaynak adı</span>
                        <input className="admin-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ör. TVF Haberler" />
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>RSS / Atom adresi</span>
                        <input className="admin-input" type="url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…/rss" />
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>Varsayılan kategori</span>
                        <select className="admin-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                        </select>
                    </label>
                    <button className="admin-btn primary" disabled={busy === 'add'}><Plus size={15} /> {busy === 'add' ? 'Ekleniyor…' : 'Ekle'}</button>
                </form>
            )}
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            {sources.length === 0 ? <div className="admin-panel admin-empty">Henüz kaynak yok.</div> : (
                <div className="admin-panel" style={{ padding: 0 }}>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead><tr><th>Kaynak</th><th>Kategori</th><th>Son tarama</th><th>Öğe</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {sources.map((s) => (
                                    <tr key={s.id}>
                                        <td className="title-cell">{s.name}<div style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>{s.url}</div>
                                            {s.lastError && <div style={{ fontWeight: 400, fontSize: 12, color: 'var(--a-danger)', display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}><AlertTriangle size={12} /> {s.lastError}</div>}
                                        </td>
                                        <td>
                                            <select className="admin-select" style={{ width: 'auto', padding: '6px 10px' }} value={s.category?.slug || ''} disabled={!canManage || busy === s.id} onChange={(e) => setCat(s, e.target.value)} aria-label="Varsayılan kategori">
                                                <option value="">—</option>
                                                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                                            </select>
                                        </td>
                                        <td className="muted">{when(s.lastFetchedAt)}</td>
                                        <td className="muted">{s.items}</td>
                                        <td>
                                            <button className={`badge ${s.active ? 'PUBLISHED' : 'ARCHIVED'}`} style={{ cursor: canManage ? 'pointer' : 'default' }} disabled={!canManage || busy === s.id} onClick={() => toggle(s)} title={canManage ? 'Durumu değiştir' : undefined}>
                                                {s.active ? 'Etkin' : 'Durduruldu'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="admin-icon-btn" title="Şimdi tara" aria-label="Şimdi tara" disabled={busy === s.id} onClick={() => pollOne(s)}><RefreshCw size={15} /></button>
                                                {canManage && <button className="admin-icon-btn danger" title="Sil" aria-label="Sil" disabled={busy === s.id} onClick={() => remove(s)}><Trash2 size={15} /></button>}
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
