import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLayout, DEFAULT_LAYOUT, BLOCK_TYPES } from '../lib/homeLayout.js';

test('özgün düzen geçerli ve tüm tekil blokları içerir', () => {
    const l = normalizeLayout(DEFAULT_LAYOUT);
    assert.equal(l.length, DEFAULT_LAYOUT.length);
    const lead = l.find((b) => b.type === 'lead').settings;
    for (const [k, v] of Object.entries(BLOCK_TYPES.lead.defaults)) assert.deepEqual(lead[k], v);
    assert.equal(l.filter((b) => b.type === 'ad').length, 2);
});

test('bilinmeyen tür ve alanlar atılır, tekil bloklar bir kez', () => {
    const l = normalizeLayout([{ type: 'lead' }, { type: 'lead' }, { type: 'hack', settings: {} }, { type: 'news', settings: { evil: '<script>', title: 'Transfer' } }]);
    assert.deepEqual(l.map((b) => b.type), ['lead', 'news']);
    assert.equal(l[1].settings.title, 'Transfer');
    assert.equal('evil' in l[1].settings, false);
});

test('sayılar sınırlanır, seçimler ve bağlantılar doğrulanır', () => {
    const [b] = normalizeLayout([{ type: 'news', settings: { count: 999, layout: 'xx', link: 'javascript:alert(1)', pinned: ['3', 3, -1, 'a', 7], source: 'feed', feedSourceId: '4' } }]);
    assert.equal(b.settings.count, 12);
    assert.equal(b.settings.layout, 'feature');
    assert.equal(b.settings.link, '');
    assert.deepEqual(b.settings.pinned, [3, 7]);
    assert.equal(b.settings.feedSourceId, 4);
    const [c] = normalizeLayout([{ type: 'news', settings: { link: '/category/transfer' } }]);
    assert.equal(c.settings.link, '/category/transfer');
});

test('kapalı blok korunur, kimlikler benzersiz', () => {
    const l = normalizeLayout([{ id: 'x', type: 'news', enabled: false }, { id: 'x', type: 'news' }]);
    assert.equal(l[0].enabled, false);
    assert.notEqual(l[0].id, l[1].id);
});
