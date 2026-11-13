import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="status-page">
            <div>
                <div className="status-code" aria-hidden="true">404</div>
                <h1>Bu sayfa baskıdan kalkmış</h1>
                <p>Aradığınız haber kaldırılmış, taşınmış ya da adres yanlış yazılmış olabilir.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" className="btn btn-primary"><ArrowLeft size={16} /> Ana sayfa</Link>
                    <Link href="/search" className="btn"><Search size={16} /> Haber ara</Link>
                </div>
            </div>
        </div>
    );
}
