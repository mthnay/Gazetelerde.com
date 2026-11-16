import { test } from 'node:test';
import assert from 'node:assert/strict';
import { similarity, findDuplicate, DUPLICATE_THRESHOLD as T } from '../lib/dedupe.js';

const same = (a, b) => assert.ok(similarity(a, b) >= T, `aynı sayılmalı (${similarity(a, b).toFixed(2)}): ${a} | ${b}`);
const diff = (a, b) => assert.ok(similarity(a, b) < T, `farklı sayılmalı (${similarity(a, b).toFixed(2)}): ${a} | ${b}`);

test('farklı kaynaklardaki aynı haber', () => {
    same("Fenerbahçe'de Yiğit Gülmezoğlu kadro dışı bırakıldı", 'Fenerbahçe Medicana, Yiğit Gülmezoğlu ile yollarını ayırmadı ama kadro dışı bıraktı');
    same("VakıfBank, Eczacıbaşı Dynavit'i 3-1 yendi", "Sultanlar Ligi'nde VakıfBank, Eczacıbaşı Dynavit karşısında 3-1 kazandı");
    same("Temsilcimiz İstanbul Gençlik, CEV Challenge Kupası'nda Sahne Alıyor", "İstanbul Gençlik, CEV Challenge Kupası'nda Maccabi Yeadim Tel Aviv ile karşılaşacak");
    same('U18 Erkek Milli Takımımız Ankara’da Ara Kampa Girdi', 'U18 Erkek Milli Takımı Ankara’daki ara kampına başladı');
});

test('benzer görünen ama farklı haberler', () => {
    diff("Uzman Posta Kadınlar 2. Ligi'nde 7. Hafta Sona Erdi", "Uzman Posta Erkekler 2. Ligi'nde 7. Hafta Sona Erdi");
    diff("VakıfBank, Eczacıbaşı Dynavit'i 3-1 yendi", "VakıfBank, Eczacıbaşı Dynavit'i 3-0 yendi");
    diff("Vodafone Sultanlar Ligi'nde 8. Hafta Sona Erdi", "Vodafone Sultanlar Ligi'nde 9. Hafta Sona Erdi");
    diff('Fenerbahçe Medicana, Türk Hava Yolları deplasmanında set vermedi', 'Galatasaray Daikin, Beşiktaş karşısında set vermedi');
    diff('Teşekkürler Orkun Özel', 'Orkun Özel ile yollar ayrıldı mı?');
});

test('listeden eşleşeni bulur', () => {
    const items = [{ id: 1, text: "Efeler Ligi'nde Ziraat Bankkart'ın kusursuz başlangıcı sürüyor" }, { id: 2, text: "Fenerbahçe'de Yiğit Gülmezoğlu kadro dışı bırakıldı" }];
    assert.equal(findDuplicate('Yiğit Gülmezoğlu, Fenerbahçe’de kadro dışı', items)?.id, 2);
    assert.equal(findDuplicate('Halkbank kupada yarı finalde', items), null);
});
