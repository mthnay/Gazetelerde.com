import { prisma } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/api';

// Tıklama sayacı + yönlendirme (yalnızca reklamın kayıtlı adresine; açık yönlendirme yok)
export async function GET(request, { params }) {
    const id = Number((await params).id);
    const ad = Number.isInteger(id) && (await prisma.adSlot.findUnique({ where: { id }, select: { link: true } }));
    if (!ad?.link) return new Response('Bulunamadı', { status: 404 });
    if (rateLimit(`adc:${clientIp(request)}:${id}`, 1, 10 * 60 * 1000)) {
        await prisma.adSlot.update({ where: { id }, data: { clicks: { increment: 1 } } });
    }
    return Response.redirect(ad.link, 302);
}
