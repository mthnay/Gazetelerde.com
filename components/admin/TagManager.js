"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Trash2, ExternalLink, Merge, Check } from 'lucide-react';

export default function TagManager({ initial }) {
    const router = useRouter();
    const [busy, setBusy] = useState(null);
    const [edit, setEdit] = useState(null); // { id, name, description }
    const [msg, setMsg] = useState(null);

    const call = async (t, method, body) => {
        setBusy(t.id); setMsg(null);
        const res = await fetch(`/api/admin/tags/${t.id}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
        const d = await res?.json().catch(() => null);
        setBusy(null);
        if (!d?.success) setMsg({ type: 'error', text: d?.message || 'İşlem başarısız.' });
        router.refresh();
        return d?.success;
    };
    const merge = (t) => {
        const name = prompt(`"${t.name}" hangi etiketle birleştirilsin? Hedef etiketin adını yazın:`);
        if (!name) return;
        const target = initial.find((x) => x.name.toLocaleLowerCase('tr') === name.trim().toLocaleLowerCase('tr'));
        if (!target) return setMsg({ type: 'error', text: `"${name}" adlı etiket bulunamadı.` });
        call(t, 'PATCH', { mergeInto: target.id });
    };

    if (!initial.length) return <div className="admin-panel"><p className="admin-empty">Henüz etiket yok. Haber stüdyosunda “Bilgiler” bölümünden etiket ekleyebilirsiniz.</p></div>;
    return (
        <>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <div className="admin-panel" style={{ padding: 0 }}>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead><tr><th>Etiket</th><th>Açıklama (konu sayfasında görünür)</th><th>Haber</th><th></th></tr></thead>
                        <tbody>
                            {initial.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600, minWidth: 160 }}>
                                        {edit?.id === t.id
                                            ? <input className="admin-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} aria-label="Etiket adı" />
                                            : <>#{t.name}{t.featured && <span className="badge ok" style={{ marginLeft: 8 }}>Öne çıkan</span>}</>}
                                    </td>
                                    <td className="muted" style={{ minWidth: 260 }}>
                                        {edit?.id === t.id
                                            ? <textarea className="admin-textarea" rows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} aria-label="Açıklama" />
                                            : <button type="button" className="linklike" onClick={() => setEdit({ id: t.id, name: t.name, description: t.description })}>{t.description || 'Açıklama ekle…'}</button>}
                                    </td>
                                    <td className="muted">{t.count}</td>
                                    <td>
                                        <div className="admin-actions">
                                            {edit?.id === t.id && <button type="button" className="admin-btn primary" disabled={busy === t.id}
                                                onClick={async () => { if (await call(t, 'PATCH', { name: edit.name, description: edit.description })) setEdit(null); }}><Check size={14} /> Kaydet</button>}
                                            <button type="button" className={`admin-icon-btn ${t.featured ? 'active' : ''}`} disabled={busy === t.id} title={t.featured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'} aria-label="Öne çıkar"
                                                onClick={() => call(t, 'PATCH', { featured: !t.featured })}><Star size={15} fill={t.featured ? 'currentColor' : 'none'} /></button>
                                            <a className="admin-icon-btn" href={`/etiket/${t.slug}`} target="_blank" rel="noreferrer" title="Konu sayfası" aria-label="Konu sayfasını aç"><ExternalLink size={15} /></a>
                                            <button type="button" className="admin-icon-btn" disabled={busy === t.id} title="Başka etiketle birleştir" aria-label="Birleştir" onClick={() => merge(t)}><Merge size={15} /></button>
                                            <button type="button" className="admin-icon-btn danger" disabled={busy === t.id} title="Sil" aria-label="Sil"
                                                onClick={() => confirm(`#${t.name} silinsin mi? Haberler silinmez, yalnızca etiket kaldırılır.`) && call(t, 'DELETE')}><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
