import { prisma, buildSafe } from '@/lib/db';
import { absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { xmlEscape } from '@/lib/xml';

export const revalidate = 300;

// Sitenin kendi RSS akışı: haber okuyucular ve toplayıcılar (Google News, Feedly vb.) için
export async function GET() {
    const now = new Date();
    const articles = await buildSafe(() => prisma.article.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: now } },
        orderBy: { publishedAt: 'desc' },
        take: 50,
        select: { slug: true, title: true, summary: true, image: true, publishedAt: true, authorName: true, author: { select: { name: true } }, category: { select: { label: true } } },
    }), []);

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(SITE_NAME)}</title>
    <link>${xmlEscape(absoluteUrl('/'))}</link>
    <description>${xmlEscape(SITE_DESCRIPTION)}</description>
    <language>tr</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(absoluteUrl('/rss.xml'))}" rel="self" type="application/rss+xml" />
${articles.map((a) => {
        const url = absoluteUrl(`/haber/${a.slug}`);
        return `    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <description>${xmlEscape(a.summary)}</description>
      <category>${xmlEscape(a.category.label)}</category>
      <dc:creator>${xmlEscape(a.author?.name || a.authorName || SITE_NAME)}</dc:creator>
      <pubDate>${a.publishedAt.toUTCString()}</pubDate>${a.image ? `\n      <media:content url="${xmlEscape(a.image.startsWith('/') ? absoluteUrl(`${a.image}?w=1200&f=jpg`) : a.image)}" medium="image" type="image/jpeg" width="1200" />` : ''}
    </item>`;
    }).join('\n')}
  </channel>
</rss>`;

    return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
