// Rol bazlı yetki kuralları. Hem sunucuda (asıl kontrol) hem istemcide
// (butonları göstermek/gizlemek için) kullanılır.
//
//  AUTHOR : kendi haberlerini yazar/düzenler, yayınlayamaz (taslak olarak kalır)
//  EDITOR : tüm haberleri düzenler, yayınlar, yorumları yönetir
//  ADMIN  : editörün yaptıkları + kullanıcı ve rol yönetimi

export const ROLE_LABELS = { READER: 'Okur', AUTHOR: 'Yazar', EDITOR: 'Editör', ADMIN: 'Yönetici' };
export const STATUS_LABELS = { DRAFT: 'Taslak', PUBLISHED: 'Yayında', ARCHIVED: 'Arşiv' };

export const isStaffRole = (role) => ['AUTHOR', 'EDITOR', 'ADMIN'].includes(role);
export const canPublish = (user) => ['EDITOR', 'ADMIN'].includes(user?.role);
export const canModerate = canPublish;
export const canManageUsers = (user) => user?.role === 'ADMIN';

export function canEditArticle(user, article) {
    if (!user) return false;
    if (canPublish(user)) return true;
    return user.role === 'AUTHOR' && article.authorId === user.id && article.status !== 'PUBLISHED';
}

export const canDeleteArticle = canEditArticle;
