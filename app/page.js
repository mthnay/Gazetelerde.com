import BreakingTicker from '@/components/BreakingTicker';
import MostRead from '@/components/MostRead';
import LiveFeed from '@/components/LiveFeed';
import Story from '@/components/Story';
import SectionHead from '@/components/SectionHead';
import Newsletter from '@/components/Newsletter';
import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
import AdSlot from '@/components/AdSlot';
import ForYou from '@/components/ForYou';
import { getMatchDay, getFeaturedStandings } from '@/lib/matchCenter';
import StandingsTable from '@/components/StandingsTable';
import { getBreakingNews, getCategories, getLatestNews, getMostRead, getTrendingTags } from '@/lib/news';
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
  const [allNews, categories, breaking, mostRead, topics, matchDay, standings, volleyNews] = await buildSafe(
    () => Promise.all([getLatestNews({ take: 60 }), getCategories(), getBreakingNews(), getMostRead(5), getTrendingTags(12), getMatchDay(), getFeaturedStandings(2), getLatestNews({ tag: 'voleybol', take: 5 })]),
    [[], [], { flagged: false, items: [] }, [], [], { live: [], upcoming: [], results: [] }, [], []],
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
  // Kategori satırları: 4+ haber -> büyük blok, 3 -> üç kart, 1-2 -> başka küçük kategoriyle yan yana
  const blocks = categories
    .map((c) => ({ cat: c, items: allNews.filter((n) => n.category === c.slug).slice(0, 5) }))
    .filter((b) => b.items.length > 0);
  const rows = [];
  let pending = null;
  for (const b of blocks) {
    if (b.items.length >= 4) rows.push({ type: 'big', ...b });
    else if (b.items.length === 3) rows.push({ type: 'three', ...b });
    else if (pending) { rows.push({ type: 'pair', items: [pending, b] }); pending = null; }
    else pending = b;
  }
  if (pending) rows.push({ type: 'pair', items: [pending] });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      {/* Ekran okuyucular ve arama motorları için sayfa başlığı (görsel tasarımda logo bu görevi görüyor) */}
      <h1 className="sr-only">Gazetelerde: son dakika haberleri, gündem, spor ve ekonomi</h1>
      <BreakingTicker items={breaking.items} flagged={breaking.flagged} />

      {topics.length > 0 && (
        <nav className="container topic-strip" aria-label="Gündemdeki konular">
          <span className="label">Gündemde</span>
          {topics.map((t) => <Link key={t.slug} href={`/etiket/${t.slug}`} className="article-tag">#{t.name}</Link>)}
        </nav>
      )}

      {/* Canlı / yaklaşan maçlar varsa ana sayfada kısa şerit */}
      {(() => {
        const strip = [...matchDay.live, ...matchDay.upcoming.slice(0, 6 - matchDay.live.length)].slice(0, 6);
        return strip.length > 0 && (
          <section className="container home-matches" aria-label="Maçlar">
            <SectionHead title={matchDay.live.length ? 'Canlı skorlar' : 'Yaklaşan maçlar'} kicker="Maç Merkezi" href="/mac-merkezi" />
            <div className="match-grid">{strip.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>
          </section>
        );
      })()}

      {/* MANŞET */}
      <section className="container front" aria-label="Manşet">
        <div className="front-grid">
          <div className="rise">
            <Story item={lead} variant="lead" summary priority reveal={false} as="div" level={2} />
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

      {/* Okunanlar + canlı akış: yan yana, eşit genişlikte (uzun yan sütun boşluk bırakmasın) */}
      <ForYou />

      {/* VOLEYBOL: sitenin odağı — puan durumu özetleri + son voleybol haberleri */}
      {(standings.length > 0 || volleyNews.length > 0) && (
        <section className="container section volley-home" aria-labelledby="voleybol-baslik">
          <div className="section-head">
            <div><span className="kicker">🏐 Voleybol</span><h2 id="voleybol-baslik" className="section-title"><Link href="/voleybol">Filede bugün</Link></h2></div>
            <nav className="league-tabs" aria-label="Voleybol bağlantıları">
              <Link href="/tahmin-ligi" className="article-tag">Tahmin Ligi</Link>
              <Link href="/transfer" className="article-tag">Transfer</Link>
              <Link href="/oyuncular" className="article-tag">Oyuncular</Link>
            </nav>
          </div>
          <div className="volley-home-grid">
            {standings.map((f) => (
              <div key={f.league.slug}>
                <h3 className="group-title"><Link href={`/mac-merkezi/${f.league.slug}`}>{f.league.name}</Link></h3>
                <StandingsTable rows={f.standings} compact label={`${f.league.name} puan durumu`} />
              </div>
            ))}
            {volleyNews.length > 0 && (
              <div>
                <h3 className="group-title"><Link href="/etiket/voleybol">Son voleybol haberleri</Link></h3>
                <div className="volley-home-news">{volleyNews.map((n, i) => <Story key={n.id} item={n} variant="row" index={i} />)}</div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="container"><AdSlot place="ana-ust" /></div>

      <section className="container section home-band" aria-label="Öne çıkanlar">
        <MostRead items={mostRead} />
        <LiveFeed items={allNews.slice(0, 6)} />
      </section>

      {/* Tipografik akış bandı */}
      <div className="marquee-band" aria-hidden="true">
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

      {/* KATEGORİLER: haber sayısına göre düzen; küçük kategoriler ikişer ikişer eşleşir */}
      <div className="container home-cats">
        {rows.map((row) => (row.type === 'pair' ? (
          <div key={row.items.map((b) => b.cat.slug).join('-')} className="cat-pair">
            {row.items.map(({ cat, items }) => (
              <section key={cat.slug} aria-label={cat.label}>
                <SectionHead title={titleCase(cat.label)} kicker={cat.description} href={`/category/${cat.slug}`} />
                <div className="cat-pair-list">
                  {items.slice(0, 3).map((n, i) => <Story key={n.id} item={n} variant={i === 0 ? 'card' : 'row'} index={i} summary={i === 0} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section key={row.cat.slug} className="cat-row" aria-label={row.cat.label}>
            <SectionHead title={titleCase(row.cat.label)} kicker={row.cat.description} href={`/category/${row.cat.slug}`} />
            {row.type === 'big' ? (
              <div className="cat-block">
                <Story item={row.items[0]} variant="feature" summary />
                <div className="cat-block-list">
                  {row.items.slice(1, 4).map((n, i) => <Story key={n.id} item={n} variant="row" index={i + 1} />)}
                </div>
              </div>
            ) : (
              <div className="grid-3">
                {row.items.slice(0, 3).map((n, i) => <Story key={n.id} item={n} variant="card" summary index={i} />)}
              </div>
            )}
          </section>
        )))}
      </div>

      <div className="container" style={{ marginTop: 'clamp(40px, 6vw, 72px)' }}>
        <AdSlot place="ana-orta" />
        <Newsletter />
      </div>
    </>
  );
}
