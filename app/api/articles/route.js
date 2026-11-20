import { ok, fail } from '@/lib/api';
import { getLatestNews, getAuthor } from '@/lib/news';

// "Daha fazla yükle": kategori / konu / yazar sayfalarının devamı. ?kategori=spor&skip=40
export async function GET(request) {
    const sp = new URL(request.url).searchParams;
    const skip = Math.max(0, Math.min(5000, Math.trunc(Number(sp.get('skip'))) || 0));
    const take = Math.max(1, Math.min(24, Math.trunc(Number(sp.get('take'))) || 12));
    const category = sp.get('kategori') || undefined;
    const tag = sp.get('etiket') || undefined;
    const format = ['video', 'galeri'].includes(sp.get('tur')) ? sp.get('tur') : undefined;
    let authorId;
    if (sp.get('yazar')) {
        const a = await getAuthor(sp.get('yazar'));
        if (!a) return fail('Yazar bulunamadı.', 404);
        authorId = a.id;
    }
    // Bir sonraki sayfanın olup olmadığını anlamak için bir fazlası istenir
    const rows = await getLatestNews({ skip, take: take + 1, category, tag, authorId, format });
    return ok({ items: rows.slice(0, take), hasMore: rows.length > take }, 200);
}
