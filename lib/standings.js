// Puan durumu hesabı (saf fonksiyonlar, veritabanına bağlı değil; testleri tests/standings.test.js).
//
// Voleybol (TVF kuralı): 3-0 ve 3-1 galibiyet 3 puan (mağlup 0), 3-2 galibiyet 2 puan (mağlup 1).
//   Sıralama (TVF ligleri): galibiyet sayısı > puan > set averajı (alınan/verilen) > sayı averajı.
//   (TVF'nin 2026-27 resmi puan tablosuyla doğrulandı: daha çok galibiyeti olan takım, puanı az da olsa öndedir.)
// Futbol: galibiyet 3, beraberlik 1. Sıralama: puan > averaj > atılan gol.
// Basketbol: galibiyet 2, mağlubiyet 1. Sıralama: puan > averaj.

export const SPORTS = { voleybol: 'Voleybol', futbol: 'Futbol', basketbol: 'Basketbol' };

// "25-21, 23-25 25-18" -> [[25,21],[23,25],[25,18]] ; geçersizse null
export function parseSets(input) {
    if (Array.isArray(input)) return input;
    const parts = String(input || '').split(/[,;\s]+/).filter(Boolean);
    if (!parts.length) return [];
    const sets = parts.map((p) => p.split(/[-:]/).map(Number));
    if (sets.some((s) => s.length !== 2 || s.some((n) => !Number.isInteger(n) || n < 0 || n > 99))) return null;
    return sets;
}

// Set skorlarından maç skoru (3-1 gibi)
export function setsToScore(sets) {
    let h = 0, a = 0;
    for (const [x, y] of sets || []) { if (x > y) h++; else if (y > x) a++; }
    return [h, a];
}

function pointsFor(sport, my, their) {
    if (sport === 'voleybol') {
        if (my > their) return their >= 2 ? 2 : 3;
        return my >= 2 ? 1 : 0;
    }
    if (sport === 'basketbol') return my > their ? 2 : 1;
    return my > their ? 3 : my === their ? 1 : 0;
}

/**
 * teams: [{ id, name, shortName? }]
 * matches: [{ homeId, awayId, homeScore, awayScore, sets?, status }]
 * Döner: [{ team, played, won, lost, drawn, for, against, diff, ptsFor, ptsAgainst, points, form: ['G','M',…] }] sıralı
 */
export function computeStandings(teams, matches, sport = 'voleybol') {
    const rows = new Map(teams.map((t) => [t.id, {
        team: t, played: 0, won: 0, lost: 0, drawn: 0, for: 0, against: 0, ptsFor: 0, ptsAgainst: 0, points: 0, form: [],
    }]));
    const finished = matches
        .filter((m) => m.status === 'FINISHED' && m.homeScore != null && m.awayScore != null)
        .sort((x, y) => new Date(x.startAt || 0) - new Date(y.startAt || 0));
    for (const m of finished) {
        const sides = [[m.homeId, m.homeScore, m.awayScore, 0], [m.awayId, m.awayScore, m.homeScore, 1]];
        for (const [id, my, their, idx] of sides) {
            const r = rows.get(id);
            if (!r) continue;
            r.played++;
            r.for += my; r.against += their;
            if (my > their) { r.won++; r.form.push('G'); } else if (my < their) { r.lost++; r.form.push('M'); } else { r.drawn++; r.form.push('B'); }
            r.points += pointsFor(sport, my, their);
            for (const s of Array.isArray(m.sets) ? m.sets : []) { r.ptsFor += s[idx]; r.ptsAgainst += s[1 - idx]; }
        }
    }
    const ratio = (a, b) => (b === 0 ? (a > 0 ? Infinity : 0) : a / b);
    return [...rows.values()]
        // Ceza puanı (hükmen yenilgi vb.) düşülür
        .map((r) => ({ ...r, points: r.points - (r.team.penalty || 0), penalty: r.team.penalty || 0, diff: r.for - r.against, form: r.form.slice(-5) }))
        .sort((a, b) => {
            if (sport === 'voleybol' && b.won !== a.won) return b.won - a.won;
            if (b.points !== a.points) return b.points - a.points;
            if (sport === 'voleybol') {
                const sr = ratio(b.for, b.against) - ratio(a.for, a.against);
                if (sr && Number.isFinite(sr)) return sr;
                if (sr) return ratio(b.for, b.against) === Infinity ? 1 : -1;
                return ratio(b.ptsFor, b.ptsAgainst) - ratio(a.ptsFor, a.ptsAgainst) || a.team.name.localeCompare(b.team.name, 'tr');
            }
            return b.diff - a.diff || b.for - a.for || a.team.name.localeCompare(b.team.name, 'tr');
        });
}
