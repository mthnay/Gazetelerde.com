import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="container" style={{ textAlign: 'center', padding: '120px 24px' }}>
            <p style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '2px' }}>404</p>
            <h1 style={{ fontSize: '2.5rem', margin: '12px 0' }}>Aradığınız sayfa bulunamadı</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Haber kaldırılmış ya da adres yanlış olabilir.</p>
            <Link href="/" className="btn btn-primary">Ana sayfaya dön</Link>
        </div>
    );
}
