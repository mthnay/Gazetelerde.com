"use client";
import { use } from 'react';
import NewsCard from "@/components/NewsCard";
import Link from 'next/link';

// Mock Data Database (Expanded for categories)
const allNews = [
    // GUNDEM
    { id: 101, title: "Ankara'da Kritik Zirve: Yeni Kararlar Açıklandı", category: "GÜNDEM", img: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=800" },
    { id: 102, title: "Eğitim Sisteminde Köklü Değişiklik Hazırlığı", category: "GÜNDEM", img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800" },

    // DUNYA
    { id: 201, title: "Avrupa'da Enerji Krizi: Yeni Önlemler Masada", category: "DÜNYA", img: "https://images.unsplash.com/photo-1473341304170-5799da148dbe?q=80&w=800" },
    { id: 202, title: "Asya Piyasalarında Sert Rüzgarlar", category: "DÜNYA", img: "https://images.unsplash.com/photo-1526304640152-d4619684e484?q=80&w=800" },

    // EKONOMI
    { id: 301, title: "Merkez Bankası Faiz Kararını Açıkladı", category: "EKONOMİ", img: "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=800" },
    { id: 302, title: "Borsa İstanbul'da Rekor Kapanış", category: "EKONOMİ", img: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800" },
    { id: 303, title: "Altın Fiyatlarında Son Durum", category: "EKONOMİ", img: "https://images.unsplash.com/photo-1610375461246-fd7cd19a26f5?q=80&w=800" },

    // SPOR
    { id: 401, title: "İstanbul'da Büyük Maraton Heyecanı", category: "SPOR", img: "https://images.unsplash.com/photo-1552674605-5d28c4e1902c?q=80&w=800" },
    { id: 402, title: "Dev Derbi Öncesi Nefesler Tutuldu", category: "SPOR", img: "https://images.unsplash.com/photo-1579952363873-27f3bde9be2e?q=80&w=800" },
    { id: 403, title: "Milli Takım Kamp Kadrosu Belli Oldu", category: "SPOR", img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800" },

    // TEKNOLOJI
    { id: 501, title: "Yapay Zeka Devrimi: GPT-5 Duyuruldu", category: "TEKNOLOJİ", img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800" },
    { id: 502, title: "Yerli Otomobil Dünya Sahnesinde", category: "TEKNOLOJİ", img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800" },
    { id: 503, title: "Apple'dan Yeni Karma Gerçeklik Gözlüğü", category: "TEKNOLOJİ", img: "https://images.unsplash.com/photo-1592478411213-61535fca3ee0?q=80&w=800" },

    // YASAM
    { id: 601, title: "Sağlıklı Yaşam: Güne Zinde Başlamanın 5 Yolu", category: "YAŞAM", img: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=800" },
    { id: 602, title: "İstanbul'un En İyi 10 Kahve Mekanı", category: "YAŞAM", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800" },
];

const categoryMap = {
    'gundem': { label: 'GÜNDEM', desc: 'Türkiye ve dünyadan sıcak gelişmeler.' },
    'dunya': { label: 'DÜNYA', desc: 'Sınırsız habercilik, küresel bakış.' },
    'ekonomi': { label: 'EKONOMİ', desc: 'Piyasalar, analizler ve finans dünyası.' },
    'spor': { label: 'SPOR', desc: 'Sahalardan en son skorlar ve transfer haberleri.' },
    'teknoloji': { label: 'TEKNOLOJİ', desc: 'Geleceği şekillendiren inovasyonlar.' },
    'yasam': { label: 'YAŞAM', desc: 'Kültür, sanat, sağlık ve daha fazlası.' }
};

export default function CategoryPage({ params }) {
    // Unwrap params using React.use()
    const { slug } = use(params);

    const catInfo = categoryMap[slug] || { label: slug.toUpperCase(), desc: 'En güncel haberler.' };
    const filteredNews = allNews.filter(n =>
        n.category === catInfo.label ||
        (slug === 'gundem' && n.category === 'GÜNDEM') // Fallback matching
    );

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>

            {/* Category Header */}
            <div className="cat-header animate-fade-in">
                <span className="cat-subtitle">KATEGORİ</span>
                <h1 className="cat-title">{catInfo.label}</h1>
                <p className="cat-desc">{catInfo.desc}</p>
            </div>

            {/* News Grid */}
            <div className="grid-feed animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {filteredNews.length > 0 ? (
                    filteredNews.map(news => (
                        <Link key={news.id} href={`/news/${news.id}`} style={{ display: 'contents' }}>
                            <NewsCard news={news} />
                        </Link>
                    ))
                ) : (
                    <div className="empty-state">
                        Bu kategoride henüz haber bulunmuyor.
                    </div>
                )}
            </div>

            <style jsx>{`
                .cat-header {
                    margin-bottom: 60px;
                    text-align: center;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }
                .cat-subtitle {
                    color: var(--primary);
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    display: block;
                    margin-bottom: 16px;
                }
                .cat-title {
                    font-size: 3.5rem;
                    line-height: 1;
                    margin-bottom: 16px;
                    background: linear-gradient(to bottom, var(--text-main), var(--text-muted));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .cat-desc {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                }
                
                .grid-feed {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 32px 24px;
                }

                .empty-state {
                    grid-column: 1 / -1;
                    padding: 80px;
                    text-align: center;
                    background: var(--bg-card);
                    border: 1px dashed var(--border);
                    border-radius: 16px;
                    color: var(--text-muted);
                }

                @media (max-width: 1024px) {
                    .grid-feed { grid-template-columns: repeat(3, 1fr); }
                    .cat-title { font-size: 2.5rem; }
                }
                @media (max-width: 768px) {
                    .grid-feed { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 600px) {
                    .grid-feed { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
