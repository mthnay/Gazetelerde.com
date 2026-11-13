"use client";
import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

// Haberin solunda yapışık duran paylaşım düğmeleri
export default function ShareRail({ title }) {
    const [copied, setCopied] = useState(false);
    const url = () => window.location.href.split('#')[0];
    const open = (base) => window.open(base, '_blank', 'noopener,noreferrer,width=640,height=560');

    return (
        <>
            <span className="kicker kicker--plain" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginBottom: 6 }}>Paylaş</span>
            <button className="icon-btn" aria-label="X'te paylaş" title="X'te paylaş"
                onClick={() => open(`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.7L6.4 3.9H4.6L17.7 20Z" /></svg>
            </button>
            <button className="icon-btn" aria-label="WhatsApp'ta paylaş" title="WhatsApp'ta paylaş"
                onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" /></svg>
            </button>
            <button className="icon-btn" aria-label="Bağlantıyı kopyala" title="Bağlantıyı kopyala"
                onClick={async () => { try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* yoksay */ } }}>
                {copied ? <Check size={16} /> : <Link2 size={16} />}
            </button>
        </>
    );
}
