// Reklam yerleşimleri ve seçim
import { prisma } from '@/lib/db';

export const PLACEMENTS = {
    'ana-ust': { label: 'Ana sayfa — manşet altı', size: '970x250 / mobil 320x100', minH: 120 },
    'ana-orta': { label: 'Ana sayfa — kategoriler arası', size: '970x250', minH: 250 },
    'haber-ici': { label: 'Haber — metin sonrası', size: '728x90 / 300x250', minH: 250 },
    'haber-yan': { label: 'Haber — yan sütun', size: '300x600 / 300x250', minH: 250 },
    'kategori-ust': { label: 'Kategori / konu — başlık altı', size: '970x90', minH: 90 },
};

// Yerleşimdeki etkin reklamlar (ağırlığa göre istemcide seçilir)
export function activeAds(placement) {
    const now = new Date();
    return prisma.adSlot.findMany({
        where: {
            placement, active: true,
            AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
        },
        select: { id: true, kind: true, image: true, link: true, alt: true, code: true, label: true, weight: true },
    });
}
