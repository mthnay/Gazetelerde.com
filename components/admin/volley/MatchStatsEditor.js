"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';

const norm = (s) => String(s || '').toLocaleLowerCase('tr').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
const COLS = [['points', 'Sayı'], ['attack', 'Hücum'], ['block', 'Blok'], ['ace', 'As']];

// Maç istatistiği: kadrodan oyuncu başına sayı/hücum/blok/as/MVP; istersen tabloyu yapıştırıp yapay zekâya doldurt
export default function MatchStatsEditor({ match, homeRoster, awayRoster, initial }) {
    const init = Object.fromEntries(initial.map((s) => [s.playerId, s]));
    const [rows, setRows] = useState(() => Object.fromEntries([...homeRoster.map((p) => [p.id, 'home']), ...awayRoster.map((p) => [p.id, 'away'])]
        .map(([id, side]) => [id, { playerId: id, side, points: init[id]?.points ?? 0, attack: init[id]?.attack ?? 0, block: init[id]?.block ?? 0, ace: init[id]?.ace ?? 0, mvp: init[id]?.mvp ?? false }])));
    const [msg, setMsg] = useState(null);
    const [paste, setPaste] = useState('');
    const [busy, setBusy] = useState(false);
    const set = (id, k, v) => setRows((r) => ({ ...r, [id]: { ...r[id], [k]: v } }));
    const setMvp = (id) => setRows((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...v, mvp: Number(k) === id ? !v.mvp : false }])));

    const save = async () => {
        setBusy(true); setMsg(null);
        const d = await fetch(`/api/admin/matches/${match.id}/stats`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: Object.values(rows) }) }).then((r) => r.json()).catch(() => null);
        setBusy(false);
        setMsg(d?.success ? { type: 'success', text: `${d.saved} oyuncunun istatistiği kaydedildi.` } : { type: 'error', text: d?.message || 'Kaydedilemedi.' });
    };

    const parse = async () => {
        setBusy(true); setMsg(null);
        const d = await fetch('/api/admin/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task: 'istatistik', matchId: match.id, text: paste }) }).then((r) => r.json()).catch(() => null);
        setBusy(false);
        if (!d?.success) return setMsg({ type: 'error', text: d?.message || 'Ayrıştırılamadı.' });
        const all = [...homeRoster.map((p) => ({ ...p, side: 'home' })), ...awayRoster.map((p) => ({ ...p, side: 'away' }))];
        const unmatched = [];
        setRows((cur) => {
            const next = { ...cur };
            for (const r of d.result.rows) {
                const n = norm(r.name);
                const p = all.find((x) => x.side === r.side && norm(x.name) === n) || all.find((x) => x.side === r.side && (norm(x.name).includes(n) || n.includes(norm(x.name).split(' ').pop())));
                if (!p) { unmatched.push(r.name); continue; }
                next[p.id] = { ...next[p.id], points: r.points, attack: r.attack, block: r.block, ace: r.ace, mvp: r.mvp };
            }
            return next;
        });
        setMsg({ type: unmatched.length ? 'error' : 'success', text: `Tablo dolduruldu; kontrol edip kaydedin.${unmatched.length ? ` Kadroda bulunamayanlar: ${unmatched.join(', ')} (önce kadroya ekleyin).` : ''}` });
    };

    const table = (title, roster) => (
        <section className="admin-panel" style={{ padding: 0 }}>
            <h2 style={{ margin: 16 }}>{title}</h2>
            {!roster.length ? <p className="admin-empty">Bu takımın kadrosu yok. Önce Voleybol verisi &gt; Kulüpler bölümünde takımı kulübe bağlayıp kadroyu girin.</p> : (
                <div className="admin-table-wrap"><table className="admin-table stats-table">
                    <thead><tr><th>Oyuncu</th>{COLS.map(([, l]) => <th key={l}>{l}</th>)}<th>MVP</th></tr></thead>
                    <tbody>{roster.map((p) => (
                        <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.number != null && <span className="muted">#{p.number} </span>}{p.name}</td>
                            {COLS.map(([k, l]) => <td key={k}><input className="admin-input" type="number" min="0" max="99" value={rows[p.id][k]} onChange={(e) => set(p.id, k, e.target.value)} aria-label={`${p.name} ${l}`} /></td>)}
                            <td><input type="radio" name="mvp" checked={rows[p.id].mvp} onChange={() => setMvp(p.id)} onClick={() => rows[p.id].mvp && setMvp(p.id)} aria-label={`${p.name} maçın oyuncusu`} /></td>
                        </tr>
                    ))}</tbody>
                </table></div>
            )}
        </section>
    );

    return (
        <>
            <header className="admin-header">
                <div>
                    <Link href={`/admin/mac-merkezi/${match.leagueId}`} className="hint" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><ArrowLeft size={14} /> Lig</Link>
                    <h1>{match.home} {match.score || '–'} {match.away}</h1>
                    <p>Oyuncu istatistikleri oyuncu sayfalarını, maç sayfasını ve sezon istatistik liderlerini besler.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <a className="admin-btn" href={`/mac/${match.id}`} target="_blank" rel="noreferrer">Maç sayfası</a>
                    <button type="button" className="admin-btn primary" onClick={save} disabled={busy}><Save size={15} /> Kaydet</button>
                </div>
            </header>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}
            <details className="admin-panel" style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}><Sparkles size={15} style={{ verticalAlign: -2 }} /> Tablo yapıştır, yapay zekâ doldursun</summary>
                <textarea className="admin-textarea" rows={8} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Federasyon ya da kulüp sitesindeki maç istatistik tablosunu buraya yapıştırın…" style={{ marginTop: 10, fontFamily: 'var(--font-mono, monospace)', fontSize: '.8rem' }} />
                <button type="button" className="admin-btn" onClick={parse} disabled={busy || paste.trim().length < 20} style={{ marginTop: 8 }}>{busy ? 'Ayrıştırılıyor…' : 'Ayrıştır ve doldur'}</button>
            </details>
            <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {table(match.home, homeRoster)}
                {table(match.away, awayRoster)}
            </div>
        </>
    );
}
