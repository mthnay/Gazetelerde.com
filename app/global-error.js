"use client";

// Kök yerleşim (layout) bile çöktüğünde gösterilen son çare sayfası; kendi <html>'ini çizer
export default function GlobalError({ error, reset }) {
    return (
        <html lang="tr">
            <body style={{ fontFamily: 'system-ui, sans-serif', background: '#09090b', color: '#f4f4f5', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
                <div style={{ textAlign: 'center', padding: 24 }}>
                    <h1>Site şu anda yanıt veremiyor</h1>
                    <p style={{ color: '#a1a1aa' }}>Lütfen biraz sonra tekrar deneyin.{error?.digest ? ` (Hata kodu: ${error.digest})` : ''}</p>
                    <button onClick={() => reset()} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 99, border: 'none', background: '#fbbf24', fontWeight: 700, cursor: 'pointer' }}>
                        Tekrar dene
                    </button>
                </div>
            </body>
        </html>
    );
}
