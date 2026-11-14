import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBot, deviceOf, kindOf, sourceOf, istanbulDay } from '../lib/analytics.js';

test('botlar ayıklanır', () => {
    assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
    assert.equal(isBot(''), true);
    assert.equal(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1'), false);
});

test('cihaz ve sayfa türü', () => {
    assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 14) Mobile'), 'mobil');
    assert.equal(deviceOf('Mozilla/5.0 (Macintosh)'), 'masaustu');
    assert.equal(kindOf('/'), 'anasayfa');
    assert.equal(kindOf('/haber/x'), 'haber');
    assert.equal(kindOf('/etiket/voleybol'), 'etiket');
    assert.equal(kindOf('/kunye'), 'diger');
});

test('kaynak tespiti', () => {
    assert.equal(sourceOf({}), 'dogrudan');
    assert.equal(sourceOf({ utm: 'Bulten' }), 'bulten');
    assert.equal(sourceOf({ referrer: 'https://www.google.com.tr/' }), 'google');
    assert.equal(sourceOf({ referrer: 'https://news.google.com/x' }), 'google-haberler');
    assert.equal(sourceOf({ referrer: 'https://t.co/abc' }), 'x');
    assert.equal(sourceOf({ referrer: 'https://site.com/a', host: 'site.com' }), 'site-ici');
    assert.equal(sourceOf({ referrer: 'http://localhost:3000/', host: 'localhost:3000' }), 'site-ici');
    assert.equal(sourceOf({ referrer: 'çöp' }), 'dogrudan');
});

test('İstanbul günü: UTC 22:30 ertesi güne sayılır', () => {
    assert.equal(istanbulDay(new Date('2026-11-13T22:30:00Z')).toISOString(), '2026-11-14T00:00:00.000Z');
    assert.equal(istanbulDay(new Date('2026-11-13T20:00:00Z')).toISOString(), '2026-11-13T00:00:00.000Z');
});
