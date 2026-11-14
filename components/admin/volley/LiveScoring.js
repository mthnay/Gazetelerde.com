"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Undo2, ExternalLink, Radio } from 'lucide-react';

/**
 * Sayı sayı canlı skor masası. Büyük düğmeler (telefonda da rahat), klavye: A = ev sahibi, L = deplasman, Z = son sayıyı geri al.
 * Set ve maç sonu kurallar gereği otomatik; okur ekranları birkaç saniye içinde güncellenir.
 */
export default function LiveScoring({ match }) {
    const [m, setM] = useState(match);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const last = useRef([]); // geri alma için son taraflar

    const point = async (side, delta = 1) => {
        if (busy) return;
        setBusy(true); setMsg('');
        const d = await fetch(`/api/admin/matches/${m.id}/point`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ side, delta }) }).then((r) => r.json()).catch(() => null);
        setBusy(false);
        if (!d?.success) return setMsg(d?.message || 'Kaydedilemedi, tekrar deneyin.');
        if (delta > 0) last.current.push(side); else last.current.pop();
        setM((x) => ({ ...x, sets: d.sets, homeScore: d.home, awayScore: d.away, status: d.status }));
        if (d.matchEnded) setMsg('Maç bitti. Tahminler sonuçlandı, takipçilere bildirim gitti.');
        else if (d.setEnded) setMsg('Set bitti, yeni set başladı.');
    };
    const undo = () => { const side = last.current[last.current.length - 1]; if (side) point(side, -1); else setMsg('Bu oturumda geri alınacak sayı yok.'); };

    useEffect(() => {
        const onKey = (e) => {
            if (e.target.closest('input, textarea, select')) return;
            if (e.key === 'a' || e.key === 'A') point('home');
            else if (e.key === 'l' || e.key === 'L') point('away');
            else if (e.key === 'z' || e.key === 'Z') undo();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const cur = m.sets.length ? m.sets[m.sets.length - 1] : [0, 0];
    const finished = m.status === 'FINISHED';
    return (
        <>
            <header className="admin-header">
                <div>
                    <Link href={`/admin/mac-merkezi/${m.leagueId}`} className="hint" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><ArrowLeft size={14} /> {m.league}</Link>
                    <h1>Canlı skor</h1>
                    <p>{m.status === 'LIVE' ? <span className="badge danger">● Canlı</span> : finished ? <span className="badge ok">Bitti</span> : <span className="badge">Başlamadı: ilk sayıyla canlıya geçer</span>} · Kısayollar: <kbd>A</kbd> ev sahibi, <kbd>L</kbd> deplasman, <kbd>Z</kbd> geri al</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <a className="admin-btn" href={`/mac/${m.id}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Maç sayfası</a>
                    {m.articleId && <a className="admin-btn" href={`/admin/canli/${m.articleId}`}><Radio size={15} /> Canlı anlatım</a>}
                </div>
            </header>
            {msg && <div className="admin-msg success" role="status">{msg}</div>}
            <div className="ls-board">
                <div className="ls-sets">Setler <b>{m.homeScore} - {m.awayScore}</b>{m.sets.length > 0 && <span> ({m.sets.map((s) => s.join('-')).join(', ')})</span>}</div>
                <div className="ls-sides">
                    {[['home', m.home, cur[0]], ['away', m.away, cur[1]]].map(([side, name, pts]) => (
                        <button key={side} type="button" className={`ls-btn ${side}`} onClick={() => point(side)} disabled={busy || finished} aria-label={`${name} sayı kazandı`}>
                            <span className="ls-name">{name}</span>
                            <span className="ls-pts">{pts}</span>
                            <span className="ls-hint">+1 sayı ({side === 'home' ? 'A' : 'L'})</span>
                        </button>
                    ))}
                </div>
                <button type="button" className="admin-btn" onClick={undo} disabled={busy}><Undo2 size={15} /> Son sayıyı geri al</button>
            </div>
        </>
    );
}
