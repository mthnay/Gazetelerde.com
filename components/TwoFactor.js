"use client";
import { useState } from 'react';
import { ShieldCheck, ShieldOff, Copy, Download } from 'lucide-react';

async function call(body) {
    const res = await fetch('/api/profile/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    return (await res?.json().catch(() => null)) || { success: false, message: 'Sunucuya ulaşılamadı.' };
}

// Profil > Güvenlik: iki adımlı doğrulamayı aç / kapat
export default function TwoFactor({ enabled: initial, staff }) {
    const [enabled, setEnabled] = useState(initial);
    const [setup, setSetup] = useState(null); // { qr, secret }
    const [codes, setCodes] = useState(null);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);

    const run = async (body, after) => {
        setBusy(true); setMsg('');
        const d = await call(body);
        setBusy(false);
        if (!d.success) return setMsg(d.message || 'İşlem başarısız.');
        after(d);
    };

    const download = () => {
        const blob = new Blob([`Gazetelerde kurtarma kodları\nHer kod bir kez kullanılabilir.\n\n${codes.join('\n')}\n`], { type: 'text/plain' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'gazetelerde-kurtarma-kodlari.txt' });
        a.click(); URL.revokeObjectURL(a.href);
    };

    return (
        <div className="profile-form">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} /> İki adımlı doğrulama</h3>
            {codes ? (
                <>
                    <div className="alert alert-success">İki adımlı doğrulama açıldı. Aşağıdaki kurtarma kodlarını güvenli bir yere kaydedin; telefonunuzu kaybederseniz bunlarla girebilirsiniz. <strong>Bu kodlar bir daha gösterilmeyecek.</strong></div>
                    <ul className="recovery-codes">{codes.map((c) => <li key={c}><code>{c}</code></li>)}</ul>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn" onClick={download}><Download size={16} /> İndir</button>
                        <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(codes.join('\n'))}><Copy size={16} /> Kopyala</button>
                        <button type="button" className="btn btn-primary" onClick={() => setCodes(null)}>Kaydettim</button>
                    </div>
                </>
            ) : enabled ? (
                <>
                    <p className="field-hint" style={{ fontSize: 14 }}>✓ Açık. Girişte şifrenize ek olarak doğrulama uygulamasındaki kod istenir.</p>
                    <label className="field"><span className="field-label">Şifre</span>
                        <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                    <label className="field"><span className="field-label">Doğrulama kodu</span>
                        <input className="input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={9} /></label>
                    {msg && <div className="alert alert-error" role="alert">{msg}</div>}
                    <div><button type="button" className="btn btn-danger" disabled={busy || !password || !code}
                        onClick={() => run({ action: 'disable', password, code }, () => { setEnabled(false); setPassword(''); setCode(''); })}><ShieldOff size={16} /> Kapat</button></div>
                </>
            ) : setup ? (
                <>
                    <ol className="twofa-steps">
                        <li>Telefonunuzda Google Authenticator, Microsoft Authenticator ya da 1Password gibi bir doğrulama uygulaması açın.</li>
                        <li>Bu karekodu okutun:
                            <div className="twofa-qr" dangerouslySetInnerHTML={{ __html: setup.qr }} />
                            <span className="field-hint">Okutamıyorsanız anahtarı elle girin: <code>{setup.secret}</code></span>
                        </li>
                        <li>Uygulamanın gösterdiği 6 haneli kodu yazın.</li>
                    </ol>
                    <label className="field"><span className="field-label">Doğrulama kodu</span>
                        <input className="input" inputMode="numeric" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></label>
                    {msg && <div className="alert alert-error" role="alert">{msg}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-primary" disabled={busy || code.length < 6}
                            onClick={() => run({ action: 'enable', code }, (d) => { setEnabled(true); setSetup(null); setCode(''); setCodes(d.recoveryCodes); })}>Doğrula ve aç</button>
                        <button type="button" className="btn" onClick={() => { setSetup(null); setCode(''); setMsg(''); }}>Vazgeç</button>
                    </div>
                </>
            ) : (
                <>
                    <p style={{ color: 'var(--ink-2)', margin: '0 0 12px', maxWidth: '60ch' }}>
                        Şifreniz ele geçirilse bile hesabınıza telefonunuzdaki kod olmadan girilemez.
                        {staff && <strong> Yönetim paneline erişiminiz olduğu için açmanız önemle önerilir.</strong>}
                    </p>
                    {msg && <div className="alert alert-error" role="alert">{msg}</div>}
                    <div><button type="button" className="btn btn-primary" disabled={busy} onClick={() => run({ action: 'start' }, setSetup)}><ShieldCheck size={16} /> Kurulumu başlat</button></div>
                </>
            )}
        </div>
    );
}
