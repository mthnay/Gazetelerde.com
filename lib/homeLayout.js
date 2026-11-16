// Ana sayfa düzeni: sıralı blok listesi. Panelden (Yönetim → Ana Sayfa) düzenlenir, SiteSetting["home.layout"]
// kaydında saklanır. Kayıt yoksa DEFAULT_LAYOUT (sitenin özgün düzeni) kullanılır.
// Bu dosya saf veri + doğrulama içerir (istemci ve sunucuda, testlerde kullanılabilir).

// Haber içeren bloklarda içerik kaynağı
export const SOURCES = [
    ['latest', 'En yeni haberler'],
    ['category', 'Bir kategori'],
    ['tag', 'Bir etiket'],
    ['feed', 'Bir haber kaynağı (TVF, AA…)'],
    ['pinned', 'Yalnızca seçtiğim haberler'],
];
const sourceFields = [
    { key: 'source', label: 'İçerik', type: 'select', options: SOURCES },
    { key: 'category', label: 'Kategori', type: 'category', when: (s) => s.source === 'category' },
    { key: 'tag', label: 'Etiket (adres adı, ör. voleybol)', type: 'text', when: (s) => s.source === 'tag' },
    { key: 'feedSourceId', label: 'Haber kaynağı', type: 'feedSource', when: (s) => s.source === 'feed' },
    { key: 'pinned', label: 'Sabitlenen haberler (en üstte, bu sırayla)', type: 'articles' },
];

// type → { label, açıklama, alanlar, varsayılan ayarlar, birden fazla eklenebilir mi }
export const BLOCK_TYPES = {
    ticker: {
        label: 'Son dakika şeridi', hint: 'Sayfanın en üstündeki kayan şerit: son 24 saatin son dakika haberleri.',
        fields: [{ key: 'count', label: 'Haber sayısı', type: 'number', min: 1, max: 12 }],
        defaults: { count: 6 },
    },
    topics: {
        label: 'Gündemde etiketleri', hint: 'Öne çıkan etiketler.',
        fields: [{ key: 'title', label: 'Başlık', type: 'text' }, { key: 'count', label: 'Etiket sayısı', type: 'number', min: 1, max: 30 }],
        defaults: { title: 'Gündemde', count: 12 },
    },
    matches: {
        label: 'Maç şeridi', hint: 'Canlı ya da yaklaşan maçlar (maç yoksa görünmez).',
        fields: [{ key: 'count', label: 'Maç sayısı', type: 'number', min: 1, max: 12 }],
        defaults: { count: 6 },
    },
    lead: {
        label: 'Manşet', hint: 'Büyük manşet haberi, yanında liste, altında kart şeridi. Sabitlenen ilk haber manşet olur.',
        fields: [
            { key: 'title', label: 'Yan liste başlığı', type: 'text' },
            ...sourceFields,
            { key: 'sideCount', label: 'Yan listede haber', type: 'number', min: 0, max: 8 },
            { key: 'stripCount', label: 'Alt şeritte haber', type: 'number', min: 0, max: 8 },
        ],
        defaults: { title: 'Şimdi gündemde', source: 'latest', pinned: [], sideCount: 4, stripCount: 4 },
    },
    foryou: { label: 'Senin için', hint: 'Giriş yapan okura takip ettiği konulardan kişisel akış.', fields: [], defaults: {} },
    volley: {
        label: 'Voleybol: puan durumu + haberler', hint: 'Lig puan durumları ve son voleybol haberleri.',
        fields: [
            { key: 'kicker', label: 'Üst etiket', type: 'text' }, { key: 'title', label: 'Başlık', type: 'text' },
            { key: 'leagues', label: 'Puan durumu (lig sayısı)', type: 'number', min: 0, max: 4 },
            ...sourceFields,
            { key: 'count', label: 'Haber sayısı', type: 'number', min: 0, max: 10 },
        ],
        defaults: { kicker: '🏐 Voleybol', title: 'Filede bugün', leagues: 2, source: 'tag', tag: 'voleybol', pinned: [], count: 5 },
    },
    band: {
        label: 'Çok okunanlar + Dakika dakika', hint: 'Yan yana iki liste.',
        fields: [{ key: 'mostRead', label: 'Çok okunan sayısı', type: 'number', min: 0, max: 10 }, { key: 'live', label: 'Dakika dakika sayısı', type: 'number', min: 0, max: 12 }],
        defaults: { mostRead: 5, live: 6 },
    },
    news: {
        label: 'Haber bloğu', hint: 'Başlıklı haber bloğu: istediğin kategoriden, etiketten, kaynaktan ya da elle seçtiğin haberlerden.', multiple: true,
        fields: [
            { key: 'kicker', label: 'Üst etiket', type: 'text' }, { key: 'title', label: 'Başlık', type: 'text' },
            { key: 'link', label: 'Başlık bağlantısı (ör. /category/transfer)', type: 'text' },
            ...sourceFields,
            { key: 'count', label: 'Haber sayısı', type: 'number', min: 1, max: 12 },
            { key: 'layout', label: 'Görünüm', type: 'select', options: [['feature', 'Büyük haber + liste'], ['grid', 'Kartlar (3’lü)'], ['list', 'Liste']] },
        ],
        defaults: { kicker: '', title: 'Haberler', link: '', source: 'latest', pinned: [], count: 4, layout: 'feature' },
    },
    categories: {
        label: 'Kategori blokları', hint: 'Her kategori için ayrı blok (otomatik düzen). Boş bırakılırsa haberi olan tüm kategoriler.',
        fields: [{ key: 'categories', label: 'Kategoriler (sırayla)', type: 'categories' }, { key: 'count', label: 'Kategori başına haber', type: 'number', min: 1, max: 6 }],
        defaults: { categories: [], count: 5 },
    },
    marquee: {
        label: 'Kayan yazı bandı', hint: 'Büyük harflerle kayan bant. Boş bırakılırsa kategori adları yazılır.',
        fields: [{ key: 'text', label: 'Kelimeler (virgülle)', type: 'text' }],
        defaults: { text: '' }, multiple: true,
    },
    ad: {
        label: 'Reklam alanı', hint: 'Reklamlar sayfasında bu alana atanmış reklam (yoksa görünmez).', multiple: true,
        fields: [{ key: 'place', label: 'Reklam yeri', type: 'select', options: [['ana-ust', 'Ana sayfa üst'], ['ana-orta', 'Ana sayfa orta']] }],
        defaults: { place: 'ana-ust' },
    },
    newsletter: { label: 'Bülten kayıt kutusu', hint: 'E-posta bülteni abonelik formu.', fields: [], defaults: {} },
};

export const DEFAULT_LAYOUT = [
    { type: 'ticker' }, { type: 'topics' }, { type: 'matches' }, { type: 'lead' }, { type: 'foryou' }, { type: 'volley' },
    { type: 'ad', settings: { place: 'ana-ust' } }, { type: 'band' }, { type: 'marquee' }, { type: 'categories' },
    { type: 'ad', settings: { place: 'ana-orta' } }, { type: 'newsletter' },
].map((b, i) => ({ id: `b${i + 1}`, enabled: true, settings: {}, ...b }));

const clampInt = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : d; };
const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const slug = (v) => str(v, 80).toLocaleLowerCase('tr-TR').replace(/[^a-z0-9-]/g, '');

// Panelden gelen düzeni doğrular: bilinmeyen tür/alan atılır, sayılar sınırlanır, eksikler varsayılanla dolar
export function normalizeLayout(input) {
    const list = Array.isArray(input) ? input : [];
    const out = [];
    const ids = new Set();
    for (const raw of list.slice(0, 40)) {
        const def = BLOCK_TYPES[raw?.type];
        if (!def) continue;
        if (!def.multiple && out.some((b) => b.type === raw.type)) continue; // tekil bloklar bir kez
        const s = { ...def.defaults, ...(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}) };
        const settings = {};
        for (const f of def.fields) {
            const v = s[f.key];
            if (f.type === 'number') settings[f.key] = clampInt(v, f.min ?? 0, f.max ?? 50, def.defaults[f.key] ?? f.min ?? 0);
            else if (f.type === 'select') settings[f.key] = f.options.some(([o]) => o === v) ? v : def.defaults[f.key] ?? f.options[0][0];
            else if (f.type === 'articles') settings[f.key] = [...new Set((Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 20);
            else if (f.type === 'categories') settings[f.key] = [...new Set((Array.isArray(v) ? v : []).map(slug).filter(Boolean))].slice(0, 20);
            else if (f.type === 'feedSource') settings[f.key] = Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;
            else if (f.type === 'category' || (f.type === 'text' && f.key === 'tag')) settings[f.key] = slug(v);
            else if (f.key === 'link') settings[f.key] = /^\/[^\s]*$/.test(str(v, 200)) ? str(v, 200) : '';
            else settings[f.key] = str(v, f.key === 'text' ? 400 : 120);
        }
        let id = str(raw.id, 24).replace(/[^\w-]/g, '') || `b${out.length + 1}`;
        while (ids.has(id)) id = `${id}x`;
        ids.add(id);
        out.push({ id, type: raw.type, enabled: raw.enabled !== false, settings });
    }
    return out;
}

export const newBlock = (type) => ({ id: `b${Date.now().toString(36)}`, type, enabled: true, settings: { ...BLOCK_TYPES[type].defaults } });
