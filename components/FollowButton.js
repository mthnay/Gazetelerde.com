"use client";
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Check } from 'lucide-react';

export default function FollowButton({ slug, label, initialFollowing, isLoggedIn }) {
    const router = useRouter();
    const pathname = usePathname();
    const [following, setFollowing] = useState(initialFollowing);
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
