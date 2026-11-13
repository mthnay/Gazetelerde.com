import FeedImporter from '@/components/admin/FeedImporter';

export const metadata = { title: 'İçerik Çek | Yönetim' };

export default function ImportPage() {
    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>İçerik Çek</h1>
                    <p>Bir RSS/Atom akışındaki son haberleri listeleyin ve seçtiğinizi taslak olarak açın.</p>
                </div>
            </header>
            <FeedImporter />
        </>
    );
}
