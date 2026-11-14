import { test } from 'node:test';
import assert from 'node:assert/strict';

// matchPosition saf bir fonksiyon; modülün geri kalanı veritabanı ister, o yüzden kopyasını değil kaynağı okuyup değerlendiririz
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../lib/volleyAdmin.js', import.meta.url), 'utf8');
const body = src.slice(src.indexOf('export function matchPosition'), src.indexOf('export function revalidateVolley'));
const matchPosition = new Function(`${body.replace('export ', '')}; return matchPosition;`)();

test('mevki yazımları eşlenir', () => {
    assert.equal(matchPosition('Pasör'), 'pasor');
    assert.equal(matchPosition('Pasör Çaprazı'), 'pasor-capraz');
    assert.equal(matchPosition('opposite'), 'pasor-capraz');
    assert.equal(matchPosition('Orta Oyuncu'), 'orta');
    assert.equal(matchPosition('Smaçör'), 'smacor');
    assert.equal(matchPosition('LİBERO'), 'libero');
    assert.equal(matchPosition('antrenör'), '');
});
