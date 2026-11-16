// Dışarıdan gelen haberin kategorisini metinden tahmin eder (saf fonksiyonlar: test edilebilir).
// Sıra önemlidir: ilk eşleşen kural kazanır.

const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR');

const VOLLEY = /voleybol|volley|sultanlar ligi|efeler ligi|filenin|\bcev\b|\bfivb\b|\btvf\b|smaç|libero|pasör|tie-?break|plaj voley/;

const RULES = [
    ['plaj-voleybolu', /plaj voleybol|beach volley|plaj voley/],
    ['milli-takimlar', /filenin (sultanları|efeleri)|milli takım|a milli|milli voleybol|national team|nations league|milletler ligi|dünya şampiyonası|avrupa şampiyonası|olimpiyat/],
    ['avrupa-kupalari', /\bcev\b|şampiyonlar ligi|champions league|challenge kupası|challenge cup|cev kupası|cev cup|avrupa kupa/],
    ['transfer', /transfer|imza attı|imzaladı|sözleşme (uzattı|imzaladı)|kadrosuna kattı|ile anlaştı|yollarını ayırdı|kiralık/],
    ['alt-ligler', /(kadınlar|erkekler) [12]\. lig|\b[12]\. lig|alt lig|genç(ler)? ligi|yıldızlar|altyapı/],
    ['efeler-ligi', /efeler ligi|erkekler voleybol|erkek voleybol/],
    ['sultanlar-ligi', /sultanlar ligi|kadınlar voleybol|kadın voleybol/],
];

export const isVolleyball = (text) => VOLLEY.test(norm(text));

// Denenecek kategori slug'ları (öncelik sırasıyla). Sonda her zaman 'spor' vardır.
//   sport: kaynağın türü ('voleybol' | 'spor'); fallback: kaynağın varsayılan kategorisi
export function categorySlugsForText(text, { sport = 'voleybol', fallback = null } = {}) {
    const t = norm(text);
    const out = [];
    const volley = sport === 'voleybol' || VOLLEY.test(t);
    if (volley) {
        for (const [slug, re] of RULES) if (re.test(t)) { out.push(slug); break; }
    }
    if (fallback) out.push(fallback);
    if (volley && !out.length) out.push('sultanlar-ligi'); // lig belirsizse en çok okunan lig
    out.push('spor');
    return [...new Set(out)];
}

// Son dakika sayılacak başlık/özet
export const looksBreaking = (text) => /son dakika|flaş|resmen açıklandı|şampiyon oldu/.test(norm(text));

// "a, b , c" -> ['a','b','c'] ; anahtar kelime filtresi
export const keywords = (s) => String(s || '').split(',').map((x) => norm(x).trim()).filter(Boolean);
export function passesFilter(text, { include = '', exclude = '' } = {}) {
    const t = norm(text);
    const inc = keywords(include);
    const exc = keywords(exclude);
    if (exc.some((k) => t.includes(k))) return false;
    return !inc.length || inc.some((k) => t.includes(k));
}
