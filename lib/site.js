// Sitenin herkese açık adresi ve kimliği (sitemap, RSS, meta etiketleri için)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'Gazetelerde';
export const SITE_DESCRIPTION = 'En güncel ve doğru haberler, modern arayüz ile karşınızda.';
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
