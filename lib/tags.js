// Etiketler: haberlere serbest metinle eklenir, aynı ada sahip etiket tekrar oluşturulmaz.
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';

export const MAX_TAGS = 10;

// ["Voleybol", " voleybol ", "Filenin Sultanları"] -> benzersiz, temiz adlar
export function normalizeTagNames(input) {
    const list = Array.isArray(input) ? input : String(input || '').split(',');
    const seen = new Set(), out = [];
    for (const raw of list) {
        const name = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        const slug = slugify(name);
        if (!name || !slug || seen.has(slug)) continue;
        seen.add(slug);
        out.push({ name, slug });
        if (out.length >= MAX_TAGS) break;
    }
    return out;
}

// Haberin etiketlerini verilen listeyle eşitler (yoksa oluşturur)
export async function syncArticleTags(articleId, input) {
    if (input === undefined) return; // istemci etiket göndermediyse dokunma
    const tags = normalizeTagNames(input);
    const rows = [];
    for (const t of tags) {
        rows.push(await prisma.tag.upsert({ where: { slug: t.slug }, update: {}, create: t, select: { id: true } }));
    }
    await prisma.$transaction([
        prisma.articleTag.deleteMany({ where: { articleId, tagId: { notIn: rows.map((r) => r.id) } } }),
        prisma.articleTag.createMany({ data: rows.map((r) => ({ articleId, tagId: r.id })), skipDuplicates: true }),
    ]);
}
