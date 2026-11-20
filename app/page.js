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
import { getHomeLayout, blockNews } from '@/lib/homeData';
import { absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { unstable_cache } from 'next/cache';
import { connection } from 'next/server';

// Google'da site adı ve site içi arama kutusu için
const siteJsonLd = [
  {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/'), description: SITE_DESCRIPTION, inLanguage: 'tr',
    potentialAction: { '@type': 'SearchAction', target: `${absoluteUrl('/search')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  },
  { '@context': 'https://schema.org', '@type': 'NewsMediaOrganization', name: SITE_NAME, url: absoluteUrl('/'), logo: absoluteUrl('/icon') },
];

const titleCase = (s) => s.charAt(0) + s.slice(1).toLocaleLowerCase('tr');

const getHomeEdition = unstable_cache(async () => {
  // Düzen panelden gelir (Yönetim → Ana Sayfa); her blok kendi verisini yükler
  const { blocks: all } = await getHomeLayout();
  const blocks = all.filter((b) => b.enabled);
  const has = (t) => blocks.some((b) => b.type === t);
  const cfg = (t) => blocks.find((b) => b.type === t)?.settings || {};

  const [allNews, categories, breaking, mostRead, topics, matchDay, standings] = await Promise.all([
    getLatestNews({ take: 60 }), getCategories(),
    has('ticker') ? getBreakingNews(cfg('ticker').count) : { flagged: false, items: [] },
    has('band') ? getMostRead(cfg('band').mostRead || 5) : [],
    has('topics') ? getTrendingTags(cfg('topics').count) : [],
    has('matches') ? getMatchDay() : { live: [], upcoming: [], results: [] },
    has('volley') && cfg('volley').leagues ? getFeaturedStandings(cfg('volley').leagues) : [],
  ]);

  if (!allNews.length) return null;

  // Haber listesi isteyen blokların verisi (sabitlenenler + seçilen kaynak)
  const newsOf = Object.fromEntries(await Promise.all(blocks.map(async (b) => {
    const s = b.settings;
    if (b.type === 'lead') return [b.id, await blockNews(s, 1 + s.sideCount + s.stripCount)];
    if (b.type === 'volley') return [b.id, s.count ? await blockNews(s, s.count) : []];
    if (b.type === 'news') return [b.id, await blockNews(s, s.count)];
    return [b.id, null];
  })));

  const categorySettings = blocks.find((b) => b.type === 'categories')?.settings;
  const categoryList = categorySettings
    ? (categorySettings.categories.length ? categorySettings.categories.map((slug) => categories.find((c) => c.slug === slug)).filter(Boolean) : categories)
    : [];
  const categoryNews = await Promise.all(categoryList.map(async (cat) => ({
    cat, items: await getLatestNews({ category: cat.slug, take: categorySettings.count }),
  })));

  return { blocks, allNews, categories, categoryNews, breaking, mostRead, topics, matchDay, standings, newsOf };
}, ['home-edition'], { revalidate: 60 });

export default async function Home() {
  // İlk baskı, veritabanının erişilebilir olduğu çalışma ortamında hazırlanır.
  await connection();
  const edition = await getHomeEdition();
  if (!edition) {
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

  const { blocks, newsOf, ...ctx } = edition;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      {/* Ekran okuyucular ve arama motorları için sayfa başlığı (görsel tasarımda logo bu görevi görüyor) */}
      <h1 className="sr-only">Gazetelerde: voleybol haberleri, canlı skorlar, Sultanlar Ligi ve Efeler Ligi</h1>
      {blocks.map((b) => <Block key={b.id} b={b} ctx={{ ...ctx, news: newsOf[b.id] || [] }} />)}
    </>
  );
}

function Block({ b, ctx }) {
  const s = b.settings;
  switch (b.type) {
    case 'ticker':
      return <BreakingTicker items={ctx.breaking.items} flagged={ctx.breaking.flagged} />;

    case 'topics':
      return ctx.topics.length > 0 && (
        <nav className="container topic-strip" aria-label="Gündemdeki konular">
          <span className="label">{s.title}</span>
          {ctx.topics.map((t) => <Link key={t.slug} href={`/etiket/${t.slug}`} className="article-tag">#{t.name}</Link>)}
        </nav>
      );

    case 'matches': {
      // Canlı / yaklaşan maçlar varsa kısa şerit
      const { live, upcoming } = ctx.matchDay;
      const strip = [...live, ...upcoming].slice(0, s.count);
      return strip.length > 0 && (
        <section className="container home-matches" aria-label="Maçlar">
          <SectionHead title={live.length ? 'Canlı skorlar' : 'Yaklaşan maçlar'} kicker="Maç Merkezi" href="/mac-merkezi" />
          <div className="match-grid">{strip.map((m) => <MatchCard key={m.id} m={m} showLeague />)}</div>
        </section>
      );
    }

    case 'lead': {
      const items = ctx.news;
      // Sabitlenen haber yoksa işaretli manşet, o da yoksa en yeni haber
      const lead = s.pinned.length ? items[0] : items.find((n) => n.featured) || items[0];
      if (!lead) return null;
      const rest = items.filter((n) => n.id !== lead.id);
      const side = rest.slice(0, s.sideCount);
      const strip = rest.slice(s.sideCount, s.sideCount + s.stripCount);
      return (
        <section className="container front" aria-label="Manşet">
          <div className="front-grid">
            <div className="rise">
              <Story item={lead} variant="lead" summary priority reveal={false} as="div" level={2} />
            </div>
            {side.length > 0 && (
              <div className="front-side">
                <span className="kicker kicker--live">{s.title}</span>
                {side.map((n, i) => <Story key={n.id} item={n} variant="row" index={i} />)}
              </div>
            )}
          </div>
          {strip.length > 0 && <div className="front-strip">{strip.map((n, i) => <Story key={n.id} item={n} variant="card" index={i} />)}</div>}
        </section>
      );
    }

    case 'foryou':
      return <ForYou />;

    case 'volley':
      return (ctx.standings.length > 0 || ctx.news.length > 0) && (
        <section className="container section volley-home" aria-labelledby={`${b.id}-baslik`}>
          <div className="section-head">
            <div>{s.kicker && <span className="kicker">{s.kicker}</span>}<h2 id={`${b.id}-baslik`} className="section-title"><Link href="/voleybol">{s.title}</Link></h2></div>
            <nav className="league-tabs" aria-label="Voleybol bağlantıları">
              <Link href="/tahmin-ligi" className="article-tag">Tahmin Ligi</Link>
              <Link href="/transfer" className="article-tag">Transfer</Link>
              <Link href="/oyuncular" className="article-tag">Oyuncular</Link>
            </nav>
          </div>
          <div className="volley-home-grid">
            {ctx.standings.map((f) => (
              <div key={f.league.slug}>
                <h3 className="group-title"><Link href={`/mac-merkezi/${f.league.slug}`}>{f.league.name}</Link></h3>
                <StandingsTable rows={f.standings} compact label={`${f.league.name} puan durumu`} />
              </div>
            ))}
            {ctx.news.length > 0 && (
              <div>
                <h3 className="group-title"><Link href={s.source === 'tag' && s.tag ? `/etiket/${s.tag}` : '/voleybol'}>Son voleybol haberleri</Link></h3>
                <div className="volley-home-news">{ctx.news.map((n, i) => <Story key={n.id} item={n} variant="row" sizes="56px" index={i} />)}</div>
              </div>
            )}
          </div>
        </section>
      );

    case 'band':
      return (s.mostRead > 0 || s.live > 0) && (
        <section className="container section home-band" aria-label="Öne çıkanlar">
          {s.mostRead > 0 && <MostRead items={ctx.mostRead} />}
          {s.live > 0 && <LiveFeed items={ctx.allNews.slice(0, s.live)} />}
        </section>
      );

    case 'news': {
      if (!ctx.news.length) return null;
      const head = <SectionHead title={s.title} kicker={s.kicker} href={s.link || undefined} />;
      return (
        <section className="container section" aria-label={s.title}>
          {head}
          {s.layout === 'feature' ? (
            <div className="cat-block">
              <Story item={ctx.news[0]} variant="feature" summary />
              <div className="cat-block-list">{ctx.news.slice(1).map((n, i) => <Story key={n.id} item={n} variant="row" index={i + 1} />)}</div>
            </div>
          ) : s.layout === 'grid' ? (
            <div className="grid-3">{ctx.news.map((n, i) => <Story key={n.id} item={n} variant="card" summary index={i % 3} />)}</div>
          ) : (
            <div className="cat-pair-list">{ctx.news.map((n, i) => <Story key={n.id} item={n} variant="row" index={i} />)}</div>
          )}
        </section>
      );
    }

    case 'marquee': {
      const words = s.text ? s.text.split(',').map((w) => w.trim()).filter(Boolean) : ctx.categories.map((c) => titleCase(c.label));
      return words.length > 0 && (
        <div className="marquee-band" aria-hidden="true">
          <div className="marquee-band-track">
            {[0, 1].map((k) => (
              <span key={k}>{words.map((w, i) => <span key={`${w}-${i}`} className={i % 2 ? 'outline' : ''}>{w}</span>)}</span>
            ))}
          </div>
        </div>
      );
    }

    case 'categories':
      return <CategoryBlocks blocks={ctx.categoryNews} />;

    case 'ad':
      return <div className="container"><AdSlot place={s.place} /></div>;

    case 'newsletter':
      return <div className="container" style={{ marginTop: 'clamp(28px, 4vw, 44px)' }}><Newsletter /></div>;

    default:
      return null;
  }
}

// KATEGORİLER: haber sayısına göre düzen; küçük kategoriler ikişer ikişer eşleşir
function CategoryBlocks({ blocks: categoryNews }) {
  const blocks = categoryNews.filter((b) => b.items.length > 0);
  const rows = [];
  let pending = null;
  for (const b of blocks) {
    if (b.items.length >= 4) rows.push({ type: 'big', ...b });
    else if (b.items.length === 3) rows.push({ type: 'three', ...b });
    else if (pending) { rows.push({ type: 'pair', items: [pending, b] }); pending = null; }
    else pending = b;
  }
  if (pending) rows.push({ type: 'pair', items: [pending] });
  if (!rows.length) return null;
  return (
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
                {row.items.slice(1).map((n, i) => <Story key={n.id} item={n} variant="row" index={i + 1} />)}
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
  );
}
