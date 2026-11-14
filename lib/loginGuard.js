// Giriş denemelerinin kaydı ve kilitleme. Bellekteki hız sınırından farklı olarak sunucu yeniden başlasa da korunur.
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

const WINDOW = 15 * 60 * 1000;
export const MAX_PER_EMAIL = 8;   // aynı hesaba 15 dakikada en fazla 8 hatalı deneme
export const MAX_PER_IP = 30;     // aynı IP'den 15 dakikada en fazla 30 hatalı deneme

// IP açık tutulmaz: sunucuya özel tuzla özetlenir
export const ipHash = (ip) => createHash('sha256').update(`${process.env.AUTH_SECRET || 'gazetelerde'}:${ip}`).digest('hex').slice(0, 32);

export async function isLocked(email, ip) {
    const since = new Date(Date.now() - WINDOW);
    const [byEmail, byIp] = await Promise.all([
        prisma.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } }),
        prisma.loginAttempt.count({ where: { ipHash: ipHash(ip), success: false, createdAt: { gte: since } } }),
    ]);
    return byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP;
}

export function recordAttempt(email, ip, success, reason) {
    return prisma.loginAttempt.create({ data: { email: email.slice(0, 200), ipHash: ipHash(ip), success, reason } }).catch(() => {});
}
