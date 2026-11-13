import { prisma } from '@/lib/db';
import { renderIssue } from '@/lib/newsletter/service';

// Gönderilmiş bir sayının tarayıcıda görünümü ("Tarayıcıda görüntüle")
export async function GET(_request, { params }) {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return new Response('Bulunamadı', { status: 404 });
    const issue = await prisma.newsletterIssue.findFirst({ where: { id, status: { in: ['SENDING', 'SENT'] } } });
    if (!issue) return new Response('Bulunamadı', { status: 404 });
    const { html } = await renderIssue({ ...issue, sentAt: issue.sentAt || issue.startedAt });
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
}
