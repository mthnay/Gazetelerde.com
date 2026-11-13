"use client";
import { useState } from 'react';
import {
    LayoutDashboard, FileText, PlusCircle, Users, Settings, LogOut,
    Search, Bell, MoreVertical, Lock, Edit3, Trash2, BarChart3, TrendingUp,
    MessageSquare, Activity, Calendar, Smartphone, Monitor, Save
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
    const [activeView, setActiveView] = useState('dashboard');
    const router = useRouter();

    // Mock Data
    const stats = [
        { title: 'Toplam Okunma', value: '1.2M', change: '+12%', icon: <Activity size={24} />, color: 'var(--primary)' },
        { title: 'Aktif Kullanıcı', value: '45.2K', change: '+5%', icon: <Users size={24} />, color: '#60a5fa' },
        { title: 'Yayınlanan Haber', value: '8,540', change: '+24%', icon: <FileText size={24} />, color: '#c084fc' },
        { title: 'Gelir (Tahmini)', value: '₺125K', change: '+8%', icon: <TrendingUp size={24} />, color: '#4ade80' },
    ];

    const [users, setUsers] = useState([
        { id: 0, name: 'Mert H. (Root)', email: 'admin@gazetelerde.com', role: 'Süper Admin', status: 'Online', avatar: 'https://i.pravatar.cc/150?u=admin' },
        { id: 1, name: 'Selin Yılmaz', email: 'selin@gazetelerde.com', role: 'Baş Editör', status: 'Online', avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: 2, name: 'Canberk Demir', email: 'canberk@example.com', role: 'Yazar', status: 'Offline', avatar: 'https://i.pravatar.cc/150?u=2' },
        { id: 3, name: 'Elif Kaya', email: 'elif@example.com', role: 'Moderatör', status: 'Online', avatar: 'https://i.pravatar.cc/150?u=3' },
    ]);

    const handleLogout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* yoksay */ }
        localStorage.removeItem('user');
        router.push('/login');
        router.refresh();
    };

    const handleDeleteUser = (id) => {
        const user = users.find(u => u.id === id);
        if (user.email === 'admin@gazetelerde.com') {
            alert('KRİTİK UYARI: Süper Admin hesabı silinemez! Bu hesap sistemin kalıcı yöneticisidir.');
            return;
        }
        if (confirm(`${user.name} kullanıcısını silmek istediğinize emin misiniz?`)) {
            setUsers(users.filter(u => u.id !== id));
            alert('Kullanıcı silindi.');
        }
    };

    const handleResetPassword = (id) => {
        const user = users.find(u => u.id === id);
        const newPass = prompt(`"${user.name}" kullanıcısı için yeni şifreyi girin:`);
        if (newPass) {
            alert(`${user.name} için şifre başarıyla güncellendi! \n(Yeni Şifre: ${newPass})`);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="admin-container">
            {/* Animated Background */}
            <div className="blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Glass Backdrop */}
            <div className="glass-overlay"></div>

            <div className="content-wrapper">
                {/* SIDEBAR */}
                <motion.aside
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="sidebar glass-panel"
                >
                    <div className="sidebar-header">
                        <div className="logo">
                            <span className="logo-icon">G</span>
                            <span className="logo-text">Admin<span className="text-primary">X</span></span>
                        </div>
                    </div>

                    <nav className="nav-menu">
                        {[
                            { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
                            { id: 'cms', icon: FileText, label: 'İçerik' },
                            { id: 'users', icon: Users, label: 'Kullanıcılar' },
                            { id: 'analytics', icon: BarChart3, label: 'Analiz' },
                            { id: 'settings', icon: Settings, label: 'Ayarlar' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                                {activeView === item.id && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="active-pill"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <div className="user-mini">
                            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" />
                            <div>
                                <p className="name">Mert H.</p>
                                <p className="role">Süper Admin</p>
                            </div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /></button>
                    </div>
                </motion.aside>

                {/* MAIN CONTENT */}
                <main className="main-area">
                    <header className="top-header">
                        <motion.h1
                            key={activeView}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="page-title"
                        >
                            {activeView === 'dashboard' ? 'Genel Bakış' :
                                activeView === 'cms' ? 'İçerik Yönetimi' :
                                    activeView === 'users' ? 'Kullanıcı Yönetimi' :
                                        activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                        </motion.h1>

                        <div className="search-bar glass-input">
                            <Search size={18} />
                            <input type="text" placeholder="Hızlı arama..." />
                        </div>

                        <div className="header-actions">
                            <button className="icon-btn"><Bell size={20} /><span className="dot"></span></button>
                            <button className="icon-btn"><MessageSquare size={20} /></button>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -20 }}
                            className="view-content"
                        >
                            {activeView === 'dashboard' && (
                                <>
                                    {/* Stats Grid */}
                                    <div className="stats-grid">
                                        {stats.map((stat, i) => (
                                            <motion.div key={i} variants={itemVariants} className="stat-card glass-panel" whileHover={{ y: -5 }}>
                                                <div className="stat-header">
                                                    <div className="icon-box" style={{ color: stat.color, background: `${stat.color}20` }}>
                                                        {stat.icon}
                                                    </div>
                                                    <span className="stat-change" style={{ color: '#4ade80' }}>
                                                        {stat.change} <TrendingUp size={14} />
                                                    </span>
                                                </div>
                                                <div className="stat-body">
                                                    <h3>{stat.value}</h3>
                                                    <p>{stat.title}</p>
                                                </div>
                                                <div className="bg-glow" style={{ background: stat.color }}></div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="dashboard-split">
                                        <motion.div variants={itemVariants} className="big-graph glass-panel">
                                            <div className="panel-header">
                                                <h3>Ziyaretçi Analizi</h3>
                                                <select className="glass-select"><option>Bu Hafta</option></select>
                                            </div>
                                            <div className="graph-placeholder">
                                                {/* Visual Mockup for Graph */}
                                                <div className="bars">
                                                    {[40, 65, 34, 87, 56, 92, 45, 67, 88, 54, 76, 43].map((h, i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="bar"
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${h}%` }}
                                                            transition={{ delay: i * 0.05, duration: 0.5 }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div variants={itemVariants} className="recent-users glass-panel">
                                            <div className="panel-header">
                                                <h3>Ekip Durumu</h3>
                                            </div>
                                            <div className="user-list">
                                                {users.map(u => (
                                                    <div key={u.id} className="user-row">
                                                        <div className="user-info">
                                                            <div className="avatar-wrapper">
                                                                <img src={u.avatar} alt={u.name} />
                                                                <span className={`status-dot ${u.status === 'Online' ? 'online' : ''}`}></span>
                                                            </div>
                                                            <div>
                                                                <h4>{u.name}</h4>
                                                                <span>{u.role}</span>
                                                            </div>
                                                        </div>
                                                        <button className="btn-icon-sm"><MoreVertical size={16} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="btn-full">Tüm Ekibi Gör</button>
                                        </motion.div>
                                    </div>
                                </>
                            )}

                            {activeView === 'cms' && (
                                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div className="toolbar" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="tabs">
                                            <button className="tab active">Yayındakiler</button>
                                            <button className="tab">Taslaklar</button>
                                            <button className="tab">Arşiv</button>
                                        </div>
                                        <button className="btn-primary-glow"><PlusCircle size={18} /> Yeni İçerik</button>
                                    </div>
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Haber Başlığı</th>
                                                <th>Kategori</th>
                                                <th>Yazar</th>
                                                <th>Tarih</th>
                                                <th>Durum</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600, color: 'white' }}>Yapay Zeka Dünyayı Nasıl Değiştiriyor?</td>
                                                    <td><span className="tag-pill">Teknoloji</span></td>
                                                    <td>
                                                        <div className="sm-avatar-group">
                                                            <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                                                            <span>Mert H.</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-muted">12 Oca, 14:30</td>
                                                    <td><span className="status-badge success">Yayında</span></td>
                                                    <td style={{ textAlign: 'right' }}><button className="btn-icon-hover"><Edit3 size={16} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}

                            {activeView === 'users' && (
                                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div className="toolbar" style={{ padding: '24px', marginBottom: '0' }}>
                                        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Kullanıcı Yönetimi</h3>
                                    </div>
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Kullanıcı</th>
                                                <th>E-posta</th>
                                                <th>Rol</th>
                                                <th>Durum</th>
                                                <th style={{ textAlign: 'right' }}>İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div className="user-info">
                                                            <div className="avatar-wrapper">
                                                                <img src={u.avatar} alt={u.name} />
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ color: '#a1a1aa' }}>{u.email}</td>
                                                    <td>
                                                        <span className="tag-pill" style={{
                                                            background: u.role === 'Süper Admin' ? 'rgba(251, 191, 36, 0.2)' : undefined,
                                                            color: u.role === 'Süper Admin' ? '#fbbf24' : undefined
                                                        }}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td><span className={`status-badge ${u.status === 'Online' ? 'success' : ''}`}>{u.status}</span></td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                            <button
                                                                className="btn-icon-hover"
                                                                title="Şifre Değiştir"
                                                                onClick={() => handleResetPassword(u.id)}
                                                            >
                                                                <Lock size={16} />
                                                            </button>

                                                            {u.email !== 'admin@gazetelerde.com' && (
                                                                <button
                                                                    className="btn-icon-hover"
                                                                    style={{ color: '#ef4444' }}
                                                                    title="Kullanıcıyı Sil"
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}

                            {activeView === 'analytics' && (
                                <motion.div variants={itemVariants} className="analytics-view">
                                    <div className="stats-grid">
                                        {[
                                            { label: 'Hemen Çıkma Oranı', val: '%42', change: '-2%', good: true, icon: <Activity size={24} />, color: '#f472b6' },
                                            { label: 'Oturum Süresi', val: '4dk 12sn', change: '+12s', good: true, icon: <Calendar size={24} />, color: '#60a5fa' },
                                            { label: 'Mobil Trafik', val: '%78', change: '+5%', good: true, icon: <Smartphone size={24} />, color: '#a78bfa' },
                                            { label: 'Masaüstü', val: '%22', change: '-5%', good: false, icon: <Monitor size={24} />, color: '#34d399' },
                                        ].map((s, i) => (
                                            <motion.div key={i} variants={itemVariants} className="stat-card glass-panel">
                                                <div className="stat-header">
                                                    <div className="icon-box" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                                                    <span className="stat-change" style={{ color: s.good ? '#4ade80' : '#ef4444', background: s.good ? undefined : 'rgba(239, 68, 68, 0.1)' }}>{s.change}</span>
                                                </div>
                                                <div className="stat-body">
                                                    <h3>{s.val}</h3>
                                                    <p>{s.label}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="dashboard-split" style={{ marginTop: '24px' }}>
                                        <div className="glass-panel" style={{ flex: 2 }}>
                                            <div className="panel-header">
                                                <h3>Trafik Kaynakları</h3>
                                                <div className="tabs">
                                                    <button className="tab active">Haftalık</button>
                                                    <button className="tab">Aylık</button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '20px', padding: '20px 0' }}>
                                                {[30, 45, 25, 60, 75, 50, 80].map((h, i) => (
                                                    <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', position: 'relative', height: '100%' }}>
                                                        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h}%`, background: 'var(--primary)', borderRadius: '8px', opacity: 0.7 }}></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="glass-panel" style={{ flex: 1 }}>
                                            <div className="panel-header">
                                                <h3>En Çok Okunanlar</h3>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {[
                                                    { t: 'Yapay Zeka Zirvesi', v: '125K', c: '#60a5fa' },
                                                    { t: 'Ekonomi Paketi', v: '98K', c: '#34d399' },
                                                    { t: 'İstanbul Maratonu', v: '45K', c: '#f472b6' },
                                                ].map((n, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{n.t}</span>
                                                        <span className="tag-pill" style={{ background: `${n.c}20`, color: n.c }}>{n.v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeView === 'settings' && (
                                <motion.div variants={itemVariants} className="settings-view">
                                    <div className="glass-panel">
                                        <div className="toolbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
                                            <h3 style={{ margin: 0 }}>Genel Ayarlar</h3>
                                        </div>

                                        <div style={{ display: 'grid', gap: '24px' }}>
                                            <div className="setting-group" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px', alignItems: 'start' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 8px 0' }}>Site Kimliği</h4>
                                                    <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>Site başlığı ve açıklamaları.</p>
                                                </div>
                                                <div style={{ display: 'grid', gap: '16px' }}>
                                                    <div className="glass-input" style={{ width: '100%' }}>
                                                        <input type="text" defaultValue="Gazetelerde | Geleceğin Haberciliği" />
                                                    </div>
                                                    <div className="glass-input" style={{ width: '100%' }}>
                                                        <input type="text" defaultValue="Türkiye'nin en yenilikçi haber platformu." />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="setting-group" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px', alignItems: 'start', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 8px 0' }}>Sistem Durumu</h4>
                                                    <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>Bakım modu ve üyelik ayarları.</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '24px' }}>
                                                    <div className="toggle-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '12px' }}>
                                                        <div className="toggle active" style={{ width: '40px', height: '24px', background: 'var(--primary)', borderRadius: '20px', position: 'relative' }}>
                                                            <div style={{ width: '18px', height: '18px', background: 'black', borderRadius: '50%', position: 'absolute', top: '3px', right: '3px' }}></div>
                                                        </div>
                                                        <span>Kayıtlar Açık</span>
                                                    </div>
                                                    <div className="toggle-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '12px' }}>
                                                        <div className="toggle" style={{ width: '40px', height: '24px', background: '#3f3f46', borderRadius: '20px', position: 'relative' }}>
                                                            <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: '3px' }}></div>
                                                        </div>
                                                        <span>Bakım Modu</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                                <button className="btn-primary-glow">
                                                    <Save size={18} /> Değişiklikleri Kaydet
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <style jsx global>{`
                :root {
                    --prim: #fbbf24;
                    --bg-dark: #09090b;
                    --glass-border: rgba(255, 255, 255, 0.08);
                    --glass-bg: rgba(20, 20, 23, 0.7);
                    --glass-shine: rgba(255, 255, 255, 0.03);
                }

                .admin-container {
                    margin-top: calc(-1 * var(--header-height));
                    min-height: 100vh;
                    background: #050505;
                    color: #fff;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Inter', sans-serif;
                }

                /* ANIMATED BLOBS */
                .blobs { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
                .blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.4; animation: float 10s infinite ease-in-out; }
                .blob-1 { width: 500px; height: 500px; background: purple; top: -100px; left: -100px; animation-delay: 0s; }
                .blob-2 { width: 400px; height: 400px; background: blue; bottom: -50px; right: -50px; animation-delay: 2s; }
                .blob-3 { width: 300px; height: 300px; background: var(--prim); top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.15; animation-delay: 4s; }

                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }

                .glass-overlay {
                    position: fixed; inset: 0; backdrop-filter: blur(80px); z-index: 1; opacity: 0.5; pointer-events: none;
                }

                .content-wrapper { position: relative; z-index: 2; display: flex; height: 100vh; }

                /* SIDEBAR */
                .sidebar {
                    width: 280px;
                    padding: 32px;
                    display: flex; flex-direction: column;
                    border-right: 1px solid var(--glass-border);
                    background: rgba(10, 10, 12, 0.6);
                    backdrop-filter: blur(20px);
                }
                .logo { font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
                .logo-icon { width: 40px; height: 40px; background: var(--prim); color: black; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
                
                .nav-menu { display: flex; flex-direction: column; gap: 8px; flex: 1; }
                .nav-item {
                    display: flex; align-items: center; gap: 16px;
                    padding: 14px 20px;
                    border-radius: 16px;
                    background: transparent;
                    color: #a1a1aa;
                    border: none;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.3s;
                    font-weight: 500;
                    overflow: hidden;
                }
                .nav-item:hover { color: white; background: rgba(255,255,255,0.05); }
                .nav-item.active { color: black; font-weight: 700; }
                .nav-item.active svg { color: black; }
                .active-pill {
                    position: absolute; inset: 0; background: var(--prim); z-index: -1; border-radius: 16px; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
                }

                .sidebar-footer { padding-top: 20px; border-top: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: space-between; }
                .user-mini { display: flex; align-items: center; gap: 12px; }
                .user-mini img { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--prim); }
                .user-mini .name { font-weight: 700; font-size: 0.9rem; }
                .user-mini .role { font-size: 0.75rem; color: #a1a1aa; }
                .logout-btn { background: rgba(255,255,255,0.05); border: none; width: 40px; height: 40px; border-radius: 12px; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .logout-btn:hover { background: #ef4444; color: white; }

                /* MAIN AREA */
                .main-area { flex: 1; padding: 40px; overflow-y: auto; }
                .top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .page-title { font-size: 2rem; font-weight: 800; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                
                .glass-input {
                    background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 12px 20px; border-radius: 14px; display: flex; align-items: center; gap: 12px; color: #a1a1aa; width: 300px; transition: 0.3s;
                }
                .glass-input:focus-within { border-color: var(--prim); color: white; box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1); }
                .glass-input input { background: none; border: none; outline: none; color: white; width: 100%; }

                .header-actions { display: flex; gap: 16px; }
                .icon-btn { width: 48px; height: 48px; border-radius: 14px; background: var(--glass-bg); border: 1px solid var(--glass-border); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: 0.3s; }
                .icon-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
                .dot { position: absolute; top: 14px; right: 14px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 10px #ef4444; }

                /* PANELS & CARDS */
                .glass-panel { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 24px; padding: 24px; position: relative; overflow: hidden; backdrop-filter: blur(10px); }
                
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px; }
                .stat-card { position: relative; transition: transform 0.3s; }
                .stat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .icon-box { width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
                .stat-change { font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 4px; padding: 6px 10px; background: rgba(74, 222, 128, 0.1); border-radius: 20px; }
                .stat-body h3 { font-size: 2rem; font-weight: 800; margin-bottom: 4px; }
                .stat-body p { color: #a1a1aa; font-size: 0.9rem; }
                .bg-glow { position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; filter: blur(60px); opacity: 0.15; border-radius: 50%; pointer-events: none; }

                .dashboard-split { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; height: 400px; }
                .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .glass-select { background: rgba(255,255,255,0.05); border: none; color: #a1a1aa; padding: 6px 12px; border-radius: 8px; outline: none; }
                
                /* GRAPH */
                .graph-placeholder { height: 280px; display: flex; align-items: flex-end; padding-bottom: 20px; }
                .bars { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; height: 100%; gap: 12px; }
                .bar { width: 100%; background: linear-gradient(to top, rgba(251, 191, 36, 0.2), var(--prim)); border-radius: 8px 8px 0 0; min-height: 10px; opacity: 0.8; transition: all 0.3s; }
                .bar:hover { opacity: 1; filter: drop-shadow(0 0 10px var(--prim)); transform: scaleY(1.05); transform-origin: bottom; }

                /* USER LIST */
                .user-list { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 250px; padding-right: 8px; }
                .user-row { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 16px; transition: 0.2s; }
                .user-row:hover { background: rgba(255,255,255,0.03); }
                .user-info { display: flex; align-items: center; gap: 16px; }
                .avatar-wrapper { position: relative; }
                .avatar-wrapper img { width: 44px; height: 44px; border-radius: 14px; object-fit: cover; }
                .status-dot { position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background: #22c55e; border: 2px solid #18181b; border-radius: 50%; }
                .user-info h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 2px; }
                .user-info span { font-size: 0.8rem; color: #a1a1aa; }
                .btn-icon-sm { background: none; border: none; color: #52525b; cursor: pointer; padding: 8px; border-radius: 8px; transition: 0.2s; }
                .btn-icon-sm:hover { background: rgba(255,255,255,0.1); color: white; }
                .btn-full { width: 100%; margin-top: 20px; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; cursor: pointer; transition: 0.2s; font-weight: 600; font-size: 0.9rem; }
                .btn-full:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

                /* TABLE */
                .modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
                .modern-table th { text-align: left; padding: 16px 24px; color: #a1a1aa; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
                .modern-table tr { background: rgba(255,255,255,0.02); transition: 0.2s; }
                .modern-table tr:hover { background: rgba(255,255,255,0.05); transform: scale(1.01); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .modern-table td:first-child { border-radius: 16px 0 0 16px; }
                .modern-table td:last-child { border-radius: 0 16px 16px 0; }
                .modern-table td { padding: 16px 24px; vertical-align: middle; border: none; font-size: 0.95rem; color: #e4e4e7; }
                
                .tag-pill { background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
                .sm-avatar-group { display: flex; align-items: center; gap: 10px; }
                .sm-avatar-group img { width: 28px; height: 28px; border-radius: 50%; }
                .status-badge { padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
                .status-badge.success { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
                
                .btn-icon-hover { background: rgba(255,255,255,0.05); border: none; padding: 8px; border-radius: 8px; color: #a1a1aa; cursor: pointer; transition: 0.2s; }
                .btn-icon-hover:hover { background: var(--prim); color: black; }
                .btn-primary-glow { background: var(--prim); color: black; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 15px rgba(251, 191, 36, 0.3); transition: 0.3s; }
                .btn-primary-glow:hover { box-shadow: 0 0 25px rgba(251, 191, 36, 0.6); transform: translateY(-2px); }

                .tabs { display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 12px; }
                .tab { background: none; border: none; color: #a1a1aa; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
                .tab.active { background: rgba(255,255,255,0.1); color: white; font-weight: 600; }

                /* SCROLLBAR */
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}
