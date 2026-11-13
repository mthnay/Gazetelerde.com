"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, Trash2, Save, Lock, AlertTriangle, Bookmark, Heart, Bell, Check, Plus } from 'lucide-react';
import { articleUrl, formatDate } from '@/lib/format';
import Modal from '@/components/Modal';

export default function ProfileView({ initialUser, initialTab = 'general', bookmarks = [], likes = [], categories = [], followed = [] }) {
    const [user, setUser] = useState(initialUser);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [following, setFollowing] = useState(followed);
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const router = useRouter();

    // Şifre değiştirme
    const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
    const [pwMsg, setPwMsg] = useState('');

    // Hesap silme
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const patchProfile = async (body) => {
        const res = await fetch('/api/profile', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        }).catch(() => null);
        return (await res?.json().catch(() => null)) || { success: false, message: 'Bağlantı hatası.' };
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = await patchProfile({ name: user.name });
        setLoading(false);
        setNotice(data.success ? 'Bilgileriniz güncellendi.' : data.message);
        if (data.success) router.refresh();
    };

    const handlePassword = async (e) => {
        e.preventDefault();
        const data = await patchProfile(pw);
        setPwMsg(data.success ? 'Şifreniz değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.' : data.message);
        if (data.success) setPw({ currentPassword: '', newPassword: '' });
    };

    const toggleFollow = async (slug) => {
        const on = !following.includes(slug);
        setFollowing(on ? [...following, slug] : following.filter((x) => x !== slug));
        const res = await fetch(`/api/categories/${slug}/follow`, { method: on ? 'POST' : 'DELETE' }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) setFollowing(following); // geri al
    };

    const handleDeleteAccount = async () => {
        const res = await fetch('/api/profile', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: deletePassword }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        if (!data?.success) {
            setDeleteError(data?.message || 'Hesap silinemedi.');
            return;
        }
        router.push('/');
        router.refresh();
    };

    return (
        <div className="container" style={{ padding: '40px 24px', minHeight: '80vh' }}>
            <div className="profile-grid">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="user-card glass-panel">
                        <div className="avatar-placeholder">{user.name.charAt(0)}</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{user.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</p>
                    </div>

                    <nav className="settings-nav glass-panel">
                        <button
                            className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <User size={18} /> Profil Bilgileri
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <Settings size={18} /> Hesap Ayarları
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'bookmarks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bookmarks')}
                        >
                            <Bookmark size={18} /> Kaydettiklerim ({bookmarks.length})
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'likes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('likes')}
                        >
                            <Heart size={18} /> Beğendiklerim ({likes.length})
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'takip' ? 'active' : ''}`}
                            onClick={() => setActiveTab('takip')}
                        >
                            <Bell size={18} /> Takip ettiklerim ({following.length})
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="content-area glass-panel">
                    {activeTab === 'general' && (
                        <div className="animate-fade-in">
                            <h2 className="tab-title">Profil Bilgileri</h2>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label>Ad Soyad</label>
                                    <input
                                        type="text"
                                        value={user.name}
                                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                                        className="styled-input"
                                    />
                                </div>
                                <div>
                                    <label>E-posta</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="styled-input disabled"
                                    />
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                        E-posta adresi güvenlik nedeniyle değiştirilemez.
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <button className="btn btn-primary" disabled={loading}>
                                        <Save size={16} />
                                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                    </button>
                                </div>
                                {notice && <p role="status" style={{ color: 'var(--primary)', fontSize: '14px' }}>{notice}</p>}
                            </form>
                        </div>
                    )}

                    {activeTab === 'bookmarks' && (
                        <div className="animate-fade-in">
                            <h2 className="tab-title">Kaydettiklerim</h2>
                            <ArticleList items={bookmarks} empty="Henüz kaydettiğiniz bir haber yok. Haberlerdeki kaydet simgesiyle sonra okumak üzere saklayabilirsiniz." />
                        </div>
                    )}

                    {activeTab === 'likes' && (
                        <div className="animate-fade-in">
                            <h2 className="tab-title">Beğendiklerim</h2>
                            <ArticleList items={likes} empty="Henüz beğendiğiniz bir haber yok." />
                        </div>
                    )}

                    {activeTab === 'takip' && (
                        <div className="animate-fade-in">
                            <h2 className="tab-title">Takip ettiklerim</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                                Takip ettiğiniz kategorilerde yeni haber çıkınca üst menüdeki zil simgesinde görürsünüz.
                            </p>
                            <div className="follow-grid">
                                {categories.map((c) => {
                                    const on = following.includes(c.slug);
                                    return (
                                        <button key={c.slug} type="button" onClick={() => toggleFollow(c.slug)} className={`follow-chip ${on ? 'on' : ''}`} aria-pressed={on}>
                                            {on ? <Check size={14} /> : <Plus size={14} />} {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="animate-fade-in">
                            <h2 className="tab-title">Hesap Ayarları</h2>

                            <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={18} /> Şifre Değiştir</h3>
                                <div>
                                    <label>Mevcut Şifre</label>
                                    <input type="password" autoComplete="current-password" className="styled-input" required
                                        value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                                </div>
                                <div>
                                    <label>Yeni Şifre (en az 8 karakter)</label>
                                    <input type="password" autoComplete="new-password" minLength={8} className="styled-input" required
                                        value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                                </div>
                                {pwMsg && <p role="status" style={{ color: 'var(--primary)', fontSize: '14px' }}>{pwMsg}</p>}
                                <div style={{ textAlign: 'right' }}>
                                    <button className="btn btn-primary"><Save size={16} /> Şifreyi Güncelle</button>
                                </div>
                            </form>

                            <div className="danger-zone">
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '50%', color: '#ef4444' }}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>Hesabı Sil</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.5' }}>
                                            Hesabınızı sildiğinizde tüm verileriniz, yorumlarınız ve favorileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
                                        </p>
                                        <button
                                            className="btn"
                                            style={{ background: '#ef4444', color: 'white' }}
                                            onClick={() => setShowDeleteModal(true)}
                                        >
                                            <Trash2 size={16} /> Hesabımı Kalıcı Olarak Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hesabı Silmek Üzeresiniz">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <p style={{ marginBottom: '16px', color: '#fbbf24' }}>Güvenliğiniz için lütfen şifrenizi girin.</p>
                </div>

                <input
                    type="password"
                    placeholder="Şifreniz"
                    value={deletePassword}
                    onChange={(e) => {
                        setDeletePassword(e.target.value);
                        setDeleteError('');
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}
                />

                {deleteError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{deleteError}</p>}

                <button
                    onClick={handleDeleteAccount}
                    style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Onaylıyorum, Sil
                </button>
            </Modal>

            <style jsx>{`
        .follow-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .follow-chip { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 99px; border: 1px solid var(--border); background: var(--bg-hover); color: var(--text-main); font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .follow-chip:hover { border-color: var(--primary); }
        .follow-chip.on { background: var(--primary); color: #000; border-color: var(--primary); }
        .bookmark-row { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border: 1px solid var(--border); border-radius: 12px; transition: border-color 0.2s; }
        .bookmark-row:hover { border-color: var(--primary); }
        .profile-grid {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 32px;
            margin-top: 20px;
        }
        
        .user-card {
            padding: 32px;
            text-align: center;
            border-radius: 16px;
            margin-bottom: 24px;
        }
        
        .avatar-placeholder {
            width: 80px;
            height: 80px;
            background: var(--primary);
            color: black;
            font-size: 32px;
            font-weight: 800;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px auto;
        }

        .settings-nav {
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .nav-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 24px;
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .nav-item:hover, .nav-item.active {
            background: rgba(255,255,255,0.05);
            color: white;
            border-left: 3px solid var(--primary);
        }
        
        .content-area {
            padding: 40px;
            border-radius: 16px;
            min-height: 500px;
        }

        .tab-title {
            font-size: 1.5rem;
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border);
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .styled-input {
            width: 100%;
            padding: 12px;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: white;
            outline: none;
        }
        
        .styled-input:focus { border-color: var(--primary); }
        .styled-input.disabled { opacity: 0.5; cursor: not-allowed; }

        .danger-zone {
            border: 1px solid rgba(239,68,68,0.2);
            background: rgba(239,68,68,0.05);
            border-radius: 12px;
            padding: 24px;
        }

        @media (max-width: 768px) {
            .profile-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
}

function ArticleList({ items, empty }) {
    if (!items.length) return <p style={{ color: 'var(--text-muted)' }}>{empty}</p>;
    return (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((b) => (
                <li key={b.id}>
                    <Link href={articleUrl(b)} className="article-row">
                        <span style={{ fontWeight: 600 }}>{b.title}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.categoryLabel} · {formatDate(b.publishedAt)}</span>
                    </Link>
                </li>
            ))}
            <style jsx>{`
                li :global(.article-row) { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border: 1px solid var(--border); border-radius: 12px; transition: border-color 0.2s; }
                li :global(.article-row:hover) { border-color: var(--primary); }
            `}</style>
        </ul>
    );
}
