// Core Web Vitals: Google eşikleri ve p75 tahmini için histogram aralıkları (saf fonksiyonlar)
export const THRESHOLDS = {
    LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], FCP: [1800, 3000], TTFB: [800, 1800],
};
const MS_EDGES = [100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000, 15000];
const CLS_EDGES = [0.01, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25, 0.35, 0.5, 0.75, 1, 1.5, 2, 3];
export const BUCKETS = MS_EDGES.length + 1;
export const edgesFor = (metric) => (metric === 'CLS' ? CLS_EDGES : MS_EDGES);

export function rate(metric, value) {
    const [good, poor] = THRESHOLDS[metric];
    return value <= good ? 'good' : value <= poor ? 'ni' : 'poor';
}

export function bucketOf(metric, value) {
    const edges = edgesFor(metric);
    const i = edges.findIndex((e) => value <= e);
    return i === -1 ? edges.length : i;
}

// Histogramdan yüzdelik tahmini: ilgili aralığın üst sınırı (son aralıkta son sınır)
export function percentile(metric, buckets, p = 0.75) {
    const total = buckets.reduce((a, b) => a + (b || 0), 0);
    if (!total) return null;
    const edges = edgesFor(metric);
    let acc = 0;
    for (let i = 0; i < buckets.length; i++) {
        acc += buckets[i] || 0;
        if (acc / total >= p) return edges[Math.min(i, edges.length - 1)];
    }
    return edges[edges.length - 1];
}
