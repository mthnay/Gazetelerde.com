// Farklı kaynaklardan gelen aynı haberi tanır (saf fonksiyonlar: test edilebilir).
// Türkçe ekler yüzünden "Fenerbahçe'de" / "Fenerbahçe" farklı görünmesin diye kelimeler kökün ilk
// 4 harfine indirilir; skorlar ("3-1") ve sayılar ayrı birer ipucu olarak korunur.

const STOP = new Set(('ve ile için bir bu şu o da de ki mi mu mü mı ise ya veya ama çok daha en gibi kadar sonra önce olan oldu '
    + 'olarak yeni son dakika flaş haber haberi açıkland karşı karşıla maçı maçta maçında ligi ligde liginde takım takımı').split(' '));

export function tokens(text) {
    const t = String(text || '').toLocaleLowerCase('tr-TR')
        .replace(/[’'`´]/g, ' ')
        .replace(/(\d+)\s*[-–:]\s*(\d+)/g, ' skor$1x$2 ') // 3-1 -> skor3x1
        .replace(/[^\p{L}\p{N}\s]/gu, ' ');
    const out = new Set();
    for (const w of t.split(/\s+/)) {
        if (!w || STOP.has(w)) continue;
        if (/^skor\d+x\d+$/.test(w)) { out.add(w); continue; }
        if (/^\d+$/.test(w)) { out.add(`n${w}`); continue; } // hafta / lig / yaş numaraları
        if (w.length < 3) continue;
        out.add(w.slice(0, 4));
    }
    return out;
}

// İki haberi kesin olarak ayıran ipuçları: farklı skor, farklı sayı (hafta, lig), kadın/erkek
const GENDER = (S) => ({ k: [...S].some((x) => /^(kadı|kızl|sult)/.test(x)), e: [...S].some((x) => /^(erke|efel)/.test(x)) });
function conflicts(A, B) {
    const nums = (S) => [...S].filter((x) => /^(skor|n)\d/.test(x));
    const na = nums(A), nb = nums(B);
    if (na.length && nb.length && (na.some((x) => !B.has(x)) && nb.some((x) => !A.has(x)))) return true;
    const ga = GENDER(A), gb = GENDER(B);
    return (ga.k && !ga.e && gb.e && !gb.k) || (ga.e && !ga.k && gb.k && !gb.e);
}

// 0..1 benzerlik: ortak kök sayısı / kısa olanın kök sayısı (başlıklar farklı uzunlukta olabilir)
export function similarity(a, b) {
    const A = a instanceof Set ? a : tokens(a);
    const B = b instanceof Set ? b : tokens(b);
    if (!A.size || !B.size || conflicts(A, B)) return 0;
    let common = 0;
    for (const x of A) if (B.has(x)) common++;
    const overlap = common / Math.min(A.size, B.size);
    const jaccard = common / (A.size + B.size - common);
    // Kısa başlıklarda tek-iki ortak kelime yanıltmasın: en az 3 ortak kök şartı
    return common >= 3 ? Math.max(jaccard, overlap * 0.85) : 0;
}

export const DUPLICATE_THRESHOLD = 0.55;

// Aday haber, listedeki haberlerden biriyle aynı mı? Eşleşeni (ve puanını) döndürür.
// items: [{ id, text }] — text: başlık (+ isteğe bağlı özet)
export function findDuplicate(text, items, threshold = DUPLICATE_THRESHOLD) {
    const A = tokens(text);
    let best = null;
    for (const it of items) {
        const s = similarity(A, it.tokens || tokens(it.text));
        if (s >= threshold && (!best || s > best.score)) best = { ...it, score: s };
    }
    return best;
}
