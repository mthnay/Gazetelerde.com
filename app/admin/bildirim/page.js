import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { pushEnabled } from '@/lib/push';
import { formatShortDate } from '@/lib/format';
import PushComposer from '@/components/admin/PushComposer';

export const metadata = { title: 'Bildirimler | Yönetim' };

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

export default async function PushAdmin() {
    await requirePageUser(canPublish);
    const [subs, history, recent] = await Promise.all([
        prisma.pushSubscription.count(),
        prisma.pushMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
        prisma.article.findMany({
            where: { status: 'PUBLISHED', publishedAt: { lte: new Date(), gte: hoursAgo(48) } },
            orderBy: { publishedAt: 'desc' }, take: 30, select: { id: true, title: true, breaking: true },
        }),
    ]);
    const sentIds = new Set(history.map((h) => h.articleId).filter(Boolean));
    return (
        <>
            <header className="admin-header">
                <div><h1>Bildirimler</h1><p>“Son dakika” işaretiyle yayınlanan haberler otomatik bildirim olarak gider. Buradan elle de gönderebilirsiniz.</p></div>
            </header>
            {!pushEnabled() && <div className="admin-msg error">Bildirimler kapalı: sunucuda NEXT_PUBLIC_VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY tanımlanmalı.</div>}
            <div className="admin-stats">
                <div className="admin-panel admin-stat"><span className="label">Abone tarayıcı</span><strong className="value">{subs}</strong></div>
                <div className="admin-panel admin-stat"><span className="label">Gönderilen bildirim</span><strong className="value">{history.filter((h) => h.sentAt).length}</strong><small className="sub">son 30 kayıt içinde</small></div>
            </div>
            <div className="admin-grid-2">
                <PushComposer articles={recent.filter((a) => !sentIds.has(a.id)).map((a) => ({ id: a.id, title: a.title, breaking: a.breaking }))} />
                <section className="admin-panel">
                    <h2 style={{ marginTop: 0 }}>Geçmiş</h2>
                    {!history.length ? <p className="hint">Henüz bildirim gönderilmedi.</p> : (
                        <ul className="admin-list">
                            {history.map((h) => (
                                <li key={h.id} className="admin-list-row" style={{ alignItems: 'flex-start' }}>
                                    <span style={{ flex: 1 }}>{h.title}<small className="muted" style={{ display: 'block' }}>{formatShortDate(h.createdAt.toISOString())} · {h.articleId ? 'haber' : 'elle'}</small></span>
                                    {h.sentAt ? <span className="badge ok">{h.sent} ulaştı{h.failed ? ` · ${h.failed} hata` : ''}</span> : <span className="badge warn">Kuyrukta</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
