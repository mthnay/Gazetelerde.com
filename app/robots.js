import { absoluteUrl } from '@/lib/site';

export default function robots() {
    return {
        rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/profile', '/login', '/register', '/search', '/bulten/'] }],
        sitemap: [absoluteUrl('/sitemap.xml'), absoluteUrl('/news-sitemap.xml')],
    };
}
