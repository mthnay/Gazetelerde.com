import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStandings, parseSets, setsToScore } from '../lib/standings.js';

const T = [{ id: 1, name: 'VakıfBank' }, { id: 2, name: 'Fenerbahçe Medicana' }, { id: 3, name: 'Eczacıbaşı' }];
const F = (homeId, awayId, h, a, sets) => ({ homeId, awayId, homeScore: h, awayScore: a, sets, status: 'FINISHED' });

test('set girişi ayrıştırma', () => {
    assert.deepEqual(parseSets('25-21, 23-25 25:18'), [[25, 21], [23, 25], [25, 18]]);
    assert.equal(parseSets('25-21, abc'), null);
    assert.deepEqual(setsToScore([[25, 21], [23, 25], [25, 18], [25, 20]]), [3, 1]);
});

test('voleybol puanlaması: 3-0/3-1 = 3-0, 3-2 = 2-1', () => {
    const s = computeStandings(T, [F(1, 2, 3, 2), F(3, 1, 3, 1), F(2, 3, 3, 0)], 'voleybol');
    const by = Object.fromEntries(s.map((r) => [r.team.id, r]));
    assert.equal(by[1].points, 2 + 0);
    assert.equal(by[2].points, 1 + 3);
    assert.equal(by[3].points, 3 + 0);
    assert.equal(s[0].team.id, 2); // 4 puan
});

test('eşit puanda galibiyet, sonra set averajı', () => {
    const s = computeStandings(T, [F(1, 3, 3, 0), F(2, 3, 3, 1)], 'voleybol');
    assert.equal(s[0].team.id, 1); // aynı puan/galibiyet, set averajı 3/0 > 3/1
    assert.equal(s[1].team.id, 2);
});

test('oynanmamış maçlar sayılmaz, form son 5', () => {
    const s = computeStandings(T, [{ homeId: 1, awayId: 2, status: 'SCHEDULED' }], 'voleybol');
    assert.ok(s.every((r) => r.played === 0));
});

test('futbol: beraberlik 1 puan', () => {
    const s = computeStandings(T, [F(1, 2, 1, 1), F(3, 1, 0, 2)], 'futbol');
    assert.equal(s[0].team.id, 1);
    assert.equal(s[0].points, 4);
    assert.equal(s.find((r) => r.team.id === 2).points, 1);
});
