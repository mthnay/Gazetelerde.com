import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import SubscriberTable from '@/components/admin/newsletter/SubscriberTable';

export const metadata = { title: 'Bülten aboneleri | Yönetim' };

const FILTERS = {
    onayli: { label: 'Onaylı', where: { active: true, confirmedAt: { not: null } } },
    bekleyen: { label: 'Onay bekleyen', where: { active: true, confirmedAt: null } },
    ayrilan: { label: 'Ayrılan', where: { active: false } },
};

export default async function Subscribers({ searchParams }) {
    await requirePageUser(canPublish);
    const sp = await searchParams;
    const f = FILTERS[sp.durum] ? sp.durum : undefined;
    const q = String(sp.q || '').trim().slice(0, 100);
    const where = { ...(f ? FILTERS[f].where : {}), ...(q ? { email: { contains: q, mode: 'insensitive' } } : {}) };
    const [rows, total, ...counts] = await Promise.all([
        prisma.subscriber.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 }),
        prisma.subscriber.count(),
        ...Object.values(FILTERS).map((x) => prisma.subscriber.count({ where: x.where })),
    ]);
    const subs = rows.map((s) => ({
        id: s.id, email: s.email, active: s.active, createdAt: s.createdAt.toISOString(),
        confirmedAt: s.confirmedAt?.toISOString() ?? null, unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
    }));
    const href = (d) => `/admin/bulten/aboneler${d ? `?durum=${d}` : ''}`;

    return (
        <>
            <header className="admin-header">
                <div><h1>Bülten aboneleri</h1><p>Yalnızca onaylı aboneler bülten alır. Liste dışa aktarılabilir.</p></div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/admin/bulten" className="admin-btn">Bültenler</Link>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- dosya indirme, sayfa değil */}
                    <a href="/api/admin/subscribers/export" className="admin-btn" download>CSV indir</a>
                </div>
            </header>
            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    <Link href={href()} className={`admin-tab ${!f ? 'active' : ''}`}>Tümü<span className="count">{total}</span></Link>
                    {Object.entries(FILTERS).map(([k, x], i) => (
                        <Link key={k} href={href(k)} className={`admin-tab ${f === k ? 'active' : ''}`}>{x.label}<span className="count">{counts[i]}</span></Link>
                    ))}
                </nav>
                <form className="admin-search" action="/admin/bulten/aboneler">
                    {f && <input type="hidden" name="durum" value={f} />}
                    <input className="admin-input" type="search" name="q" defaultValue={q} placeholder="E-posta ara..." aria-label="Abone ara" />
                </form>
            </div>
            <SubscriberTable initial={subs} />
        </>
    );
}
