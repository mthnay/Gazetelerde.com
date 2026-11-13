"use client";
import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Bookmark } from 'lucide-react';

// Beğeni / kayıt / yorum durumu şimdilik tarayıcıda (localStorage) tutulur.
// Backend eklendiğinde bu bileşen API çağrılarına bağlanacak.
const readJSON = (key, fallback) => {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch {
        return fallback;
    }
};

export default function NewsInteractions({ newsId, title }) {
    const key = `news:${newsId}`;
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [shareMsg, setShareMsg] = useState('');

    useEffect(() => {
        const state = readJSON(key, {});
        /* eslint-disable react-hooks/set-state-in-effect */
        setLiked(!!state.liked);
        setSaved(!!state.saved);
        setComments(state.comments || []);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [key]);

    const persist = (patch) => {
        const next = { ...readJSON(key, {}), ...patch };
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* yoksay */ }
    };

    const toggleLike = () => { persist({ liked: !liked }); setLiked(!liked); };
    const toggleSave = () => { persist({ saved: !saved }); setSaved(!saved); };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title, url });
            } else {
                await navigator.clipboard.writeText(url);
                setShareMsg('Bağlantı kopyalandı');
                setTimeout(() => setShareMsg(''), 2000);
            }
        } catch { /* kullanıcı iptal etti */ }
    };

    const handleComment = (e) => {
        e.preventDefault();
        const text = newComment.trim();
        if (!text) return;
        const user = readJSON('user', null)?.name || 'Misafir';
        const next = [{ id: Date.now(), user, text, time: new Date().toISOString() }, ...comments];
        setComments(next);
        persist({ comments: next });
        setNewComment('');
    };

    const timeLabel = (iso) =>
        new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

    return (
        <>
            <div className="interaction-bar glass-panel">
                <div style={{ display: 'flex', gap: '24px' }}>
                    <button onClick={toggleLike} className={`action-btn ${liked ? 'liked' : ''}`} aria-pressed={liked} aria-label="Beğen">
                        <Heart size={20} fill={liked ? '#ef4444' : 'none'} />
                        <span>{liked ? 'Beğendin' : 'Beğen'}</span>
                    </button>
                    <a href="#yorumlar" className="action-btn">
                        <MessageCircle size={20} />
                        <span>{comments.length}</span>
                    </a>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {shareMsg && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{shareMsg}</span>}
                    <button onClick={toggleSave} className={`action-btn ${saved ? 'saved' : ''}`} aria-pressed={saved} aria-label="Kaydet">
                        <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={handleShare} className="action-btn" aria-label="Paylaş">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            <div id="yorumlar" style={{ marginTop: '40px', marginBottom: '60px' }}>
                <h3 style={{ marginBottom: '24px' }}>Yorumlar ({comments.length})</h3>

                <form onSubmit={handleComment} style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        className="comment-input"
                        placeholder="Düşüncelerini paylaş..."
                        aria-label="Yorum"
                        maxLength={500}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '99px' }} aria-label="Gönder">
                        <Send size={18} />
                    </button>
                </form>

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
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {timeLabel(c.time)}</span>
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
            `}</style>
        </>
    );
}
