// Yazar sayfası adresleri (/yazar/<slug>)
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';

// Kullanıcının yazar adresi yoksa adından üretir (çakışırsa -2, -3 …). Personel olmayanlara adres verilmez.
export async function ensureAuthorSlug(userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { slug: true, name: true, role: true } });
    if (!u || u.slug || u.role === 'READER') return u?.slug ?? null;
    const base = slugify(u.name) || 'yazar';
    for (let i = 1; i < 100; i++) {
        const slug = i === 1 ? base : `${base}-${i}`;
        try {
            await prisma.user.update({ where: { id: userId }, data: { slug } });
            return slug;
        } catch (e) {
            if (e?.code !== 'P2002') throw e; // benzersizlik çakışması değilse
        }
    }
    return null;
}
