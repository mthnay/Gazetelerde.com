"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Plus, LogIn } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

// Arkadaş ligleri: kur, kodla katıl, liglerim
export default function FriendLeagues() {
    const { user, loading } = useSession();
    const router = useRouter();
    const [groups, setGroups] = useState(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (!user) return;
        fetch('/api/tahmin-ligi/gruplar', { cache: 'no-store' }).then((r) => r.json()).then((d) => setGroups(d.groups || [])).catch(() => setGroups([]));
    }, [user]);

    const post = async (body) => {
        setMsg('');
        const d = await fetch('/api/tahmin-ligi/gruplar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
        if (!d?.success) return setMsg(d?.message || 'İşlem başarısız.');
        router.push(`/tahmin-ligi/grup/${d.code}`);
    };

    if (loading) return null;
    return (
        <section className="friend-leagues" aria-labelledby="arkadas">
            <h2 id="arkadas" className="mc-title"><Users size={22} aria-hidden="true" /> Arkadaş ligleri</h2>
            {!user ? (
                <p className="field-hint">Arkadaşlarınızla kendi sıralamanızı kurmak için <Link href="/login?next=/tahmin-ligi">giriş yapın</Link>.</p>
            ) : (
                <>
                    {groups?.length > 0 && (
                        <ul className="timeline" style={{ marginBottom: 14 }}>
                            {groups.map((g) => <li key={g.id}><Link href={`/tahmin-ligi/grup/${g.code}`}>{g.name}</Link> <small className="muted">{g.members} kişi{g.owner ? ' · kurucu' : ''}</small></li>)}
                        </ul>
                    )}
                    <form className="fl-form" onSubmit={(e) => { e.preventDefault(); post({ name }); }}>
                        <label className="sr-only" htmlFor="fl-name">Yeni lig adı</label>
                        <input id="fl-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Ofis Tahmin Ligi" maxLength={40} />
                        <button className="btn btn-primary" disabled={name.trim().length < 3}><Plus size={16} /> Lig kur</button>
                    </form>
                    <form className="fl-form" onSubmit={(e) => { e.preventDefault(); post({ code }); }}>
                        <label className="sr-only" htmlFor="fl-code">Davet kodu</label>
                        <input id="fl-code" className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Davet kodu" maxLength={7} />
                        <button className="btn" disabled={code.trim().length < 5}><LogIn size={16} /> Katıl</button>
                    </form>
                    {msg && <p className="field-hint" role="status">{msg}</p>}
                </>
            )}
        </section>
    );
}
