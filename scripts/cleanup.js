// Bakım: süresi dolmuş oturumları siler. Günde bir kez cron ile çalıştırılabilir:
//   npm run db:cleanup       (yerelde, .env.local ile)
//   node scripts/cleanup.js  (sunucuda, DATABASE_URL ortamda tanımlıyken)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
    const { count } = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    console.log(`${count} süresi dolmuş oturum silindi.`);
} finally {
    await prisma.$disconnect();
}
