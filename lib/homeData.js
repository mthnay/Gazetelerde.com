import 'server-only';
import { prisma } from '@/lib/db';
import { getLatestNews, getArticlesByIds } from '@/lib/news';
import { DEFAULT_LAYOUT, normalizeLayout } from '@/lib/homeLayout';

export const HOME_KEY = 'home.layout';

// Kayıtlı ana sayfa düzeni; kayıt yoksa ya da okunamazsa özgün düzen
export async function getHomeLayout() {
    try {
        const row = await prisma.siteSetting.findUnique({ where: { key: HOME_KEY } });
        const list = row ? normalizeLayout(row.value) : null;
        return { blocks: list?.length ? list : normalizeLayout(DEFAULT_LAYOUT), custom: Boolean(list?.length), updatedAt: row?.updatedAt ?? null };
    } catch {
        return { blocks: normalizeLayout(DEFAULT_LAYOUT), custom: false, updatedAt: null };
    }
}

// Bir bloğun haberleri: önce sabitlenenler (sırasıyla), sonra seçilen kaynaktan otomatik olanlar
export async function blockNews(settings, take) {
    const pinned = await getArticlesByIds(settings.pinned || []);
    if (settings.source === 'pinned' || pinned.length >= take) return pinned.slice(0, take);
    const q = { take: take - pinned.length, excludeIds: pinned.map((a) => a.id) };
    if (settings.source === 'category' && settings.category) q.category = settings.category;
    if (settings.source === 'tag' && settings.tag) q.tag = settings.tag;
    if (settings.source === 'feed' && settings.feedSourceId) q.feedSourceId = settings.feedSourceId;
    return [...pinned, ...(await getLatestNews(q))];
}
