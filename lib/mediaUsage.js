// Görsel kullanım sayımı: haber kapakları, haber metinleri, canlı anlatım, takım logoları, şablonlar
import { prisma } from '@/lib/db';

export async function mediaUsage(ids) {
    if (!ids.length) return new Map();
    const rows = await prisma.$queryRaw`
        SELECT m.id,
          (SELECT count(*) FROM "Article" a WHERE a.image = '/media/' || m.id OR position('/media/' || m.id IN a.content) > 0)::int
          + (SELECT count(*) FROM "LiveEntry" l WHERE l.image = '/media/' || m.id)::int
          + (SELECT count(*) FROM "Team" t WHERE t.logo = '/media/' || m.id)::int
          + (SELECT count(*) FROM "ArticleTemplate" t WHERE position('/media/' || m.id IN t.content) > 0)::int AS uses
        FROM "Media" m WHERE m.id = ANY(${ids})`;
    return new Map(rows.map((r) => [r.id, r.uses]));
}

// Görselin kullanıldığı haberler (silme uyarısı / ayrıntı için)
export function mediaArticles(id) {
    const url = `/media/${id}`;
    return prisma.article.findMany({
        where: { OR: [{ image: url }, { content: { contains: url } }] },
        select: { id: true, title: true, status: true }, take: 20,
    });
}
