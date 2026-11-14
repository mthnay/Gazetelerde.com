import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { getLiveEntries, getArticleMatches } from '@/lib/live';

export const dynamic = 'force-dynamic';

// Canlı anlatım akışı: haber sayfası 20 sn'de bir sorar. ?since=<ISO> verilirse yalnızca o andan sonra değişenler döner.
export async function GET(request, { params }) {
    const id = Number((await params).id);
    const a = Number.isInteger(id) && (await prisma.article.findFirst({ where: { id, status: 'PUBLISHED' }, select: { id: true, live: true, liveEndedAt: true } }));
    if (!a) return fail('Haber bulunamadı.', 404);
    const since = new URL(request.url).searchParams.get('since');
    const sinceDate = since && !Number.isNaN(Date.parse(since)) ? new Date(since) : null;
    const [entries, matches, ids] = await Promise.all([
        sinceDate
            ? prisma.liveEntry.findMany({ where: { articleId: id, updatedAt: { gt: sinceDate } }, orderBy: { createdAt: 'desc' }, take: 100 })
                .then((r) => r.map((e) => ({ id: e.id, text: e.text, kind: e.kind, image: e.image, pinned: e.pinned, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() })))
            : getLiveEntries(id),
        getArticleMatches(id),
        // Silinen girişleri istemcinin de silebilmesi için mevcut kimlikler
        prisma.liveEntry.findMany({ where: { articleId: id }, select: { id: true } }),
    ]);
    return ok({ live: a.live, entries, matches, ids: ids.map((x) => x.id), serverTime: new Date().toISOString() }, 200);
}
