// Kendi sunucumuzda hata takibi: aynı hata tek kayıtta toplanır (parmak izi), sayısı ve son görülme zamanı artar.
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';

// Değişken kısımları (sayılar, kimlikler, adresler) atarak aynı türdeki hataları birleştir
export function normalizeMessage(msg = '') {
    return String(msg)
        .replace(/https?:\/\/\S+/g, '<url>')
        .replace(/\b[0-9a-f]{8,}\b/gi, '<id>')
        .replace(/\b\d+\b/g, '<n>')
        .slice(0, 300);
}

export function fingerprintOf(source, message, stack = '') {
    // Yığının ilk anlamlı satırı (dosya:satır) hatanın yerini belirler
    const frame = String(stack).split('\n').map((l) => l.trim()).find((l) => l.startsWith('at ') && !l.includes('node_modules')) || '';
    return createHash('sha1').update(`${source}|${normalizeMessage(message)}|${frame.replace(/:\d+:\d+\)?$/, '')}`).digest('hex');
}

let last = 0, burst = 0;
export async function captureError({ source = 'sunucu', error, message, stack, path = '' }) {
    try {
        // Hata fırtınasında veritabanını boğmamak için saniyede en fazla 20 kayıt
        const now = Date.now();
        if (now - last > 1000) { last = now; burst = 0; }
        if (++burst > 20) return;
        const msg = String(message || error?.message || error || 'Bilinmeyen hata').slice(0, 1000);
        const stk = String(stack || error?.stack || '').slice(0, 4000);
        const fingerprint = fingerprintOf(source, msg, stk);
        await prisma.errorEvent.upsert({
            where: { fingerprint },
            update: { count: { increment: 1 }, lastSeen: new Date(), resolved: false, ...(path ? { path: String(path).slice(0, 300) } : {}) },
            create: { fingerprint, source, message: msg, stack: stk, path: String(path).slice(0, 300) },
        });
    } catch (e) {
        console.error('[hata-takibi] kaydedilemedi:', e?.message);
    }
}
