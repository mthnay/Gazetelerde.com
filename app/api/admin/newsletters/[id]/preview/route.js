import { prisma } from '@/lib/db';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { renderIssue } from '@/lib/newsletter/service';

// Panel önizlemesi (iframe). Kaydedilmemiş içerik ?ids=1,2,3 ile denenebilir.
export async function GET(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const issue = id && (await prisma.newsletterIssue.findUnique({ where: { id } }));
    if (!issue) return new Response('Bulunamadı', { status: 404 });
    const { html } = await renderIssue(issue);
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
