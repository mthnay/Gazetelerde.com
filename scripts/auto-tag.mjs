// Mevcut haberlere anahtar kelimeye göre etiket ekler (mevcut etiketlere dokunmaz, yalnızca ekler).
//   DATABASE_URL=... node scripts/auto-tag.mjs
import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/slug.js';

const prisma = new PrismaClient();
// [etiket, öne çıkan mı, eşleşme ifadesi (başlık + özet)]
const RULES = [
    ['Voleybol', true, /voleybol|sultanlar ligi|efeler ligi|cev |tie-break|filenin/i],
    ['Sultanlar Ligi', false, /sultanlar ligi/i],
    ['Efeler Ligi', false, /efeler ligi/i],
    ['CEV Şampiyonlar Ligi', false, /cev şampiyonlar/i],
    ['VakıfBank', false, /vakıfbank/i],
    ['Fenerbahçe', true, /fenerbahçe/i],
    ['Galatasaray', true, /galatasaray/i],
    ['Beşiktaş', false, /beşiktaş/i],
    ['Milli Takım', false, /milli takım|a milli/i],
    ['Arda Güler', false, /arda güler/i],
    ['Borsa İstanbul', false, /borsa/i],
    ['Dolar', false, /dolar/i],
    ['Yapay Zeka', true, /yapay zeka|yapay zekâ/i],
    ['Uzay', false, /james webb|mini ay|kara delik|uzay|nasa/i],
    ['İklim', false, /iklim|cop31|kuraklık/i],
    ['Nükleer Enerji', false, /nükleer/i],
    ['Microsoft', false, /microsoft/i],
    ['Hava Durumu', false, /sağanak|hava ısınıyor|meteoroloji|fırtına/i],
    ['İstanbul', false, /istanbul/i],
    ['Sinema', false, /beyaz perde|film|sinema/i],
    ['Tiyatro', false, /tiyatro/i],
];

try {
    const articles = await prisma.article.findMany({ select: { id: true, title: true, summary: true } });
    let links = 0;
    for (const [name, featured, re] of RULES) {
        const hits = articles.filter((a) => re.test(`${a.title} ${a.summary}`));
        if (!hits.length) continue;
        const slug = slugify(name);
        const tag = await prisma.tag.upsert({ where: { slug }, update: featured ? { featured: true } : {}, create: { slug, name, featured } });
        const r = await prisma.articleTag.createMany({ data: hits.map((a) => ({ articleId: a.id, tagId: tag.id })), skipDuplicates: true });
        links += r.count;
        console.log(`#${name}: ${hits.length} haber`);
    }
    console.log(`${links} yeni etiket bağlantısı eklendi.`);
} finally {
    await prisma.$disconnect();
}
