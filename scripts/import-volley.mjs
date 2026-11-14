// Voleybol ligi verisini içe aktarır (tekrar çalıştırmak güvenlidir: var olan kayıtları günceller).
//   DATABASE_URL=... node scripts/import-volley.mjs content/voleybol-2026-27.json
// Veri dosyası: ligler, takımlar, oynanmış maçlar (set skorlarıyla), oynanacak maçlar, ceza puanları.
// Saati bilinmeyen maçlar İstanbul saatiyle 00:00 kaydedilir; sitede bu maçların yalnızca tarihi gösterilir.
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/slug.js';

const prisma = new PrismaClient();
const at = (date, time = '00:00') => new Date(`${date}T${time}:00+03:00`);
const setsWon = (sets) => sets.reduce(([h, a], [x, y]) => (x > y ? [h + 1, a] : [h, a + 1]), [0, 0]);

async function clubFor(name, gender, takenNames) {
    // Aynı adlı kadın ve erkek takımları (ör. Fenerbahçe Medicana) ayrı kulüp sayfası alır
    const dup = takenNames.has(name);
    const slug = slugify(dup ? `${name} ${gender === 'erkek' ? 'erkek' : 'kadin'}` : name);
    return prisma.club.upsert({ where: { slug }, update: {}, create: { slug, name, gender } });
}

async function main(file) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const allNames = data.leagues.flatMap((l) => l.teams);
    const dupNames = new Set(allNames.filter((n, i) => allNames.indexOf(n) !== i));
    for (const L of data.leagues) {
        const slug = slugify(`${L.name} ${L.season}`);
        const league = await prisma.league.upsert({
            where: { slug },
            update: { name: L.name, season: L.season, gender: L.gender, kind: L.kind, sortOrder: L.sortOrder, featured: true, active: true },
            create: { slug, name: L.name, season: L.season, sport: 'voleybol', gender: L.gender, kind: L.kind, sortOrder: L.sortOrder, featured: true },
        });
        const teams = {};
        for (const name of L.teams) {
            const club = await clubFor(name, L.gender, dupNames);
            teams[name] = await prisma.team.upsert({
                where: { leagueId_name: { leagueId: league.id, name } },
                update: { clubId: club.id, penalty: L.penalties?.[name] ?? 0 },
                create: { leagueId: league.id, name, clubId: club.id, penalty: L.penalties?.[name] ?? 0 },
            });
        }
        const upsertMatch = async (week, homeName, awayName, data) => {
            const home = teams[homeName], away = teams[awayName];
            if (!home || !away) throw new Error(`Takım bulunamadı: ${homeName} / ${awayName}`);
            const found = await prisma.match.findFirst({ where: { leagueId: league.id, homeId: home.id, awayId: away.id, week } });
            if (found) await prisma.match.update({ where: { id: found.id }, data });
            else await prisma.match.create({ data: { leagueId: league.id, homeId: home.id, awayId: away.id, week, ...data } });
        };
        let played = 0, upcoming = 0;
        for (const [week, date, home, away, sets] of L.matches) {
            if (sets === 'ERTELENDI') {
                await upsertMatch(week, home, away, { startAt: at(date), status: 'POSTPONED', sets: [], homeScore: null, awayScore: null });
                continue;
            }
            if (sets.startsWith('HUKMEN')) {
                const [h, a] = sets.split(' ')[1].split('-').map(Number);
                await upsertMatch(week, home, away, { startAt: at(date), status: 'FINISHED', sets: [], homeScore: h, awayScore: a, venue: 'Hükmen' });
                played++;
                continue;
            }
            const parsed = sets.split(',').map((x) => x.split('-').map(Number));
            const [h, a] = setsWon(parsed);
            await upsertMatch(week, home, away, { startAt: at(date), status: 'FINISHED', sets: parsed, homeScore: h, awayScore: a });
            played++;
        }
        for (const [week, date, time, home, away, venue, tv] of L.upcoming) {
            await upsertMatch(week, home, away, { startAt: at(date, time), status: 'SCHEDULED', sets: [], homeScore: null, awayScore: null, venue, broadcaster: tv });
            upcoming++;
        }
        // Önümüzdeki 7 günün maçları için tahmin ligi soruları (kazanan + set skoru; yoksa)
        const soon = await prisma.match.findMany({ where: { leagueId: league.id, status: 'SCHEDULED', startAt: { gt: new Date(), lte: new Date(Date.now() + 7 * 864e5) } }, include: { home: true, away: true } });
        const SCORES = ['3-0', '3-1', '3-2', '2-3', '1-3', '0-3'];
        let polls = 0;
        for (const m of soon) {
            const kinds = new Set((await prisma.poll.findMany({ where: { matchId: m.id }, select: { kind: true } })).map((p) => p.kind));
            if (!kinds.has('tahmin')) { await prisma.poll.create({ data: { question: `${m.home.name} - ${m.away.name}: kim kazanır?`, kind: 'tahmin', matchId: m.id, closesAt: m.startAt, options: { create: [{ text: `${m.home.name} kazanır`, sort: 0 }, { text: `${m.away.name} kazanır`, sort: 1 }] } } }); polls++; }
            if (!kinds.has('skor')) { await prisma.poll.create({ data: { question: `${m.home.name} - ${m.away.name}: set skoru kaç olur?`, kind: 'skor', matchId: m.id, closesAt: m.startAt, options: { create: SCORES.map((t, sort) => ({ text: `${t} (${Number(t[0]) > Number(t[2]) ? m.home.name : m.away.name})`, sort })) } } }); polls++; }
        }
        console.log(`${L.name}: ${L.teams.length} takım, ${played} oynanmış maç, ${upcoming} yaklaşan maç, ${polls} yeni tahmin.`);
    }
}

try {
    await main(process.argv[2] || 'content/voleybol-2026-27.json');
} finally {
    await prisma.$disconnect();
}
