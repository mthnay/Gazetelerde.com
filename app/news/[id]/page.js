"use client";
import { useState, use } from 'react';
import { Heart, MessageCircle, Share2, Send, Bookmark } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function NewsDetail({ params }) {
    const { id } = use(params);
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(124);
    const [comments, setComments] = useState([
        { id: 1, user: 'Ahmet Y.', text: 'Harika bir gelişme, ülkemiz adına gurur verici!', time: '10dk önce' },
        { id: 2, user: 'Selin K.', text: 'Detayları merakla bekliyoruz.', time: '25dk önce' }
    ]);
    const [newComment, setNewComment] = useState('');

    const toggleLike = () => {
        setLiked(!liked);
        setLikes(liked ? likes - 1 : likes + 1);
    };

    const handleComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // Mock Add Comment
        const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Misafir';
        setComments([{ id: Date.now(), user, text: newComment, time: 'Şimdi' }, ...comments]);
        setNewComment('');
    };

    return (
        <div className="container" style={{ marginTop: '40px', maxWidth: '800px' }}>
            {/* Header / Meta */}
            <div style={{ marginBottom: '24px' }}>
                <span className="badge">TEKNOLOJİ</span>
                <h1 style={{ fontSize: '2.5rem', lineHeight: '1.2', marginTop: '16px', marginBottom: '16px' }}>
                    Türkiye'nin Teknoloji Hamlesi: Yeni Yongalar Seri Üretime Geçiyor
                </h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <span>12 Ocak 2026 - 14:30</span>
                    <span>3 dk okuma</span>
                </div>
            </div>

            {/* Featured Image */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
                <img
                    src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000"
                    style={{ width: '100%', height: 'auto' }}
                    alt="News Cover"
                />
            </div>

            {/* Content Body */}
            <article style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e4e4e7', marginBottom: '40px' }}>
                <p style={{ marginBottom: '20px' }}>
                    Savunma sanayiinden sonra şimdi de mikroçip devrimi başlıyor. Yerli üretim tesisleri açıldı.
                    Uzun süredir beklenen proje nihayet hayata geçti. Mühendislerimiz tarafından tasarlanan
                    yeni nesil işlemciler, hem savunma sanayinde hem de tüketici elektroniğinde kullanılacak.
                </p>
                <p style={{ marginBottom: '20px' }}>
                    Tesisin açılışında konuşan yetkililer, bu adımın stratejik önemine vurgu yaptı.
                    Dışa bağımlılığı azaltacak olan bu hamle, aynı zamanda ihracat potansiyeliyle de dikkat çekiyor.
                </p>
                <h3>Gelecek Vizyonu</h3>
                <p>
                    Önümüzdeki 5 yıl içerisinde üretim kapasitesinin 10 katına çıkarılması hedefleniyor.
                    Bu sayede Türkiye, bölgenin teknoloji üssü haline gelecek.
                </p>
            </article>

            {/* Interactions Bar */}
            <div className="interaction-bar glass-panel">
                <div style={{ display: 'flex', gap: '24px' }}>
                    <button
                        onClick={toggleLike}
                        className={`action-btn ${liked ? 'liked' : ''}`}
                    >
                        <Heart size={20} fill={liked ? "#ef4444" : "none"} />
                        <span>{likes}</span>
                    </button>
                    <button className="action-btn">
                        <MessageCircle size={20} />
                        <span>{comments.length}</span>
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="action-btn icon-only"><Bookmark size={20} /></button>
                    <button className="action-btn icon-only"><Share2 size={20} /></button>
                </div>
            </div>

            {/* Comments Section */}
            <div style={{ marginTop: '40px', marginBottom: '80px' }}>
                <h3 style={{ marginBottom: '24px' }}>Yorumlar ({comments.length})</h3>

                {/* Comment Form */}
                <form onSubmit={handleComment} style={{ marginBottom: '32px', display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Düşüncelerini paylaş..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                borderRadius: '99px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '99px' }}>
                        <Send size={18} />
                    </button>
                </form>

                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {c.user.charAt(0)}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '600' }}>{c.user}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {c.time}</span>
                                </div>
                                <p style={{ color: '#d4d4d8', lineHeight: '1.5' }}>{c.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .badge {
                    background: var(--primary);
                    color: black;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 700;
                }
                .interaction-bar {
                    display: flex;
                    justify-content: space-between;
                    padding: 16px 24px;
                    border-radius: 12px;
                    margin-bottom: 40px;
                }
                .action-btn {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-btn:hover { color: white; }
                .action-btn.liked { color: #ef4444; }
                .action-btn.icon-only {  }
            `}</style>
        </div>
    );
}
