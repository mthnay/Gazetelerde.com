"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api } from './api';

export default function NewLeagueForm({ sports }) {
    const router = useRouter();
    const [f, setF] = useState({ name: '', season: '2025-26', sport: 'voleybol' });
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
            {msg && <div className="admin-msg error">{msg}</div>}
            <button className="admin-btn primary"><Plus size={15} /> Ligi oluştur</button>
        </form>
    );
}
