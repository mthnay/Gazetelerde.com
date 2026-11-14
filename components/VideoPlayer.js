"use client";
import { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * Video oynatıcı "vitrin" ile: oynat'a basılana kadar YouTube/Vimeo hiç yüklenmez
 * (sayfa hızlı açılır, oynatılmadan üçüncü tarafa istek gitmez).
 */
export default function VideoPlayer({ video, title, poster }) {
    const [on, setOn] = useState(false);
    const thumb = poster || video.thumb;
    return (
        <div className={`video-frame ${video.vertical ? 'is-vertical' : ''}`}>
            {on ? (
                video.provider === 'file'
                    ? <video src={video.src} controls autoPlay playsInline poster={poster || undefined} title={title} />
                    : <iframe src={video.embed} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            ) : (
                <button type="button" className="video-facade" onClick={() => setOn(true)} aria-label={`Videoyu oynat: ${title}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb && <img src={thumb.startsWith('/media/') ? `${thumb}?w=1200` : thumb} alt="" />}
                    <span className="video-play"><Play size={34} fill="currentColor" aria-hidden="true" /></span>
                    {video.provider === 'youtube' && <span className="video-note">Oynatınca YouTube&apos;dan yüklenir</span>}
                </button>
            )}
        </div>
    );
}
