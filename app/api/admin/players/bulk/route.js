import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { uniqueSlug, matchPosition, revalidateVolley } from '@/lib/volleyAdmin';

// Toplu kadro: her satır "No | Ad Soyad | Mevki | Boy" (No, mevki ve boy isteğe bağlı).
// Aynı adlı oyuncu varsa onu kullanır, yoksa oluşturur; kulübün o sezonki kadrosuna ekler.
export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const b = (await readJson(request)) || {};
    const club = await prisma.club.findUnique({ where: { id: Number(b.clubId) } });
    const season = String(b.season || '').trim();
    if (!club || !/^\d{4}-\d{2}$/.test(season)) return fail('Kulüp ve sezon (ör. 2025-26) gerekli.');
    const lines = String(b.lines || '').split('\n').map((l) => l.split(/\s*[|\t;]\s*/).map((x) => x.trim())).filter((c) => c.some(Boolean)).slice(0, 40);
    let created = 0, added = 0;
    for (const cols of lines) {
        let [no, name, pos, height] = cols;
        if (!/^\d{1,2}$/.test(no || '')) { [name, pos, height] = cols; no = ''; } // numarasız satır
        if (!name || name.length < 3) continue;
        let player = await prisma.player.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
        if (!player) {
            player = await prisma.player.create({
                data: { name: name.slice(0, 80), slug: await uniqueSlug('player', name), position: matchPosition(pos), height: Number(height) >= 140 && Number(height) <= 230 ? Number(height) : null, gender: club.gender },
            });
            created++;
        } else if (pos && !player.position) {
            await prisma.player.update({ where: { id: player.id }, data: { position: matchPosition(pos) } });
        }
        await prisma.rosterEntry.upsert({
            where: { playerId_clubId_season: { playerId: player.id, clubId: club.id, season } },
            update: { number: no ? Number(no) : null }, create: { playerId: player.id, clubId: club.id, season, number: no ? Number(no) : null },
        });
        added++;
    }
    revalidateVolley({ clubSlug: club.slug });
    return ok({ created, added });
}
