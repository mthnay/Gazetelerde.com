"use client";
import { useEffect, useRef, useState } from 'react';
import { Pin } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import MatchCard from '@/components/MatchCard';

const KIND = { onemli: 'Önemli', skor: 'Skor', son: 'Son durum' };
const POLL_MS = 20000;
const hm = (iso) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(iso));

function Entry({ e, isNew }) {
    return (
        <li className={`live-entry kind-${e.kind} ${isNew ? 'is-new' : ''}`} id={`g-${e.id}`}>
            <time dateTime={e.createdAt} className="live-time">{hm(e.createdAt)}</time>
            <div className="live-body">
                {KIND[e.kind] && <span className="live-kind">{KIND[e.kind]}</span>}
                <p>{e.text}</p>
                {e.image && <div className="live-img"><SmartImage src={e.image} alt="" sizes="(max-width: 760px) 100vw, 640px" /></div>}
            </div>
        </li>
    );
}

/**
 * Canlı anlatım akışı. İlk liste sunucudan gelir (SEO ve hızlı ilk boyama);
 * anlatım sürerken sekme açıkken 20 sn'de bir yeni / düzenlenen / silinen girişler çekilir.
 */
export default function LiveBlog({ articleId, initialEntries, initialMatches = [], initialLive }) {
    const [entries, setEntries] = useState(initialEntries);
    const [matches, setMatches] = useState(initialMatches);
    const [live, setLive] = useState(initialLive);
    const [fresh, setFresh] = useState(new Set());
    const [pending, setPending] = useState([]); // okur aşağıdayken gelenler, düğmeyle eklenir
    const since = useRef(new Date().toISOString());
    const listRef = useRef(null);

    useEffect(() => {
        if (!live) return;
        let timer;
        const poll = async () => {
            if (document.visibilityState !== 'visible') return;
            const d = await fetch(`/api/articles/${articleId}/live?since=${encodeURIComponent(since.current)}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
            if (!d?.success) return;
            since.current = d.serverTime;
            setLive(d.live);
            setMatches(d.matches);
            const keep = new Set(d.ids);
            const atTop = (listRef.current?.getBoundingClientRect().top ?? 0) > -200;
            setEntries((cur) => {
                const changed = new Map(d.entries.map((e) => [e.id, e]));
                const updated = cur.filter((e) => keep.has(e.id)).map((e) => changed.get(e.id) || e);
                const added = d.entries.filter((e) => !cur.some((c) => c.id === e.id));
                if (added.length && !atTop) { setPending((p) => [...added, ...p.filter((x) => !added.some((a) => a.id === x.id))]); return updated; }
                if (added.length) setFresh(new Set(added.map((e) => e.id)));
                return [...added, ...updated].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            });
        };
        timer = setInterval(poll, POLL_MS);
        const onVis = () => document.visibilityState === 'visible' && poll();
        document.addEventListener('visibilitychange', onVis);
        return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVis); };
    }, [articleId, live]);

    const showPending = () => {
        setEntries((cur) => [...pending, ...cur].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setFresh(new Set(pending.map((e) => e.id)));
        setPending([]);
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const pinned = entries.find((e) => e.pinned);
    return (
        <section className="liveblog" aria-label="Canlı anlatım">
            {matches.length > 0 && <div className="live-matches">{matches.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>}
            <div className="live-head">
                {live ? <span className="kicker kicker--live">Canlı anlatım</span> : <span className="kicker">Anlatım sona erdi</span>}
                <span className="field-hint">{entries.length} güncelleme{live ? ' · otomatik yenileniyor' : ''}</span>
            </div>
            {pinned && <div className="live-pinned"><Pin size={14} aria-hidden="true" /><span className="sr-only">Sabitlenmiş: </span><ol className="live-list" style={{ flex: 1 }}><Entry e={pinned} /></ol></div>}
            {pending.length > 0 && (
                <button type="button" className="btn btn-primary live-pending" onClick={showPending}>{pending.length} yeni güncelleme</button>
            )}
            {/* Yeni girişler ekran okuyuculara nazikçe duyurulur */}
            <ol ref={listRef} className="live-list" aria-live="polite" aria-relevant="additions">
                {entries.filter((e) => !e.pinned).map((e) => <Entry key={e.id} e={e} isNew={fresh.has(e.id)} />)}
            </ol>
        </section>
    );
}
