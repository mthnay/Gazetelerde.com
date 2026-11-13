import HomeView from '@/components/HomeView';
import BreakingTicker from '@/components/BreakingTicker';
import MostRead from '@/components/MostRead';
import { getBreakingNews, getCategories, getLatestNews, getMostRead } from '@/lib/news';

export default async function Home() {
  const [allNews, categories, breaking, mostRead] = await Promise.all([
    getLatestNews({ take: 40 }), getCategories(), getBreakingNews(), getMostRead(5),
  ]);
  return (
    <>
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
