"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, MessageSquare, Users, Rss, LogOut, ExternalLink } from 'lucide-react';
import { canModerate, canManageUsers, ROLE_LABELS } from '@/lib/permissions';

export default function AdminShell({ user, children }) {
    const pathname = usePathname();
    const router = useRouter();

    const items = [
        { href: '/admin', icon: LayoutDashboard, label: 'Genel Bakış', exact: true },
        { href: '/admin/haberler', icon: FileText, label: 'Haberler' },
        { href: '/admin/icerik-cek', icon: Rss, label: 'İçerik Çek' },
        canModerate(user) && { href: '/admin/yorumlar', icon: MessageSquare, label: 'Yorumlar' },
        canManageUsers(user) && { href: '/admin/kullanicilar', icon: Users, label: 'Kullanıcılar' },
    ].filter(Boolean);

    const logout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* yoksay */ }
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="admin">
            <aside className="admin-sidebar">
                <Link href="/admin" className="admin-logo">
                    <span className="admin-logo-icon">G</span>
                    <span>Yönetim</span>
                </Link>
                <nav className="admin-nav">
                    {items.map(({ href, icon: Icon, label, exact }) => {
                        const active = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <Link key={href} href={href} className={`admin-nav-item ${active ? 'active' : ''}`}>
                                <Icon size={18} /> <span>{label}</span>
                            </Link>
                        );
                    })}
                    <Link href="/" className="admin-nav-item" target="_blank">
                        <ExternalLink size={18} /> <span>Siteyi Gör</span>
                    </Link>
                </nav>
                <div className="admin-user">
                    <div className="admin-avatar">{user.name.charAt(0).toLocaleUpperCase('tr')}</div>
                    <div className="admin-user-info">
                        <strong>{user.name}</strong>
                        <span>{ROLE_LABELS[user.role]}</span>
                    </div>
                    <button onClick={logout} className="admin-icon-btn danger" title="Çıkış Yap" aria-label="Çıkış Yap">
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>
            <main className="admin-main">{children}</main>
        </div>
    );
}
