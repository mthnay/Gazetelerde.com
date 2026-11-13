"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageCircle, Share2, Send, Bookmark } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

export default function NewsInteractions({
    articleId, title, isLoggedIn,
    initialLiked = false, initialSaved = false, initialLikeCount = 0, initialComments = [],
}) {
    const pathname = usePathname();
    const [liked, setLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [saved, setSaved] = useState(initialSaved);
    const [comments, setComments] = useState(initialComments);
    const [newComment, setNewComment] = useState('');
    const [msg, setMsg] = useState('');
    const [sending, setSending] = useState(false);

    const flash = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(''), 2500);
    };

    const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

    const toggle = async (kind, current, setCurrent) => {
        if (!isLoggedIn) return flash('Bu işlem için giriş yapmalısınız.');
        setCurrent(!current); // iyimser güncelleme
        const res = await fetch(`/api/articles/${articleId}/${kind}`, { method: current ? 'DELETE' : 'POST' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) {
            setCurrent(current);
            return flash(data?.message || 'Bir hata oluştu.');
        }
        if (kind === 'like') setLikeCount(data.count);
        if (kind === 'bookmark') flash(data.saved ? 'Kaydedilenlere eklendi' : 'Kaydedilenlerden çıkarıldı');
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title, url });
            } else {
                await navigator.clipboard.writeText(url);
                flash('Bağlantı kopyalandı');
            }
        } catch { /* kullanıcı iptal etti */ }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        const text = newComment.trim();
        if (!text || sending) return;
        setSending(true);
        const res = await fetch(`/api/articles/${articleId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setSending(false);
        if (!data?.success) return flash(data?.message || 'Yorum gönderilemedi.');
        const c = data.comment;
        setComments([{ id: c.id, text: c.text, user: c.user.name, time: c.createdAt }, ...comments]);
        setNewComment('');
    };

    return (
        <>
            <div className="interaction-bar glass-panel">
                <div style={{ display: 'flex', gap: '24px' }}>
                    <button onClick={() => toggle('like', liked, setLiked)} className={`action-btn ${liked ? 'liked' : ''}`} aria-pressed={liked} aria-label="Beğen">
                        <Heart size={20} fill={liked ? '#ef4444' : 'none'} />
                        <span>{likeCount}</span>
                    </button>
                    <a href="#yorumlar" className="action-btn">
                        <MessageCircle size={20} />
                        <span>{comments.length}</span>
                    </a>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {msg && <span role="status" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{msg}</span>}
                    <button onClick={() => toggle('bookmark', saved, setSaved)} className={`action-btn ${saved ? 'saved' : ''}`} aria-pressed={saved} aria-label="Kaydet">
                        <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={handleShare} className="action-btn" aria-label="Paylaş">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            <div id="yorumlar" style={{ marginTop: '40px', marginBottom: '60px' }}>
                <h3 style={{ marginBottom: '24px' }}>Yorumlar ({comments.length})</h3>

                {isLoggedIn ? (
                    <form onSubmit={handleComment} style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            className="comment-input"
                            placeholder="Düşüncelerini paylaş..."
                            aria-label="Yorum"
                            maxLength={1000}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button type="submit" disabled={sending} className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '99px' }} aria-label="Gönder">
                            <Send size={18} />
                        </button>
                    </form>
                ) : (
                    <p className="login-hint">
                        Yorum yapmak için <Link href={loginHref}>giriş yapın</Link> ya da <Link href="/register">üye olun</Link>.
                    </p>
                )}

                {comments.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>Henüz yorum yok. İlk yorumu sen yap!</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {comments.map((c) => (
                        <div key={c.id} style={{ display: 'flex', gap: '16px' }}>
                            <div className="comment-avatar">{c.user.charAt(0).toLocaleUpperCase('tr')}</div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '600' }}>{c.user}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {formatShortDate(c.time)}</span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', overflowWrap: 'anywhere' }}>{c.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .interaction-bar { display: flex; justify-content: space-between; padding: 16px 24px; border-radius: 12px; margin-bottom: 40px; }
                .action-btn { background: none; border: none; color: var(--text-muted); display: flex; align-items: center; gap: 8px; font-size: 15px; cursor: pointer; transition: all 0.2s; }
                .action-btn:hover { color: var(--text-main); }
                .action-btn.liked { color: #ef4444; }
                .action-btn.saved { color: var(--primary); }
                .comment-input { flex: 1; padding: 14px 20px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 99px; color: var(--text-main); outline: none; }
                .comment-input:focus { border-color: var(--primary); }
                .comment-avatar { width: 40px; height: 40px; flex-shrink: 0; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
                .login-hint { margin-bottom: 32px; padding: 16px 20px; border: 1px dashed var(--border); border-radius: 12px; color: var(--text-muted); }
                .login-hint :global(a) { color: var(--primary); font-weight: 600; }
            `}</style>
        </>
    );
}
