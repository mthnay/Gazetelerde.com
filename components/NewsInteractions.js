"use client";
import { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageCircle, Share2, Send, Bookmark, CornerDownRight, Flag } from 'lucide-react';
import { formatShortDate } from '@/lib/format';

export default function NewsInteractions({ articleId, title, initialLikeCount = 0, initialComments = [] }) {
    const pathname = usePathname();
    const { user } = useSession();
    const isLoggedIn = !!user;
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [saved, setSaved] = useState(false);
    const [comments, setComments] = useState(initialComments);
    const [mineIds, setMineIds] = useState([]);

    // Okunma sayacı (sekme başına bir kez)
    useEffect(() => {
        const key = `viewed:${articleId}`;
        try {
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch { /* yoksay */ }
        fetch(`/api/articles/${articleId}/view`, { method: 'POST', keepalive: true }).catch(() => { });
    }, [articleId]);

    // Kişiye özel durum: beğendim mi, kaydettim mi, hangi yorumlar benim + güncel beğeni sayısı
    useEffect(() => {
        let alive = true;
        fetch(`/api/articles/${articleId}/me`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => {
                if (!alive || !d.success) return;
                setLiked(d.liked);
                setSaved(d.saved);
                setLikeCount(d.likeCount);
                setMineIds(d.mine);
            })
            .catch(() => { });
        return () => { alive = false; };
    }, [articleId, user?.id]);

    const withMine = (c) => ({ ...c, mine: c.mine || mineIds.includes(c.id) });
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

    const postComment = async (text, parentId = null) => {
        const res = await fetch(`/api/articles/${articleId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, parentId }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) {
            flash(data?.message || 'Yorum gönderilemedi.');
            return null;
        }
        const c = data.comment;
        return { id: c.id, text: c.text, user: c.user.name, time: c.createdAt, mine: true, replies: [] };
    };

    const handleComment = async (e) => {
        e.preventDefault();
        const text = newComment.trim();
        if (!text || sending) return;
        setSending(true);
        const c = await postComment(text);
        setSending(false);
        if (!c) return;
        setComments([c, ...comments]);
        setNewComment('');
    };

    const handleReply = async (parent, text) => {
        const c = await postComment(text, parent.id);
        if (!c) return false;
        setComments(comments.map((x) => (x.id === parent.id ? { ...x, replies: [...(x.replies || []), c] } : x)));
        return true;
    };

    const handleReport = async (c) => {
        const reason = prompt('Bu yorumu neden şikayet ediyorsunuz? (isteğe bağlı)');
        if (reason === null) return; // iptal
        const res = await fetch(`/api/comments/${c.id}/report`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        flash(data?.success ? 'Şikayetiniz alındı, teşekkürler.' : (data?.message || 'Şikayet gönderilemedi.'));
    };

    const totalComments = comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0);

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
                        <span>{totalComments}</span>
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
                <h3 style={{ marginBottom: '24px' }}>Yorumlar ({totalComments})</h3>

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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {comments.map((c) => (
                        <CommentItem key={c.id} c={withMine(c)} isLoggedIn={isLoggedIn} onReply={handleReply} onReport={handleReport}>
                            {c.replies?.length > 0 && (
                                <div className="replies">
                                    {c.replies.map((r) => (
                                        <CommentItem key={r.id} c={withMine(r)} isLoggedIn={isLoggedIn} onReport={handleReport} isReply />
                                    ))}
                                </div>
                            )}
                        </CommentItem>
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
                .replies { margin-top: 16px; padding-left: 20px; border-left: 2px solid var(--border); display: flex; flex-direction: column; gap: 16px; }
                .login-hint { margin-bottom: 32px; padding: 16px 20px; border: 1px dashed var(--border); border-radius: 12px; color: var(--text-muted); }
                .login-hint :global(a) { color: var(--primary); font-weight: 600; }
            `}</style>
        </>
    );
}

function CommentItem({ c, isLoggedIn, onReply, onReport, isReply = false, children }) {
    const [replying, setReplying] = useState(false);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!text.trim() || busy) return;
        setBusy(true);
        const okay = await onReply(c, text.trim());
        setBusy(false);
        if (okay) { setText(''); setReplying(false); }
    };

    return (
        <div style={{ display: 'flex', gap: '14px' }}>
            <div className="c-avatar" style={isReply ? { width: 32, height: 32, fontSize: 13 } : undefined}>{c.user.charAt(0).toLocaleUpperCase('tr')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{c.user}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {formatShortDate(c.time)}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', overflowWrap: 'anywhere' }}>{c.text}</p>
                {isLoggedIn && (
                    <div className="c-actions">
                        {!isReply && (
                            <button type="button" onClick={() => setReplying(!replying)}><CornerDownRight size={14} /> Cevapla</button>
                        )}
                        {!c.mine && (
                            <button type="button" onClick={() => onReport(c)} aria-label="Yorumu şikayet et"><Flag size={13} /> Şikayet et</button>
                        )}
                    </div>
                )}
                {replying && (
                    <form onSubmit={submit} className="c-reply-form">
                        <input
                            autoFocus value={text} maxLength={1000} onChange={(e) => setText(e.target.value)}
                            placeholder={`${c.user} kullanıcısına cevap yaz...`} aria-label="Cevap"
                        />
                        <button type="submit" disabled={busy} className="btn btn-primary" style={{ padding: '8px 16px' }}>Gönder</button>
                    </form>
                )}
                {children}
            </div>
            <style jsx>{`
                .c-avatar { width: 40px; height: 40px; flex-shrink: 0; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
                .c-actions { display: flex; gap: 16px; margin-top: 6px; }
                .c-actions button { background: none; border: none; color: var(--text-muted); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 0; }
                .c-actions button:hover { color: var(--primary); }
                .c-reply-form { display: flex; gap: 8px; margin-top: 10px; }
                .c-reply-form input { flex: 1; min-width: 0; padding: 10px 16px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 99px; color: var(--text-main); outline: none; }
                .c-reply-form input:focus { border-color: var(--primary); }
            `}</style>
        </div>
    );
}
