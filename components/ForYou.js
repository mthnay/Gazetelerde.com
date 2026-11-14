"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import Story from '@/components/Story';
import MatchCard from '@/components/MatchCard';

// Ana sayfadaki "Sizin için" bölümü: yalnızca giriş yapmış okurda, istemcide yüklenir (sayfa önbellekte kalır)
export default function ForYou() {
    const { user, loading } = useSession();
    const [feed, setFeed] = useState(null);

    useEffect(() => {
        if (!user) return;
        let alive = true;
        fetch('/api/me/feed', { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (alive && d.success) setFeed(d); }).catch(() => {});
        return () => { alive = false; };
    }, [user]);

    if (loading || !user || !feed) return null;
    const empty = !feed.teams.length && !feed.categories.length;
    return (
        <section className="container section for-you" aria-labelledby="for-you-title">
            <div className="section-head">
                <div>
                    <span className="kicker"><Sparkles size={13} aria-hidden="true" /> Kişisel</span>
                    <h2 id="for-you-title" className="section-title">Sizin için, {user.name.split(' ')[0]}</h2>
                </div>
            </div>
            {empty ? (
                <p className="for-you-empty">Takımlarınızı ve kategorilerinizi seçin, ana sayfanız size göre şekillensin: <Link href="/mac-merkezi">Maç Merkezi</Link>&apos;nde takımınızın yanındaki ☆ işaretine, kategori sayfalarında <b>Takip et</b>&apos;e dokunun.</p>
            ) : (
                <>
                    {feed.matches.length > 0 && <div className="match-grid for-you-matches">{feed.matches.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>}
                    {feed.articles.length > 0
                        ? <div className="grid-auto" style={{ '--min': '260px' }}>{feed.articles.slice(0, 8).map((n, i) => <Story key={n.id} item={n} variant="card" index={i % 4} reveal={false} />)}</div>
                        : <p className="for-you-empty">Takip ettiklerinizle ilgili son iki haftada haber yok.</p>}
                    <p className="field-hint" style={{ marginTop: 12 }}>
                        Takip: {[...feed.teams.map((t) => t.name), ...feed.categories.map((c) => c.label)].join(', ')} · <Link href="/profile?sekme=takip">düzenle</Link>
                    </p>
                </>
            )}
        </section>
    );
}
