import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canEditArticle, canPublish, canModerate, canManageUsers, isStaffRole } from '../lib/permissions.js';

const author = { id: 'a1', role: 'AUTHOR' };
const editor = { id: 'e1', role: 'EDITOR' };
const admin = { id: 'x1', role: 'ADMIN' };
const reader = { id: 'r1', role: 'READER' };

test('yazar yalnızca kendi yayınlanmamış haberini düzenler', () => {
    assert.equal(canEditArticle(author, { authorId: 'a1', status: 'DRAFT' }), true);
    assert.equal(canEditArticle(author, { authorId: 'a1', status: 'PUBLISHED' }), false);
    assert.equal(canEditArticle(author, { authorId: 'baska', status: 'DRAFT' }), false);
});

test('editör ve yönetici tüm haberleri düzenler ve yayınlar', () => {
    for (const u of [editor, admin]) {
        assert.equal(canEditArticle(u, { authorId: 'baska', status: 'PUBLISHED' }), true);
        assert.equal(canPublish(u), true);
        assert.equal(canModerate(u), true);
    }
    assert.equal(canPublish(author), false);
});

test('kullanıcı yönetimi yalnızca yönetici', () => {
    assert.equal(canManageUsers(admin), true);
    assert.equal(canManageUsers(editor), false);
});

test('okur personel değildir, hiçbir şeyi düzenleyemez', () => {
    assert.equal(isStaffRole('READER'), false);
    assert.equal(canEditArticle(reader, { authorId: 'r1', status: 'DRAFT' }), false);
    assert.equal(canEditArticle(null, { authorId: 'x', status: 'DRAFT' }), false);
});
