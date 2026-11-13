"use client";
import { useState } from 'react';
import Link from 'next/link';
import { formatDate, articleUrl } from '@/lib/format';
import SmartImage from '@/components/SmartImage';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, Zap, Activity, Globe } from 'lucide-react';

export default function HomeView({ allNews = [], categories = [], breaking = null, mostRead = null }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [nlStatus, setNlStatus] = useState('');
  const [email, setEmail] = useState('');

  const news = allNews.slice(0, 9);
  const filters = [{ slug: 'all', label: 'HEPSİ' }, ...categories];
  const filteredNews = activeFilter === 'all' ? news : allNews.filter(n => n.category === activeFilter);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNlStatus('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setNlStatus('Gönderiliyor…');
    const res = await fetch('/api/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setNlStatus(data?.message || (data?.success ? 'Teşekkürler!' : 'Bir hata oluştu, lütfen tekrar deneyin.'));
    if (data?.success) setEmail('');
  };

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

            <div className="content-wrapper">

        {/* HERO SECTION */}
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            {breaking && (
              <Link href={articleUrl(breaking)} className="badge-glow">
                <Zap size={16} fill="currentColor" /> SON DAKİKA: {breaking.title}
              </Link>
            )}
            <h1 className="hero-title">
              Geleceğin <span className="text-gradient">Haberciliği</span> <br />
              Burada Başlıyor.
            </h1>
            <p className="hero-subtitle">
              Doğru, tarafsız ve anlık haber akışı. Modern arayüz ile haber okuma deneyiminizi yeniden tanımlıyoruz.
            </p>
            <div className="hero-actions">
              <a href="#akis" className="btn-primary-glow">Keşfetmeye Başla</a>
              <Link href="/register" className="btn-outline">Ücretsiz Üye Ol</Link>
            </div>
          </motion.div>
        </section>

        {/* FILTERS & CONTENT */}
        <section className="feed-section" id="akis">
          <div className="feed-header">
            <div className="filters-scroll">
              {filters.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveFilter(cat.slug)}
                  className={`filter-pill ${activeFilter === cat.slug ? 'active' : ''}`}
                >
                  {cat.label}
                  {activeFilter === cat.slug && (
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
                  className={`news-card glass-panel ${item.featured && activeFilter === 'all' ? 'featured' : ''}`}
                >
                  <div className="card-image">
                    {item.img && <SmartImage src={item.img} alt={item.title} sizes={item.featured && activeFilter === 'all' ? '(max-width: 1024px) 100vw, 600px' : '(max-width: 1024px) 100vw, 380px'} priority={item.featured} className="card-img" />}
                    <div className="card-overlay"></div>
                    <span className="category-tag">{item.categoryLabel}</span>
                  </div>
                  <div className="card-content">
                    <div className="meta-row">
                      <span className="author">
                        <div className="avatar-xs">{item.author[0]}</div> {item.author}
                      </span>
                      <span className="time"><Clock size={12} /> {formatDate(item.publishedAt)}</span>
                    </div>
                    <Link href={articleUrl(item)}>
                      <h3>{item.title}</h3>
                    </Link>
                    <div className="card-footer">
                      <Link href={articleUrl(item)} className="read-more">Devamını Oku <ArrowRight size={14} /></Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredNews.length === 0 && (
              <div className="empty-feed">Bu kategoride henüz haber bulunmuyor.</div>
            )}
          </motion.div>
        </section>

        {mostRead && <section className="most-read-section">{mostRead}</section>}

        {/* NEWSLETTER SECTION */}
        <section className="newsletter-section">
          <div className="glass-panel newsletter-box">
            <div className="nl-content">
              <h2>Gündemi Kaçırma!</h2>
              <p>En önemli gelişmeler, her sabah 08:00&apos;de e-posta kutunda.</p>
              <form className="input-group" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="E-posta adresin..."
                  aria-label="E-posta adresi"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setNlStatus(''); }}
                  required
                />
                <button type="submit">Abone Ol</button>
              </form>
              {nlStatus && <p className="nl-status" role="status">{nlStatus}</p>}
            </div>
            <div className="nl-decoration">
              <Globe size={180} strokeWidth={0.5} />
            </div>
          </div>
        </section>

      </div>

      <style jsx global>{`
                .main-container {
                    --prim: var(--primary);
                    --glass-border: var(--border);
                    --glass-bg: var(--bg-card);
                    position: relative;
                    min-height: 100vh;
                    color: var(--text-main);
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
                    background: linear-gradient(135deg, var(--primary) 0%, #f97316 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    position: relative;
                }
                .hero-subtitle { font-size: 1.25rem; color: var(--text-muted); max-width: 600px; line-height: 1.6; }

                .hero-actions { display: flex; gap: 16px; margin-top: 16px; }
                .btn-primary-glow {
                    background: var(--prim); color: black; border: none; padding: 16px 32px; border-radius: 16px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s; text-decoration: none;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
                }
                .btn-primary-glow:hover { transform: translateY(-3px); box-shadow: 0 0 40px rgba(251, 191, 36, 0.6); }
                .btn-outline {
                    background: transparent; color: var(--text-main); border: 1px solid var(--border); padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.3s;
                    display: flex; align-items: center; gap: 8px;
                }
                .btn-outline:hover { background: var(--bg-hover); border-color: var(--text-main); }

                /* FEED SECTION */
                .feed-section { padding: 80px 0; }
                .feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid var(--glass-border); padding-bottom: 24px; }
                .filters-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 4px; }
                .filter-pill {
                    background: transparent; border: none; color: var(--text-muted); padding: 10px 20px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; position: relative; cursor: pointer; transition: 0.3s;
                }
                .filter-pill:hover { color: var(--text-main); }
                .filter-pill.active { color: black; }
                .active-bg { position: absolute; inset: 0; background: var(--prim); border-radius: 20px; z-index: -1; }

                .feed-meta { display: flex; align-items: center; gap: 8px; color: var(--prim); font-weight: 600; font-size: 0.9rem; }

                /* CARD GRID */
                .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
                
                .glass-panel {
                    background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 24px; overflow: hidden; backdrop-filter: blur(10px); transition: 0.4s;
                }
                .news-card:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.25); }

                .news-card.featured { grid-column: span 2; display: flex; align-items: stretch; }
                .news-card.featured .card-image { width: 50%; height: auto; min-height: 320px; }
                .news-card.featured .card-content { width: 50%; display: flex; flex-direction: column; justify-content: center; padding: 40px; }
                .news-card.featured h3 { font-size: 1.8rem; }

                .card-image { width: 100%; height: 240px; position: relative; overflow: hidden; }
                .card-image .card-img { transition: transform 0.5s; }
                .news-card:hover .card-image .card-img { transform: scale(1.05); }
                .card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); opacity: 0.6; }
                .category-tag { position: absolute; top: 16px; left: 16px; background: var(--prim); color: black; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }

                .card-content { padding: 24px; }
                .meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.8rem; color: var(--text-muted); }
                .author { display: flex; align-items: center; gap: 8px; }
                .avatar-xs { width: 24px; height: 24px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--text-main); font-size: 10px; }
                
                .news-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; line-height: 1.4; transition: 0.2s; }
                .news-card:hover h3 { color: var(--prim); }

                .card-footer { border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px; display: flex; justify-content: flex-end; }
                .read-more { background: none; border: none; color: var(--text-main); font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
                .read-more:hover { color: var(--prim); gap: 10px; }

                /* NEWSLETTER */
                .newsletter-section { padding: 60px 0; }
                .newsletter-box { padding: 60px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
                .nl-content { position: relative; z-index: 2; max-width: 500px; }
                .nl-content h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; }
                .nl-content p { color: var(--text-muted); margin-bottom: 32px; font-size: 1.1rem; }
                
                .input-group { display: flex; gap: 12px; }
                .input-group input { flex: 1; background: var(--bg-hover); border: 1px solid var(--border); padding: 16px 24px; border-radius: 12px; color: var(--text-main); font-size: 1rem; outline: none; transition: 0.3s; }
                .input-group input:focus { border-color: var(--prim); box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1); }
                .input-group button { background: var(--text-main); color: var(--bg-main); border: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .input-group button:hover { background: var(--prim); color: black; transform: translateY(-2px); }

                .nl-decoration { position: absolute; right: -50px; bottom: -50px; opacity: 0.1; transform: rotate(-15deg); }

                .badge-glow { text-decoration: none; max-width: 100%; }
                .most-read-section { padding: 20px 0 40px; max-width: 760px; }
                [data-theme='light'] .badge-glow { color: #92400e; background: rgba(251, 191, 36, 0.25); }
                .btn-outline { justify-content: center; }
                .empty-feed { grid-column: 1 / -1; padding: 60px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 24px; }
                .nl-status { margin-top: 12px !important; margin-bottom: 0 !important; font-size: 0.95rem !important; color: var(--primary) !important; }
                .news-card h3 a, .news-card > a { color: inherit; }

                @media (max-width: 1024px) {
                    .hero-title { font-size: 3rem; }
                    .news-grid { grid-template-columns: 1fr; }
                    .news-card.featured { grid-column: span 1; flex-direction: column; }
                    .news-card.featured .card-image, .news-card.featured .card-content { width: 100%; }
                    .newsletter-box { flex-direction: column; text-align: center; gap: 40px; }
                    .input-group { flex-direction: column; width: 100%; }
                }
                @media (max-width: 600px) {
                    .hero-title { font-size: 2.25rem; }
                    .hero-actions { flex-direction: column; width: 100%; }
                    .newsletter-box { padding: 32px 20px; }
                    .nl-content h2 { font-size: 1.8rem; }
                    .feed-header { flex-direction: column; align-items: flex-start; gap: 16px; }
                    .filters-scroll { max-width: 100%; }
                }
            `}</style>
    </div>
  );
}
