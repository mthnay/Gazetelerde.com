"use client";
import { useEffect, useState } from 'react';
import { Check, Share2, Trophy } from 'lucide-react';

const pct = (v, t) => (t ? Math.round((v / t) * 100) : 0);

// Anket / tahmin kutusu. Oy verince (ya da anket kapanınca) sonuçlar çubuklarla açılır.
export default function PollWidget({ pollId, standalone = false }) {
    const [poll, setPoll] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        let alive = true;
        fetch(`/api/polls/${pollId}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (alive && d.success) setPoll(d.poll); }).catch(() => {});
        return () => { alive = false; };
    }, [pollId]);

    if (!poll) return standalone ? <h1 className="sr-only">Anket</h1> : <div className="poll poll--loading" aria-hidden="true" />;
    const vote = async (optionId) => {
        setBusy(true); setMsg('');
        const d = await fetch(`/api/polls/${pollId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ optionId }) }).then((r) => r.json()).catch(() => null);
        setBusy(false);
        if (d?.success) setPoll(d.poll); else setMsg(d?.message || 'Oy kaydedilemedi.');
    };
    const share = async () => {
        const url = `${location.origin}/anket/${poll.id}`;
        try { if (navigator.share) await navigator.share({ title: poll.question, url }); else { await navigator.clipboard.writeText(url); setMsg('Bağlantı kopyalandı.'); } } catch { /* vazgeçildi */ }
    };

    const voted = poll.myVote != null;
    const showResults = poll.total != null;
    const tahmin = poll.kind === 'tahmin';
    const correct = poll.options.find((o) => o.id === poll.correctId);
    return (
        <section className={`poll ${tahmin ? 'poll--tahmin' : ''}`} aria-labelledby={`poll-${poll.id}`}>
            <span className="kicker">{tahmin ? <><Trophy size={13} aria-hidden="true" /> Tahmin</> : 'Anket'}</span>
            {standalone
                ? <h1 id={`poll-${poll.id}`} className="poll-q">{poll.question}</h1>
                : <h2 id={`poll-${poll.id}`} className="poll-q">{poll.question}</h2>}
            <ul className="poll-options">
                {poll.options.map((o) => {
                    const mine = poll.myVote === o.id;
                    const isCorrect = poll.correctId === o.id;
                    return (
                        <li key={o.id}>
                            {showResults ? (
                                <div className={`poll-result ${mine ? 'is-mine' : ''} ${isCorrect ? 'is-correct' : ''}`}>
                                    <span className="poll-fill" style={{ width: `${pct(o.votes, poll.total)}%` }} />
                                    <span className="poll-text">{isCorrect && <Check size={15} aria-label="Doğru" />} {o.text}{mine && <small> (oyunuz)</small>}</span>
                                    <strong>%{pct(o.votes, poll.total)}</strong>
                                </div>
                            ) : (
                                <button type="button" className={`poll-btn ${mine ? 'is-mine' : ''}`} disabled={busy || voted || poll.closed} onClick={() => vote(o.id)} aria-pressed={mine}>{o.text}{mine && ' ✓'}</button>
                            )}
                        </li>
                    );
                })}
            </ul>
            <div className="poll-foot">
                <span>
                    {showResults ? `${poll.total} oy` : voted ? 'Oyunuz alındı; sonuçlar anket kapanınca açıklanacak.' : poll.closed ? 'Oylama kapandı.' : poll.closesAt ? `Oylama ${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(poll.closesAt))} tarihinde kapanır.` : 'Oyunuzu verin, sonuçları görün.'}
                    {tahmin && correct && voted && <b> {poll.myVote === poll.correctId ? ' 🎉 Doğru tahmin!' : ' Bu sefer olmadı.'}</b>}
                    {tahmin && !correct && !poll.closed && ' Maç bitince doğru tahmin açıklanır.'}
                </span>
                <button type="button" className="poll-share" onClick={share} aria-label="Anketi paylaş"><Share2 size={15} /></button>
            </div>
            {msg && <p className="field-hint" role="status">{msg}</p>}
        </section>
    );
}
