import 'server-only';
import { NextResponse } from 'next/server';

export const ok = (data = {}, status = 200) => NextResponse.json({ success: true, ...data }, { status });
export const fail = (message, status = 400) => NextResponse.json({ success: false, message }, { status });

export async function readJson(request) {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const MIN_PASSWORD = 8;

// Basit, bellek içi deneme sınırlayıcı (tek sunucu için yeterli;
// birden fazla sunucuda Redis gibi ortak bir depo gerekir).
const buckets = new Map();
export function rateLimit(key, limit = 10, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || b.reset < now) {
        buckets.set(key, { count: 1, reset: now + windowMs });
        return true;
    }
    b.count += 1;
    return b.count <= limit;
}

export function clientIp(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
}
