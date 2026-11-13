"use client";
import NewsCard from "@/components/NewsCard";
import Link from 'next/link';
import { articleUrl } from '@/lib/format';

export default function CategoryView({ catInfo, filteredNews, followButton = null }) {

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>

            {/* Category Header */}
            <div className="cat-header animate-fade-in">
                <span className="cat-subtitle">KATEGORİ</span>
                <h1 className="cat-title">{catInfo.label}</h1>
                <p className="cat-desc">{catInfo.description}</p>
                {followButton && <div style={{ marginTop: '24px' }}>{followButton}</div>}
            </div>

            {/* News Grid */}
            <div className="grid-feed animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {filteredNews.length > 0 ? (
                    filteredNews.map(news => (
                        <Link key={news.id} href={articleUrl(news)} style={{ display: 'contents' }}>
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
