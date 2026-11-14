// Her deploy'da (scripts/migrate.js sonrası) çalışır: yazar adresi olmayan personele adres verir. Tekrar çalıştırmak güvenlidir.
import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/slug.js';

const prisma = new PrismaClient();
try {
    const users = await prisma.user.findMany({ where: { slug: null, role: { not: 'READER' } }, select: { id: true, name: true } });
    for (const u of users) {
        const base = slugify(u.name) || 'yazar';
        for (let i = 1; i < 100; i++) {
            const slug = i === 1 ? base : `${base}-${i}`;
            if (await prisma.user.findUnique({ where: { slug }, select: { id: true } })) continue;
            await prisma.user.update({ where: { id: u.id }, data: { slug } });
            break;
        }
    }
    if (users.length) console.log(`[yazarlar] ${users.length} yazar adresi oluşturuldu.`);
} finally {
    await prisma.$disconnect();
}
