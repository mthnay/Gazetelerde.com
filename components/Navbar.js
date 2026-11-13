"use client";
import Link from 'next/link';
import { Search, User, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar({ categories = [], user = null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Admin paneli kendi yerleşimini kullanır
  if (pathname?.startsWith('/admin')) return null;

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* yoksay */ }
    router.push('/');
    router.refresh();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <nav className="site-nav">
        <div className="container nav-top">
          <form className="search-bar" onSubmit={handleSearch} role="search">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="search"
              placeholder="Haber ara..."
              aria-label="Haber ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="logo-wrap">
            <Link href="/" className="logo" aria-label="Gazetelerde ana sayfa">GAZETELERDE</Link>
          </div>

          <div className="nav-actions">
            <Link href="/search" className="icon-btn mobile-only" aria-label="Ara">
              <Search size={18} />
            </Link>
            {user ? (
              <>
                <Link href={['ADMIN', 'EDITOR', 'AUTHOR'].includes(user.role) ? '/admin' : '/profile'} className="user-pill">
                  <User size={16} />
                  <span className="user-name">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="icon-btn" title="Çıkış Yap" aria-label="Çıkış Yap">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                Giriş Yap
              </Link>
            )}
          </div>
        </div>

        <div className="nav-cats">
          <div className="container cats-scroll">
            {categories.map((c) => {
              const href = `/category/${c.slug}`;
              return (
                <Link key={c.slug} href={href} className={`cat-link ${pathname === href ? 'active' : ''}`}>
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <style jsx>{`
        .site-nav {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
          background: var(--bg-secondary);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          height: var(--header-height);
          display: flex; flex-direction: column;
        }
        :global([data-theme='dark']) .site-nav { background: rgba(9, 9, 11, 0.92); }
        :global([data-theme='light']) .site-nav { background: rgba(255, 255, 255, 0.9); }
        .nav-top { flex: 1; display: flex; align-items: center; justify-content: space-between; position: relative; gap: 12px; }
        .logo-wrap { position: absolute; left: 50%; transform: translateX(-50%); }
        .logo-wrap :global(.logo) {
          background: var(--primary); color: black; font-weight: 900; font-size: 20px;
          padding: 0 12px; border-radius: 4px; height: 40px; display: flex; align-items: center;
        }
        .nav-actions { display: flex; align-items: center; gap: 12px; }
        .search-bar {
          background: var(--bg-hover); border: 1px solid var(--border); border-radius: 99px;
          padding: 8px 16px; display: flex; align-items: center; gap: 8px; width: 240px; height: 40px;
        }
        .search-bar input { background: transparent; border: none; outline: none; color: var(--text-main); font-size: 13px; width: 100%; }
        .nav-actions :global(.icon-btn) {
          background: var(--bg-hover); border: 1px solid var(--border); width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: var(--text-main); cursor: pointer; transition: all 0.2s;
        }
        .nav-actions :global(.icon-btn:hover) { border-color: var(--primary); color: var(--primary); }
        .nav-actions :global(.user-pill) {
          display: flex; align-items: center; gap: 8px; background: var(--bg-hover);
          padding: 4px 12px 4px 4px; border-radius: 99px; border: 1px solid var(--border); height: 40px;
        }
        .nav-actions :global(.user-pill svg) { background: var(--border); padding: 4px; width: 30px; height: 30px; border-radius: 50%; }
        .user-name { font-size: 13px; font-weight: 600; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nav-actions :global(.mobile-only) { display: none; }

        .nav-cats { height: 40px; border-top: 1px solid var(--border); }
        .cats-scroll { height: 100%; display: flex; align-items: center; justify-content: center; gap: 24px; overflow-x: auto; scrollbar-width: none; }
        .cats-scroll :global(.cat-link) { font-size: 12px; font-weight: 700; letter-spacing: 1px; color: var(--text-muted); white-space: nowrap; padding: 4px 0; border-bottom: 2px solid transparent; }
        .cats-scroll :global(.cat-link:hover), .cats-scroll :global(.cat-link.active) { color: var(--text-main); border-bottom-color: var(--primary); }

        @media (max-width: 1024px) {
          .search-bar { display: none; }
          .nav-actions :global(.mobile-only) { display: flex; }
          .logo-wrap { position: static; transform: none; }
        }
        @media (max-width: 768px) {
          .cats-scroll { justify-content: flex-start; gap: 18px; }
          .logo-wrap :global(.logo) { font-size: 16px; height: 34px; }
          .user-name { display: none; }
          .nav-actions :global(.user-pill) { padding: 4px; }
        }
      `}</style>
    </>
  );
}
