// Video adresini oynatıcıya çevirir: YouTube (çerezsiz alan adı), Vimeo ya da doğrudan .mp4
export function parseVideo(url) {
    if (!url) return null;
    let u;
    try { u = new URL(url); } catch { return null; }
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];
    }
    if (id && /^[\w-]{6,20}$/.test(id)) {
        const start = parseInt(u.searchParams.get('t') || u.searchParams.get('start') || '0', 10) || 0;
        return {
            provider: 'youtube', id,
            embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start ? `&start=${start}` : ''}`,
            thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            vertical: u.pathname.startsWith('/shorts/'),
        };
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const vid = u.pathname.match(/(\d{6,12})/)?.[1];
        if (vid) return { provider: 'vimeo', id: vid, embed: `https://player.vimeo.com/video/${vid}?autoplay=1&dnt=1`, thumb: null, vertical: false };
    }
    if (/\.(mp4|webm)$/i.test(u.pathname)) return { provider: 'file', src: u.href, thumb: null, vertical: false };
    return null;
}
