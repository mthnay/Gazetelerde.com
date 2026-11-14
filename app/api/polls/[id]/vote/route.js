import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { ok, fail, readJson, rateLimit, clientIp } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { pollView, voterHash, isClosed } from '@/lib/polls';

// Oy ver. Her kişi (üye hesabı ya da tarayıcı) bir kez oy verir; aynı IP'den günde en fazla 20 oy.
export async function POST(request, { params }) {
    const id = Number((await params).id);
    const poll = Number.isInteger(id) && (await prisma.poll.findUnique({ where: { id }, include: { options: { select: { id: true } } } }));
    if (!poll) return fail('Anket bulunamadı.', 404);
    if (isClosed(poll)) return fail('Bu anket oylamaya kapandı.', 409);
    const optionId = Number((await readJson(request))?.optionId);
    if (!poll.options.some((o) => o.id === optionId)) return fail('Geçersiz seçenek.');
    if (!rateLimit(`vote:${clientIp(request)}`, 20, 24 * 3600 * 1000)) return fail('Bugün çok fazla oy kullanıldı, yarın tekrar deneyin.', 429);

    const user = await getCurrentUser();
    const store = await cookies();
    let anon = store.get('gz_v')?.value;
    if (!user && !anon) {
        // Yalnızca tekrar oyu önlemek için rastgele, kişiyi tanımlamayan işlevsel çerez
        anon = randomBytes(16).toString('base64url');
        store.set('gz_v', anon, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
    }
    const voter = voterHash({ userId: user?.id, anonId: anon });
    try {
        await prisma.$transaction([
            // Üye oyları tahmin ligi puanı için hesaba bağlanır
            prisma.pollVote.create({ data: { pollId: id, voterHash: voter, optionId, userId: user?.id ?? null } }),
            prisma.pollOption.update({ where: { id: optionId }, data: { votes: { increment: 1 } } }),
        ]);
    } catch (e) {
        if (e?.code === 'P2002') return fail('Bu ankette zaten oy kullandınız.', 409);
        throw e;
    }
    return ok({ poll: await pollView(id, voter) });
}
