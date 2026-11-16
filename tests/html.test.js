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

test('stüdyo blokları korunur', () => {
    const html = '<figure data-align="wide"><img src="/media/abc123" alt="x"><figcaption>Altyazı</figcaption></figure>'
        + '<div class="cols cols-2"><div class="col"><p>A</p></div><div class="col"><p>B</p></div></div>'
        + '<div class="gallery gallery-3"><figure class="gallery-item"><img src="/media/abc123" alt=""></figure></div>'
        + '<aside class="callout" data-tone="highlight"><p>Not</p></aside>'
        + '<div class="score" data-home="VakıfBank" data-away="Nilüfer" data-home-score="3" data-away-score="0" data-sets="25-18" data-meta="Sultanlar Ligi"><div class="score-meta">Sultanlar Ligi</div><div class="score-row"><span class="score-team">VakıfBank</span><span class="score-num">3 – 0</span><span class="score-team">Nilüfer</span></div><div class="score-sets">25-18</div></div>';
    const out = sanitizeArticleHtml(html);
    for (const part of ['data-align="wide"', '<figcaption>Altyazı</figcaption>', 'class="cols cols-2"', 'class="col"', 'class="gallery gallery-3"', 'class="gallery-item"', 'class="callout" data-tone="highlight"', 'data-home="VakıfBank"', 'class="score-num"']) {
        assert.ok(out.includes(part), part);
    }
});

test('izinsiz sınıf ve değerler atılır', () => {
    const out = sanitizeArticleHtml('<figure data-align="evil" class="x"><img src="/media/abc123"></figure><div class="hack"><p>t</p></div><aside class="callout" data-tone="red" style="color:red"><p>n</p></aside><span class="kotu">s</span>');
    assert.doesNotMatch(out, /data-align|class="x"|hack|data-tone|style=|kotu/);
    assert.match(out, /<p>t<\/p>/);
});

test('geçersiz kutu içeriği korunarak açılır, komşu kutular bozulmaz', () => {
    const out = sanitizeArticleHtml('<aside class="callout"><p>n</p></aside><aside class="kotu"><p>k</p></aside><div class="hack"><p>t</p></div>');
    assert.equal(out, '<aside class="callout"><p>n</p></aside><p>k</p><p>t</p>');
});

test('karakter kodları çözülür (RSS)', async () => {
    const { decodeEntities } = await import('../lib/html.js');
    assert.equal(decodeEntities('Gülmezoğlu&#8217;nun &#8220;karar&#8221; &amp; &hellip;'), 'Gülmezoğlu’nun “karar” & …');
    assert.equal(decodeEntities('&amp;#8217; &#x2019; &amp;quot;x&amp;quot;'), '’ ’ "x"');
    assert.equal(decodeEntities('&bilinmeyen; 3 &lt; 5'), '&bilinmeyen; 3 < 5');
});
