"use client";
import { Clock } from 'lucide-react';

export default function Stories() {
    const stories = [
        { id: 1, title: 'Son Dakika', img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=300', seen: false },
        { id: 2, title: 'Analiz', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=300', seen: false },
        { id: 3, title: 'Video', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=300', seen: true },
        { id: 4, title: 'Galeri', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=300', seen: false },
        { id: 5, title: 'Piyasa', img: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=300', seen: false },
        { id: 6, title: 'Podcast', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=300', seen: false },
        { id: 7, title: 'Infografik', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=300', seen: false },
    ];

    return (
        <section className="container" style={{ margin: '20px auto' }}>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                {stories.map(story => (
                    <div key={story.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '80px' }}>
                        <div style={{
                            width: '74px',
                            height: '74px',
                            borderRadius: '50%',
                            padding: '3px',
                            background: story.seen ? '#404040' : 'linear-gradient(45deg, #fbbf24, #d97706)'
                        }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '3px solid var(--background)'
                            }}>
                                <img src={story.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            </div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: story.seen ? '#737373' : 'white' }}>{story.title}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
