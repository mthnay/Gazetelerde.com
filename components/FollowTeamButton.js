"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

const followed = { list: null, promise: null };
async function loadFollowed() {
    followed.promise ??= fetch('/api/me/feed', { cache: 'no-store' }).then((r) => r.json()).then((d) => { followed.list = new Set((d.teams || []).map((t) => t.id)); return followed.list; }).catch(() => new Set());
    return followed.promise;
}

// Takımı takip et yıldızı (puan durumu ve maç sayfalarında)
export default function FollowTeamButton({ teamId, teamName }) {
    const { user } = useSession();
    const router = useRouter();
    const [on, setOn] = useState(false);

    useEffect(() => {
        if (!user) return;
        loadFollowed().then((s) => setOn(s.has(teamId)));
    }, [user, teamId]);

    const toggle = async () => {
        if (!user) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        const next = !on;
        setOn(next);
        const r = await fetch(`/api/teams/${teamId}/follow`, { method: next ? 'POST' : 'DELETE' }).then((x) => x.json()).catch(() => null);
        if (!r?.success) setOn(!next);
        else if (followed.list) next ? followed.list.add(teamId) : followed.list.delete(teamId);
    };
    return (
        <button type="button" className={`follow-star ${on ? 'is-on' : ''}`} onClick={toggle} aria-pressed={on} aria-label={on ? `${teamName} takibini bırak` : `${teamName} takımını takip et`} title={on ? 'Takibi bırak' : 'Takip et: maç başlayınca ve bitince bildirim'}>
            <Star size={15} fill={on ? 'currentColor' : 'none'} />
        </button>
    );
}
