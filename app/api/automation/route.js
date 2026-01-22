import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
    try {
        const { url } = await request.json();
        if (!url) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });

        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const text = await response.text();
        const $ = cheerio.load(text, { xmlMode: true });

        const items = [];
        $('item').slice(0, 10).each((i, el) => {
            const title = $(el).find('title').text().replace('<![CDATA[', '').replace(']]>', '');
            const link = $(el).find('link').text();
            const pubDate = $(el).find('pubDate').text();

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
