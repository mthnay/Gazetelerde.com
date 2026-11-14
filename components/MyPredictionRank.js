"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/SessionProvider';

export default function MyPredictionRank({ period }) {
    const { user, loading } = useSession();
    const [me, setMe] = useState(null);
    useEffect(() => {
        if (!user) return;
        fetch(`/api/tahmin-ligi?donem=${period}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => setMe(d.me)).catch(() => {});
    }, [user, period]);
    if (loading) return null;
    if (!user) return <p className="my-rank">Puanınızın sayılması için <Link href="/login?next=/tahmin-ligi">giriş yapın</Link> ya da <Link href="/register">ücretsiz üye olun</Link>. Üye olmadan verilen tahminler sıralamaya girmez.</p>;
    if (!me) return null;
    return <p className="my-rank">{me.rank ? <>Sıranız: <b>{me.rank}.</b> / {me.of} · {me.points} puan · {me.correct}/{me.total} doğru</> : 'Henüz sonuçlanmış tahmininiz yok; aşağıdaki maçlardan başlayın.'}</p>;
}
