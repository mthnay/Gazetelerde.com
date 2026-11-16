"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, RefreshCw, AlertTriangle, Filter } from 'lucide-react';

const MODES = [['INBOX', 'Gelen kutusu'], ['DRAFT', 'Taslak'], ['REVIEW', 'Onaya gönder'], ['PUBLISH', 'Otomatik yayımla']];
const when = (d) => d ? new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'henüz taranmadı';

export default function FeedSources({ sources, categories, canManage }) {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', url: '', category: '', kind: 'RSS', mode: 'PUBLISH', sport: 'voleybol', linkPattern: '', note: '', breaking: true, keepDays: 7 });
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
            : { type: 'success', text: `Kaynak eklendi; ${d.poll.found} haber bulundu, ${d.poll.added} tanesi yeni${d.poll.published != null ? `, ${d.poll.published} tanesi habere dönüştü` : ''}.` });
        setForm({ ...form, name: '', url: '' });
        router.refresh();
    };

    const toggle = async (s) => { setBusy(s.id); await call(`/api/admin/feeds/${s.id}`, 'PATCH', { active: !s.active }); setBusy(null); router.refresh(); };
    const setCat = async (s, category) => { setBusy(s.id); await call(`/api/admin/feeds/${s.id}`, 'PATCH', { category }); setBusy(null); router.refresh(); };
    const patch = async (s, data) => {
        if (data.mode === 'PUBLISH' && !confirm(`"${s.name}" kaynağından gelen yeni haberler onaysız yayımlanacak. Emin misiniz?`)) return;
        setBusy(s.id); await call(`/api/admin/feeds/${s.id}`, 'PATCH', data); setBusy(null); router.refresh();
    };
    const editFilter = (s) => {
        const include = prompt('Bu kelimelerden en az biri geçmeli (virgülle; boş = hepsi):', s.include);
        if (include === null) return;
        const exclude = prompt('Bu kelimelerden biri geçerse atla (virgülle):', s.exclude);
        if (exclude === null) return;
        patch(s, { include, exclude });
    };
    const pollOne = async (s) => {
        setBusy(s.id); setMsg(null);
        const d = await call(`/api/admin/feeds/${s.id}`, 'PATCH', { poll: true });
        setBusy(null);
        setMsg(d?.poll?.error ? { type: 'error', text: `${s.name}: ${d.poll.error}` } : { type: 'success', text: `${s.name}: ${d?.poll?.added ?? 0} yeni haber${d?.poll?.published != null ? `, ${d.poll.published} tanesi habere dönüştü` : ''}.` });
        router.refresh();
    };
    const remove = async (s) => {
        if (!confirm(`"${s.name}" kaynağı ve gelen kutusundaki ${s.items} öğesi silinsin mi? Bu kaynaktan oluşturulmuş haber taslakları silinmez.`)) return;
        setBusy(s.id); await call(`/api/admin/feeds/${s.id}`, 'DELETE'); setBusy(null); router.refresh();
    };

    return (
        <>
            {canManage && (
                <form onSubmit={add} className="admin-panel" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, alignItems: 'end' }}>
                    <label className="admin-field" style={{ margin: 0 }}><span>Kaynak adı</span>
                        <input className="admin-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ör. TVF Haberler" />
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>{form.kind === 'HTML' ? 'Haber listesi sayfası' : 'RSS / Atom adresi'}</span>
                        <input className="admin-input" type="url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder={form.kind === 'HTML' ? 'https://tvf.org.tr/icerikler/haberler' : 'https://…/rss'} />
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>Açıklama (isteğe bağlı)</span>
                        <input className="admin-input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="ör. Federasyon duyuruları" />
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>Arşiv (gün, 0 = hiç)</span>
                        <input className="admin-input" type="number" min="0" max="365" value={form.keepDays} onChange={(e) => setForm({ ...form, keepDays: Number(e.target.value) })} />
                    </label>
                    <label className="admin-field" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={form.breaking} onChange={(e) => setForm({ ...form, breaking: e.target.checked })} /> <span>Son dakika</span>
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>Tür</span>
                        <select className="admin-select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                            <option value="RSS">RSS / Atom</option><option value="HTML">Web sayfası (akışsız)</option>
                        </select>
                    </label>
                    {form.kind === 'HTML' && (
                        <label className="admin-field" style={{ margin: 0 }}><span>Bağlantı kalıbı</span>
                            <input className="admin-input" value={form.linkPattern} onChange={(e) => setForm({ ...form, linkPattern: e.target.value })} placeholder="/icerik/" />
                        </label>
                    )}
                    <label className="admin-field" style={{ margin: 0 }}><span>Konu</span>
                        <select className="admin-select" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                            <option value="voleybol">Voleybol</option><option value="spor">Genel spor</option>
                        </select>
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>Yeni haberler</span>
                        <select className="admin-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                            {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                    <label className="admin-field" style={{ margin: 0 }}><span>Varsayılan kategori</span>
                        <select className="admin-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                            <option value="">Otomatik (metinden)</option>
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
                            <thead><tr><th>Kaynak</th><th>Kategori</th><th>Yeni haberler</th><th>Son tarama</th><th>Öğe</th><th>Durum</th><th></th></tr></thead>
                            <tbody>
                                {sources.map((s) => (
                                    <tr key={s.id}>
                                        <td className="title-cell">{s.name}<div style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)', wordBreak: 'break-all' }}>{s.kind === 'HTML' ? 'Web sayfası · ' : ''}{s.sport === 'spor' ? 'Genel spor · ' : 'Voleybol · '}{s.url}</div>
                                            {(s.include || s.exclude) && <div style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)' }}>{s.include && `+ ${s.include}`} {s.exclude && `− ${s.exclude}`}</div>}
                                            {s.lastError && <div style={{ fontWeight: 400, fontSize: 12, color: 'var(--a-danger)', display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}><AlertTriangle size={12} /> {s.lastError}</div>}
                                        </td>
                                        <td>
                                            <select className="admin-select" style={{ width: 'auto', padding: '6px 10px' }} value={s.category?.slug || ''} disabled={!canManage || busy === s.id} onChange={(e) => setCat(s, e.target.value)} aria-label="Varsayılan kategori">
                                                <option value="">Otomatik</option>
                                                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <select className="admin-select" style={{ width: 'auto', padding: '6px 10px' }} value={s.mode} disabled={!canManage || busy === s.id} onChange={(e) => patch(s, { mode: e.target.value })} aria-label="Yeni haberler">
                                                {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                            </select>
                                            <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12 }}>
                                                <label><input type="checkbox" checked={s.breaking} disabled={!canManage || busy === s.id} onChange={(e) => patch(s, { breaking: e.target.checked })} /> Son dakika</label>
                                                <label title="Bu kaynaktan yayımlanan haberler kaç gün sonra arşivlensin (0 = hiç)">Arşiv <input type="number" min="0" max="365" defaultValue={s.keepDays} disabled={!canManage || busy === s.id} onBlur={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v !== s.keepDays) patch(s, { keepDays: v }); }} style={{ width: 48 }} /> gün</label>
                                                <label title="Yapay zekâ açıksa metin özgün habere dönüştürülür"><input type="checkbox" checked={s.rewrite} disabled={!canManage || busy === s.id} onChange={(e) => patch(s, { rewrite: e.target.checked })} /> AI ile yeniden yaz</label>
                                            </div>
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
                                                {canManage && <button className="admin-icon-btn" title="Filtre" aria-label="Anahtar kelime filtresi" disabled={busy === s.id} onClick={() => editFilter(s)}><Filter size={15} /></button>}
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
