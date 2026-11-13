// Haber sayfası düzen seçenekleri (editörde seçilir, haber sayfasında uygulanır)

export const HERO_OPTIONS = [
    { id: 'classic', label: 'Klasik', hint: 'Ortalanmış başlık, altında kapak görseli' },
    { id: 'immersive', label: 'Tam ekran', hint: 'Kapak görseli tüm genişlikte, başlık üzerinde' },
    { id: 'split', label: 'Yan yana', hint: 'Solda başlık, sağda kapak görseli' },
    { id: 'minimal', label: 'Sade', hint: 'Kapak görseli yok, yalnızca metin' },
];

export const WIDTH_OPTIONS = [
    { id: 'normal', label: 'Standart', px: 680 },
    { id: 'wide', label: 'Geniş', px: 860 },
];

export const DEFAULT_LAYOUT = { hero: 'classic', width: 'normal', aside: true, dropcap: true };

// Dışarıdan gelen değeri güvenli, bilinen değerlere indirger
export function normalizeLayout(input) {
    const l = input && typeof input === 'object' ? input : {};
    return {
        hero: HERO_OPTIONS.some((o) => o.id === l.hero) ? l.hero : DEFAULT_LAYOUT.hero,
        width: WIDTH_OPTIONS.some((o) => o.id === l.width) ? l.width : DEFAULT_LAYOUT.width,
        aside: typeof l.aside === 'boolean' ? l.aside : DEFAULT_LAYOUT.aside,
        dropcap: typeof l.dropcap === 'boolean' ? l.dropcap : DEFAULT_LAYOUT.dropcap,
    };
}
