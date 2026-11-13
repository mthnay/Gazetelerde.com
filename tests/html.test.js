import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeArticleHtml, toArticleHtml, plainText } from '../lib/html.js';

test('zararlı içerik temizlenir (XSS)', () => {
    const out = sanitizeArticleHtml('<p onclick="x()">a<script>alert(1)</script></p><img src=x onerror=alert(1)><a href="javascript:alert(1)">b</a><iframe src="https://evil.com"></iframe>');
    assert.doesNotMatch(out, /script|onerror|onclick|javascript:|evil\.com/);
    assert.match(out, /<p>a<\/p>/);
});

test('izinli biçimlendirme korunur, dış link güvenli açılır', () => {
    const out = sanitizeArticleHtml('<h2>Başlık</h2><p><strong>kalın</strong> <a href="https://tvf.org.tr">TVF</a></p><blockquote>alıntı</blockquote>');
    assert.match(out, /<h2>Başlık<\/h2>/);
    assert.match(out, /<a href="https:\/\/tvf\.org\.tr" target="_blank" rel="noopener noreferrer nofollow">TVF<\/a>/);
    assert.match(out, /<blockquote>alıntı<\/blockquote>/);
});

test('yalnızca YouTube videosu ve izinli görsel kaynakları kabul edilir', () => {
    const yt = sanitizeArticleHtml('<div data-youtube-video=""><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></div>');
    assert.match(yt, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    assert.match(sanitizeArticleHtml('<img src="/media/abc123" alt="x">'), /src="\/media\/abc123"/);
    assert.doesNotMatch(sanitizeArticleHtml('<img src="http://x.com/a.png">'), /<img/);
});

test('eski düz metin paragraflara çevrilir ve kaçırılır', () => {
    assert.equal(toArticleHtml('Bir <b>.\n\nİki.'), '<p>Bir &lt;b&gt;.</p><p>İki.</p>');
});

test('HTML düz metne çevrilir', () => {
    assert.equal(plainText('<h2>A</h2><p>B &amp; C</p>'), 'A\nB & C');
});
