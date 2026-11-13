import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paragraphs, readingTime, articleUrl } from '../lib/format.js';
import { xmlEscape } from '../lib/xml.js';

test('paragrafları boş satırdan böler, boşları atar', () => {
    assert.deepEqual(paragraphs('Bir.\n\nİki.\n   \n\nÜç.'), ['Bir.', 'İki.', 'Üç.']);
    assert.deepEqual(paragraphs(''), []);
});

test('okuma süresi en az 1 dakikadır', () => {
    assert.equal(readingTime({ summary: 'kısa', content: 'metin' }), 1);
    assert.equal(readingTime({ summary: '', content: 'kelime '.repeat(1000) }), 5);
});

test('haber adresi slug ile oluşur', () => {
    assert.equal(articleUrl({ slug: 'deneme' }), '/haber/deneme');
});

test('XML özel karakterleri kaçırılır', () => {
    assert.equal(xmlEscape(`<a href="x">Tom & Jerry's</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;');
});
