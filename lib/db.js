import { PrismaClient } from '@prisma/client';

// Geliştirmede hot-reload her seferinde yeni bağlantı havuzu açmasın
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

// Build sırasında (ör. Docker imajı derlenirken) veritabanına ulaşılamazsa build'i düşürme:
// sayfa boş veriyle üretilir ve ilk istekte (ISR) veritabanından gerçek içerikle yenilenir.
// Çalışma zamanında hatalar normal şekilde fırlatılır.
export async function buildSafe(fn, fallback) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') return fn();
    try {
        return await fn();
    } catch (e) {
        console.warn(`[build] Veritabanına ulaşılamadı, sayfa boş üretiliyor ve çalışırken doldurulacak: ${e?.message?.split('\n')[0]}`);
        return fallback;
    }
}
