import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { slugify } from '@/lib/slug';
import { SPORTS } from '@/lib/standings';

export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const b = (await readJson(request)) || {};
    const name = String(b.name || '').trim().slice(0, 80);
    if (name.length < 2) return fail('Lig adı gerekli.');
    const season = String(b.season || '').trim().slice(0, 20);
    const sport = SPORTS[b.sport] ? b.sport : 'voleybol';
    const slug = slugify(`${name} ${season}`.trim()) || 'lig';
    if (await prisma.league.findUnique({ where: { slug } })) return fail('Bu ad ve sezonla bir lig zaten var.', 409);
    const league = await prisma.league.create({ data: { name, season, sport, slug }, select: { id: true } });
    return ok({ id: league.id }, 201);
}
