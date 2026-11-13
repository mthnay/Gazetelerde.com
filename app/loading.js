// Sayfa sunucuda hazırlanırken gösterilen hafif iskelet
export default function Loading() {
    return (
        <div className="container" style={{ paddingTop: 48 }} aria-busy="true" aria-label="Yükleniyor">
            <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 320, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 16, width: '80%' }} />
        </div>
    );
}
