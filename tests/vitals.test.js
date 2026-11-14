import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rate, bucketOf, percentile, BUCKETS } from '../lib/vitals.js';

test('Google eşikleri', () => {
    assert.equal(rate('LCP', 2400), 'good');
    assert.equal(rate('LCP', 3000), 'ni');
    assert.equal(rate('LCP', 4100), 'poor');
    assert.equal(rate('CLS', 0.05), 'good');
    assert.equal(rate('INP', 600), 'poor');
});

test('histogram ve p75', () => {
    const b = Array(BUCKETS).fill(0);
    for (const v of [500, 800, 1200, 1800, 2200, 2400, 3500, 9000]) b[bucketOf('LCP', v)]++;
    assert.equal(percentile('LCP', b), 2500); // 8 ölçümün 6.'sı 2400 -> 2500 aralığı
    assert.equal(percentile('LCP', Array(BUCKETS).fill(0)), null);
    assert.equal(bucketOf('LCP', 99999), BUCKETS - 1);
});
