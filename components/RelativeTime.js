"use client";
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/format';

// "12 dk önce" gibi göreli zaman. Sunucuda (önbellekli sayfada) mutlak tarih yazılır,
// tarayıcıda göreli zamana çevrilir; böylece önbellekteki sayfa "eskimiş" görünmez.
const rtf = typeof Intl !== 'undefined' ? new Intl.RelativeTimeFormat('tr', { numeric: 'auto' }) : null;

export function relative(iso, now = Date.now()) {
    const diff = (new Date(iso).getTime() - now) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return 'az önce';
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), 'day');
    return null;
}

export default function RelativeTime({ iso }) {
    const [text, setText] = useState(null);
    useEffect(() => {
        const tick = () => setText(relative(iso));
        tick();
        const t = setInterval(tick, 60000);
        return () => clearInterval(t);
    }, [iso]);
    return <time dateTime={iso} title={formatDate(iso)}>{text || formatDate(iso)}</time>;
}
