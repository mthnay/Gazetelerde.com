import { rateLimit, clientIp } from '@/lib/api';
import { captureError } from '@/lib/errors';

// Tarayıcı hataları (components/ErrorReporter). IP başına saatte 30 kayıt.
export async function POST(request) {
    if (!rateLimit(`err:${clientIp(request)}`, 30, 60 * 60 * 1000)) return new Response(null, { status: 204 });
    let b = {};
    try { b = JSON.parse((await request.text()).slice(0, 8000)); } catch { return new Response(null, { status: 204 }); }
    const message = String(b.message || '').slice(0, 1000);
    // Tarayıcı eklentileri ve önemsiz gürültü kayda geçmesin
    if (!message || /ResizeObserver loop|Script error\.?$|chrome-extension:|moz-extension:|safari-extension:/i.test(`${message} ${b.stack || ''}`)) {
        return new Response(null, { status: 204 });
    }
    await captureError({ source: 'tarayici', message, stack: String(b.stack || ''), path: String(b.path || '').slice(0, 300) });
    return new Response(null, { status: 204 });
}
