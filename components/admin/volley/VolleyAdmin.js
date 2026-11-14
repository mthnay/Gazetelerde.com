"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pencil, ExternalLink, Users } from 'lucide-react';
import CoverImage from '../CoverImage';

const POSITIONS = { '': '—', pasor: 'Pasör', smacor: 'Smaçör', orta: 'Orta oyuncu', 'pasor-capraz': 'Pasör çaprazı', libero: 'Libero' };
const STATUS = { soylenti: 'Söylenti', gorusme: 'Görüşme', resmi: 'Resmi' };
async function api(url, method, body) {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    return (await r?.json().catch(() => null)) || { success: false, message: 'Sunucuya ulaşılamadı.' };
}
const Field = ({ label, children, style }) => <label className="admin-field" style={style}><span>{label}</span>{children}</label>;

// ---------------------------------------------------------------- Kulüpler
function ClubForm({ initial, teams, onDone, onError }) {
    const [f, setF] = useState(initial || { name: '', shortName: '', city: '', venue: '', founded: '', coach: '', colors: '', logo: '', bio: '', website: '', national: false, gender: 'kadin' });
    const [teamIds, setTeamIds] = useState(initial?.teamIds || []);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const save = async (e) => {
        e.preventDefault();
        const d = initial?.id ? await api(`/api/admin/clubs/${initial.id}`, 'PATCH', { ...f, teamIds }) : await api('/api/admin/clubs', 'POST', f);
        if (!d.success) return onError(d.message);
        onDone();
    };
    return (
        <form className="admin-panel" onSubmit={save} style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>{initial?.id ? `${initial.name} — düzenle` : 'Yeni kulüp / milli takım'}</h2>
            <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                    <Field label="Ad"><input className="admin-input" required value={f.name} onChange={set('name')} placeholder="ör. VakıfBank" /></Field>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Field label="Kısa ad" style={{ width: 110 }}><input className="admin-input" maxLength={6} value={f.shortName} onChange={set('shortName')} /></Field>
                        <Field label="Şehir" style={{ flex: 1 }}><input className="admin-input" value={f.city} onChange={set('city')} /></Field>
                        <Field label="Kuruluş" style={{ width: 100 }}><input className="admin-input" type="number" value={f.founded ?? ''} onChange={set('founded')} /></Field>
                    </div>
                    <Field label="Salon"><input className="admin-input" value={f.venue} onChange={set('venue')} /></Field>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Field label="Başantrenör" style={{ flex: 1 }}><input className="admin-input" value={f.coach} onChange={set('coach')} /></Field>
                        <Field label="Renkler" style={{ flex: 1 }}><input className="admin-input" value={f.colors} onChange={set('colors')} /></Field>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '6px 0 10px' }}>
                        <label className="admin-check"><input type="radio" checked={f.gender === 'kadin'} onChange={() => setF({ ...f, gender: 'kadin' })} /> Kadın</label>
                        <label className="admin-check"><input type="radio" checked={f.gender === 'erkek'} onChange={() => setF({ ...f, gender: 'erkek' })} /> Erkek</label>
                        <label className="admin-check"><input type="checkbox" checked={f.national} onChange={set('national')} /> Milli takım</label>
                    </div>
                    <Field label="Tanıtım"><textarea className="admin-textarea" rows={3} value={f.bio} onChange={set('bio')} /></Field>
                </div>
                <div>
                    <div className="admin-field"><span>Logo</span><CoverImage value={f.logo || ''} onChange={(v) => setF({ ...f, logo: v })} /></div>
                    {initial?.id && (
                        <Field label="Lig takım kayıtları (maçlar ve puan durumu bu kulübe bağlanır)">
                            <select className="admin-select" multiple size={6} value={teamIds.map(String)} onChange={(e) => setTeamIds([...e.target.selectedOptions].map((o) => Number(o.value)))}>
                                {teams.filter((t) => !t.clubId || t.clubId === initial.id).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </Field>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}><button className="admin-btn primary">Kaydet</button><button type="button" className="admin-btn" onClick={() => onDone(true)}>Vazgeç</button></div>
        </form>
    );
}

function BulkRoster({ club, season, onDone, onError }) {
    const [lines, setLines] = useState('');
    const [s, setS] = useState(season);
    const run = async () => {
        const d = await api('/api/admin/players/bulk', 'POST', { clubId: club.id, season: s, lines });
        if (!d.success) return onError(d.message);
        setLines(''); onDone(`${d.added} oyuncu kadroya eklendi (${d.created} yeni oyuncu oluşturuldu).`);
    };
    return (
        <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}><Users size={16} style={{ verticalAlign: -2 }} /> {club.name} — toplu kadro</h3>
            <Field label="Sezon"><input className="admin-input" value={s} onChange={(e) => setS(e.target.value)} style={{ width: 120 }} /></Field>
            <Field label="Her satıra bir oyuncu: No | Ad Soyad | Mevki | Boy (Excel'den sekmeyle yapıştırabilirsiniz)">
                <textarea className="admin-textarea" rows={8} value={lines} onChange={(e) => setLines(e.target.value)} placeholder={'1 | Ad Soyad | Pasör | 182\n7 | Ad Soyad | Smaçör | 190'} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '.82rem' }} />
            </Field>
            <button type="button" className="admin-btn primary" onClick={run} disabled={!lines.trim()}>Kadroya ekle</button>
        </div>
    );
}

// ---------------------------------------------------------------- Oyuncular
function PlayerForm({ initial, clubs, season, onDone, onError }) {
    const [f, setF] = useState(initial || { name: '', position: '', height: '', birthYear: '', nationality: 'Türkiye', gender: 'kadin', photo: '', bio: '', active: true });
    const [r, setR] = useState({ clubId: '', season, number: '', captain: false });
    const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const save = async (e) => {
        e.preventDefault();
        const d = initial?.id ? await api(`/api/admin/players/${initial.id}`, 'PATCH', f) : await api('/api/admin/players', 'POST', f);
        if (!d.success) return onError(d.message);
        onDone();
    };
    const addRoster = async () => { const d = await api(`/api/admin/players/${initial.id}`, 'PATCH', { roster: r }); if (!d.success) return onError(d.message); onDone(); };
    const removeRoster = async (id) => { const d = await api(`/api/admin/players/${initial.id}`, 'PATCH', { removeRoster: id }); if (d.success) onDone(); };
    return (
        <form className="admin-panel" onSubmit={save} style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>{initial?.id ? `${initial.name} — düzenle` : 'Yeni oyuncu'}</h2>
            <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                    <Field label="Ad Soyad"><input className="admin-input" required value={f.name} onChange={set('name')} /></Field>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Field label="Mevki" style={{ flex: 1 }}><select className="admin-select" value={f.position} onChange={set('position')}>{Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                        <Field label="Boy (cm)" style={{ width: 100 }}><input className="admin-input" type="number" value={f.height ?? ''} onChange={set('height')} /></Field>
                        <Field label="Doğum yılı" style={{ width: 110 }}><input className="admin-input" type="number" value={f.birthYear ?? ''} onChange={set('birthYear')} /></Field>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Field label="Uyruk" style={{ flex: 1 }}><input className="admin-input" value={f.nationality} onChange={set('nationality')} /></Field>
                        <Field label="Lig" style={{ width: 140 }}><select className="admin-select" value={f.gender} onChange={set('gender')}><option value="kadin">Kadın</option><option value="erkek">Erkek</option></select></Field>
                    </div>
                    <Field label="Biyografi"><textarea className="admin-textarea" rows={4} value={f.bio} onChange={set('bio')} /></Field>
                    <label className="admin-check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Aktif oyuncu</label>
                </div>
                <div>
                    <div className="admin-field"><span>Fotoğraf</span><CoverImage value={f.photo || ''} onChange={(v) => setF({ ...f, photo: v })} /></div>
                    {initial?.id && (
                        <div className="admin-field"><span>Kadro geçmişi</span>
                            <ul className="admin-list">{initial.roster.map((x) => <li key={x.id} className="admin-list-row"><span style={{ flex: 1 }}>{x.season} · {x.club.name}{x.number != null && ` · #${x.number}`}{x.captain && ' (K)'}</span><button type="button" className="admin-icon-btn danger" onClick={() => removeRoster(x.id)} aria-label="Kadrodan çıkar"><Trash2 size={13} /></button></li>)}</ul>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                <select className="admin-select" value={r.clubId} onChange={(e) => setR({ ...r, clubId: e.target.value })} style={{ flex: '1 1 160px' }} aria-label="Kulüp"><option value="">Kulüp seçin</option>{clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                <input className="admin-input" value={r.season} onChange={(e) => setR({ ...r, season: e.target.value })} style={{ width: 90 }} aria-label="Sezon" />
                                <input className="admin-input" type="number" placeholder="No" value={r.number} onChange={(e) => setR({ ...r, number: e.target.value })} style={{ width: 70 }} aria-label="Forma no" />
                                <label className="admin-check"><input type="checkbox" checked={r.captain} onChange={(e) => setR({ ...r, captain: e.target.checked })} /> Kaptan</label>
                                <button type="button" className="admin-btn" onClick={addRoster} disabled={!r.clubId}><Plus size={14} /> Ekle</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}><button className="admin-btn primary">Kaydet</button><button type="button" className="admin-btn" onClick={() => onDone(true)}>Vazgeç</button></div>
        </form>
    );
}

// ---------------------------------------------------------------- Transferler
function TransferForm({ players, clubs, season, onDone, onError }) {
    const [f, setF] = useState({ playerId: '', fromClubId: '', fromName: '', toClubId: '', toName: '', status: 'soylenti', season, date: '', note: '', sourceUrl: '' });
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const save = async (e) => {
        e.preventDefault();
        const d = await api('/api/admin/transfers', 'POST', { ...f, date: f.date ? new Date(f.date).toISOString() : undefined });
        if (!d.success) return onError(d.message);
        onDone();
    };
    return (
        <form className="admin-panel" onSubmit={save} style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>Yeni transfer</h2>
            <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                    <Field label="Oyuncu"><select className="admin-select" required value={f.playerId} onChange={set('playerId')}><option value="">Seçin</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
                    <Field label="Ayrıldığı kulüp"><select className="admin-select" value={f.fromClubId} onChange={set('fromClubId')}><option value="">— listede yok —</option>{clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                    {!f.fromClubId && <Field label="…ya da kulüp adı"><input className="admin-input" value={f.fromName} onChange={set('fromName')} placeholder="ör. Imoco Volley (İtalya)" /></Field>}
                    <Field label="Gittiği kulüp"><select className="admin-select" value={f.toClubId} onChange={set('toClubId')}><option value="">— listede yok —</option>{clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                    {!f.toClubId && <Field label="…ya da kulüp adı"><input className="admin-input" value={f.toName} onChange={set('toName')} /></Field>}
                </div>
                <div>
                    <Field label="Durum"><select className="admin-select" value={f.status} onChange={set('status')}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Field label="Sezon" style={{ width: 110 }}><input className="admin-input" value={f.season} onChange={set('season')} /></Field>
                        <Field label="Tarih" style={{ flex: 1 }}><input className="admin-input" type="date" value={f.date} onChange={set('date')} /></Field>
                    </div>
                    <Field label="Not"><input className="admin-input" value={f.note} onChange={set('note')} placeholder="ör. 2 yıllık sözleşme" /></Field>
                    <Field label="Kaynak bağlantısı"><input className="admin-input" type="url" value={f.sourceUrl} onChange={set('sourceUrl')} /></Field>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}><button className="admin-btn primary">Kaydet</button><button type="button" className="admin-btn" onClick={() => onDone(true)}>Vazgeç</button></div>
        </form>
    );
}

export default function VolleyAdmin({ tab: initialTab, season, clubs, players, transfers, teams }) {
    const router = useRouter();
    const [tab, setTab] = useState(initialTab);
    const [edit, setEdit] = useState(null); // { kind, item }
    const [bulk, setBulk] = useState(null);
    const [msg, setMsg] = useState(null);
    const [q, setQ] = useState('');
    const done = (cancelOrText) => { setEdit(null); setBulk(null); if (typeof cancelOrText === 'string') setMsg({ type: 'success', text: cancelOrText }); else if (!cancelOrText) setMsg({ type: 'success', text: 'Kaydedildi.' }); router.refresh(); };
    const err = (text) => setMsg({ type: 'error', text });
    const del = async (url, label) => { if (!confirm(`${label} silinsin mi? Geri alınamaz.`)) return; const d = await api(url, 'DELETE'); if (d.success) done('Silindi.'); else err(d.message); };
    const shownPlayers = useMemo(() => players.filter((p) => !q || p.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr'))), [players, q]);

    return (
        <>
            <header className="admin-header">
                <div><h1>Voleybol verisi</h1><p>Kulüpler, oyuncular, kadrolar ve transferler. Sitedeki oyuncu ve takım sayfaları, istatistik liderleri ve transfer merkezi buradan beslenir. Güncel sezon: {season}.</p></div>
            </header>
            <nav className="admin-tabs" style={{ marginBottom: 16 }}>
                {[['kulupler', `Kulüpler (${clubs.length})`], ['oyuncular', `Oyuncular (${players.length})`], ['transferler', `Transferler (${transfers.length})`]].map(([k, v]) => (
                    <button key={k} type="button" className={`admin-tab ${tab === k ? 'active' : ''}`} onClick={() => { setTab(k); setEdit(null); setBulk(null); }}>{v}</button>
                ))}
            </nav>
            {msg && <div className={`admin-msg ${msg.type}`} role="status">{msg.text}</div>}

            {tab === 'kulupler' && (
                <>
                    {edit?.kind === 'club' ? <ClubForm initial={edit.item} teams={teams} onDone={done} onError={err} /> : <button type="button" className="admin-btn primary" style={{ marginBottom: 16 }} onClick={() => setEdit({ kind: 'club', item: null })}><Plus size={15} /> Yeni kulüp</button>}
                    {bulk && <BulkRoster club={bulk} season={season} onDone={done} onError={err} />}
                    <div className="admin-panel" style={{ padding: 0 }}>
                        {!clubs.length ? <p className="admin-empty">Henüz kulüp yok. Lig takımlarıyla aynı adla eklerseniz maçları otomatik bağlanır.</p> : (
                            <div className="admin-table-wrap"><table className="admin-table">
                                <thead><tr><th>Kulüp</th><th>Şehir</th><th>{season} kadro</th><th>Lig kaydı</th><th></th></tr></thead>
                                <tbody>{clubs.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.name}{c.national && <span className="badge ok" style={{ marginLeft: 6 }}>Milli</span>}<small className="muted" style={{ display: 'block' }}>{c.gender === 'erkek' ? 'Erkek' : 'Kadın'}</small></td>
                                        <td className="muted">{c.city || '—'}</td>
                                        <td className="muted">{c.rosterCount} oyuncu</td>
                                        <td className="muted">{c.teamIds.length}</td>
                                        <td><div className="admin-actions">
                                            <button type="button" className="admin-btn" onClick={() => setBulk(c)}><Users size={14} /> Kadro</button>
                                            <button type="button" className="admin-icon-btn" onClick={() => setEdit({ kind: 'club', item: c })} aria-label="Düzenle"><Pencil size={14} /></button>
                                            <a className="admin-icon-btn" href={`/takim/${c.slug}`} target="_blank" rel="noreferrer" aria-label="Sayfası"><ExternalLink size={14} /></a>
                                            <button type="button" className="admin-icon-btn danger" onClick={() => del(`/api/admin/clubs/${c.id}`, c.name)} aria-label="Sil"><Trash2 size={14} /></button>
                                        </div></td>
                                    </tr>
                                ))}</tbody>
                            </table></div>
                        )}
                    </div>
                </>
            )}

            {tab === 'oyuncular' && (
                <>
                    {edit?.kind === 'player' ? <PlayerForm initial={edit.item} clubs={clubs} season={season} onDone={done} onError={err} /> : (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <button type="button" className="admin-btn primary" onClick={() => setEdit({ kind: 'player', item: null })}><Plus size={15} /> Yeni oyuncu</button>
                            <input className="admin-input" type="search" placeholder="Oyuncu ara…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} aria-label="Oyuncu ara" />
                        </div>
                    )}
                    <div className="admin-panel" style={{ padding: 0 }}>
                        {!shownPlayers.length ? <p className="admin-empty">Oyuncu yok. Kulüpler sekmesindeki “Kadro” ile toplu ekleyebilirsiniz.</p> : (
                            <div className="admin-table-wrap"><table className="admin-table">
                                <thead><tr><th>Oyuncu</th><th>Mevki</th><th>Takım ({season})</th><th>Boy</th><th></th></tr></thead>
                                <tbody>{shownPlayers.map((p) => {
                                    const cur = p.roster.find((r) => r.season === season);
                                    return (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.name}{!p.active && <span className="badge" style={{ marginLeft: 6 }}>Pasif</span>}</td>
                                            <td className="muted">{POSITIONS[p.position]}</td>
                                            <td className="muted">{cur ? `${cur.club.name}${cur.number != null ? ` · #${cur.number}` : ''}` : '—'}</td>
                                            <td className="muted">{p.height ? `${p.height} cm` : '—'}</td>
                                            <td><div className="admin-actions">
                                                <button type="button" className="admin-icon-btn" onClick={() => setEdit({ kind: 'player', item: p })} aria-label="Düzenle"><Pencil size={14} /></button>
                                                <a className="admin-icon-btn" href={`/oyuncu/${p.slug}`} target="_blank" rel="noreferrer" aria-label="Sayfası"><ExternalLink size={14} /></a>
                                                <button type="button" className="admin-icon-btn danger" onClick={() => del(`/api/admin/players/${p.id}`, p.name)} aria-label="Sil"><Trash2 size={14} /></button>
                                            </div></td>
                                        </tr>
                                    );
                                })}</tbody>
                            </table></div>
                        )}
                    </div>
                </>
            )}

            {tab === 'transferler' && (
                <>
                    {edit?.kind === 'transfer' ? <TransferForm players={players} clubs={clubs} season={season} onDone={done} onError={err} /> : <button type="button" className="admin-btn primary" style={{ marginBottom: 16 }} onClick={() => setEdit({ kind: 'transfer' })} disabled={!players.length}><Plus size={15} /> Yeni transfer</button>}
                    <div className="admin-panel" style={{ padding: 0 }}>
                        {!transfers.length ? <p className="admin-empty">Henüz transfer yok.</p> : (
                            <div className="admin-table-wrap"><table className="admin-table">
                                <thead><tr><th>Oyuncu</th><th>Transfer</th><th>Durum</th><th>Tarih</th><th></th></tr></thead>
                                <tbody>{transfers.map((t) => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600 }}><Link href={`/oyuncu/${t.player.slug}`} target="_blank">{t.player.name}</Link></td>
                                        <td className="muted">{t.fromClub?.name || t.fromName || '—'} → {t.toClub?.name || t.toName || '—'}{t.note && <small style={{ display: 'block' }}>{t.note}</small>}</td>
                                        <td><select className="admin-select" value={t.status} onChange={async (e) => { const d = await api(`/api/admin/transfers/${t.id}`, 'PATCH', { status: e.target.value }); if (d.success) done('Durum güncellendi.'); }} aria-label="Durum">
                                            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                                        <td className="muted">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                                        <td><div className="admin-actions">
                                            {t.status === 'resmi' && t.toClubId && <button type="button" className="admin-btn" onClick={async () => { const d = await api(`/api/admin/transfers/${t.id}`, 'PATCH', { addToRoster: t.season || season }); if (d.success) done('Oyuncu yeni kulübün kadrosuna eklendi.'); else err(d.message); }}>Kadroya ekle</button>}
                                            <button type="button" className="admin-icon-btn danger" onClick={() => del(`/api/admin/transfers/${t.id}`, 'Bu transfer kaydı')} aria-label="Sil"><Trash2 size={14} /></button>
                                        </div></td>
                                    </tr>
                                ))}</tbody>
                            </table></div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
