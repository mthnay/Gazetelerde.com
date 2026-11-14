"use client";
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import PushOptIn from './PushOptIn';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setStatus('Lütfen geçerli bir e-posta adresi girin.');
        setBusy(true);
        const res = await fetch('/api/newsletter', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
        }).catch(() => null);
        const data = await res?.json().catch(() => null);
        setBusy(false);
        setStatus(data?.message || 'Bir hata oluştu, lütfen tekrar deneyin.');
        if (data?.success) setEmail('');
    };

    return (
        <section className="newsletter" data-reveal="scale">
            <span className="kicker" style={{ color: 'var(--brand)' }}>Sabah bülteni</span>
            <h2 style={{ marginTop: 12 }}>Günü beş dakikada yakalayın.</h2>
            <p>Her sabah 08:00&apos;de günün en önemli haberleri, sade ve kısa bir özetle e-posta kutunuzda.</p>
            <form onSubmit={submit}>
                <input className="input" type="email" required placeholder="E-posta adresiniz" aria-label="E-posta adresi" value={email} onChange={(e) => { setEmail(e.target.value); setStatus(''); }} />
                <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <>Abone ol <ArrowRight size={16} /></>}</button>
            </form>
            {status && <p className="newsletter-status" role="status">{status}</p>}
            <PushOptIn compact />
        </section>
    );
}
