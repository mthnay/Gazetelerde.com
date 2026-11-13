"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, LogOut, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { useSession } from '@/components/SessionProvider';

const STAFF = ['ADMIN', 'EDITOR', 'AUTHOR'];
const titleCase = (s) => s.charAt(0) + s.slice(1).toLocaleLowerCase('tr');

export function Wordmark({ className = '' }) {
    return (
        <Link href="/" className={`wordmark ${className}`} aria-label="Gazetelerde ana sayfa">
            Gazetelerde<span className="wordmark-dot" aria-hidden="true" />
        </Link>
    );
}

// Tarih yalnızca tarayıcıda yazılır: önbellekteki sayfada eski tarih kalmasın
function TodayLabel() {
    const [label, setLabel] = useState('');
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLabel(new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));
    }, []);
    return <span className="masthead-date">{label || ' '}</span>;
}

function SearchOverlay({ onClose, categories }) {
    const router = useRouter();
    const [q, setQ] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 30);
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const submit = (e) => {
        e.preventDefault();
        const v = q.trim();
        if (!v) return;
        onClose();
        router.push(`/search?q=${encodeURIComponent(v)}`);
    };

    return (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Haber ara" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="search-dialog">
                <form className="search-box" onSubmit={submit} role="search">
                    <Search size={22} />
                    <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ne okumak istersiniz?" aria-label="Arama" type="search" />
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
                </form>
                <div style={{ marginTop: 26 }}>
                    <span className="kicker">Kategorilere göz atın</span>
                    <div className="search-hints">
                        {categories.map((c) => (
                            <Link key={c.slug} href={`/category/${c.slug}`} onClick={onClose}>{titleCase(c.label)}</Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Drawer({ onClose, categories, user, onLogout }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const isStaff = user && STAFF.includes(user.role);
    return (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Menü">
            <div className="drawer-backdrop" onClick={onClose} />
            <nav className="drawer-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Wordmark />
                    <button className="icon-btn" onClick={onClose} aria-label="Menüyü kapat"><X size={18} /></button>
                </div>
                <div className="drawer-links" onClick={onClose}>
                    <Link href="/">Ana Sayfa <ArrowRight size={18} /></Link>
                    {categories.map((c) => (
                        <Link key={c.slug} href={`/category/${c.slug}`}>{titleCase(c.label)} <ArrowRight size={18} /></Link>
                    ))}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }} onClick={onClose}>
                    {user ? (
                        <>
                            <Link href={isStaff ? '/admin' : '/profile'} className="btn btn-block">{isStaff ? 'Yönetim paneli' : 'Profilim'}</Link>
                            <button onClick={onLogout} className="btn btn-ghost btn-block"><LogOut size={16} /> Çıkış yap</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-primary btn-block">Giriş yap</Link>
                            <Link href="/register" className="btn btn-block">Ücretsiz üye ol</Link>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}

export default function Navbar({ categories = [] }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, refresh } = useSession();
    const [stuck, setStuck] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const closeSearch = useCallback(() => setSearchOpen(false), []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    // Manşet şeridi kaybolunca küçük logo ve arama kategori çubuğuna kayarak gelir
    useEffect(() => {
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setStuck(window.scrollY > (window.innerWidth <= 900 ? 60 : 72)));
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
    }, []);

    // Mobilde aktif kategori ekran dışında kalmasın
    useEffect(() => {
        const el = document.querySelector('.cat-nav .is-active');
        const nav = el?.parentElement;
        if (!el || !nav) return;
        const left = el.offsetLeft - nav.clientWidth / 2 + el.clientWidth / 2;
        nav.scrollLeft = Math.max(0, left);
    }, [pathname]);

    // Ctrl/⌘ + K veya "/" ile arama
    useEffect(() => {
        const onKey = (e) => {
            const el = document.activeElement;
            const typing = /input|textarea|select/i.test(el?.tagName || '') || el?.isContentEditable;
            if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    if (pathname?.startsWith('/admin')) return null;

    const handleLogout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* yoksay */ }
        await refresh();
        router.push('/');
    };

    const isStaff = user && STAFF.includes(user.role);

    return (
        <>
            <header className={`site-header ${stuck ? 'is-stuck' : ''}`}>
                <div className="masthead">
                    <div className="container masthead-inner">
                        <div className="masthead-left">
                            <button className="icon-btn hamburger" onClick={() => setDrawerOpen(true)} aria-label="Menüyü aç"><Menu size={18} /></button>
                            <TodayLabel />
                            <button className="search-trigger hide-mobile" onClick={() => setSearchOpen(true)} aria-label="Haber ara (Ctrl+K)">
                                <Search size={15} /> <span className="search-trigger-label">Ara</span> <span className="kbd">⌘K</span>
                            </button>
                        </div>
                        <Wordmark />
                        <div className="masthead-right">
                            <button className="icon-btn show-mobile" onClick={() => setSearchOpen(true)} aria-label="Haber ara"><Search size={17} /></button>
                            {loading ? (
                                <span style={{ width: 110, height: 40 }} aria-hidden="true" />
                            ) : user ? (
                                <>
                                    <NotificationBell />
                                    <Link href={isStaff ? '/admin' : '/profile'} className="user-chip" title={isStaff ? 'Yönetim paneli' : 'Profilim'}>
                                        <span className="avatar">{user.name.charAt(0).toLocaleUpperCase('tr')}</span>
                                        <span className="user-chip-name">{user.name}</span>
                                        {isStaff && <LayoutDashboard size={14} className="hide-mobile" style={{ opacity: 0.55 }} />}
                                    </Link>
                                    <button onClick={handleLogout} className="icon-btn hide-mobile" title="Çıkış yap" aria-label="Çıkış yap"><LogOut size={16} /></button>
                                </>
                            ) : (
                                <>
                                    <Link href="/register" className="btn btn-ghost btn-sm hide-mobile">Üye ol</Link>
                                    <Link href="/login" className="btn btn-primary btn-sm">Giriş yap</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="navbar">
                    <div className="container navbar-inner">
                        <div className="navbar-mini" aria-hidden={!stuck}>
                            <Link href="/" className="wordmark" tabIndex={stuck ? 0 : -1} aria-label="Ana sayfa">
                                Gazetelerde<span className="wordmark-dot" aria-hidden="true" />
                            </Link>
                        </div>
                        <nav className="cat-nav" aria-label="Kategoriler">
                            <Link href="/" className={`cat-link cat-link--home ${pathname === '/' ? 'is-active' : ''}`}>Ana Sayfa</Link>
                            {categories.map((c) => {
                                const href = `/category/${c.slug}`;
                                return (
                                    <Link key={c.slug} href={href} className={`cat-link ${pathname === href ? 'is-active' : ''}`}>
                                        {titleCase(c.label)}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="navbar-actions">
                            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Haber ara" tabIndex={stuck ? 0 : -1}><Search size={17} /></button>
                        </div>
                    </div>
                </div>
            </header>

            {searchOpen && <SearchOverlay onClose={closeSearch} categories={categories} />}
            {drawerOpen && <Drawer onClose={closeDrawer} categories={categories} user={user} onLogout={handleLogout} />}
        </>
    );
}
