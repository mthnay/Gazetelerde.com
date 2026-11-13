"use client";
import { useEffect } from 'react';
import Link from 'next/link';

// Sayfa içinde beklenmeyen bir hata olursa (ör. veritabanına ulaşılamadı) gösterilir
export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('[sayfa hatası]', error?.digest || '', error);
    }, [error]);

    return (
        <div className="container" style={{ textAlign: 'center', padding: '120px 24px' }}>
            <p style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '2px' }}>HATA</p>
            <h1 style={{ fontSize: '2.2rem', margin: '12px 0' }}>Bir şeyler ters gitti</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Sayfa yüklenirken bir sorun oluştu. Birkaç saniye sonra tekrar deneyin.
                {error?.digest && <><br /><small>Hata kodu: {error.digest}</small></>}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => reset()} className="btn btn-primary">Tekrar dene</button>
                <Link href="/" className="btn" style={{ border: '1px solid var(--border)' }}>Ana sayfa</Link>
            </div>
        </div>
    );
}
