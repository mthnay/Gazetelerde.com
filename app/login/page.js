"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import { useSession } from '@/components/SessionProvider';

export default function LoginPage() {
    const router = useRouter();
    const { refresh } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Giriş yapılamadı.');
                setLoading(false);
                return;
            }
            const next = new URLSearchParams(window.location.search).get('next');
            const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
            await refresh();
            router.push(safeNext || data.redirectUrl || '/');
            router.refresh();
        } catch {
            setError('Bağlantı hatası. Lütfen tekrar deneyin.');
            setLoading(false);
        }
    };

    return (
        <AuthShell quote={<>Günün hikâyesi <em>sizi</em> bekliyor.</>}>
            <form className="auth-form" onSubmit={handleLogin} noValidate={false}>
                <div className="rise">
                    <span className="kicker">Tekrar hoş geldiniz</span>
                    <h1 style={{ marginTop: 10 }}>Giriş yapın</h1>
                </div>
                <p className="lede rise" style={{ '--i': 1 }}>Kaydettiğiniz haberler, takip ettiğiniz kategoriler ve yorumlarınız sizi bekliyor.</p>

                <label className="field rise" style={{ '--i': 2 }}>
                    <span className="field-label">E-posta</span>
                    <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" />
                </label>

                <label className="field rise" style={{ '--i': 3 }}>
                    <span className="field-label">Şifre</span>
                    <span className="pw-wrap">
                        <input className="input" type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </span>
                </label>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <button type="submit" className="btn btn-primary btn-lg btn-block rise" style={{ '--i': 4 }} disabled={loading}>
                    {loading ? <span className="spinner" /> : <>Giriş yap <ArrowRight size={17} /></>}
                </button>

                <p className="auth-switch">Hesabınız yok mu? <Link href="/register">Ücretsiz üye olun</Link></p>
            </form>
        </AuthShell>
    );
}
