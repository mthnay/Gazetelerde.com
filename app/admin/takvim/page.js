import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish, STATUS_LABELS } from '@/lib/permissions';

export const metadata = { title: 'Yayın takvimi | Yönetim' };

const TZ = 'Europe/Istanbul';
const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const hm = (d) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);

async function load(user, monthStart, monthEnd) {
    const mine = canPublish(user) ? {} : { authorId: user.id };
    const [rows, queue] = await Promise.all([
        prisma.article.findMany({
            where: { ...mine, publishedAt: { gte: monthStart, lt: monthEnd }, status: { not: 'ARCHIVED' } },
            orderBy: { publishedAt: 'asc' },
            select: { id: true, title: true, status: true, publishedAt: true, category: { select: { label: true } } },
        }),
        prisma.article.findMany({
            where: { ...mine, status: 'REVIEW' }, orderBy: { updatedAt: 'asc' },
            select: { id: true, title: true, updatedAt: true, author: { select: { name: true } } },
        }),
    ]);
    return { rows, queue, now: new Date() };
}

// Aylık yayın takvimi: yayınlanan, zamanlanmış (ileri tarihli) ve tarihi belirlenmiş taslak/onaydaki haberler
export default async function Calendar({ searchParams }) {
    const user = await requirePageUser();
    const sp = await searchParams;
    const [y, m] = /^\d{4}-\d{2}$/.test(sp.ay || '') ? sp.ay.split('-').map(Number) : dayKey(new Date()).split('-').slice(0, 2).map(Number);
    const monthStart = new Date(Date.UTC(y, m - 1, 1, -3)); // İstanbul gece yarısı (UTC+3)
    const monthEnd = new Date(Date.UTC(y, m, 1, -3));
    const { rows, queue, now } = await load(user, monthStart, monthEnd);

    const byDay = new Map();
    for (const a of rows) {
        const k = dayKey(a.publishedAt);
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(a);
    }
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7; // pazartesi başlangıçlı
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    const ym = (yy, mm) => `${yy}-${String(mm).padStart(2, '0')}`;
    const prev = m === 1 ? ym(y - 1, 12) : ym(y, m - 1), next = m === 12 ? ym(y + 1, 1) : ym(y, m + 1);
    const today = dayKey(now);
    const title = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);
    const label = (a) => (a.status === 'PUBLISHED' && a.publishedAt > now ? 'Zamanlandı' : STATUS_LABELS[a.status]);
    const cls = (a) => (a.status === 'PUBLISHED' && a.publishedAt > now ? 'SCHEDULED' : a.status);

    return (
        <>
            <header className="admin-header">
                <div><h1>Yayın takvimi</h1><p>İleri tarihli haberler o saatte kendiliğinden yayına girer. Taslak ve onaydaki haberler planlanan tarihlerinde görünür.</p></div>
                <Link href="/admin/haberler/yeni" className="admin-btn primary">Yeni Haber</Link>
            </header>

            {queue.length > 0 && (
                <section className="admin-panel" style={{ marginBottom: 16 }}>
                    <h2 style={{ marginTop: 0 }}>Onay bekleyenler ({queue.length})</h2>
                    <ul className="admin-list">
                        {queue.map((a) => (
                            <li key={a.id} className="admin-list-row">
                                <Link href={`/admin/haberler/${a.id}`} style={{ flex: 1 }}>{a.title}</Link>
                                <span className="muted">{a.author?.name || '—'}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="admin-panel">
                <div className="cal-head">
                    <Link className="admin-btn" href={`/admin/takvim?ay=${prev}`} aria-label="Önceki ay">←</Link>
                    <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{title}</h2>
                    <Link className="admin-btn" href={`/admin/takvim?ay=${next}`} aria-label="Sonraki ay">→</Link>
                </div>
                <div className="cal-grid" role="grid" aria-label={`${title} yayın takvimi`}>
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
                    {cells.map((d, i) => {
                        if (!d) return <div key={`e${i}`} className="cal-cell is-empty" />;
                        const k = `${ym(y, m)}-${String(d).padStart(2, '0')}`;
                        const items = byDay.get(k) || [];
                        return (
                            <div key={k} className={`cal-cell ${k === today ? 'is-today' : ''} ${k < today ? 'is-past' : ''}`} role="gridcell">
                                <span className="cal-day">{d}</span>
                                {items.slice(0, 4).map((a) => (
                                    <Link key={a.id} href={`/admin/haberler/${a.id}`} className={`cal-item ${cls(a)}`} title={`${hm(a.publishedAt)} · ${label(a)} · ${a.category.label}\n${a.title}`}>
                                        <b>{hm(a.publishedAt)}</b> {a.title}
                                    </Link>
                                ))}
                                {items.length > 4 && <span className="cal-more">+{items.length - 4} haber</span>}
                            </div>
                        );
                    })}
                </div>
                <p className="hint" style={{ marginTop: 10 }}>
                    <span className="cal-key PUBLISHED" /> Yayında <span className="cal-key SCHEDULED" /> Zamanlandı <span className="cal-key REVIEW" /> Onay bekliyor <span className="cal-key DRAFT" /> Taslak
                </p>
            </section>
        </>
    );
}
