import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPoint, setsWon, isSetComplete, trimSets } from '../lib/volleyScore.js';

const play = (sets, seq) => seq.split('').reduce((s, c) => applyPoint(s, c === 'h' ? 'home' : 'away').sets, sets);

test('set 25 sayıda ve 2 farkla biter', () => {
    assert.equal(isSetComplete([25, 23], 0), true);
    assert.equal(isSetComplete([25, 24], 0), false);
    assert.equal(isSetComplete([27, 25], 1), true);
    assert.equal(isSetComplete([15, 13], 4), true); // 5. set 15
    assert.equal(isSetComplete([15, 13], 3), false);
});

test('set biter, yeni set açılır; devam eden set skora sayılmaz', () => {
    let r = { sets: [[24, 20]] };
    r = applyPoint(r.sets, 'home');
    assert.equal(r.setEnded, true);
    assert.deepEqual(r.sets, [[25, 20], [0, 0]]);
    assert.deepEqual([r.home, r.away], [1, 0]);
    r = applyPoint(r.sets, 'away');
    assert.deepEqual(setsWon(r.sets), [1, 0]);
});

test('3 set alan kazanır, sonra sayı eklenmez', () => {
    let s = [[25, 10], [25, 10], [24, 10]];
    const r = applyPoint(s, 'home');
    assert.equal(r.matchEnded, true);
    assert.deepEqual([r.home, r.away], [3, 0]);
    assert.deepEqual(r.sets, [[25, 10], [25, 10], [25, 10]]);
    assert.equal(applyPoint(r.sets, 'away').matchEnded, true);
    assert.deepEqual(applyPoint(r.sets, 'away').sets, r.sets);
});

test('geri alma: 0-0 seti silip önceki sete döner', () => {
    const r = applyPoint([[25, 20], [0, 0]], 'home', -1);
    assert.deepEqual(r.sets, [[24, 20]]);
    assert.deepEqual(trimSets([[25, 20], [0, 0]]), [[25, 20]]);
});

test('tie-break 15-13 maçı bitirir', () => {
    const s = [[25, 20], [20, 25], [25, 22], [23, 25], [14, 13]];
    const r = applyPoint(s, 'home');
    assert.equal(r.matchEnded, true);
    assert.deepEqual([r.home, r.away], [3, 2]);
});

test('sıfırdan oynanan set', () => {
    const sets = play([], 'h'.repeat(25) + 'a'.repeat(3));
    assert.deepEqual(sets, [[25, 0], [0, 3]]);
});
