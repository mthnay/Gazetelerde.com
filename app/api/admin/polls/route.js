import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parsePoll } from '@/lib/pollInput';
import { revalidateArticle } from '@/lib/revalidate';

export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const p = await parsePoll((await readJson(request)) || {});
    if (p.error) return fail(p.error);
    const poll = await prisma.poll.create({
        data: { ...p.data, options: { create: p.options.map((text, sort) => ({ text: text.slice(0, 120), sort })) } },
        select: { id: true, articleId: true },
    });
    if (poll.articleId) await revalidateArticle(poll.articleId);
    return ok({ id: poll.id }, 201);
}
