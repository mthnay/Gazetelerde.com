import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { fail, rateLimit } from '@/lib/api';

// KVKK md. 11: kişinin kendisi hakkında tutulan verilerin bir kopyası (JSON)
export async function GET() {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    if (!rateLimit(`export:${me.id}`, 5, 60 * 60 * 1000)) return fail('Saatte en fazla 5 kez indirilebilir.', 429);
    const u = await prisma.user.findUnique({
        where: { id: me.id },
        select: {
            name: true, email: true, role: true, createdAt: true, lastLoginAt: true, totpEnabledAt: true, title: true, bio: true,
            comments: { select: { text: true, createdAt: true, status: true, article: { select: { title: true, slug: true } } }, orderBy: { createdAt: 'desc' } },
            likes: { select: { createdAt: true, article: { select: { title: true, slug: true } } } },
            bookmarks: { select: { createdAt: true, article: { select: { title: true, slug: true } } } },
            follows: { select: { createdAt: true, category: { select: { label: true } } } },
            sessions: { select: { createdAt: true, expiresAt: true } },
        },
    });
    const [subscriber, logins] = await Promise.all([
        prisma.subscriber.findUnique({ where: { email: me.email }, select: { active: true, createdAt: true, confirmedAt: true, unsubscribedAt: true } }),
        prisma.loginAttempt.findMany({ where: { email: me.email }, orderBy: { createdAt: 'desc' }, take: 100, select: { createdAt: true, success: true, reason: true } }),
    ]);
    const data = {
        olusturulma: new Date().toISOString(),
        aciklama: 'Gazetelerde.com hesabınıza ait kayıtlı verilerin kopyasıdır. Şifreniz yalnızca geri döndürülemez özet olarak saklandığı için dahil edilmemiştir.',
        hesap: { ...u, comments: undefined, likes: undefined, bookmarks: undefined, follows: undefined, sessions: undefined, ikiAdimliDogrulama: Boolean(u.totpEnabledAt) },
        yorumlar: u.comments, begeniler: u.likes, kayitlar: u.bookmarks, takipEdilenKategoriler: u.follows,
        acikOturumlar: u.sessions, bultenAboneligi: subscriber, sonGirisDenemeleri: logins,
    };
    return new Response(JSON.stringify(data, null, 2), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': 'attachment; filename="gazetelerde-verilerim.json"',
            'Cache-Control': 'no-store',
        },
    });
}
