"use client";
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ArrowRight, Clock, Star, Zap, ChevronRight,
  Play, Activity, Globe, Shield
} from 'lucide-react';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('HEPSİ');
  const [email, setEmail] = useState('');

  const categories = ['HEPSİ', 'TEKNOLOJİ', 'EKONOMİ', 'SPOR', 'KÜLTÜR', 'SEYAHAT', 'BİLİM'];

  const news = [
    { id: 1, title: "Yapay Zeka Devrimi: İnsanlık İçin Yeni Bir Çağ mı?", category: "TEKNOLOJİ", author: "Mert H.", time: "10 dk önce", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800", featured: true },
    { id: 2, title: "Global Piyasalarda Rüzgar Tersine Döndü", category: "EKONOMİ", author: "Selin Y.", time: "1 saat önce", img: "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=800" },
    { id: 3, title: "İstanbul Maratonu'nda Rekor Katılım", category: "SPOR", author: "Can A.", time: "2 saat önce", img: "https://images.unsplash.com/photo-1552674605-5d28c4e1902c?q=80&w=800" },
    { id: 4, title: "Mars Kolonisi İçin İlk Adımlar Atılıyor", category: "BİLİM", author: "Elif K.", time: "3 saat önce", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800" },
    { id: 5, title: "Elektrikli Araçlar İçin Yeni Batarya Teknolojisi", category: "OTOMOBİL", author: "Teknoloji Ed.", time: "4 saat önce", img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800" },
    { id: 6, title: "Ödüllü Filmler Festivali Başlıyor", category: "KÜLTÜR", author: "Sanat E.", time: "5 saat önce", img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800" },
  ];

  const filteredNews = activeFilter === 'HEPSİ' ? news : news.filter(n => n.category === activeFilter);

  // Varians
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <div className="main-container">
      {/* Animated Background Blobs */}
      <div className="blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="glass-overlay"></div>

      {/* Navbar Placeholder (Assuming Layout handles it, but creating a spacer or transparent header effect) */}
      <div className="content-wrapper">

        {/* HERO SECTION */}
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            <div className="badge-glow">
              <Zap size={16} fill="currentColor" /> SON DAKİKA: Teknoloji Zirvesi Başladı
            </div>
            <h1 className="hero-title">
              Geleceğin <span className="text-gradient">Haberciliği</span> <br />
              Burada Başlıyor.
            </h1>
            <p className="hero-subtitle">
              Doğru, tarafsız ve anlık haber akışı. Modern arayüz ile haber okuma deneyiminizi yeniden tanımlıyoruz.
            </p>
            <div className="hero-actions">
              <button className="btn-primary-glow">Keşfetmeye Başla</button>
              <button className="btn-outline">
                <Play size={16} fill="currentColor" /> Tanıtımı İzle
              </button>
            </div>
          </motion.div>
        </section>

        {/* FILTERS & CONTENT */}
        <section className="feed-section">
          <div className="feed-header">
            <div className="filters-scroll">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`filter-pill ${activeFilter === cat ? 'active' : ''}`}
                >
                  {cat}
                  {activeFilter === cat && (
                    <motion.div layoutId="activeFilter" className="active-bg" />
                  )}
                </button>
              ))}
            </div>
            <div className="feed-meta">
              <Activity size={18} color="#fbbf24" />
              <span>Canlı Akış</span>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="news-grid"
          >
            <AnimatePresence mode="popLayout">
              {filteredNews.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  variants={itemVariants}
                  className={`news-card glass-panel ${item.featured ? 'featured' : ''}`}
                >
                  <div className="card-image">
                    <img src={item.img} alt={item.title} />
                    <div className="card-overlay"></div>
                    <span className="category-tag">{item.category}</span>
                  </div>
                  <div className="card-content">
                    <div className="meta-row">
                      <span className="author">
                        <div className="avatar-xs">{item.author[0]}</div> {item.author}
                      </span>
                      <span className="time"><Clock size={12} /> {item.time}</span>
                    </div>
                    <Link href={`/news/${item.id}`}>
                      <h3>{item.title}</h3>
                    </Link>
                    <div className="card-footer">
                      <button className="read-more">Devamını Oku <ArrowRight size={14} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* NEWSLETTER SECTION */}
        <section className="newsletter-section">
          <div className="glass-panel newsletter-box">
            <div className="nl-content">
              <h2>Gündemi Kaçırma!</h2>
              <p>En önemli gelişmeler, her sabah 08:00'de e-posta kutunda.</p>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="E-posta adresin..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button>Abone Ol</button>
              </div>
            </div>
            <div className="nl-decoration">
              <Globe size={180} strokeWidth={0.5} />
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2026 Gazetelerde.com · Geleceğin Medyası</p>
            <div className="footer-links">
              <a href="#">Gizlilik</a>
              <a href="#">Künye</a>
              <a href="#">İletişim</a>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
                :root {
                    --prim: #fbbf24;
                    --bg-dark: #050505;
                    --glass-border: rgba(255, 255, 255, 0.08);
                    --glass-bg: rgba(20, 20, 23, 0.6);
                    --glass-hover: rgba(255, 255, 255, 0.08);
                }

                body {
                    background: var(--bg-dark);
                    color: white;
                    font-family: 'Inter', sans-serif;
                    overflow-x: hidden;
                }

                .main-container {
                    position: relative;
                    min-height: 100vh;
                }

                /* ANIMATED BLOBS */
                .blobs { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
                .blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.3; animation: float 10s infinite ease-in-out; }
                .blob-1 { width: 600px; height: 600px; background: #4f46e5; top: -200px; left: -100px; }
                .blob-2 { width: 500px; height: 500px; background: #c026d3; bottom: -100px; right: -100px; animation-delay: 2s; }
                .blob-3 { width: 400px; height: 400px; background: var(--prim); top: 40%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; animation-delay: 4s; }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -40px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                .glass-overlay { position: fixed; inset: 0; backdrop-filter: blur(80px); z-index: 0; pointer-events: none; opacity: 0.6; }

                .content-wrapper { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 24px; }

                /* HERO */
                .hero-section {
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding-top: 40px;
                }
                .hero-content {
                    max-width: 800px;
                    display: flex; flex-direction: column; align-items: center; gap: 24px;
                }
                .badge-glow {
                    background: rgba(251, 191, 36, 0.1);
                    color: var(--prim);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex; align-items: center; gap: 8px;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.1);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }

                .hero-title {
                    font-size: 4.5rem;
                    font-weight: 900;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                }
                .text-gradient {
                    background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    position: relative;
                }
                .hero-subtitle { font-size: 1.25rem; color: #a1a1aa; max-width: 600px; line-height: 1.6; }

                .hero-actions { display: flex; gap: 16px; margin-top: 16px; }
                .btn-primary-glow {
                    background: var(--prim); color: black; border: none; padding: 16px 32px; border-radius: 16px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
                }
                .btn-primary-glow:hover { transform: translateY(-3px); box-shadow: 0 0 40px rgba(251, 191, 36, 0.6); }
                .btn-outline {
                    background: transparent; color: white; border: 1px solid rgba(255,255,255,0.2); padding: 16px 32px; border-radius: 16px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.3s;
                    display: flex; align-items: center; gap: 8px;
                }
                .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

                /* FEED SECTION */
                .feed-section { padding: 80px 0; }
                .feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid var(--glass-border); padding-bottom: 24px; }
                .filters-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 4px; }
                .filter-pill {
                    background: transparent; border: none; color: #a1a1aa; padding: 10px 20px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; position: relative; cursor: pointer; transition: 0.3s;
                }
                .filter-pill:hover { color: white; }
                .filter-pill.active { color: black; }
                .active-bg { position: absolute; inset: 0; background: var(--prim); border-radius: 20px; z-index: -1; }

                .feed-meta { display: flex; align-items: center; gap: 8px; color: var(--prim); font-weight: 600; font-size: 0.9rem; }

                /* CARD GRID */
                .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
                
                .glass-panel {
                    background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 24px; overflow: hidden; backdrop-filter: blur(10px); transition: 0.4s;
                }
                .news-card:hover { transform: translateY(-10px); border-color: rgba(255,255,255,0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

                .news-card.featured { grid-column: span 2; display: flex; align-items: stretch; }
                .news-card.featured .card-image { width: 50%; height: auto; }
                .news-card.featured .card-content { width: 50%; display: flex; flex-direction: column; justify-content: center; padding: 40px; }
                .news-card.featured h3 { font-size: 1.8rem; }

                .card-image { width: 100%; height: 240px; position: relative; overflow: hidden; }
                .card-image img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .news-card:hover .card-image img { transform: scale(1.05); }
                .card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); opacity: 0.6; }
                .category-tag { position: absolute; top: 16px; left: 16px; background: var(--prim); color: black; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }

                .card-content { padding: 24px; }
                .meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.8rem; color: #a1a1aa; }
                .author { display: flex; align-items: center; gap: 8px; }
                .avatar-xs { width: 24px; height: 24px; background: #3f3f46; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 10px; }
                
                h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; line-height: 1.4; transition: 0.2s; }
                .news-card:hover h3 { color: var(--prim); }

                .card-footer { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px; display: flex; justify-content: flex-end; }
                .read-more { background: none; border: none; color: white; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
                .read-more:hover { color: var(--prim); gap: 10px; }

                /* NEWSLETTER */
                .newsletter-section { padding: 60px 0; }
                .newsletter-box { padding: 60px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
                .nl-content { position: relative; z-index: 2; max-width: 500px; }
                .nl-content h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; }
                .nl-content p { color: #a1a1aa; margin-bottom: 32px; font-size: 1.1rem; }
                
                .input-group { display: flex; gap: 12px; }
                .input-group input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px 24px; border-radius: 12px; color: white; font-size: 1rem; outline: none; transition: 0.3s; }
                .input-group input:focus { border-color: var(--prim); box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1); }
                .input-group button { background: white; color: black; border: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .input-group button:hover { background: var(--prim); transform: translateY(-2px); }

                .nl-decoration { position: absolute; right: -50px; bottom: -50px; opacity: 0.1; transform: rotate(-15deg); }

                /* FOOTER */
                .footer { border-top: 1px solid var(--glass-border); padding: 60px 0; margin-top: 60px; text-align: center; color: #52525b; }
                .footer-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
                .footer-links { display: flex; gap: 24px; }
                .footer-links a { color: #52525b; text-decoration: none; transition: 0.2s; }
                .footer-links a:hover { color: var(--prim); }

                @media (max-width: 1024px) {
                    .hero-title { font-size: 3rem; }
                    .news-grid { grid-template-columns: 1fr; }
                    .news-card.featured { grid-column: span 1; flex-direction: column; }
                    .news-card.featured .card-image, .news-card.featured .card-content { width: 100%; }
                    .newsletter-box { flex-direction: column; text-align: center; gap: 40px; }
                    .input-group { flex-direction: column; width: 100%; }
                    .footer-content { flex-direction: column; gap: 24px; }
                }
            `}</style>
    </div>
  );
}
