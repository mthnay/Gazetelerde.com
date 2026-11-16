import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { pollSource } from '@/lib/feeds';
import { presetByKey, PRESET_DEFAULTS } from '@/lib/feedPresets';

// Hazır kaynağı aç / kapat. Açılınca kaynak oluşturulur (ya da yeniden etkinleşir) ve hemen bir kez taranır.
export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const body = await readJson(request);
    const p = presetByKey(String(body?.key || ''));
    if (!p) return fail('Bilinmeyen kaynak.', 404);
    const active = Boolean(body?.active);
    const settings = { name: p.name, url: p.url, kind: p.kind, linkPattern: p.linkPattern || '', sport: p.sport, include: p.include || '', exclude: p.exclude || '' };

    // Aynı adres daha önce elle eklendiyse onu hazır kaynağa bağla
    const existing = await prisma.feedSource.findFirst({ where: { OR: [{ preset: p.key }, { url: p.url }] } });
    let source;
    if (existing) {
        source = await prisma.feedSource.update({
            where: { id: existing.id },
            // Panelde değiştirilen mod / süre ayarları korunur; ilk bağlanışta varsayılanlar uygulanır
            data: active ? { ...settings, preset: p.key, active, ...(existing.preset ? {} : PRESET_DEFAULTS) } : { active },
        });
    } else {
        if (!active) return ok({ active: false });
        source = await prisma.feedSource.create({ data: { ...settings, ...PRESET_DEFAULTS, preset: p.key, active } });
    }
    // Tarama (ve yapay zekâyla yeniden yazma) uzun sürebilir: isteği bekletmeden arka planda
    if (active) pollSource(source).catch((e) => console.error('[hazır kaynak]', p.key, e?.message));
    return ok({ active: source.active, id: source.id });
}
