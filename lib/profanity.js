// Basit Türkçe küfür/hakaret filtresi.
// Harf oyunlarını (ı/i, 0/o, 1/i, 3/e, 4/a, @, $, tekrar eden harfler, araya konan nokta/boşluk) normalize eder.
// Kelime listesi bilinçli olarak kısa tutuldu; ihtiyaç oldukça BANNED listesine eklenebilir.
const BANNED = [
    'amk', 'aq', 'amina', 'amına', 'aminakoyim', 'orospu', 'orosbu', 'pic', 'piç', 'sik', 'sikerim', 'siktir',
    'yarrak', 'yarak', 'göt', 'got', 'gotveren', 'ibne', 'kahpe', 'pezevenk', 'serefsiz', 'şerefsiz', 'gavat',
    'yavsak', 'yavşak', 'dalyarak', 'avradını', 'sürtük', 'surtuk', 'gerizekali', 'gerizekalı',
];

const MAP = { ı: 'i', İ: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };

function normalize(text) {
    return String(text)
        .toLocaleLowerCase('tr')
        .replace(/[ıİşğüöç0134 57@$!]/g, (c) => MAP[c] ?? c)
        .replace(/(.)\1{2,}/g, '$1$1'); // "siiiiik" -> "siik"
}

const NORMALIZED = [...new Set(BANNED.map((w) => normalize(w).replace(/(.)\1+/g, '$1')))];
// "mal" gibi kısa kelimeler sadece tam kelime olarak; uzunlar kelime içinde de yakalanır
const short = NORMALIZED.filter((w) => w.length <= 3);
const long = NORMALIZED.filter((w) => w.length > 3);

export function containsProfanity(text) {
    const words = normalize(text).split(/[^a-z]+/).filter(Boolean).map((w) => w.replace(/(.)\1+/g, '$1'));
    if (words.some((w) => short.includes(w))) return true;
    // "s.i.k" / "s i k" gibi ayrılmış yazımlar için harfleri birleştirilmiş hali de kontrol edilir
    const joined = words.join('');
    return words.some((w) => long.some((b) => w.includes(b))) || long.some((b) => joined.includes(b) && b.length >= 5);
}
