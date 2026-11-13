// Sayfa sunucuda hazırlanırken gösterilen iskelet
export default function Loading() {
    return (
        <div className="container" style={{ paddingTop: 40 }} aria-busy="true" aria-label="Yükleniyor">
            <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 18 }} />
            <div className="skeleton" style={{ height: 'clamp(48px, 8vw, 96px)', width: '70%', marginBottom: 32 }} />
            <div className="front-grid">
                <div className="skeleton" style={{ height: 'clamp(320px, 45vw, 520px)', borderRadius: 'var(--radius-lg)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} style={{ display: 'flex', gap: 14 }}>
                            <div className="skeleton" style={{ width: 110, height: 90, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
                                <div className="skeleton" style={{ height: 18, marginBottom: 6 }} />
                                <div className="skeleton" style={{ height: 18, width: '70%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
