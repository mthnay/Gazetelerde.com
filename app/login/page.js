"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                router.push(data.redirectUrl || '/');
                router.refresh();
            } else {
                setError(data.message || 'Giriş yapılamadı.');
                setLoading(false);
            }
        } catch (err) {
            setError('Bir bağlantı hatası oluştu.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Decoration */}
            <div className="bg-glow"></div>

            <div className={`split-layout ${mounted ? 'visible' : ''}`}>

                {/* Left Side - Visual */}
                <div className="visual-side">
                    <div className="visual-content">
                        <div className="logo-badge">GAZETELERDE</div>
                        <h2 className="visual-title">Geleceğin Haberciliğine <br />Hoş Geldiniz.</h2>
                        <p className="visual-desc">En güncel gelişmeler, derinlemesine analizler ve size özel içerikler bir tık uzağınızda.</p>
                        <div className="visual-footer">
                            <div className="stat">
                                <b>10K+</b> <span>Okur</span>
                            </div>
                            <div className="stat">
                                <b>500+</b> <span>Yazar</span>
                            </div>
                        </div>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                </div>

                {/* Right Side - Form */}
                <div className="form-side">
                    <div className="form-wrapper">
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: '800' }}>Giriş Yap</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Hesabınıza erişmek için bilgilerinizi girin.</p>
                        </div>

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            <div className="input-group">
                                <label className={email ? 'filled' : ''}>E-posta veya Kullanıcı Adı</label>
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className={password ? 'filled' : ''}>Şifre</label>
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                                    Beni Hatırla
                                </label>
                                <a href="#" className="forgot-link">Şifremi Unuttum?</a>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '10px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? (
                                    <span className="spin-loader"></span>
                                ) : (
                                    <>Giriş Yap <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <div className="divider">
                            <span>veya</span>
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Henüz üye değil misiniz? <Link href="/register" className="register-link">Hemen Kayıt Ol</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .login-container {
            min-height: calc(100vh - 80px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            position: relative;
            overflow: hidden;
        }

        .bg-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle at center, rgba(251, 191, 36, 0.05) 0%, transparent 60%);
            z-index: 0;
            pointer-events: none;
        }

        .split-layout {
            display: flex;
            width: 100%;
            max-width: 1000px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.1);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
            z-index: 1;
            min-height: 600px;
        }

        .split-layout.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* LEFT SIDE */
        .visual-side {
            flex: 1;
            background: #101010; /* Always dark for aesthetic */
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 60px;
            color: white;
            overflow: hidden;
        }

        .visual-content {
            position: relative;
            z-index: 2;
        }

        .logo-badge {
            background: var(--primary);
            color: black;
            font-weight: 900;
            padding: 6px 12px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 24px;
            font-size: 14px;
        }

        .visual-title {
            font-size: 2.5rem;
            line-height: 1.2;
            margin-bottom: 20px;
            background: linear-gradient(to right, #fff, #a1a1aa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .visual-desc {
            color: #a1a1aa;
            line-height: 1.6;
            margin-bottom: 40px;
            font-size: 1.1rem;
        }

        .visual-footer {
            display: flex;
            gap: 40px;
            margin-top: auto;
        }

        .stat b { font-size: 1.5rem; display: block; }
        .stat span { font-size: 0.9rem; color: #71717a; }

        .shape {
            position: absolute;
            filter: blur(80px);
            z-index: 1;
            opacity: 0.5;
        }
        .shape-1 {
            width: 300px;
            height: 300px;
            background: blue;
            top: -50px;
            right: -50px;
            border-radius: 50%;
            background: radial-gradient(circle, var(--primary), transparent);
        }
        .shape-2 {
            width: 400px;
            height: 400px;
            background: purple;
            bottom: -100px;
            left: -100px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.5), transparent);
        }

        /* RIGHT SIDE */
        .form-side {
            flex: 1;
            padding: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-card);
        }

        .form-wrapper { width: 100%; max-width: 360px; }

        .input-group {
            position: relative;
        }

        .input-group input {
            width: 100%;
            padding: 16px 16px 16px 48px;
            background: var(--bg-hover);
            border: 2px solid transparent;
            border-radius: 12px;
            font-size: 15px;
            color: var(--text-main);
            outline: none;
            transition: all 0.3s;
        }

        .input-group input:focus {
            background: var(--bg-main);
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1);
        }

        .input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            transition: color 0.3s;
        }
        
        .input-group input:focus ~ .input-icon {
            color: var(--primary);
        }

        .input-group label {
            position: absolute;
            left: 48px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 15px;
            pointer-events: none;
            transition: all 0.3s ease;
        }

        .input-group input:focus ~ label,
        .input-group label.filled {
            top: -8px;
            left: 12px;
            font-size: 11px;
            background: var(--bg-card);
            padding: 0 4px;
            color: var(--primary);
            font-weight: 700;
        }

        .login-btn {
            width: 100%;
            padding: 16px;
            border-radius: 12px;
            border: none;
            background: var(--primary);
            color: var(--primary-fg);
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s;
            margin-top: 10px;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(251, 191, 36, 0.4);
        }

        .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
        }

        .forgot-link { color: var(--text-secondary); transition: color 0.2s; }
        .forgot-link:hover { color: var(--primary); text-decoration: underline; }

        .register-link { color: var(--primary); font-weight: 700; position: relative; }
        .register-link::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0%;
            height: 2px;
            background: var(--primary);
            transition: width 0.3s;
        }
        .register-link:hover::after { width: 100%; }

        .divider {
            margin: 30px 0;
            position: relative;
            text-align: center;
        }
        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 1px;
            background: var(--border);
        }
        .divider span {
            position: relative;
            background: var(--bg-card);
            padding: 0 10px;
            color: var(--text-muted);
            font-size: 13px;
        }

        .spin-loader {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(0,0,0,0.1);
            border-top-color: black;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        @media (max-width: 900px) {
            .split-layout { flex-direction: column; max-width: 500px; }
            .visual-side { display: none; }
            .form-side { padding: 40px; }
        }
      `}</style>
        </div>
    );
}
