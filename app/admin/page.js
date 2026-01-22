"use client";
import { useState } from 'react';
import { Sparkles, Save, Link as LinkIcon, AlertCircle, CheckCircle, RefreshCw, Rss, Plus, FileText, Trash2, Edit } from 'lucide-react';

export default function AdminPage() {
    const [view, setView] = useState('editor'); // 'editor' | 'list'

    // Automation States
    const [activeTab, setActiveTab] = useState('single');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [feedUrl, setFeedUrl] = useState('https://www.trthaber.com/xml/sondakika.xml');
    const [feedItems, setFeedItems] = useState([]);
    const [feedLoading, setFeedLoading] = useState(false);

    // Editor State
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        excerpt: '',
        content: '',
        image: '',
        category: 'Gündem',
        status: 'draft' // draft, published
    });

    // Mock Database
    const [newsList, setNewsList] = useState([
        { id: 1, title: 'İstanbul Maratonu Tamamlandı', category: 'Spor', status: 'published', date: '22 Oca 14:30' },
        { id: 2, title: 'Yapay Zeka Zirvesi Başlıyor', category: 'Teknoloji', status: 'draft', date: '22 Oca 10:15' },
    ]);

    const router = require('next/navigation').useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    };

    const handleNewPost = () => {
        setFormData({
            id: null,
            title: '',
            excerpt: '',
            content: '',
            image: '',
            category: 'Gündem',
            status: 'draft'
        });
        setView('editor');
        setStatus(null);
    };

    const handleEdit = (news) => {
        // In a real app, fetch full details here
        setFormData({
            ...news,
            excerpt: 'Örnek özet metni...',
            content: 'Örnek içerik metni...',
            image: 'https://source.unsplash.com/random/800x600',
        });
        setView('editor');
    };

    const handleSave = () => {
        // Mock Save
        if (formData.id) {
            // Update
            setNewsList(newsList.map(n => n.id === formData.id ? { ...n, title: formData.title, category: formData.category } : n));
        } else {
            // Create
            const newId = Date.now();
            setNewsList([{ id: newId, title: formData.title || 'Yeni Başlık', category: formData.category, status: 'published', date: 'Şimdi' }, ...newsList]);
            setFormData({ ...formData, id: newId });
        }
        alert('İçerik başarıyla kaydedildi!');
    };

    const handleDelete = (id) => {
        if (confirm('Silmek istediğinize emin misiniz?')) {
            setNewsList(newsList.filter(n => n.id !== id));
        }
    };

    const handleFetchSingle = async (targetUrl = url) => {
        if (!targetUrl) return;
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl })
            });
            const data = await res.json();
            if (data.success) {
                setFormData({
                    ...formData,
                    title: data.data.title,
                    excerpt: data.data.description,
                    image: data.data.image,
                    content: data.data.content
                });
                setStatus({ type: 'success', message: 'İçerik aktarıldı, düzenleyebilirsiniz.' });
            } else {
                setStatus({ type: 'error', message: data.error });
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Bağlantı hatası.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFetchFeed = async () => {
        setFeedLoading(true);
        try {
            const res = await fetch('/api/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: feedUrl })
            });
            const data = await res.json();
            if (data.success) setFeedItems(data.items);
        } catch (e) { console.error(e); }
        finally { setFeedLoading(false); }
    };

    const sources = [
        { name: 'TRT Haber Son Dakika', url: 'https://www.trthaber.com/xml/sondakika.xml' },
        { name: 'BBC Teknoloji', url: 'http://feeds.bbci.co.uk/turkce/rss.xml' },
        { name: 'AA Analiz', url: 'https://www.aa.com.tr/tr/rss/default?cat=analiz' },
        { name: 'Webrazzi', url: 'https://webrazzi.com/feed/' }
    ];

    return (
        <div className="container" style={{ padding: '40px 24px', animation: 'fadeIn 0.5s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem' }}>
                        <span style={{ color: 'var(--primary)' }}>CMS</span> Paneli
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>İçerik Yönetim Sistemi</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setView('list')} className={`btn ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`}>
                        <FileText size={18} /> Tüm Haberler
                    </button>
                    <button onClick={handleNewPost} className={`btn ${view === 'editor' ? 'btn-primary' : 'btn-ghost'}`}>
                        <Plus size={18} /> Yeni Ekle
                    </button>
                    <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,50,50,0.1)', color: '#fca5a5' }}>
                        Çıkış
                    </button>
                </div>
            </div>

            {view === 'list' ? (
                // LIST VIEW
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3>Yayındaki İçerikler</h3>
                        <input type="text" placeholder="Haberlerde ara..." className="input-field" style={{ width: '250px', padding: '8px 12px' }} />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e4e4e7' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <th style={{ padding: '12px' }}>BAŞLIK</th>
                                <th style={{ padding: '12px' }}>KATEGORİ</th>
                                <th style={{ padding: '12px' }}>DURUM</th>
                                <th style={{ padding: '12px' }}>TARİH</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody>
                            {newsList.map(news => (
                                <tr key={news.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 12px', fontWeight: '500' }}>{news.title}</td>
                                    <td style={{ padding: '16px 12px' }}><span className="badge">{news.category}</span></td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span style={{ fontSize: '12px', color: news.status === 'published' ? '#86efac' : '#fca5a5' }}>
                                            {news.status === 'published' ? 'Yayında' : 'Taslak'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>{news.date}</td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => handleEdit(news)} className="icon-btn-mini"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(news.id)} className="icon-btn-mini delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                // EDITOR VIEW
                <div className="admin-grid">
                    {/* Automation Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Sparkles size={20} className="text-primary" />
                                <h3 style={{ fontSize: '1.2rem' }}>Oto-İçerik</h3>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', marginBottom: '20px' }}>
                                <button onClick={() => setActiveTab('single')} className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}>
                                    <LinkIcon size={14} /> Link
                                </button>
                                <button onClick={() => setActiveTab('feed')} className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}>
                                    <Rss size={14} /> RSS
                                </button>
                            </div>

                            {activeTab === 'single' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <input
                                        type="text"
                                        placeholder="Haber Linki..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="input-field"
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleFetchSingle(url)}
                                        disabled={loading}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        {loading ? 'Analiz Ediliyor...' : 'Getir'}
                                    </button>
                                    {status && (
                                        <div className={`status-box ${status.type}`}>
                                            {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                                            {status.message}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <select className="input-field" onChange={(e) => setFeedUrl(e.target.value)} value={feedUrl}>
                                        {sources.map(s => <option key={s.url} value={s.url}>{s.name}</option>)}
                                    </select>
                                    <button className="btn btn-primary" onClick={handleFetchFeed} disabled={feedLoading} style={{ width: '100%', justifyContent: 'center' }}>
                                        {feedLoading ? <RefreshCw size={16} className="spin" /> : 'Kaynağı Tara'}
                                    </button>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {feedItems.map((item, i) => (
                                            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '6px' }}>{item.title}</div>
                                                <button
                                                    className="btn"
                                                    style={{ width: '100%', padding: '6px', fontSize: '11px', background: 'var(--primary)', color: 'black' }}
                                                    onClick={() => handleFetchSingle(item.link)}
                                                >
                                                    İçeri Aktar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Editor */}
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.4rem' }}>{formData.id ? 'Haberi Düzenle' : 'Yeni Haber Oluştur'}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={handleNewPost}>Temizle</button>
                                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px' }}>Taslak</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label className="label">Başlık</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input-field"
                                    style={{ fontSize: '1.2rem', fontWeight: '700' }}
                                    placeholder="Haber başlığını buraya girin..."
                                />
                            </div>

                            <div className="form-row">
                                <div style={{ flex: 1 }}>
                                    <label className="label">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="input-field"
                                    >
                                        {['Gündem', 'Dünya', 'Ekonomi', 'Spor', 'Teknoloji', 'Yaşam', 'Otomobil'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label className="label">Görsel URL</label>
                                    <input
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="input-field"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {formData.image && (
                                <div style={{ borderRadius: '12px', overflow: 'hidden', maxHeight: '300px', border: '1px solid var(--border)' }}>
                                    <img src={formData.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                </div>
                            )}

                            <div>
                                <label className="label">Özet (Spot)</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    rows={3}
                                    className="input-field"
                                    placeholder="Haberin kısa özeti..."
                                />
                            </div>

                            <div>
                                <label className="label">Detaylı İçerik</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={15}
                                    className="input-field"
                                    style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.95rem', lineHeight: '1.6' }}
                                    placeholder="Haberin tüm detaylarını buraya yazabilirsiniz..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                                    <Save size={18} />
                                    {formData.id ? 'Güncellemeleri Kaydet' : 'Haberi Yayınla'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .admin-grid { display: grid; grid-template-columns: 350px 1fr; gap: 32px; }
                .label { display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); }
                .input-field { width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: var(--radius-sm); color: white; outline: none; transition: all 0.2s; }
                .input-field:focus { border-color: var(--primary); background: rgba(0,0,0,0.5); }
                .form-row { display: flex; gap: 20px; }
                .tab-btn { flex: 1; background: none; border: none; color: var(--text-muted); padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 13px; transition: all 0.2s; }
                .tab-btn.active { background: var(--bg-card); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                .status-box { padding: 12px; border-radius: 8px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; margin-top: 10px; }
                .status-box.success { background: rgba(22,163,74,0.1); color: #86efac; border: 1px solid rgba(22,163,74,0.2); }
                .status-box.error { background: rgba(220,38,38,0.1); color: #fca5a5; border: 1px solid rgba(220,38,38,0.2); }
                .spin { animation: spin 1s linear infinite; }
                .badge { background: rgba(255,255,255,0.1); color: var(--text-main); padding: 4px 10px; border-radius: 4px; font-size: 12px; }
                .icon-btn-mini { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; transition: color 0.2s; }
                .icon-btn-mini:hover { color: white; }
                .icon-btn-mini.delete:hover { color: #ef4444; }
                .btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid transparent; }
                .btn-ghost:hover { color: white; background: rgba(255,255,255,0.05); }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @media (max-width: 1024px) { .admin-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
