import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containsProfanity } from '../lib/profanity.js';

test('açık küfürleri yakalar', () => {
    for (const t of ['amk ya', 'Siktir', 'orospu çocuğu', 'göt']) assert.equal(containsProfanity(t), true, t);
});

test('harf oyunlarını yakalar', () => {
    for (const t of ['ş3r3fs1z', 's.i.k.t.i.r git', 'yarrrrrak']) assert.equal(containsProfanity(t), true, t);
});

test('masum kelimelerde yanlış alarm vermez', () => {
    for (const t of ['Harika bir haber', 'Sıkıntılı bir durum', 'Sikke koleksiyonu', 'Malatya', 'Götürdü', 'Mal varlığı açıklandı', 'Ananın yemeği', 'Analiz', 'Hamal']) {
        assert.equal(containsProfanity(t), false, t);
    }
});
