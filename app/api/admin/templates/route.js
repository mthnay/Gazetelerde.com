import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { sanitizeArticleHtml } from '@/lib/html';
import { normalizeLayout } from '@/lib/layout';

export async function GET() {
    const { error } = await requireStaff();
    if (error) return error;
    const rows = await prisma.articleTemplate.findMany({
        orderBy: { createdAt: 'desc' }, take: 100,
        select: { id: true, name: true, description: true, content: true, layout: true, createdAt: true, createdById: true, createdBy: { select: { name: true } } },
    });
    return ok({ templates: rows.map((t) => ({ ...t, createdBy: t.createdBy?.name || '—' })) });
}

// Mevcut tasarımı şablon olarak kaydet
export async function POST(request) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const body = await readJson(request);
    const name = String(body?.name || '').trim().slice(0, 80);
    const content = sanitizeArticleHtml(String(body?.content || '').slice(0, 200_000));
    if (name.length < 2) return fail('Şablona bir ad verin.');
    if (!content) return fail('Boş içerik şablon olarak kaydedilemez.');
    const template = await prisma.articleTemplate.create({
        data: { name, description: String(body?.description || '').trim().slice(0, 200), content, layout: normalizeLayout(body?.layout), createdById: user.id },
        select: { id: true, name: true },
    });
    return ok({ template }, 201);
}
