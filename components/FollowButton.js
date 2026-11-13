"use client";
import { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Check } from 'lucide-react';

export default function FollowButton({ slug, label }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useSession();
    const isLoggedIn = !!user;
    const [following, setFollowing] = useState(false);

    // Takip durumu kişiye özel olduğu için tarayıcıda alınır
    useEffect(() => {
        if (!user) return;
        fetch(`/api/categories/${slug}/follow`, { cache: 'no-store' })
            .then((r) => r.json()).then((d) => setFollowing(!!d.following)).catch(() => { });
    }, [user, slug]);
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        if (!isLoggedIn) return router.push(`/login?next=${encodeURIComponent(pathname)}`);
        setBusy(true);
        const res = await fetch(`/api/categories/${slug}/follow`, { method: following ? 'DELETE' : 'POST' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        if (data?.success) setFollowing(data.following);
    };

    return (
        <button onClick={toggle} disabled={busy} className={`btn ${following ? 'btn-following' : 'btn-primary'}`} aria-pressed={following}>
            {following ? <><Check size={16} /> Takip ediliyor</> : <><Plus size={16} /> {label} kategorisini takip et</>}
        </button>
    );
}
