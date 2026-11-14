import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parseMatchInput } from '@/lib/matchInput';
import { revalidateLeague } from '@/lib/matchAdmin';
import { revalidateArticle } from '@/lib/revalidate';

export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const existing = id && (await prisma.match.findUnique({ where: { id } }));
    if (!existing) return fail('Maç bulunamadı.', 404);
    const parsed = await parseMatchInput((await readJson(request)) || {}, existing);
    if (parsed.error) return fail(parsed.error);
    const m = await prisma.match.update({ where: { id }, data: parsed.data, select: { homeScore: true, awayScore: true, articleId: true } });
    await revalidateLeague(existing.leagueId);
    if (m.articleId) await revalidateArticle(m.articleId); // haber sayfasındaki skor kutusu
    return ok({ match: m });
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const existing = id && (await prisma.match.findUnique({ where: { id } }));
    if (!existing) return fail('Maç bulunamadı.', 404);
    await prisma.match.delete({ where: { id } });
    await revalidateLeague(existing.leagueId);
    return ok();
}
