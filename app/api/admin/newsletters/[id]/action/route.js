import { prisma } from '@/lib/db';
import { ok, fail, readJson, isEmail } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { sendTest, loadIssueArticles } from '@/lib/newsletter/service';
import { mailMode } from '@/lib/mail/mailer';

// test | send | schedule | cancel
export async function POST(request, { params }) {
    const { user, error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const issue = id && (await prisma.newsletterIssue.findUnique({ where: { id } }));
    if (!issue) return fail('Sayı bulunamadı.', 404);
    const b = (await readJson(request)) || {};

    if (mailMode() === 'off' && b.action !== 'cancel') {
        return fail('E-posta gönderimi yapılandırılmadı. Sunucuda SMTP_URL ve MAIL_FROM ayarlanmalı.', 503);
    }

    if (b.action === 'test') {
        const to = String(b.to || user.email).trim().toLowerCase();
        if (!isEmail(to)) return fail('Geçerli bir test adresi girin.');
        try {
            await sendTest(issue, to);
        } catch (e) {
            return fail(`Test e-postası gönderilemedi: ${String(e?.message || e).slice(0, 200)}`, 502);
        }
        return ok({ message: `Test e-postası ${to} adresine gönderildi.` });
    }

    if (b.action === 'send' || b.action === 'schedule') {
        if (!['DRAFT', 'SCHEDULED'].includes(issue.status)) return fail('Bu sayı zaten gönderildi.', 409);
        if (!(await loadIssueArticles(issue.articleIds)).length) return fail('Göndermeden önce en az bir yayındaki haber seçin.');
        let at = new Date();
        if (b.action === 'schedule') {
            at = new Date(b.scheduledAt);
            if (Number.isNaN(at.getTime()) || at.getTime() < Date.now() - 60 * 1000) return fail('Geçerli, ileri bir tarih seçin.');
        }
        await prisma.newsletterIssue.update({ where: { id }, data: { status: 'SCHEDULED', scheduledAt: at } });
        const recipients = await prisma.subscriber.count({ where: { active: true, confirmedAt: { not: null } } });
        return ok({ message: b.action === 'send' ? `Gönderim başladı: ${recipients} aboneye bir dakika içinde gitmeye başlayacak.` : 'Sayı zamanlandı.' });
    }

    if (b.action === 'cancel') {
        // Gönderim sürüyorsa bekleyen e-postalar iptal edilir; gidenler geri alınamaz
        if (!['SCHEDULED', 'SENDING'].includes(issue.status)) return fail('Bu sayı iptal edilemez.', 409);
        if (issue.status === 'SCHEDULED') {
            await prisma.newsletterIssue.update({ where: { id }, data: { status: 'DRAFT', scheduledAt: null } });
            return ok({ message: 'Zamanlama kaldırıldı, sayı taslağa döndü.' });
        }
        await prisma.$transaction([
            prisma.newsletterDelivery.updateMany({ where: { issueId: id, status: 'PENDING' }, data: { status: 'FAILED', error: 'İptal edildi' } }),
            prisma.newsletterIssue.update({ where: { id }, data: { status: 'CANCELLED' } }),
        ]);
        return ok({ message: 'Gönderim durduruldu.' });
    }
    return fail('Bilinmeyen işlem.');
}
