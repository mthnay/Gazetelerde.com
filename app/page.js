import HomeView from '@/components/HomeView';
import BreakingTicker from '@/components/BreakingTicker';
import MostRead from '@/components/MostRead';
import { getBreakingNews, getCategories, getLatestNews, getMostRead } from '@/lib/news';
import { absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { buildSafe } from '@/lib/db';

// Google'da site adı ve site içi arama kutusu için
const siteJsonLd = [
  {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/'), description: SITE_DESCRIPTION, inLanguage: 'tr',
    potentialAction: { '@type': 'SearchAction', target: `${absoluteUrl('/search')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  },
  { '@context': 'https://schema.org', '@type': 'NewsMediaOrganization', name: SITE_NAME, url: absoluteUrl('/'), logo: absoluteUrl('/icon') },
];

// Ana sayfa önbellekten sunulur; 60 sn'de bir ve her yayında tazelenir
export const revalidate = 60;

export default async function Home() {
  const [allNews, categories, breaking, mostRead] = await buildSafe(
    () => Promise.all([getLatestNews({ take: 40 }), getCategories(), getBreakingNews(), getMostRead(5)]),
    [[], [], { flagged: false, items: [] }, []],
  );
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <BreakingTicker items={breaking.items} flagged={breaking.flagged} />
      <HomeView
        allNews={allNews}
        categories={categories}
        breaking={breaking.flagged ? breaking.items[0] : null}
        mostRead={<MostRead items={mostRead} />}
      />
    </>
  );
}
