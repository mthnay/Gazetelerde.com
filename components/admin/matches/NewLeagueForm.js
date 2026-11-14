"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api } from './api';

export default function NewLeagueForm({ sports }) {
    const router = useRouter();
    const [f, setF] = useState({ name: '', season: '2025-26', sport: 'voleybol', kind: 'lig', gender: 'kadin', featured: true });
    const [msg, setMsg] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        const d = await api('/api/admin/leagues', 'POST', f);
        if (d.success) router.push(`/admin/mac-merkezi/${d.id}`);
        else setMsg(d.message);
    };
    return (
        <form className="admin-panel" onSubmit={submit}>
            <h2 style={{ marginTop: 0 }}>Yeni lig</h2>
            <label className="admin-field"><span>Lig adı</span><input className="admin-input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Sultanlar Ligi" /></label>
            <label className="admin-field"><span>Sezon</span><input className="admin-input" value={f.season} onChange={(e) => setF({ ...f, season: e.target.value })} /></label>
            <label className="admin-field"><span>Spor (puanlama kuralı)</span>
                <select className="admin-select" value={f.sport} onChange={(e) => setF({ ...f, sport: e.target.value })}>
                    {Object.entries(sports).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </label>
            <label className="admin-field"><span>Tür</span>
                <select className="admin-select" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
                    <option value="lig">Lig (Sultanlar / Efeler / 1. Lig)</option><option value="kupa">Kupa (Türkiye Kupası, Süper Kupa)</option>
                    <option value="avrupa">Avrupa kupası (CEV)</option><option value="milli">Milli takım turnuvası (VNL, Avrupa / Dünya Şampiyonası)</option>
                </select></label>
            <div style={{ display: 'flex', gap: 16, margin: '4px 0 12px' }}>
                <label className="admin-check"><input type="radio" checked={f.gender === 'kadin'} onChange={() => setF({ ...f, gender: 'kadin' })} /> Kadın</label>
                <label className="admin-check"><input type="radio" checked={f.gender === 'erkek'} onChange={() => setF({ ...f, gender: 'erkek' })} /> Erkek</label>
                <label className="admin-check"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Ana sayfada puan durumu</label>
            </div>
            {msg && <div className="admin-msg error">{msg}</div>}
            <button className="admin-btn primary"><Plus size={15} /> Ligi oluştur</button>
        </form>
    );
}
