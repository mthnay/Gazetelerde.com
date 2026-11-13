import Link from 'next/link';

const WORDS = ['Gündem', 'Dünya', 'Ekonomi', 'Spor', 'Teknoloji', 'Bilim', 'Kültür', 'Yaşam'];

// Giriş / kayıt sayfalarının ortak iki sütunlu düzeni
export default function AuthShell({ quote, children }) {
    return (
        <div className="auth">
            <aside className="auth-art" aria-hidden="true">
                <Link href="/" className="wordmark" style={{ color: 'var(--paper)' }} tabIndex={-1}>
                    Gazetelerde<span className="wordmark-dot" />
                </Link>
                <p className="auth-art-quote rise">{quote}</p>
                <div className="auth-roll">
                    <div className="auth-roll-track">
                        {[...WORDS, ...WORDS].map((w, i) => <span key={i}>{w}</span>)}
                    </div>
                </div>
            </aside>
            <div className="auth-form-wrap">{children}</div>
        </div>
    );
}
