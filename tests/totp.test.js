import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totp, verifyTotp, base32Encode, base32Decode, encryptSecret, decryptSecret, generateRecoveryCodes, hashCode } from '../lib/totp.js';

// RFC 6238 Ek B test vektörü (SHA-1, anahtar "12345678901234567890")
const SECRET = base32Encode(Buffer.from('12345678901234567890'));

test('RFC 6238 test vektörleri', () => {
    assert.equal(totp(SECRET, 59 * 1000, 30, 8), '94287082');
    assert.equal(totp(SECRET, 1111111109 * 1000, 30, 8), '07081804');
    assert.equal(totp(SECRET, 2000000000 * 1000, 30, 8), '69279037');
});

test('base32 gidiş-dönüş', () => {
    const b = Buffer.from('gazetelerde!');
    assert.deepEqual(base32Decode(base32Encode(b)), b);
});

test('±30 sn tolerans, daha fazlası reddedilir', () => {
    const t = 1_800_000_000_000;
    assert.equal(verifyTotp(SECRET, totp(SECRET, t), t + 30_000), true);
    assert.equal(verifyTotp(SECRET, totp(SECRET, t), t + 95_000), false);
    assert.equal(verifyTotp(SECRET, 'abc123', t), false);
});

test('anahtar şifreleme ve kurtarma kodları', () => {
    process.env.AUTH_SECRET = 'test-secret-1234567890';
    const enc = encryptSecret('JBSWY3DPEHPK3PXP');
    assert.notEqual(enc, 'JBSWY3DPEHPK3PXP');
    assert.equal(decryptSecret(enc), 'JBSWY3DPEHPK3PXP');
    const codes = generateRecoveryCodes();
    assert.equal(codes.length, 10);
    assert.match(codes[0], /^[a-z2-7]{4}-[a-z2-7]{4}$/);
    assert.equal(hashCode(codes[0].toUpperCase()), hashCode(codes[0].replace('-', '')));
});
