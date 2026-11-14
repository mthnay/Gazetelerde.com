// Voleybol skor kuralları (saf fonksiyonlar; testleri tests/volleyScore.test.js)
// Setler 25 sayıya (5. set 15'e) oynanır, 2 sayı fark gerekir. 5 set üzerinden 3 set alan kazanır.

export const SETS_TO_WIN = 3;
export const targetFor = (setIndex) => (setIndex === 4 ? 15 : 25);

export function isSetComplete([h, a], setIndex) {
    const t = targetFor(setIndex);
    return (h >= t || a >= t) && Math.abs(h - a) >= 2;
}

// Yalnızca tamamlanmış setleri sayar (devam eden set skora katılmaz)
export function setsWon(sets) {
    let home = 0, away = 0;
    sets.forEach((s, i) => { if (isSetComplete(s, i)) { if (s[0] > s[1]) home++; else away++; } });
    return [home, away];
}

/**
 * Sayı ekle / geri al. sets: [[25,20],[12,10]] (son eleman devam eden set)
 * side: 'home' | 'away', delta: +1 | -1
 * Döner: { sets, home, away, setEnded, matchEnded }
 */
export function applyPoint(sets, side, delta = 1) {
    const next = (sets.length ? sets : [[0, 0]]).map((s) => [...s]);
    const [h0, a0] = setsWon(next);
    if (delta > 0 && (h0 >= SETS_TO_WIN || a0 >= SETS_TO_WIN)) return { sets: next, home: h0, away: a0, setEnded: false, matchEnded: true };
    let i = next.length - 1;
    // Geri alma, yeni başlamış (0-0) seti siler ve önceki sete döner
    if (delta < 0 && next[i][0] === 0 && next[i][1] === 0 && i > 0) { next.pop(); i--; }
    // Bitmiş bir setin üzerine sayı eklenmez: yeni set açılır
    if (delta > 0 && isSetComplete(next[i], i)) { next.push([0, 0]); i++; }
    const k = side === 'home' ? 0 : 1;
    next[i][k] = Math.max(0, next[i][k] + delta);
    const setEnded = delta > 0 && isSetComplete(next[i], i);
    const [home, away] = setsWon(next);
    const matchEnded = home >= SETS_TO_WIN || away >= SETS_TO_WIN;
    if (setEnded && !matchEnded) next.push([0, 0]);
    return { sets: next, home, away, setEnded, matchEnded };
}

// Kaydederken sondaki boş (0-0) seti at
export const trimSets = (sets) => (sets.length && sets[sets.length - 1][0] === 0 && sets[sets.length - 1][1] === 0 ? sets.slice(0, -1) : sets);
