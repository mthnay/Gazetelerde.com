import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchPublic } from '@/lib/safeFetch';

export async function POST(request) {
    try {
        const { url } = await request.json().catch(() => ({}));
        if (!url) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });

        const { res: response } = await fetchPublic(url);
        const text = await response.text();
        const $ = cheerio.load(text, { xmlMode: true });

        const items = [];
        $('item, entry').slice(0, 10).each((i, el) => {
            const title = $(el).find('title').first().text().replace('<![CDATA[', '').replace(']]>', '').trim();
            const link = ($(el).find('link').first().text() || $(el).find('link').attr('href') || '').trim();
            const pubDate = $(el).find('pubDate, published, updated').first().text();

            // Try to find image in various RSS formats
            let image = $(el).find('enclosure').attr('url') ||
                $(el).find('media\\:content, content').attr('url') ||
                $(el).find('image').text() ||
                '';

            // If description contains an image tag, try to extract it
            if (!image) {
                const desc = $(el).find('description').text();
                const imgMatch = desc.match(/src="([^"]+)"/);
                if (imgMatch) image = imgMatch[1];
            }

            items.push({ title, link, pubDate, image });
        });

        return NextResponse.json({ success: true, items });

    } catch (error) {
        return NextResponse.json({ error: 'Akış okunamadı: ' + error.message, success: false }, { status: 500 });
    }
}
