"use client";
import { Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/format';
import SmartImage from '@/components/SmartImage';

export default function NewsCard({ news }) {
    return (
        <div className="news-card">
            <div className="img-container">
                {news.img ? <SmartImage src={news.img} alt={news.title} sizes="(max-width: 600px) 100vw, (max-width: 1024px) 33vw, 300px" className="card-img" /> : <div className="img-fallback" />}
                <div className="category-tag">{news.categoryLabel || news.category}</div>
            </div>

            <div className="content">
                <h3>{news.title}</h3>
                <div className="meta">
                    <span className="time"><Clock size={14} /> {news.publishedAt ? formatDate(news.publishedAt) : ''}</span>
                    <span className="read-more">Oku <ArrowRight size={14} /></span>
                </div>
            </div>

            <style jsx>{`
        .news-card {
           background: var(--bg-card);
           border-radius: var(--radius);
           border: 1px solid var(--border);
           overflow: hidden;
           display: flex;
           flex-direction: column;
           transition: all 0.3s ease;
           cursor: pointer;
           height: 100%;
        }

        .news-card:hover {
           transform: translateY(-4px);
           border-color: rgba(255,255,255,0.15);
           box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .img-container {
           width: 100%;
           aspect-ratio: 16/9;
           overflow: hidden;
           position: relative;
        }

        .img-container :global(.card-img) {
           width: 100%;
           height: 100%;
           object-fit: cover;
           transition: transform 0.5s ease;
        }

        .news-card:hover .img-container :global(.card-img) {
           transform: scale(1.08); /* Subtle zoom */
        }
        
        .img-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, var(--bg-hover), var(--border)); }
        .category-tag {
           position: absolute;
           top: 12px;
           left: 12px;
           background: rgba(0,0,0,0.6);
           backdrop-filter: blur(4px);
           color: white;
           font-size: 10px;
           font-weight: 700;
           padding: 4px 8px;
           border-radius: 4px;
           text-transform: uppercase;
           border: 1px solid rgba(255,255,255,0.1);
        }

        .content {
           padding: 20px;
           display: flex;
           flex-direction: column;
           flex: 1;
           justify-content: space-between;
        }

        h3 {
           font-size: 1.1rem;
           font-weight: 700;
           line-height: 1.4;
           color: var(--text-main);
           margin-bottom: 16px;
           display: -webkit-box;
           -webkit-line-clamp: 2;
           -webkit-box-orient: vertical;
           overflow: hidden;
        }

        .meta {
           display: flex;
           align-items: center;
           justify-content: space-between;
           border-top: 1px solid rgba(255,255,255,0.05);
           padding-top: 12px;
        }

        .time {
           color: var(--text-muted);
           font-size: 12px;
           display: flex;
           align-items: center;
           gap: 6px;
        }

        .read-more {
           font-size: 12px;
           color: var(--primary);
           font-weight: 600;
           display: flex;
           align-items: center;
           gap: 4px;
           opacity: 0;
           transform: translateX(-10px);
           transition: all 0.3s ease;
        }

        .news-card:hover .read-more {
           opacity: 1;
           transform: translateX(0);
        }
      `}</style>
        </div>
    );
}
