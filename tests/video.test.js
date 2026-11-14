import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVideo } from '../lib/video.js';

test('video adresleri', () => {
    assert.equal(parseVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42').embed, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&start=42');
    assert.equal(parseVideo('https://youtu.be/dQw4w9WgXcQ').id, 'dQw4w9WgXcQ');
    assert.equal(parseVideo('https://youtube.com/shorts/abcDEF12345').vertical, true);
    assert.equal(parseVideo('https://vimeo.com/123456789').provider, 'vimeo');
    assert.equal(parseVideo('https://cdn.example.com/klip.mp4').provider, 'file');
    assert.equal(parseVideo('http://youtube.com/watch?v=dQw4w9WgXcQ'), null); // https zorunlu
    assert.equal(parseVideo('https://evil.example.com/watch?v=dQw4w9WgXcQ'), null);
    assert.equal(parseVideo('javascript:alert(1)'), null);
});
