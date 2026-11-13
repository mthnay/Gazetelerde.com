// Şifre hash'leme: Node'un yerleşik scrypt'i (ek bağımlılık yok).
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const key = await scryptAsync(password, salt, KEYLEN);
    return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
    const [algo, salt, hex] = String(stored).split(':');
    if (algo !== 'scrypt' || !salt || !hex) return false;
    const key = await scryptAsync(password, salt, KEYLEN);
    const expected = Buffer.from(hex, 'hex');
    return expected.length === key.length && timingSafeEqual(expected, key);
}
