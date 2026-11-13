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
            <div className="action-bar">
                <div className="action-group">
                    <button onClick={() => toggle('like', liked, setLiked)} className={`action-btn ${liked ? 'liked' : ''}`} aria-pressed={liked} aria-label={`Beğen (${likeCount})`}>
                        <Heart size={18} fill={liked ? 'currentColor' : 'none'} key={liked ? 'on' : 'off'} />
                        <span>{likeCount}</span>
                    </button>
                    <a href="#yorumlar" className="action-btn" aria-label={`Yorumlar (${totalComments})`}>
                        <MessageCircle size={18} />
                        <span>{totalComments}</span>
                    </a>
                </div>
                <div className="action-group">
                    {msg && <span role="status" className="action-msg">{msg}</span>}
                    <button onClick={() => toggle('bookmark', saved, setSaved)} className={`action-btn ${saved ? 'saved' : ''}`} aria-pressed={saved} aria-label="Kaydet">
                        <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
                        <span className="hide-mobile">{saved ? 'Kaydedildi' : 'Kaydet'}</span>
                    </button>
                    <button onClick={handleShare} className="action-btn" aria-label="Paylaş">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            <section id="yorumlar" className="comments" aria-labelledby="yorum-baslik">
                <h2 id="yorum-baslik" className="comments-title">Yorumlar <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({totalComments})</span></h2>

                {isLoggedIn ? (
                    <form onSubmit={handleComment} className="comment-form">
                        <input
                            type="text"
                            className="input input-pill"
                            placeholder="Düşüncelerinizi paylaşın…"
                            aria-label="Yorum"
                            maxLength={1000}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button type="submit" disabled={sending} className="btn btn-primary" style={{ height: 50 }} aria-label="Gönder">
                            {sending ? <span className="spinner" /> : <><Send size={16} /> Gönder</>}
                        </button>
                    </form>
                ) : (
                    <p className="login-hint">
                        Tartışmaya katılmak için <Link href={loginHref}>giriş yapın</Link> ya da <Link href="/register">ücretsiz üye olun</Link>.
                    </p>
                )}

                {comments.length === 0 && (
                    <p style={{ color: 'var(--muted)' }}>Henüz yorum yok. İlk yorumu siz yapın.</p>
                )}

                <div className="comment-list">
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
            </section>
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
        <div className="comment">
            <span className="avatar" style={isReply ? { width: 28, height: 28, fontSize: 12 } : undefined}>{c.user.charAt(0).toLocaleUpperCase('tr')}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="meta">
                    <strong style={{ color: 'var(--ink)', fontSize: 14 }}>{c.user}</strong>
                    <span className="meta-sep" />
                    <span>{formatShortDate(c.time)}</span>
                </div>
                <p className="comment-text">{c.text}</p>
                {isLoggedIn && (
                    <div className="comment-actions">
                        {!isReply && (
                            <button type="button" onClick={() => setReplying(!replying)} aria-expanded={replying}><CornerDownRight size={13} /> Cevapla</button>
                        )}
                        {!c.mine && (
                            <button type="button" onClick={() => onReport(c)} aria-label="Yorumu şikayet et"><Flag size={12} /> Şikayet et</button>
                        )}
                    </div>
                )}
                {replying && (
                    <form onSubmit={submit} className="comment-form" style={{ marginTop: 12, marginBottom: 0 }}>
                        <input
                            autoFocus value={text} maxLength={1000} onChange={(e) => setText(e.target.value)}
                            className="input input-pill" style={{ height: 42 }}
                            placeholder={`${c.user} kullanıcısına cevap yazın…`} aria-label="Cevap"
                        />
                        <button type="submit" disabled={busy} className="btn btn-primary btn-sm" style={{ height: 42 }}>Gönder</button>
                    </form>
                )}
                {children}
            </div>
        </div>
    );
}
