import { prisma } from '@/lib/db';
import { ok, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { suggestArticleIds, loadIssueArticles } from '@/lib/newsletter/service';

// Yeni taslak sayı: gündemden önerilen haberlerle başlar
export async function POST(request) {
    const { user, error } = await requireStaff(canPublish);
    if (error) return error;
    const body = (await readJson(request)) || {};
    const articleIds = await suggestArticleIds(8);
    const lead = (await loadIssueArticles(articleIds.slice(0, 1)))[0];
    const date = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'Europe/Istanbul' }).format(new Date());
    const issue = await prisma.newsletterIssue.create({
        data: {
            subject: String(body.subject || `Gündem · ${date}`).slice(0, 150),
            preheader: lead?.title?.slice(0, 140) || '',
            intro: 'Günün öne çıkan haberlerini sizin için derledik.',
            articleIds,
            createdById: user.id,
        },
        select: { id: true },
    });
    return ok({ id: issue.id }, 201);
}
