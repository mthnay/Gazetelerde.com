import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/password.js';

test('doğru şifre doğrulanır, yanlışı reddedilir', async () => {
    const hash = await hashPassword('GizliSifre123');
    assert.match(hash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
    assert.equal(await verifyPassword('GizliSifre123', hash), true);
    assert.equal(await verifyPassword('gizlisifre123', hash), false);
});

test('aynı şifre her seferinde farklı hash üretir (tuz)', async () => {
    assert.notEqual(await hashPassword('x'), await hashPassword('x'));
});

test('bozuk kayıtta hata fırlatmadan false döner', async () => {
    assert.equal(await verifyPassword('x', 'bozuk'), false);
    assert.equal(await verifyPassword('x', ''), false);
});
