// Voleybol yönetimi: doğrulama ve önbellek tazeleme
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { POSITIONS } from '@/lib/volley';

const s = (v, n) => String(v ?? '').trim().slice(0, n);
const int = (v, min, max) => { const x = Number(v); return v === '' || v == null || !Number.isFinite(x) ? null : Math.max(min, Math.min(max, Math.round(x))); };
const img = (v) => (/^(\/media\/[a-z0-9]+|https:\/\/\S+)$/i.test(String(v || '')) ? String(v) : null);

export async function uniqueSlug(model, base, id) {
    const root = slugify(base) || model;
    for (let i = 1; i < 200; i++) {
        const slug = i === 1 ? root : `${root}-${i}`;
        const hit = await prisma[model].findUnique({ where: { slug }, select: { id: true } });
        if (!hit || hit.id === id) return slug;
    }
    return `${root}-${Date.now()}`;
}

export function parseClub(b) {
    const name = s(b.name, 80);
    if (name.length < 2) return { error: 'Kulüp adı gerekli.' };
    return { data: {
        name, shortName: s(b.shortName, 6), city: s(b.city, 40), venue: s(b.venue, 80), founded: int(b.founded, 1800, 2100),
        logo: img(b.logo), colors: s(b.colors, 40), coach: s(b.coach, 80), bio: s(b.bio, 2000),
        website: /^https?:\/\/\S+$/.test(String(b.website || '')) ? s(b.website, 200) : null,
        national: !!b.national, gender: b.gender === 'erkek' ? 'erkek' : 'kadin',
    } };
}

export function parsePlayer(b) {
    const name = s(b.name, 80);
    if (name.length < 3) return { error: 'Oyuncu adı gerekli.' };
    return { data: {
        name, position: POSITIONS[b.position] ? b.position : '', height: int(b.height, 140, 230), birthYear: int(b.birthYear, 1950, 2015),
        nationality: s(b.nationality, 40) || 'Türkiye', photo: img(b.photo), bio: s(b.bio, 3000), gender: b.gender === 'erkek' ? 'erkek' : 'kadin', active: b.active !== false,
    } };
}

// Mevki yazımını esnek eşle: "Pasör", "pasor", "Orta Oyuncu", "libero"...
export function matchPosition(text) {
    const t = String(text || '').toLocaleLowerCase('tr').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ğ/g, 'g');
    if (/capraz|opposite/.test(t)) return 'pasor-capraz';
    if (/pasor|setter/.test(t)) return 'pasor';
    if (/libero/.test(t)) return 'libero';
    if (/orta|middle|blok/.test(t)) return 'orta';
    if (/smac|outside|kanat/.test(t)) return 'smacor';
    return '';
}

export function revalidateVolley({ playerSlug, clubSlug } = {}) {
    ['/voleybol', '/oyuncular', '/transfer', '/'].forEach((p) => revalidatePath(p));
    if (playerSlug) revalidatePath(`/oyuncu/${playerSlug}`);
    if (clubSlug) revalidatePath(`/takim/${clubSlug}`);
}
