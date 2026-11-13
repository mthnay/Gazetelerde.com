import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { mailMode } from '@/lib/mail/mailer';
import { formatShortDate } from '@/lib/format';
import NewIssueButton from '@/components/admin/newsletter/NewIssueButton';

export const metadata = { title: 'Bülten | Yönetim' };

const STATUS = {
    DRAFT: ['Taslak', ''], SCHEDULED: ['Zamanlandı', 'warn'], SENDING: ['Gönderiliyor', 'warn'],
    SENT: ['Gönderildi', 'ok'], CANCELLED: ['İptal', 'danger'],
};

export default async function AdminNewsletter() {
    await requirePageUser(canPublish);
    const [issues, confirmed, pending, left] = await Promise.all([
        prisma.newsletterIssue.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
        prisma.subscriber.count({ where: { active: true, confirmedAt: { not: null } } }),
        prisma.subscriber.count({ where: { active: true, confirmedAt: null } }),
        prisma.subscriber.count({ where: { active: false } }),
    ]);
    const mode = mailMode();

    return (
        <>
            <header className="admin-header">
                <div><h1>Bülten</h1><p>Gündemi abonelere e-postayla gönderin. Aboneler onay bağlantısına tıklamadan e-posta almaz.</p></div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/admin/bulten/aboneler" className="admin-btn">Aboneler</Link>
                    <NewIssueButton />
                </div>
            </header>

            {mode !== 'smtp' && (
                <div className={`admin-msg ${mode === 'off' ? 'error' : 'success'}`} role="status">
                    {mode === 'off'
                        ? 'E-posta gönderimi kapalı: sunucuda SMTP_URL ve MAIL_FROM tanımlanmalı. Tanımlanana kadar abonelik onayları ve bültenler gönderilemez.'
                        : 'Geliştirme modu: e-postalar gönderilmiyor, proje klasöründeki .mail-outbox içine yazılıyor.'}
                </div>
            )}

            <div className="admin-stats">
                <div className="admin-stat"><span>Onaylı abone</span><strong>{confirmed}</strong></div>
                <div className="admin-stat"><span>Onay bekleyen</span><strong>{pending}</strong></div>
                <div className="admin-stat"><span>Ayrılan</span><strong>{left}</strong></div>
                <div className="admin-stat"><span>Gönderilen sayı</span><strong>{issues.filter((i) => i.status === 'SENT').length}</strong></div>
            </div>

            <div className="admin-panel" style={{ padding: 0 }}>
                {!issues.length ? <p className="admin-empty">Henüz bülten yok. “Yeni bülten” ile gündemden otomatik derlenmiş bir taslakla başlayın.</p> : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead><tr><th>Konu</th><th>Durum</th><th>Haber</th><th>Gönderim</th><th>Tarih</th></tr></thead>
                            <tbody>
                                {issues.map((i) => {
                                    const [label, tone] = STATUS[i.status];
                                    return (
                                        <tr key={i.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                <Link href={`/admin/bulten/${i.id}`}>{i.subject}</Link>
                                                {i.auto && <span className="badge" style={{ marginLeft: 8 }}>Otomatik</span>}
                                            </td>
                                            <td><span className={`badge ${tone}`}>{label}</span></td>
                                            <td className="muted">{i.articleIds.length}</td>
                                            <td className="muted">{i.recipients ? `${i.sentCount}/${i.recipients}${i.failedCount ? ` · ${i.failedCount} hata` : ''}` : '—'}</td>
                                            <td className="muted">{formatShortDate((i.sentAt || i.scheduledAt || i.createdAt).toISOString())}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
