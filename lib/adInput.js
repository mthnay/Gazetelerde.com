import { PLACEMENTS } from '@/lib/ads';

export function parseAd(b, user) {
    const name = String(b.name || '').trim().slice(0, 80);
    if (!name) return { error: 'Reklam adı gerekli.' };
    if (!PLACEMENTS[b.placement]) return { error: 'Geçerli bir yerleşim seçin.' };
    const kind = b.kind === 'kod' ? 'kod' : 'gorsel';
    // Dış kod (script) çalıştırdığı için yalnızca yönetici girebilir
    if (kind === 'kod' && user.role !== 'ADMIN') return { error: 'Reklam kodunu yalnızca yönetici ekleyebilir.' };
    const image = /^(\/media\/[a-z0-9]+|https:\/\/\S+)$/i.test(String(b.image || '')) ? String(b.image) : null;
    const link = /^https?:\/\/\S+$/i.test(String(b.link || '')) ? String(b.link).slice(0, 500) : null;
    if (kind === 'gorsel' && !image) return { error: 'Görsel reklam için görsel seçin.' };
    const date = (v) => (v ? (Number.isNaN(new Date(v).getTime()) ? undefined : new Date(v)) : null);
    return {
        data: {
            name, placement: b.placement, kind, image, link,
            alt: String(b.alt || '').slice(0, 200), code: kind === 'kod' ? String(b.code || '').slice(0, 20000) : '',
            label: b.label === 'Sponsorlu' ? 'Sponsorlu' : 'Reklam',
            active: b.active !== false, weight: Math.max(1, Math.min(10, Number(b.weight) || 1)),
            startsAt: date(b.startsAt), endsAt: date(b.endsAt),
        },
    };
}
