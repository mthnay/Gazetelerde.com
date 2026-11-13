import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchPublic } from '@/lib/safeFetch';

export async function POST(request) {
    try {
        const { url } = await request.json().catch(() => ({}));
        if (!url) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });

        const { res: response } = await fetchPublic(url);

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract metadata
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        let image = $('meta[property="og:image"]').attr('content') || '';

        // Fix relative image URLs
        if (image) {
            try { image = new URL(image, response.url || url).href; } catch { image = ''; }
        }

        // Attempt to grab main article content
        // We try to find common news containers
        const selectors = ['article', '.article-body', '.content', '.news-detail', 'main'];
        let content = '';

        for (const selector of selectors) {
            const el = $(selector);
            if (el.length > 0) {
                // Get all paragraphs
                content = el.first().find('p').map((i, el) => $(el).text().trim()).get().filter(t => t.length > 20).join('\n\n');
                if (content.length > 100) break; // If we found substantial content, stop
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                title: title.trim(),
                description: description.trim(),
                image,
                content: content || "İçerik otomatik alınamadı, lütfen manuel ekleyiniz."
            }
        });

    } catch (error) {
        console.error('Scrape error:', error);
        return NextResponse.json({ error: 'Haber çekilemedi: ' + error.message, success: false }, { status: 500 });
    }
}
