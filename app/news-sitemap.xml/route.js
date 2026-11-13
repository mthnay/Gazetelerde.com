import { prisma } from '@/lib/db';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { xmlEscape } from '@/lib/xml';

export const revalidate = 300;

// Google News sitemap: sadece son 48 saatte yayınlanan haberler (en fazla 1000)
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
export async function GET() {
    const now = new Date();
    const since = new Date(now.getTime() - 48 * 3600 * 1000);
    const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED', publishedAt: { gte: since, lte: now } },
        orderBy: { publishedAt: 'desc' },
        take: 1000,
        select: { slug: true, title: true, publishedAt: true },
    });

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles.map((a) => `  <url>
    <loc>${xmlEscape(absoluteUrl(`/haber/${a.slug}`))}</loc>
    <news:news>
      <news:publication><news:name>${xmlEscape(SITE_NAME)}</news:name><news:language>tr</news:language></news:publication>
      <news:publication_date>${a.publishedAt.toISOString()}</news:publication_date>
      <news:title>${xmlEscape(a.title)}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>`;

    return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
