import Link from 'next/link';
import { notFound } from 'next/navigation';
import NewsGrid from '@/components/NewsGrid';
import { archiveMonths, archiveDays, archiveArticles, topRead } from '@/lib/archive';
import { articleUrl } from '@/lib/format';

export const revalidate = 600;
export function generateStaticParams() {
    return [];
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const pad = (n) => String(n).padStart(2, '0');

function parse(tarih = []) {
    const [y, m, d] = tarih.map(Number);
    if (tarih.length > 3 || tarih.some((x) => !/^\d+$/.test(x))) return null;
    if (y && (y < 2000 || y > 2100)) return null;
    if (m && (m < 1 || m > 12)) return null;
    if (d && (d < 1 || d > new Date(Date.UTC(y, m, 0)).getUTCDate())) return null;
    return { y, m, d };
}

const label = ({ y, m, d }) => (d ? `${d} ${MONTHS[m - 1]} ${y}` : m ? `${MONTHS[m - 1]} ${y}` : y ? String(y) : 'Arşiv');

export async function generateMetadata({ params }) {
    const p = parse((await params).tarih);
    if (!p) return {};
    const t = label(p);
    return {
        title: p.y ? `${t} Haberleri | Gazetelerde Arşiv` : 'Haber Arşivi | Gazetelerde',
        description: p.y ? `${t} tarihinde Gazetelerde'de yayımlanan tüm haberler.` : 'Gazetelerde haber arşivi: tarihe göre tüm haberler ve dönemin en çok okunanları.',
        alternates: { canonical: `/arsiv${p.y ? `/${p.y}` : ''}${p.m ? `/${pad(p.m)}` : ''}${p.d ? `/${pad(p.d)}` : ''}` },
        robots: p.y ? { index: true, follow: true } : undefined,
    };
}

function TopList({ title, items }) {
    if (!items.length) return null;
    return (
        <section className="archive-top">
            <h2 className="mc-title">{title}</h2>
            <ol>
                {items.map((n, i) => (
                    <li key={n.id}>
                        <span className="archive-rank">{i + 1}</span>
                        <Link href={articleUrl(n)}><strong>{n.title}</strong><small>{n.categoryLabel} · {n.views} okunma</small></Link>
                    </li>
                ))}
            </ol>
        </section>
    );
}

export default async function Archive({ params }) {
    const p = parse((await params).tarih);
    if (!p) notFound();
    const { y, m, d } = p;

    // Kök: aylar + dönemin en çok okunanları
    if (!y) {
        const [months, week, month] = await Promise.all([archiveMonths(), topRead(7), topRead(30)]);
        const years = [...new Set(months.map((r) => r.y))];
        return (
            <div className="container">
                <header className="page-hero">
                    <span className="kicker rise">Gazetelerde</span>
                    <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(48px, 9vw, 120px)' }}>Arşiv<span className="dot">.</span></h1>
                </header>
                <div className="archive-tops">
                    <TopList title="Bu hafta en çok okunanlar" items={week} />
                    <TopList title="Bu ay en çok okunanlar" items={month} />
                </div>
                {years.map((yy) => (
                    <section key={yy} className="archive-year">
                        <h2 className="mc-title"><Link href={`/arsiv/${yy}`}>{yy}</Link></h2>
                        <div className="archive-months">
                            {months.filter((r) => r.y === yy).map((r) => (
                                <Link key={r.m} href={`/arsiv/${yy}/${pad(r.m)}`} className="archive-month"><strong>{MONTHS[r.m - 1]}</strong><span>{r.n} haber</span></Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        );
    }

    // Yıl: aylar
    if (!m) {
        const months = (await archiveMonths()).filter((r) => r.y === y);
        if (!months.length) notFound();
        return (
            <div className="container">
                <header className="page-hero">
                    <Link href="/arsiv" className="kicker rise">Arşiv</Link>
                    <h1 className="page-hero-title rise" style={{ '--i': 1 }}>{y}<span className="dot">.</span></h1>
                </header>
                <div className="archive-months" style={{ marginBottom: 64 }}>
                    {months.map((r) => <Link key={r.m} href={`/arsiv/${y}/${pad(r.m)}`} className="archive-month"><strong>{MONTHS[r.m - 1]}</strong><span>{r.n} haber</span></Link>)}
                </div>
            </div>
        );
    }

    // Ay ya da gün: günler takvimi + haberler
    const [days, items] = await Promise.all([archiveDays(y, m), archiveArticles({ y, m, d })]);
    if (!items.length && !days.length) notFound();
    const prev = m === 1 ? `${y - 1}/12` : `${y}/${pad(m - 1)}`;
    const next = m === 12 ? `${y + 1}/01` : `${y}/${pad(m + 1)}`;
    return (
        <div className="container">
            <header className="page-hero">
                <nav className="kicker rise" aria-label="Arşiv yolu"><Link href="/arsiv">Arşiv</Link> / <Link href={`/arsiv/${y}`}>{y}</Link>{d && <> / <Link href={`/arsiv/${y}/${pad(m)}`}>{MONTHS[m - 1]}</Link></>}</nav>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(42px, 8vw, 104px)' }}>{label(p)}<span className="dot">.</span></h1>
                <p className="page-hero-desc rise" style={{ '--i': 2 }}>{items.length} haber</p>
            </header>
            <nav className="archive-days" aria-label="Günler">
                <Link href={`/arsiv/${prev}`} aria-label="Önceki ay">←</Link>
                {days.map((r) => (
                    <Link key={r.d} href={`/arsiv/${y}/${pad(m)}/${pad(r.d)}`} className={r.d === d ? 'is-active' : ''} aria-current={r.d === d ? 'page' : undefined} title={`${r.n} haber`}>{r.d}</Link>
                ))}
                <Link href={`/arsiv/${next}`} aria-label="Sonraki ay">→</Link>
            </nav>
            {items.length ? <NewsGrid items={items} summary level={2} /> : <div className="empty"><p className="display">Bu tarihte haber yok</p></div>}
        </div>
    );
}
