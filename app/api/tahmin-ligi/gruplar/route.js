import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { ok, fail, readJson, rateLimit } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

const newCode = () => randomBytes(5).toString('base64url').replace(/[-_]/g, 'X').slice(0, 7).toUpperCase();

// Arkadaş ligleri: GET benim liglerim; POST { name } oluştur | { code } katıl; DELETE { groupId } ayrıl
export async function GET() {
    const me = await getCurrentUser();
    if (!me) return ok({ groups: [] });
    const rows = await prisma.predictionGroupMember.findMany({
        where: { userId: me.id }, orderBy: { joinedAt: 'asc' },
        select: { group: { select: { id: true, name: true, code: true, ownerId: true, _count: { select: { members: true } } } } },
    });
    return ok({ groups: rows.map((r) => ({ id: r.group.id, name: r.group.name, code: r.group.code, members: r.group._count.members, owner: r.group.ownerId === me.id })) });
}

export async function POST(request) {
    const me = await getCurrentUser();
    if (!me) return fail('Arkadaş ligi için giriş yapın.', 401);
    if (!rateLimit(`grp:${me.id}`, 20, 3600e3)) return fail('Çok fazla deneme, biraz bekleyin.', 429);
    const b = (await readJson(request)) || {};
    if (b.code) {
        const g = await prisma.predictionGroup.findUnique({ where: { code: String(b.code).trim().toUpperCase() }, include: { _count: { select: { members: true } } } });
        if (!g) return fail('Bu davet koduyla lig bulunamadı.', 404);
        if (g._count.members >= 200) return fail('Bu lig dolu (en fazla 200 kişi).');
        await prisma.predictionGroupMember.upsert({ where: { groupId_userId: { groupId: g.id, userId: me.id } }, update: {}, create: { groupId: g.id, userId: me.id } });
        return ok({ code: g.code });
    }
    const name = String(b.name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (name.length < 3) return fail('Lig adı en az 3 karakter olmalı.');
    if ((await prisma.predictionGroup.count({ where: { ownerId: me.id } })) >= 10) return fail('En fazla 10 lig kurabilirsiniz.');
    let code;
    for (let i = 0; i < 5; i++) { code = newCode(); if (!(await prisma.predictionGroup.findUnique({ where: { code } }))) break; }
    const g = await prisma.predictionGroup.create({ data: { name, code, ownerId: me.id, members: { create: { userId: me.id } } } });
    return ok({ code: g.code }, 201);
}

export async function DELETE(request) {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    const groupId = Number((await readJson(request))?.groupId);
    const g = Number.isInteger(groupId) && (await prisma.predictionGroup.findUnique({ where: { id: groupId } }));
    if (!g) return fail('Lig bulunamadı.', 404);
    // Kurucu ayrılırsa lig silinir
    if (g.ownerId === me.id) await prisma.predictionGroup.delete({ where: { id: g.id } });
    else await prisma.predictionGroupMember.deleteMany({ where: { groupId: g.id, userId: me.id } });
    return ok();
}
