"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import Modal from '@/components/Modal';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal States
    const [showKVKK, setShowKVKK] = useState(false);
    const [showRiza, setShowRiza] = useState(false);

    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!agreed) {
            setError('Lütfen KVKK ve Açık Rıza metinlerini onaylayın.');
            return;
        }

        if (formData.password.length < 8) {
            setError('Şifre en az 8 karakter olmalı.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, consent: agreed }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Kayıt başarısız.');
                setLoading(false);
                return;
            }
            router.push(data.redirectUrl || '/');
            router.refresh();
        } catch {
            setError('Bir bağlantı hatası oluştu.');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - var(--header-height))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div className="auth-card">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Aramıza Katılın</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gazetelerde.com ayrıcalıklarından yararlanmak için hesap oluşturun.</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-group">
                        <User size={20} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Adınız Soyadınız"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <Mail size={20} className="input-icon" />
                        <input
                            type="email"
                            placeholder="E-posta Adresi"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={20} className="input-icon" />
                        <input
                            type="password"
                            placeholder="Şifre (en az 8 karakter)"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    {/* Checkbox Section */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <input
                            type="checkbox"
                            style={{ width: '20px', marginTop: '4px', cursor: 'pointer' }}
                            checked={agreed}
                            onChange={(e) => {
                                setAgreed(e.target.checked);
                                if (error) setError('');
                            }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            <span
                                onClick={() => setShowKVKK(true)}
                                style={{ color: 'white', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                KVKK Aydınlatma Metni
                            </span>&apos;ni ve <span
                                onClick={() => setShowRiza(true)}
                                style={{ color: 'white', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                Açık Rıza Metni
                            </span>&apos;ni okudum, onaylıyorum.
                        </span>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            color: '#fca5a5',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
                        {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Zaten hesabınız var mı? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Giriş Yap</Link>
                </div>
            </div>

            {/* KVKK MODAL */}
            <Modal isOpen={showKVKK} onClose={() => setShowKVKK(false)} title="KVKK Aydınlatma Metni">
                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Veri Sorumlusu</h4>
                <p style={{ marginBottom: '16px' }}>6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, Gazetelerde.com olarak, veri sorumlusu sıfatıyla, kişisel verilerinizi aşağıda açıklanan amaçlar kapsamında işlemekteyiz.</p>

                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>İşlenen Kişisel Verileriniz</h4>
                <p style={{ marginBottom: '16px' }}>Adınız, soyadınız, e-posta adresiniz, IP adresiniz ve site içi hareketleriniz gibi veriler tarafımızca işlenmektedir.</p>

                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>İşleme Amaçları</h4>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                    <li>Üyelik işlemlerinin gerçekleştirilmesi</li>
                    <li>Hizmet kalitesinin artırılması</li>
                    <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                </ul>
            </Modal>

            {/* AÇIK RIZA MODAL */}
            <Modal isOpen={showRiza} onClose={() => setShowRiza(false)} title="Açık Rıza Beyanı">
                <p style={{ marginBottom: '16px' }}>
                    Gazetelerde.com tarafından sunulan hizmetlerden faydalanmak amacıyla paylaştığım kişisel verilerimin, KVKK Aydınlatma Metni&apos;nde belirtilen amaçlarla sınırlı olmak üzere işlenmesine, saklanmasına ve gerektiğinde yetkili kamu kurum ve kuruluşları ile paylaşılmasına <strong>açık rıza gösteriyorum.</strong>
                </p>
                <p>
                    Bu onayı dilediğim zaman geri alma hakkına sahip olduğumu biliyorum.
                </p>
            </Modal>

            <style jsx>{`
        .auth-card {
            width: 100%;
            max-width: 440px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        
        .input-group {
            position: relative;
        }
        
        .input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }
        
        input[type="text"], input[type="email"], input[type="password"] {
            width: 100%;
            padding: 14px 16px 14px 48px;
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: white;
            font-size: 15px;
            outline: none;
            transition: all 0.2s;
        }
        
        input:focus {
            border-color: var(--primary);
            background: rgba(255,255,255,0.05);
        }
      `}</style>
        </div>
    );
}
