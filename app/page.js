import HomeView from '@/components/HomeView';
import { getCategories, getLatestNews } from '@/lib/news';

export default async function Home() {
  const [allNews, categories] = await Promise.all([getLatestNews({ take: 40 }), getCategories()]);
  return <HomeView allNews={allNews} categories={categories} />;
}
