"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, Trash2, Save, Lock, Bookmark, Heart, Bell, Check, Plus, Download } from 'lucide-react';
import { articleUrl, formatDate } from '@/lib/format';
import { useSession } from '@/components/SessionProvider';
import Modal from '@/components/Modal';
import TwoFactor from '@/components/TwoFactor';

export default function ProfileView({ initialUser, twoFactor = false, staff = false, initialTab = 'general', bookmarks = [], likes = [], categories = [], followed = [] }) {
    const [user, setUser] = useState(initialUser);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [following, setFollowing] = useState(followed);
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const router = useRouter();
    const { refresh } = useSession();

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
        const data = await patchProfile(staff ? { name: user.name, title: user.title, bio: user.bio } : { name: user.name });
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
        await refresh();
        router.push('/');
        router.refresh();
    };


    const tabs = [
        { id: 'general', icon: User, label: 'Profil bilgileri' },
        { id: 'bookmarks', icon: Bookmark, label: 'Kaydettiklerim', count: bookmarks.length },
        { id: 'likes', icon: Heart, label: 'Beğendiklerim', count: likes.length },
        { id: 'takip', icon: Bell, label: 'Takip ettiklerim', count: following.length },
        { id: 'security', icon: Settings, label: 'Hesap ve güvenlik' },
    ];

    return (
        <div className="container">
            <header className="page-hero" style={{ paddingBottom: 28 }}>
                <span className="kicker rise">Hesabım</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(44px, 8vw, 104px)' }}>Merhaba, {user.name.split(' ')[0]}<span className="dot">.</span></h1>
            </header>

            <div className="profile">
                <aside className="profile-side">
                    <div className="panel profile-card">
                        <span className="avatar avatar--lg">{user.name.charAt(0).toLocaleUpperCase('tr')}</span>
                        <h2>{user.name}</h2>
                        <span className="meta">{user.email}</span>
                    </div>
                    <nav className="panel profile-nav" aria-label="Profil bölümleri">
                        {tabs.map(({ id, icon: Icon, label, count }) => (
                            <button key={id} onClick={() => setActiveTab(id)} className={activeTab === id ? 'is-active' : ''} aria-current={activeTab === id ? 'page' : undefined}>
                                <Icon size={17} /> {label}
                                {count !== undefined && <span className="count">{count}</span>}
                            </button>
                        ))}
                    </nav>
                </aside>

                <section className="panel profile-main" key={activeTab} style={{ animation: 'rise 0.6s var(--ease-out)' }}>
                    {activeTab === 'general' && (
                        <>
                            <h2>Profil bilgileri</h2>
                            <form onSubmit={handleUpdate} className="profile-form">
                                <label className="field">
                                    <span className="field-label">Ad soyad</span>
                                    <input className="input" value={user.name} minLength={2} maxLength={60} required onChange={(e) => setUser({ ...user, name: e.target.value })} />
                                </label>
                                <label className="field">
                                    <span className="field-label">E-posta</span>
                                    <input className="input" type="email" value={user.email} disabled />
                                    <span className="field-hint">E-posta adresi güvenlik nedeniyle değiştirilemez.</span>
                                </label>
                                {staff && (
                                    <>
                                        <label className="field">
                                            <span className="field-label">Unvan</span>
                                            <input className="input" value={user.title || ''} maxLength={80} placeholder="ör. Spor Editörü" onChange={(e) => setUser({ ...user, title: e.target.value })} />
                                        </label>
                                        <label className="field">
                                            <span className="field-label">Kısa biyografi</span>
                                            <textarea className="input" rows={4} value={user.bio || ''} maxLength={1000} onChange={(e) => setUser({ ...user, bio: e.target.value })}
                                                placeholder="Okurlar sizi tanısın: uzmanlık alanınız, deneyiminiz…" />
                                            <span className="field-hint">
                                                Yazar sayfanızda görünür{user.slug ? <> — <Link href={`/yazar/${user.slug}`}>/yazar/{user.slug}</Link></> : ''}.
                                            </span>
                                        </label>
                                    </>
                                )}
                                {notice && <div className="alert alert-success" role="status">{notice}</div>}
                                <div><button className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : <><Save size={16} /> Değişiklikleri kaydet</>}</button></div>
                            </form>
                        </>
                    )}

                    {activeTab === 'bookmarks' && (
                        <>
                            <h2>Kaydettiklerim</h2>
                            <ArticleList items={bookmarks} empty="Henüz kaydettiğiniz bir haber yok. Haberlerdeki kaydet düğmesiyle sonra okumak üzere saklayabilirsiniz." />
                        </>
                    )}

                    {activeTab === 'likes' && (
                        <>
                            <h2>Beğendiklerim</h2>
                            <ArticleList items={likes} empty="Henüz beğendiğiniz bir haber yok." />
                        </>
                    )}

                    {activeTab === 'takip' && (
                        <>
                            <h2>Takip ettiklerim</h2>
                            <p style={{ color: 'var(--muted)', marginBottom: 22, maxWidth: '52ch' }}>
                                Takip ettiğiniz kategorilerde yeni haber çıktığında üst menüdeki zil simgesinde görürsünüz.
                            </p>
                            <div className="chips">
                                {categories.map((c) => {
                                    const on = following.includes(c.slug);
                                    return (
                                        <button key={c.slug} type="button" onClick={() => toggleFollow(c.slug)} className={`chip ${on ? 'is-on' : ''}`} aria-pressed={on}>
                                            {on ? <Check size={14} /> : <Plus size={14} />} {c.label.charAt(0) + c.label.slice(1).toLocaleLowerCase('tr')}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {activeTab === 'security' && (
                        <>
                            <h2>Hesap ve güvenlik</h2>
                            <form onSubmit={handlePassword} className="profile-form">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={18} /> Şifre değiştir</h3>
                                <label className="field">
                                    <span className="field-label">Mevcut şifre</span>
                                    <input className="input" type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                                </label>
                                <label className="field">
                                    <span className="field-label">Yeni şifre</span>
                                    <input className="input" type="password" autoComplete="new-password" minLength={8} required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                                    <span className="field-hint">En az 8 karakter. Değiştirince diğer cihazlardaki oturumlarınız kapanır.</span>
                                </label>
                                {pwMsg && <div className={`alert ${pwMsg.includes('değiştirildi') ? 'alert-success' : 'alert-error'}`} role="status">{pwMsg}</div>}
                                <div><button className="btn"><Save size={16} /> Şifreyi güncelle</button></div>
                            </form>

                            <TwoFactor enabled={twoFactor} staff={staff} />

                            <div className="profile-form">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Download size={18} /> Verilerim</h3>
                                <p style={{ color: 'var(--ink-2)', margin: '0 0 12px', maxWidth: '60ch' }}>
                                    Hesabınız, yorumlarınız, beğeni ve kayıtlarınız, bülten aboneliğiniz ve son giriş kayıtlarınızın bir kopyasını indirebilirsiniz (KVKK md. 11).
                                    Ayrıntılar için <Link href="/gizlilik">gizlilik politikası</Link>.
                                </p>
                                <div><a className="btn" href="/api/profile/export" download><Download size={16} /> Verilerimi indir (JSON)</a></div>
                            </div>

                            <div className="danger-zone">
                                <h3>Hesabı sil</h3>
                                <p style={{ color: 'var(--ink-2)', margin: '8px 0 16px', maxWidth: '56ch' }}>
                                    Hesabınızı sildiğinizde yorumlarınız, beğenileriniz ve kayıtlarınız kalıcı olarak silinir. Bu işlem geri alınamaz.
                                </p>
                                <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}><Trash2 size={16} /> Hesabımı kalıcı olarak sil</button>
                            </div>
                        </>
                    )}
                </section>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                title="Hesabınızı silmek üzeresiniz"
                footer={<button onClick={handleDeleteAccount} className="btn btn-danger btn-sm" disabled={!deletePassword}>Onaylıyorum, hesabımı sil</button>}
            >
                <p style={{ marginBottom: 14 }}>Bu işlem geri alınamaz. Devam etmek için şifrenizi girin.</p>
                <input
                    className="input" type="password" placeholder="Şifreniz" autoComplete="current-password" aria-label="Şifre"
                    value={deletePassword} onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                />
                {deleteError && <div className="alert alert-error" role="alert" style={{ marginTop: 12 }}>{deleteError}</div>}
            </Modal>
        </div>
    );
}

function ArticleList({ items, empty }) {
    if (!items.length) return <p style={{ color: 'var(--muted)' }}>{empty}</p>;
    return (
        <ul className="article-list">
            {items.map((b) => (
                <li key={b.id}>
                    <Link href={articleUrl(b)}>
                        <span className="kicker">{b.categoryLabel}</span>
                        <span className="t"><span className="ink-link">{b.title}</span></span>
                        <span className="meta">{formatDate(b.publishedAt)}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
