import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import TagManager from '@/components/admin/TagManager';

export const metadata = { title: 'Etiketler | Yönetim' };

export default async function AdminTags({ searchParams }) {
    await requirePageUser(canPublish);
    const q = String((await searchParams).q || '').trim().slice(0, 60);
    const rows = await prisma.tag.findMany({
        where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
        orderBy: [{ featured: 'desc' }, { articles: { _count: 'desc' } }], take: 300,
        select: { id: true, slug: true, name: true, description: true, featured: true, _count: { select: { articles: true } } },
    });
    const tags = rows.map((t) => ({ id: t.id, slug: t.slug, name: t.name, description: t.description, featured: t.featured, count: t._count.articles }));
    return (
        <>
            <header className="admin-header">
                <div><h1>Etiketler ve konular</h1><p>Her etiketin bir konu sayfası vardır (/etiket/…). Öne çıkanlar ana sayfadaki “Gündemde” şeridinde görünür.</p></div>
            </header>
            <div className="admin-toolbar">
                <span className="hint">{tags.length} etiket</span>
                <form className="admin-search" action="/admin/etiketler">
                    <input className="admin-input" type="search" name="q" defaultValue={q} placeholder="Etiket ara..." aria-label="Etiket ara" />
                </form>
            </div>
            <TagManager initial={tags} />
        </>
    );
}
