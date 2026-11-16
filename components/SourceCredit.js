"use client";
import { useState } from 'react';

// Haberin altındaki kaynak satırı: sitenin simgesi (kaynaktan bağlantıyla yüklenir) + adı
export default function SourceCredit({ url, name, icon: iconUrl }) {
    const [icon, setIcon] = useState(true);
    let host = '';
    try { host = new URL(url).hostname; } catch { return null; }
    const label = name || host.replace(/^www\./, '');
    return (
        <p className="article-source">
            <span className="article-source__label">Kaynak:</span>
            <a href={url} target="_blank" rel="noopener noreferrer nofollow" title={`${label} sitesindeki haberin aslı`}>
                {icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={iconUrl || `https://${host}/favicon.ico`} alt="" width={16} height={16} loading="lazy" referrerPolicy="no-referrer" onError={() => setIcon(false)} className="article-source__icon" />
                )}
                {label}
            </a>
        </p>
    );
}
