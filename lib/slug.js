// "İstanbul Maratonu'nda Rekor" -> "istanbul-maratonunda-rekor"
const MAP = { ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u' };

export function slugify(text) {
    return String(text)
        .toLocaleLowerCase('tr')
        .replace(/[ığüşöçâîû]/g, (c) => MAP[c])
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .replace(/['’`]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}
