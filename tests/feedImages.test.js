import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { articleCover, feedCover } from '../lib/feedImages.js';

const base = 'https://gazete.example/spor/haber/';
test('Voleybol Plus kapak fotoğrafını lazy-load yer tutucusundan ayırır', () => {
    const $ = load('<header><img src="/logo.png"></header><div class="post-image"><img src="data:image/svg+xml;base64,AAAA" data-src="/uploads/forma.jpg"></div>');
    assert.equal(articleCover($, base), 'https://gazete.example/uploads/forma.jpg');
});

test('önce paylaşım görselini seçer, reklam veya site logosunu kapak yapmaz', () => {
    const $ = load('<meta property="og:image" content="//cdn.example/kapak.jpg"><figure class="post-image"><img src="/other.jpg"></figure>');
    assert.equal(articleCover($, base), 'https://cdn.example/kapak.jpg');
    assert.equal(articleCover(load('<aside><img src="/reklam.jpg"></aside>'), base), null);
});

test('RSS özetinde görsel yoksa içerikteki göreli fotoğrafı bulur, video ekini atlar', () => {
    const $ = load(`<item><enclosure type="video/mp4" url="https://cdn.example/a.mp4"/>
      <description>Maç haberi</description><content:encoded><![CDATA[<img src='../takım.jpg'>]]></content:encoded></item>`, { xmlMode: true });
    assert.equal(feedCover($, $('item'), base), 'https://gazete.example/spor/tak%C4%B1m.jpg');
});

test('Media RSS küçük resmini ve imzalı sorgusunu korur', () => {
    const $ = load('<item><media:thumbnail url="https://cdn.example/img?w=800&amp;token=a%2Fb"/></item>', { xmlMode: true });
    assert.equal(feedCover($, $('item'), base), 'https://cdn.example/img?w=800&token=a%2Fb');
});
