"use client";
import { useState } from 'react';
import Hero from "@/components/Hero";
import Stories from "@/components/Stories";
import NewsCard from "@/components/NewsCard";
import Link from 'next/link';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('TÜMÜ');

  const latestNews = [
    { id: 101, title: "İstanbul'da Büyük Maraton Heyecanı: Binlerce Kişi Koştu", category: "SPOR", img: "https://images.unsplash.com/photo-1552674605-5d28c4e1902c?q=80&w=800" },
    { id: 102, title: "Yeni Nesil Elektrikli Araçlar Tanıtıldı: Menzil Rekoru", category: "OTOMOBİL", img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800" },
    { id: 103, title: "Sinema Dünyasında Ödül Gecesi: Sürpriz İsimler Kazandı", category: "KÜLTÜR", img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800" },
    { id: 104, title: "Kış Turizminde Rekor Artış Bekleniyor", category: "SEYAHAT", img: "https://images.unsplash.com/photo-1483921020237-60fbbb7d443e?q=80&w=800" },
    { id: 105, title: "Sağlıklı Beslenmenin Püf Noktaları Açıklandı", category: "SAĞLIK", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800" },
    { id: 106, title: "Yazılım Dünyasında Yeni Trendler: AI Devrimi", category: "TEKNOLOJİ", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800" },
    { id: 107, title: "Merkez Bankası Faiz Kararını Açıkladı", category: "EKONOMİ", img: "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=800" },
    { id: 108, title: "NASA'dan Heyecanlandıran Keşif", category: "BİLİM", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800" },
  ];

  const categories = ['TÜMÜ', 'SPOR', 'EKONOMİ', 'TEKNOLOJİ', 'KÜLTÜR', 'BİLİM', 'SEYAHAT', 'OTOMOBİL'];

  const filteredNews = activeFilter === 'TÜMÜ'
    ? latestNews
    : latestNews.filter(n => n.category === activeFilter);

  return (
    <>
      <Stories />
      <Hero />
      <div className="container" style={{ marginBottom: '80px' }}>

        {/* Minimal Header with Filters */}
        <div className="feed-header">
          <h2 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Gündem Akışı</h2>
          <div className="filters">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped Minimal Layout */}
        <div className="grid-feed animate-fade-in">
          {filteredNews.length > 0 ? (
            filteredNews.map(news => (
              <Link key={news.id} href={`/news/${news.id}`} style={{ display: 'contents' }}>
                <NewsCard news={news} />
              </Link>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Bu kategoride henüz haber bulunmuyor.
            </div>
          )}
        </div>

        <div className="premium-cta">
          <div className="cta-content">
            <h3 className="cta-title">Gazetelerde.com Özel İçeriklerine Erişin</h3>
            <p className="cta-desc">Özel dosyalar, derinlemesine analizler ve reklamsız deneyim için uygulamamızı indirin.</p>
            <div className="cta-buttons">
              <button className="btn btn-primary">Hemen Başla</button>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>Daha Fazla Bilgi</button>
            </div>
          </div>
          <div className="cta-decoration"></div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="container">
          <p>&copy; 2024 Gazetelerde.com - Tüm Hakları Saklıdır.</p>
        </div>
      </footer>

      <style jsx>{`
        .feed-header {
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border);
        }

        .filters {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 8px;
            /* Hide scrollbar */
            scrollbar-width: none;
        }
        .filters::-webkit-scrollbar { display: none; }

        .filter-btn {
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 8px 16px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .filter-btn:hover {
            border-color: rgba(255,255,255,0.2);
            color: white;
            background: rgba(255,255,255,0.05);
        }

        .filter-btn.active {
            background: var(--text-main);
            color: black;
            border-color: var(--text-main);
            box-shadow: 0 0 15px rgba(255,255,255,0.2);
        }

        .grid-feed {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
        }

        @media (min-width: 768px) {
            .feed-header {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
            }
        }
        @media (max-width: 1200px) {
            .grid-feed { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
            .grid-feed { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
            .grid-feed { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
