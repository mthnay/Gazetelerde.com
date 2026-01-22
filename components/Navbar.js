"use client";
import Link from 'next/link';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for user in localStorage (Mock Auth)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = "user_token=; path=/; max-age=0"; // Clear cookie
    setUser(null);
    router.refresh();
  };

  const links = [
    { name: 'GÜNDEM', href: '/category/gundem' },
    { name: 'DÜNYA', href: '/category/dunya' },
    { name: 'EKONOMİ', href: '/category/ekonomi' },
    { name: 'SPOR', href: '/category/spor' },
    { name: 'TEKNOLOJİ', href: '/category/teknoloji' },
    { name: 'YAŞAM', href: '/category/yasam' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        background: 'rgba(9, 9, 11, 0.95)', // Matches --bg-dark
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        height: 'var(--header-height)'
      }}>
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ background: 'var(--primary)', color: 'black', fontWeight: '900', fontSize: '20px', padding: '0 12px', borderRadius: '4px', height: '40px', display: 'flex', alignItems: 'center' }}>
                GAZETELERDE
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="desktop-menu" style={{ display: 'flex', gap: '24px' }}>
              {links.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="search-bar">
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Haber ara..." />
            </div>

            <button className="icon-btn">
              <Bell size={20} />
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href="/profile" className="user-pill">
                  <User size={16} />
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="icon-btn" title="Çıkış Yap">
                  <LogOut size={18} />
                </button>
                {/* Admin Access hidden for normal users, purely URL based for now */}
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                Giriş Yap
              </Link>
            )}

          </div>
        </div>
      </nav>

      <style jsx>{`
        .nav-link {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          padding: 8px 0;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          letter-spacing: 0.5px;
        }
        .nav-link:hover, .nav-link.active {
          color: white;
          border-bottom-color: var(--primary);
        }
        .search-bar {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            border-radius: 99px;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            width: 240px;
            height: 40px;
        }
        .search-bar input {
            background: transparent;
            border: none;
            outline: none;
            color: white;
            font-size: 13px;
            width: 100%;
        }
        .icon-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-main);
            cursor: pointer;
            transition: all 0.2s;
        }
        .icon-btn:hover {
            background: rgba(255,255,255,0.1);
            color: white;
            border-color: rgba(255,255,255,0.2);
        }
        .user-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.05);
            padding: 4px 12px 4px 4px;
            border-radius: 99px;
            border: 1px solid var(--border);
            height: 40px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .user-pill:hover {
            background: rgba(255,255,255,0.1);
        }
        .user-pill svg {
            background: #27272a;
            padding: 4px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
        }

        @media (max-width: 1024px) {
            .desktop-menu { display: none !important; }
            .search-bar { display: none; }
        }
      `}</style>
    </>
  );
}
