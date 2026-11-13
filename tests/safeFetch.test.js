import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicUrl } from '../lib/safeFetch.js';

test('herkese açık http(s) adresleri kabul eder', () => {
    assert.equal(validatePublicUrl('https://example.com/rss').hostname, 'example.com');
});

test('iç ağ ve yerel adresleri reddeder (SSRF)', () => {
    for (const u of ['http://localhost:3000', 'http://127.0.0.1', 'http://10.0.0.5', 'http://192.168.1.1', 'http://172.16.0.1', 'http://169.254.169.254/latest/meta-data', 'http://[::1]/']) {
        assert.throws(() => validatePublicUrl(u), u);
    }
});

test('http/https dışındaki protokolleri ve bozuk adresleri reddeder', () => {
    for (const u of ['file:///etc/passwd', 'ftp://example.com', 'javascript:alert(1)', 'bozuk adres']) {
        assert.throws(() => validatePublicUrl(u), u);
    }
});
