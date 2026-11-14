"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Radio, ExternalLink } from 'lucide-react';
import { api } from './api';

const STATUS = { SCHEDULED: 'Oynanacak', LIVE: 'Canlı', FINISHED: 'Bitti', POSTPONED: 'Ertelendi' };
const toLocal = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

// Tek maç satırı: skoru hızlıca güncellemek için satır içi düzenleme
function MatchRow({ m, teams, volley, onSaved, onError }) {
    const [f, setF] = useState({ status: m.status, sets: m.sets.map((s) => s.join('-')).join(', '), homeScore: m.homeScore ?? '', awayScore: m.awayScore ?? '', startAt: toLocal(m.startAt), week: m.week ?? '', venue: m.venue, articleSlug: m.articleSlug });
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const name = (id) => teams.find((t) => t.id === id)?.name || '?';
    const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setDirty(true); };
    const save = async () => {
        setBusy(true);
        const body = { ...f, startAt: new Date(f.startAt).toISOString() };
        if (volley) { delete body.homeScore; delete body.awayScore; } else delete body.sets;
        const d = await api(`/api/admin/matches/${m.id}`, 'PATCH', body);
        setBusy(false);
        if (!d.success) return onError(d.message);
        setDirty(false);
        onSaved();
    };
    const remove = async () => {
        if (!confirm(`${name(m.homeId)} - ${name(m.awayId)} maçı silinsin mi?`)) return;
        const d = await api(`/api/admin/matches/${m.id}`, 'DELETE');
        if (d.success) onSaved(); else onError(d.message);
    };
    return (
        <div className={`ma-row ${f.status === 'LIVE' ? 'is-live' : ''}`}>
            <div className="ma-teams"><strong>{name(m.homeId)}</strong><span>–</span><strong>{name(m.awayId)}</strong>
                {m.homeScore != null && <span className="ma-score">{m.homeScore}-{m.awayScore}</span>}
            </div>
            <div className="ma-fields">
                <input className="admin-input" type="datetime-local" value={f.startAt} onChange={set('startAt')} aria-label="Tarih" />
                <input className="admin-input" type="number" min="1" value={f.week} onChange={set('week')} placeholder="Hafta" aria-label="Hafta" style={{ width: 80 }} />
                <select className="admin-select" value={f.status} onChange={set('status')} aria-label="Durum">
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {volley
                    ? <input className="admin-input" value={f.sets} onChange={set('sets')} placeholder="Setler: 25-21, 23-25, 25-18, 25-20" aria-label="Set skorları" style={{ minWidth: 230 }} />
                    : <><input className="admin-input" type="number" min="0" value={f.homeScore} onChange={set('homeScore')} aria-label="Ev sahibi skor" style={{ width: 70 }} />
                        <input className="admin-input" type="number" min="0" value={f.awayScore} onChange={set('awayScore')} aria-label="Deplasman skor" style={{ width: 70 }} /></>}
                <input className="admin-input" value={f.venue} onChange={set('venue')} placeholder="Salon" aria-label="Salon" />
                <input className="admin-input" value={f.articleSlug} onChange={set('articleSlug')} placeholder="Bağlı haber adresi (isteğe bağlı)" aria-label="Bağlı haber" />
                <button type="button" className={`admin-btn ${dirty ? 'primary' : ''}`} onClick={save} disabled={busy || !dirty}><Save size={14} /> Kaydet</button>
                <button type="button" className="admin-icon-btn danger" onClick={remove} aria-label="Maçı sil"><Trash2 size={15} /></button>
            </div>
        </div>
    );
}

export default function LeagueAdmin({ league, teams, matches }) {
    const router = useRouter();
    const volley = league.sport === 'voleybol';
    const [msg, setMsg] = useState(null);
    const [names, setNames] = useState('');
    const [nm, setNm] = useState({ homeId: '', awayId: '', startAt: '', week: '', venue: '' });
    const [filter, setFilter] = useState('upcoming');
    const done = () => { setMsg(null); router.refresh(); };
    const err = (text) => setMsg({ type: 'error', text });

    const shown = useMemo(() => {
        if (filter === 'all') return matches;
        if (filter === 'played') return matches.filter((m) => m.status === 'FINISHED').reverse();
        return matches.filter((m) => m.status !== 'FINISHED');
    }, [filter, matches]);

    const addTeams = async () => {
        const d = await api(`/api/admin/leagues/${league.id}/teams`, 'POST', { names });
        if (!d.success) return err(d.message);
        setNames(''); setMsg({ type: 'success', text: `${d.added} takım eklendi.` }); router.refresh();
    };
    const addMatch = async (e) => {
        e.preventDefault();
        const d = await api('/api/admin/matches', 'POST', { ...nm, leagueId: league.id, startAt: nm.startAt ? new Date(nm.startAt).toISOString() : '' });
        if (!d.success) return err(d.message);
        setNm({ ...nm, homeId: '', awayId: '' }); done();
    };
    const toggle = async () => { const d = await api(`/api/admin/leagues/${league.id}`, 'PATCH', { active: !league.active }); if (d.success) done(); else err(d.message); };
    const removeLeague = async () => {
        if (!confirm(`${league.name} ligi, tüm takımları ve maçlarıyla silinsin mi? Geri alınamaz.`)) return;
        const d = await api(`/api/admin/leagues/${league.id}`, 'DELETE');
        if (d.success) router.push('/admin/mac-merkezi'); else err(d.message);
    };
    const removeTeam = async (t) => {
        if (!confirm(`${t.name} ve bu takımın tüm maçları silinsin mi?`)) return;
        const d = await api(`/api/admin/teams/${t.id}`, 'DELETE');
        if (d.success) done(); else err(d.message);
    };

    return (
        <>
            <header className="admin-header">
                <div>
                    <Link href="/admin/mac-merkezi" className="hint" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><ArrowLeft size={14} /> Ligler</Link>
                    <h1>{league.name} {league.season}</h1>
                    <p>{teams.length} takım · {matches.length} maç · {league.active ? 'sitede yayında' : 'sitede gizli'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`/mac-merkezi/${league.slug}`} target="_blank" rel="noreferrer" className="admin-btn"><ExternalLink size={15} /> Sitede gör</a>
                    <button type="button" className="admin-btn" onClick={toggle}>{league.active ? 'Gizle' : 'Yayınla'}</button>
                    <button type="button" className="admin-btn danger" onClick={removeLeague}><Trash2 size={15} /> Sil</button>
                </div>
            </header>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            <div className="admin-grid-2">
                <section className="admin-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <h2 style={{ margin: 0 }}>Maçlar</h2>
                        <nav className="admin-tabs">
                            {[['upcoming', 'Oynanacak / canlı'], ['played', 'Oynananlar'], ['all', 'Tümü']].map(([k, v]) => (
                                <button key={k} type="button" className={`admin-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{v}</button>
                            ))}
                        </nav>
                    </div>
                    {volley && <p className="hint" style={{ marginTop: 0 }}><Radio size={13} style={{ verticalAlign: -2 }} /> Voleybolda set skorlarını yazmanız yeterli; maç skoru ve puan durumu otomatik hesaplanır.</p>}
                    {!shown.length ? <p className="hint">Bu filtrede maç yok.</p> : (
                        <div className="ma-list">{shown.map((m) => <MatchRow key={`${m.id}-${m.status}-${m.homeScore}-${m.awayScore}`} m={m} teams={teams} volley={volley} onSaved={done} onError={err} />)}</div>
                    )}
                </section>

                <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <form className="admin-panel" onSubmit={addMatch}>
                        <h2 style={{ marginTop: 0 }}>Maç ekle</h2>
                        {teams.length < 2 ? <p className="hint">Önce aşağıdan en az iki takım ekleyin.</p> : (
                            <>
                                <label className="admin-field"><span>Ev sahibi</span>
                                    <select className="admin-select" required value={nm.homeId} onChange={(e) => setNm({ ...nm, homeId: e.target.value })}>
                                        <option value="">Seçin</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select></label>
                                <label className="admin-field"><span>Deplasman</span>
                                    <select className="admin-select" required value={nm.awayId} onChange={(e) => setNm({ ...nm, awayId: e.target.value })}>
                                        <option value="">Seçin</option>{teams.filter((t) => String(t.id) !== nm.homeId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select></label>
                                <label className="admin-field"><span>Tarih ve saat</span><input className="admin-input" type="datetime-local" required value={nm.startAt} onChange={(e) => setNm({ ...nm, startAt: e.target.value })} /></label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <label className="admin-field" style={{ width: 100 }}><span>Hafta</span><input className="admin-input" type="number" min="1" value={nm.week} onChange={(e) => setNm({ ...nm, week: e.target.value })} /></label>
                                    <label className="admin-field" style={{ flex: 1 }}><span>Salon</span><input className="admin-input" value={nm.venue} onChange={(e) => setNm({ ...nm, venue: e.target.value })} /></label>
                                </div>
                                <button className="admin-btn primary"><Plus size={15} /> Ekle</button>
                                <p className="hint">Tarih, hafta ve salon bir sonraki maç için korunur; aynı haftanın maçlarını art arda hızlıca girebilirsiniz.</p>
                            </>
                        )}
                    </form>

                    <section className="admin-panel">
                        <h2 style={{ marginTop: 0 }}>Takımlar ({teams.length})</h2>
                        <ul className="admin-list">
                            {teams.map((t) => (
                                <li key={t.id} className="admin-list-row">
                                    <span style={{ flex: 1 }}>{t.name}{t.shortName && <small className="muted"> · {t.shortName}</small>}</span>
                                    <button type="button" className="admin-icon-btn danger" onClick={() => removeTeam(t)} aria-label={`${t.name} takımını sil`}><Trash2 size={14} /></button>
                                </li>
                            ))}
                        </ul>
                        <label className="admin-field" style={{ marginTop: 12 }}><span>Takım ekle (her satıra bir takım, isteğe bağlı “| KISA AD”)</span>
                            <textarea className="admin-textarea" rows={5} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'VakıfBank | VKF\nFenerbahçe Medicana | FB'} />
                        </label>
                        <button type="button" className="admin-btn" onClick={addTeams} disabled={!names.trim()}><Plus size={15} /> Takımları ekle</button>
                    </section>
                </div>
            </div>
        </>
    );
}
