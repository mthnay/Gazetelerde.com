import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import NewsletterEditor from '@/components/admin/newsletter/NewsletterEditor';

export const metadata = { title: 'Bülten düzenle | Yönetim' };

export default async function EditIssue({ params }) {
    const me = await requirePageUser(canPublish);
    const id = Number((await params).id);
    if (!Number.isInteger(id)) notFound();
    const issue = await prisma.newsletterIssue.findUnique({ where: { id } });
    if (!issue) notFound();
    const recipients = await prisma.subscriber.count({ where: { active: true, confirmedAt: { not: null } } });
    return (
        <NewsletterEditor
            meEmail={me.email}
            recipients={recipients}
            initial={{
                id: issue.id, subject: issue.subject, preheader: issue.preheader, intro: issue.intro,
                articleIds: issue.articleIds, status: issue.status,
                scheduledAt: issue.scheduledAt?.toISOString() ?? null, sentAt: issue.sentAt?.toISOString() ?? null,
                recipients: issue.recipients, sentCount: issue.sentCount, failedCount: issue.failedCount,
            }}
        />
    );
}
