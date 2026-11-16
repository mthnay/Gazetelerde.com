import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import FeedImporter from '@/components/admin/FeedImporter';
import FeedInbox from '@/components/admin/FeedInbox';
import FeedSources from '@/components/admin/FeedSources';
import FeedPresets from '@/components/admin/FeedPresets';
import { PRESETS, PRESET_DEFAULTS } from '@/lib/feedPresets';

export const metadata = { title: 'İçerik Çek | Yönetim' };

export default async function ImportPage({ searchParams }) {
    const user = await requirePageUser();
    const { sekme = 'gelen', durum } = await searchParams;
    const tab = ['gelen', 'kaynaklar', 'tek'].includes(sekme) ? sekme : 'gelen';
    const status = durum === 'IGNORED' ? 'IGNORED' : durum === 'DRAFTED' ? 'DRAFTED' : 'NEW';

    const [counts, sources, categories] = await Promise.all([
        prisma.feedItem.groupBy({ by: ['status'], _count: true }),
        prisma.feedSource.findMany({
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, url: true, active: true, kind: true, mode: true, sport: true, linkPattern: true, include: true, exclude: true, breaking: true, rewrite: true, preset: true, keepDays: true, lastFetchedAt: true, lastError: true, category: { select: { slug: true, label: true } }, _count: { select: { items: true } } },
        }),
        prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, label: true } }),
    ]);
    // Hazır kaynak başına yayında olan haber sayısı
    const published = tab === 'kaynaklar' ? Object.fromEntries((await prisma.feedItem.groupBy({
        by: ['sourceId'], where: { article: { is: { status: 'PUBLISHED' } } }, _count: true,
    })).map((r) => [r.sourceId, r._count])) : {};
    const count = (s) => counts.find((c) => c.status === s)?._count ?? 0;

    const items = tab === 'gelen' ? await prisma.feedItem.findMany({
        where: { status },
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        take: 100,
        select: {
            id: true, title: true, link: true, summary: true, image: true, publishedAt: true, createdAt: true, status: true,
            source: { select: { name: true, category: { select: { slug: true } } } },
            article: { select: { id: true, title: true } },
        },
    }) : [];

    const tabs = [['gelen', `Gelen kutusu`, count('NEW')], ['kaynaklar', 'Kaynaklar', sources.length], ['tek', 'Tek seferlik', null]];

    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>İçerik Çek</h1>
                    <p>Tanımlı kaynaklar (RSS ya da akışı olmayan siteler için haber listesi sayfası) düzenli olarak taranır. Her kaynak için yeni haberlerin gelen kutusuna mı düşeceğini, taslak / onaya mı gideceğini yoksa doğrudan mı yayımlanacağını seçin. Dış otomasyonlar için: POST /api/ingest/articles.</p>
                </div>
            </header>
            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    {tabs.map(([id, label, n]) => (
                        <Link key={id} href={`/admin/icerik-cek?sekme=${id}`} className={`admin-tab ${tab === id ? 'active' : ''}`}>
                            {label}{n !== null && <span className="count">{n}</span>}
                        </Link>
                    ))}
                </nav>
                {tab === 'gelen' && (
                    <nav className="admin-tabs">
                        {[['NEW', 'Yeni', count('NEW')], ['DRAFTED', 'Taslak yapılan', count('DRAFTED')], ['IGNORED', 'Yok sayılan', count('IGNORED')]].map(([s, label, n]) => (
                            <Link key={s} href={`/admin/icerik-cek?sekme=gelen&durum=${s}`} className={`admin-tab ${status === s ? 'active' : ''}`}>
                                {label}<span className="count">{n}</span>
                            </Link>
                        ))}
                    </nav>
                )}
            </div>

            {tab === 'gelen' && (
                <FeedInbox
                    status={status}
                    hasSources={sources.length > 0}
                    items={items.map((i) => ({
                        ...i,
                        publishedAt: i.publishedAt?.toISOString() ?? null,
                        createdAt: i.createdAt.toISOString(),
                        sourceName: i.source.name,
                        category: i.source.category?.slug ?? '',
                    }))}
                />
            )}
            {tab === 'kaynaklar' && (
                <FeedPresets
                    canManage={canPublish(user)}
                    presets={PRESETS.map((p) => {
                        const s = sources.find((x) => x.preset === p.key);
                        return { key: p.key, name: p.name, description: p.description, active: Boolean(s?.active), keepDays: s?.keepDays || PRESET_DEFAULTS.keepDays, lastError: s?.lastError || null, published: published[s?.id] || 0 };
                    })}
                />
            )}
            {tab === 'kaynaklar' && (
                <FeedSources
                    canManage={canPublish(user)}
                    categories={categories}
                    sources={sources.map((s) => ({ ...s, lastFetchedAt: s.lastFetchedAt?.toISOString() ?? null, items: s._count.items }))}
                />
            )}
            {tab === 'tek' && <FeedImporter />}
        </>
    );
}
