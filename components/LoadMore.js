"use client";
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import NewsGrid from '@/components/NewsGrid';

// Liste sayfalarının devamını sayfa yenilemeden getirir. Sayfanın ilk hali önbellekten (ISR) gelmeye devam eder.
export default function LoadMore({ query, skip: initialSkip }) {
    const [items, setItems] = useState([]);
    const [skip, setSkip] = useState(initialSkip);
    const [hasMore, setHasMore] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        setBusy(true); setError('');
        const params = new URLSearchParams({ ...query, skip: String(skip), take: '12' });
        const d = await fetch(`/api/articles?${params}`).then((r) => r.json()).catch(() => null);
        setBusy(false);
        if (!d?.success) return setError('Haberler yüklenemedi, tekrar deneyin.');
        setItems((x) => [...x, ...d.items.filter((n) => !x.some((y) => y.id === n.id))]);
        setSkip((s) => s + d.items.length);
        setHasMore(d.hasMore);
    };

    return (
        <>
            {items.length > 0 && <div style={{ marginTop: 28 }}><NewsGrid items={items} summary /></div>}
            <div className="load-more">
                {error && <p className="field-hint" role="status">{error}</p>}
                {hasMore
                    ? <button type="button" className="btn" onClick={load} disabled={busy}>{busy ? <span className="spinner" /> : <ChevronDown size={16} />} Daha fazla haber</button>
                    : <p className="kicker kicker--plain">Hepsi bu kadar</p>}
            </div>
        </>
    );
}
