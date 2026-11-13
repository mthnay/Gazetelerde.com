import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bülten aboneliği | Gazetelerde', robots: { index: false } };

// Bülten e-postalarındaki "abonelikten çık" linki buraya gelir: /bulten/iptal?t=<token>
export default async function Unsubscribe({ searchParams }) {
    const { t } = await searchParams;
    const token = typeof t === 'string' ? t : '';
    const res = token
        ? await prisma.subscriber.updateMany({ where: { token, active: true }, data: { active: false, unsubscribedAt: new Date() } })
        : { count: 0 };
    const already = token && !res.count && (await prisma.subscriber.findUnique({ where: { token }, select: { id: true } }));

    return (
        <div className="status-page"><div>
            <span className="kicker">Bülten</span>
            <h1>
                {res.count ? 'Abonelikten çıktınız' : already ? 'Zaten abone değilsiniz' : 'Geçersiz bağlantı'}
            </h1>
            <p>
                {res.count || already
                    ? 'Artık bülten e-postası almayacaksınız. Fikrinizi değiştirirseniz ana sayfadan tekrar abone olabilirsiniz.'
                    : 'Bu bağlantı geçersiz ya da süresi dolmuş olabilir.'}
            </p>
            <Link href="/" className="btn btn-primary">Ana sayfaya dön</Link>
        </div></div>
    );
}
