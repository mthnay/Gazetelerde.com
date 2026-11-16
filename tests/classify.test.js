import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorySlugsForText, isVolleyball, passesFilter, looksBreaking } from '../lib/classify.js';

const first = (t, o) => categorySlugsForText(t, o)[0];

test('voleybol haberini doğru lige yerleştirir', () => {
    assert.equal(first("Sultanlar Ligi'nde VakıfBank, Eczacıbaşı'nı 3-1 yendi"), 'sultanlar-ligi');
    assert.equal(first("Efeler Ligi'nde Ziraat Bankkart kazandı"), 'efeler-ligi');
    assert.equal(first('Filenin Sultanları Milletler Ligi kadrosu açıklandı'), 'milli-takimlar');
    assert.equal(first("CEV Şampiyonlar Ligi'nde kura çekildi"), 'avrupa-kupalari');
    assert.equal(first('Fenerbahçe Medicana, Brezilyalı smaçörle anlaştı transfer'), 'transfer');
    assert.equal(first('Plaj voleybolunda milli çift finalde'), 'plaj-voleybolu');
    assert.equal(first('Kadınlar 1. Lig 5. hafta sonuçları'), 'alt-ligler');
});

test('genel spor haberi spora, lig belirsiz voleybol haberi varsayılana düşer', () => {
    assert.equal(first('Galatasaray, Amedspor’u 4-3 yendi', { sport: 'spor' }), 'spor');
    assert.equal(first('Takım kampa girdi', { sport: 'voleybol', fallback: 'efeler-ligi' }), 'efeler-ligi');
    assert.equal(first('Takım kampa girdi', { sport: 'voleybol' }), 'sultanlar-ligi');
    assert.ok(categorySlugsForText('x').includes('spor'));
});

test('genel spor kaynağında voleybol haberi tanınır', () => {
    assert.ok(isVolleyball('Milli voleybolcu Ebrar Karakurt'));
    assert.equal(first("Sultanlar Ligi'nde derbi heyecanı", { sport: 'spor' }), 'sultanlar-ligi');
    assert.ok(!isVolleyball('Arda Güler gol attı'));
});

test('anahtar kelime filtresi ve son dakika', () => {
    assert.ok(passesFilter('Voleybol haberi', { include: 'voleybol, filenin' }));
    assert.ok(!passesFilter('Futbol haberi', { include: 'voleybol' }));
    assert.ok(!passesFilter('Voleybol bahis', { exclude: 'bahis' }));
    assert.ok(passesFilter('Herhangi', {}));
    assert.ok(looksBreaking('SON DAKİKA: Filenin Sultanları finalde'));
});
