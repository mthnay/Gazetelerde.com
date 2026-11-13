import Link from 'next/link';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Bülten aboneliği | Gazetelerde', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Onay e-postasındaki bağlantı: /bulten/onay?t=<token>
export default async function ConfirmSubscription({ searchParams }) {
    const { t } = await searchParams;
    const token = typeof t === 'string' ? t : '';
    const sub = token ? await prisma.subscriber.findUnique({ where: { token } }) : null;
    if (sub && !sub.confirmedAt) {
        await prisma.subscriber.update({ where: { id: sub.id }, data: { confirmedAt: new Date(), active: true, unsubscribedAt: null } });
    }
    return (
        <div className="status-page"><div>
            <span className="kicker">Bülten</span>
            <h1>{sub ? 'Aboneliğiniz başladı' : 'Geçersiz bağlantı'}</h1>
            <p>{sub
                ? 'Teşekkürler! Gündemin öne çıkanları her sabah e-posta kutunuzda olacak. Her e-postadaki bağlantıyla dilediğiniz an ayrılabilirsiniz.'
                : 'Bu bağlantı geçersiz. Ana sayfadaki formdan yeniden abone olabilirsiniz.'}</p>
            <Link href="/" className="btn btn-primary">Ana sayfaya dön</Link>
        </div></div>
    );
}
