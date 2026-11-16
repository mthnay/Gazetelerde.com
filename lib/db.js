import { PrismaClient } from '@prisma/client';

// Geliştirmede hot-reload her seferinde yeni bağlantı havuzu açmasın
const globalForPrisma = globalThis;

// Bağlantı havuzu sınırı: Prisma varsayılan olarak (CPU × 2 + 1) bağlantı açar. Yeni sürüm yayına girerken eski ve yeni
// uygulama bir süre birlikte çalıştığı için veritabanı kullanıcısının bağlantı sınırı (30) aşılabiliyordu
// ("too many connections"). DATABASE_URL'de connection_limit yoksa DB_POOL (varsayılan 5) uygulanır.
function datasourceUrl() {
    const raw = process.env.DATABASE_URL;
    if (!raw) return undefined;
    try {
        const u = new URL(raw);
        if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', String(Number(process.env.DB_POOL) || 5));
        return u.href;
    } catch {
        return raw;
    }
}

export const prisma = globalForPrisma.__prisma || new PrismaClient({ datasourceUrl: datasourceUrl() });

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
