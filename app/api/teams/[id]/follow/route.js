import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

async function team(params) {
    const id = Number((await params).id);
    return Number.isInteger(id) ? prisma.team.findUnique({ where: { id }, select: { id: true } }) : null;
}

// Takım takibi: kişisel ana sayfa + maç başlangıç/bitiş bildirimi
export async function POST(_request, { params }) {
    const me = await getCurrentUser();
    if (!me) return fail('Takım takip etmek için giriş yapın.', 401);
    const t = await team(params);
    if (!t) return fail('Takım bulunamadı.', 404);
    if ((await prisma.teamFollow.count({ where: { userId: me.id } })) >= 30) return fail('En fazla 30 takım takip edebilirsiniz.');
    await prisma.teamFollow.upsert({ where: { userId_teamId: { userId: me.id, teamId: t.id } }, update: {}, create: { userId: me.id, teamId: t.id } });
    return ok({ following: true });
}

export async function DELETE(_request, { params }) {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    const t = await team(params);
    if (t) await prisma.teamFollow.deleteMany({ where: { userId: me.id, teamId: t.id } });
    return ok({ following: false });
}
