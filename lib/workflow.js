// Yayın iş akışı bildirimleri: yazar onaya gönderir -> editörler; editör geri gönderir / yayınlar -> yazar
import { prisma } from '@/lib/db';

export async function notifyStatusChange({ article, before, actor }) {
    const after = article.status;
    if (before === after) return;
    const url = `/admin/haberler/${article.id}`;
    const title = article.title.length > 70 ? `${article.title.slice(0, 70)}…` : article.title;
    try {
        if (after === 'REVIEW') {
            const editors = await prisma.user.findMany({ where: { role: { in: ['EDITOR', 'ADMIN'] }, id: { not: actor.id } }, select: { id: true } });
            await prisma.userNotification.createMany({ data: editors.map((e) => ({ userId: e.id, type: 'onay', text: `${actor.name} onay bekleyen bir haber gönderdi: “${title}”`, url })) });
        } else if (before === 'REVIEW' && article.authorId && article.authorId !== actor.id) {
            const text = after === 'PUBLISHED'
                ? `Haberiniz yayınlandı: “${title}”`
                : `Haberiniz düzeltme için geri gönderildi: “${title}”${article.reviewNote ? ` — Not: ${article.reviewNote.slice(0, 120)}` : ''}`;
            await prisma.userNotification.create({ data: { userId: article.authorId, type: 'onay', text, url: after === 'PUBLISHED' ? `/haber/${article.slug}` : url } });
        }
    } catch (e) {
        console.error('[iş akışı] bildirim gönderilemedi:', e?.message);
    }
}
