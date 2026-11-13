// Künye / Gizlilik / İletişim gibi metin sayfaları için ortak yerleşim
export default function LegalPage({ title, updated, children }) {
    return (
        <div className="container legal">
            <h1>{title}</h1>
            {updated && <p className="legal-updated">Son güncelleme: {updated}</p>}
            {children}
        </div>
    );
}
