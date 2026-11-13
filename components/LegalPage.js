// Künye / Gizlilik / İletişim gibi metin sayfaları için ortak yerleşim
export default function LegalPage({ title, kicker = 'Kurumsal', updated, children }) {
    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">{kicker}</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(42px, 7.5vw, 100px)' }}>{title}<span className="dot">.</span></h1>
                {updated && <p className="meta rise" style={{ '--i': 2 }}>Son güncelleme: {updated}</p>}
            </header>
            <div className="legal">{children}</div>
        </div>
    );
}
