"use client";

export default function Hero() {
    const heroNews = [
        {
            id: 1,
            title: "Türkiye'nin Teknoloji Hamlesi: Yeni Yongalar Seri Üretime Geçiyor",
            desc: "Savunma sanayiinden sonra şimdi de mikroçip devrimi başlıyor. Yerli üretim tesisleri açıldı.",
            category: "TEKNOLOJİ",
            img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop"
        },
        {
            id: 2,
            title: "Küresel Piyasalar Hareketli: Kripto Paralarda Sert Düşüş",
            category: "EKONOMİ",
            img: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1200&auto=format&fit=crop"
        },
        {
            id: 3,
            title: "Şampiyonlar Ligi Finali İstanbul'da: Hazırlıklar Tamamlandı",
            category: "SPOR",
            img: "https://images.unsplash.com/photo-1522770179533-24471fcdba45?q=80&w=1200&auto=format&fit=crop"
        },
    ];

    return (
        <section className="container animate-fade-in" style={{ marginTop: '40px', marginBottom: '60px' }}>
            <div className="hero-wrapper">

                {/* BIG CARD */}
                <div className="hero-main glass-card">
                    <img src={heroNews[0].img} alt="" className="zoom-img" />
                    <div className="content-overlay">
                        <span className="badge">{heroNews[0].category}</span>
                        <h1 className="main-title">{heroNews[0].title}</h1>
                        <p className="main-desc">{heroNews[0].desc}</p>
                    </div>
                </div>

                {/* SIDE CARDS */}
                <div className="hero-side">
                    {heroNews.slice(1).map(item => (
                        <div key={item.id} className="hero-sub glass-card">
                            <img src={item.img} alt="" className="zoom-img" />
                            <div className="content-overlay small-overlay">
                                <span className="badge compact">{item.category}</span>
                                <h3 className="sub-title">{item.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            <style jsx>{`
        .hero-wrapper {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          height: 550px;
        }

        .glass-card {
           position: relative;
           border-radius: var(--radius);
           overflow: hidden;
           background: var(--bg-card);
           border: 1px solid var(--border);
           cursor: pointer;
        }

        .zoom-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover .zoom-img {
          transform: scale(1.05);
        }

        .content-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.95) 10%, rgba(9,9,11,0.5) 60%, transparent 100%);
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          height: 100%;
          pointer-events: none; /* Let clicks pass to card */
        }

        .badge {
          background: var(--primary);
          color: black;
          font-weight: 700;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 6px;
          letter-spacing: 1px;
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .badge.compact {
           padding: 4px 8px;
           margin-bottom: 10px;
        }

        .main-title {
          font-size: 2.75rem;
          margin-bottom: 12px;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
          color: white;
        }

        .main-desc {
          color: #d1d5db;
          font-size: 1.1rem;
          line-height: 1.5;
          max-width: 90%;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hero-side {
          display: grid;
          grid-template-rows: 1fr 1fr;
          gap: 24px;
        }

        .sub-title {
          font-size: 1.35rem;
          color: white;
          text-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }

        .small-overlay {
          padding: 24px;
        }

        @media (max-width: 900px) {
          .hero-wrapper {
            grid-template-columns: 1fr;
            grid-template-rows: 400px 1fr; /* Stack */
            height: auto;
          }
          .hero-side {
             grid-template-columns: 1fr 1fr;
             grid-template-rows: 250px;
          }
          .main-title { font-size: 1.8rem; }
        }

        @media (max-width: 600px) {
          .hero-side {
             grid-template-columns: 1fr;
          }
        }
      `}</style>
        </section>
    );
}
