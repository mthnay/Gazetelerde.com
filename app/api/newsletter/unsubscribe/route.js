import { prisma } from '@/lib/db';

// RFC 8058 tek tıkla abonelikten çıkma: e-posta istemcisi bu adrese POST atar.
export async function POST(request) {
    const t = new URL(request.url).searchParams.get('t') || '';
    if (t) {
        await prisma.subscriber.updateMany({ where: { token: t, active: true }, data: { active: false, unsubscribedAt: new Date() } });
    }
    return new Response('Abonelikten çıkıldı.', { status: 200 });
}
