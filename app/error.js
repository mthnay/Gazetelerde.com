"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';

// Sayfa içinde beklenmeyen bir hata olursa (ör. veritabanına ulaşılamadı) gösterilir
export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('[sayfa hatası]', error?.digest || '', error);
    }, [error]);

    return (
        <div className="status-page">
            <div>
                <div className="status-code" aria-hidden="true" style={{ fontSize: 'clamp(90px, 18vw, 200px)' }}>Hata</div>
                <h1>Matbaada küçük bir aksilik</h1>
                <p>
                    Sayfa yüklenirken bir sorun oluştu. Birkaç saniye sonra tekrar deneyin.
                    {error?.digest && <><br /><small>Hata kodu: {error.digest}</small></>}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => reset()} className="btn btn-primary"><RotateCcw size={16} /> Tekrar dene</button>
                    <Link href="/" className="btn">Ana sayfa</Link>
                </div>
            </div>
        </div>
    );
}
