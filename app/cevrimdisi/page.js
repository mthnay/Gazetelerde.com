import OfflineList from '@/components/OfflineList';

export const metadata = { title: 'Çevrimdışısınız | Gazetelerde', robots: { index: false } };

// İnternet yokken açılan sayfa (service worker önbellekten sunar). Daha önce okunan haberler listelenir.
export default function Offline() {
    return (
        <div className="container status-page">
            <div>
                <span className="kicker">Bağlantı yok</span>
                <h1>Çevrimdışısınız</h1>
                <p>İnternet bağlantınız geri geldiğinde sayfa kendiliğinden yenilenir. Bu arada son okuduğunuz haberlere bağlantısız da bakabilirsiniz:</p>
                <OfflineList />
            </div>
        </div>
    );
}
