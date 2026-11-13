"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import Modal from '@/components/Modal';
import { useSession } from '@/components/SessionProvider';

// Basit şifre gücü: uzunluk + çeşitlilik (0-4)
function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-ZÇĞİÖŞÜ]/.test(pw) && /[a-zçğıöşü]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(pw)) s++;
    return Math.min(4, s);
}
const LEVELS = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'];
const COLORS = ['var(--line)', 'var(--live)', 'var(--brand-deep)', '#65a30d', '#15803d'];

export default function RegisterPage() {
    const router = useRouter();
    const { refresh } = useSession();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null); // 'kvkk' | 'riza' | null

    const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(''); };
    const level = strength(form.password);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 8) return setError('Şifre en az 8 karakter olmalı.');
        if (!agreed) return setError('Devam etmek için KVKK ve Açık Rıza metinlerini onaylayın.');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, consent: agreed }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Kayıt başarısız.');
                setLoading(false);
                return;
            }
            await refresh();
            router.push(data.redirectUrl || '/');
            router.refresh();
        } catch {
            setError('Bağlantı hatası. Lütfen tekrar deneyin.');
            setLoading(false);
        }
    };

    return (
        <AuthShell quote={<>Haberi okuyun, <em>tartışın</em>, takip edin.</>}>
            <form className="auth-form" onSubmit={handleRegister}>
                <div className="rise">
                    <span className="kicker">Ücretsiz üyelik</span>
                    <h1 style={{ marginTop: 10 }}>Aramıza katılın</h1>
                </div>
                <p className="lede rise" style={{ '--i': 1 }}>Kategorileri takip edin, haberleri kaydedin, yorumlara katılın.</p>

                <label className="field rise" style={{ '--i': 2 }}>
                    <span className="field-label">Ad soyad</span>
                    <input className="input" autoComplete="name" required minLength={2} maxLength={60} value={form.name} onChange={set('name')} />
                </label>
                <label className="field rise" style={{ '--i': 3 }}>
                    <span className="field-label">E-posta</span>
                    <input className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="ornek@eposta.com" />
                </label>
                <label className="field rise" style={{ '--i': 4 }}>
                    <span className="field-label">Şifre</span>
                    <span className="pw-wrap">
                        <input className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} aria-describedby="pw-help" />
                        <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </span>
                    <span className="pw-meter" aria-hidden="true">
                        {[1, 2, 3, 4].map((i) => <span key={i} style={{ background: i <= level ? COLORS[level] : undefined }} />)}
                    </span>
                    <span id="pw-help" className="field-hint">En az 8 karakter{form.password && ` · ${LEVELS[level] || 'Çok kısa'}`}</span>
                </label>

                <label className="check rise" style={{ '--i': 5 }}>
                    <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setError(''); }} />
                    <span>
                        <button type="button" onClick={() => setModal('kvkk')}>KVKK Aydınlatma Metni</button>&apos;ni okudum,{' '}
                        <button type="button" onClick={() => setModal('riza')}>Açık Rıza Beyanı</button>&apos;nı onaylıyorum.
                    </span>
                </label>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                    {loading ? <span className="spinner" /> : <>Hesabımı oluştur <ArrowRight size={17} /></>}
                </button>

                <p className="auth-switch">Zaten üye misiniz? <Link href="/login">Giriş yapın</Link></p>
            </form>

            <Modal isOpen={modal === 'kvkk'} onClose={() => setModal(null)} title="KVKK Aydınlatma Metni">
                <p>Üyeliğiniz için ad soyad, e-posta adresiniz ve şifrenizin geri döndürülemez şekilde şifrelenmiş hali; site içi etkileşimleriniz (yorum, beğeni, kayıt, takip) ve güvenlik amacıyla IP adresiniz işlenir.</p>
                <p style={{ marginTop: 12 }}>Verileriniz satılmaz, reklam amacıyla paylaşılmaz. Hesabınızı dilediğiniz an profil sayfanızdan silebilirsiniz.</p>
                <p style={{ marginTop: 12 }}>Tam metin için <Link href="/gizlilik" target="_blank" style={{ textDecoration: 'underline' }}>Gizlilik ve KVKK</Link> sayfasına bakabilirsiniz.</p>
            </Modal>
            <Modal isOpen={modal === 'riza'} onClose={() => setModal(null)} title="Açık Rıza Beyanı">
                <p>Gazetelerde.com hizmetlerinden yararlanmak amacıyla paylaştığım kişisel verilerimin, KVKK Aydınlatma Metni&apos;nde belirtilen amaçlarla sınırlı olarak işlenmesine ve saklanmasına <strong>açık rıza gösteriyorum.</strong></p>
                <p style={{ marginTop: 12 }}>Bu onayı dilediğim zaman geri alabileceğimi biliyorum.</p>
            </Modal>
        </AuthShell>
    );
}
