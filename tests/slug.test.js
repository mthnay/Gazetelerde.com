import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../lib/slug.js';

test('Türkçe karakterleri ve kesme işaretini dönüştürür', () => {
    assert.equal(slugify("İstanbul Maratonu'nda Rekor Katılım"), 'istanbul-maratonunda-rekor-katilim');
    assert.equal(slugify('Çağ, Şehir, Ğ, Ü, Ö, ı'), 'cag-sehir-g-u-o-i');
});

test('noktalama ve fazla boşlukları tek tireye indirir, uçları kırpar', () => {
    assert.equal(slugify('  Yapay Zeka: Yeni Bir Çağ mı?!  '), 'yapay-zeka-yeni-bir-cag-mi');
});

test('80 karakterle sınırlar', () => {
    assert.ok(slugify('a '.repeat(100)).length <= 80);
});
