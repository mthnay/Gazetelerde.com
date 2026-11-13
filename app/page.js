import Link from 'next/link';
import BreakingTicker from '@/components/BreakingTicker';
import MostRead from '@/components/MostRead';
import LiveFeed from '@/components/LiveFeed';
import Story from '@/components/Story';
import SectionHead from '@/components/SectionHead';
import Newsletter from '@/components/Newsletter';
import { getBreakingNews, getCategories, getLatestNews, getMostRead } from '@/lib/news';
import { absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { buildSafe } from '@/lib/db';

// Ana sayfa önbellekten sunulur; 60 sn'de bir ve her yayında tazelenir
export const revalidate = 60;

// Google'da site adı ve site içi arama kutusu için
const siteJsonLd = [
  {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/'), description: SITE_DESCRIPTION, inLanguage: 'tr',
    potentialAction: { '@type': 'SearchAction', target: `${absoluteUrl('/search')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  },
  { '@context': 'https://schema.org', '@type': 'NewsMediaOrganization', name: SITE_NAME, url: absoluteUrl('/'), logo: absoluteUrl('/icon') },
];

const titleCase = (s) => s.charAt(0) + s.slice(1).toLocaleLowerCase('tr');

export default async function Home() {
  const [allNews, categories, breaking, mostRead] = await buildSafe(
    () => Promise.all([getLatestNews({ take: 60 }), getCategories(), getBreakingNews(), getMostRead(5)]),
    [[], [], { flagged: false, items: [] }, []],
  );

  if (!allNews.length) {
    return (
      <div className="container status-page">
        <div>
          <span className="kicker">Gazetelerde</span>
          <h1>Baskı hazırlanıyor</h1>
          <p>Henüz yayında haber yok. Yönetim panelinden ilk haberinizi yayınlayın.</p>
        </div>
      </div>
    );
  }

  // Manşet: işaretli manşet haberi varsa o, yoksa en yeni haber
  const lead = allNews.find((n) => n.featured) || allNews[0];
  const rest = allNews.filter((n) => n.id !== lead.id);
  const side = rest.slice(0, 4);
  const strip = rest.slice(4, 8);
  const blocks = categories
    .map((c) => ({ cat: c, items: allNews.filter((n) => n.category === c.slug).slice(0, 4) }))
    .filter((b) => b.items.length >= 2);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <BreakingTicker items={breaking.items} flagged={breaking.flagged} />

      {/* MANŞET */}
      <section className="container front" aria-label="Manşet">
        <div className="front-grid">
          <div className="rise">
            <Story item={lead} variant="lead" summary priority reveal={false} as="div" />
          </div>
          <div className="front-side">
            <span className="kicker kicker--live">Şimdi gündemde</span>
            {side.map((n, i) => <Story key={n.id} item={n} variant="row" index={i} />)}
          </div>
        </div>
        {strip.length > 0 && (
          <div className="front-strip">
            {strip.map((n, i) => <Story key={n.id} item={n} variant="card" index={i} />)}
          </div>
        )}
      </section>

      {/* Tipografik akış bandı */}
      <div className="marquee-band" aria-hidden="true" style={{ marginTop: 'clamp(40px, 6vw, 72px)' }}>
        <div className="marquee-band-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {categories.map((c, i) => (
                <span key={c.slug} className={i % 2 ? 'outline' : ''}>{titleCase(c.label)}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* KATEGORİLER + KENAR SÜTUNU */}
      <div className="container section split">
        <div>
          {blocks.map(({ cat, items }, bi) => (
            <section key={cat.slug} className="section" style={bi === 0 ? { paddingTop: 0 } : undefined} aria-label={cat.label}>
              <SectionHead title={titleCase(cat.label)} kicker={cat.description} href={`/category/${cat.slug}`} />
              <div className="cat-block">
                <Story item={items[0]} variant="feature" summary />
                <div className="cat-block-list">
                  {items.slice(1).map((n, i) => <Story key={n.id} item={n} variant="text" index={i + 1} />)}
                </div>
              </div>
            </section>
          ))}
        </div>
        <aside className="split-aside" aria-label="Kenar sütunu">
          <MostRead items={mostRead} />
          <LiveFeed items={allNews.slice(0, 7)} />
          <Link href="/search" className="btn btn-block" data-reveal>Arşivde ara</Link>
        </aside>
      </div>

      <div className="container">
        <Newsletter />
      </div>
    </>
  );
}
