import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { istanbulDay } from '@/lib/analytics';
import { THRESHOLDS, percentile, BUCKETS } from '@/lib/vitals';

export const metadata = { title: 'İstatistik | Yönetim' };

const RANGES = { 7: 'Son 7 gün', 30: 'Son 30 gün', 90: 'Son 90 gün' };
const KIND = { haber: 'Haber', anasayfa: 'Ana sayfa', kategori: 'Kategori', etiket: 'Konu', arama: 'Arama', diger: 'Diğer' };
const SOURCE = {
    dogrudan: 'Doğrudan', 'site-ici': 'Site içi', google: 'Google', 'google-haberler': 'Google Haberler', bing: 'Bing', yandex: 'Yandex',
    facebook: 'Facebook', instagram: 'Instagram', x: 'X (Twitter)', whatsapp: 'WhatsApp', telegram: 'Telegram', bulten: 'Bülten (e-posta)',
    'e-posta': 'E-posta', push: 'Bildirim', linkedin: 'LinkedIn', reddit: 'Reddit', duckduckgo: 'DuckDuckGo',
};
const DAY = 24 * 60 * 60 * 1000;
const n = (x) => new Intl.NumberFormat('tr-TR').format(x || 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const VITALS = [
    ['LCP', 'En büyük içerik (LCP)', 'Ana görselin / başlığın görünmesi', 'ms'],
    ['INP', 'Etkileşim gecikmesi (INP)', 'Tıklamaya tepki süresi', 'ms'],
    ['CLS', 'Görsel kayma (CLS)', 'Sayfanın yüklenirken kayması', ''],
    ['FCP', 'İlk içerik (FCP)', 'İlk metnin görünmesi', 'ms'],
    ['TTFB', 'Sunucu yanıtı (TTFB)', 'İlk baytın gelmesi', 'ms'],
];
const fmtV = (m, v) => (v == null ? '—' : m === 'CLS' ? v.toFixed(2) : v >= 1000 ? `${(v / 1000).toFixed(1)} sn` : `${v} ms`);

// Günlük histogramları birleştirip p75 ve iyi/orta/kötü oranlarını hesaplar
function summarizeVitals(rows, metric, device) {
    const sel = rows.filter((r) => r.metric === metric && (!device || r.device === device));
    const buckets = Array(BUCKETS).fill(0);
    let good = 0, ni = 0, poor = 0;
    for (const r of sel) { good += r.good; ni += r.ni; poor += r.poor; r.buckets.forEach((v, i) => { buckets[i] += v || 0; }); }
    const n = good + ni + poor;
    return { n, p75: percentile(metric, buckets), good: n ? good / n : 0, ni: n ? ni / n : 0, poor: n ? poor / n : 0 };
}

function VitalCard({ metric, label, hint, rows }) {
    const [goodT, poorT] = THRESHOLDS[metric];
    const all = summarizeVitals(rows, metric);
    const tone = all.p75 == null ? '' : all.p75 <= goodT ? 'ok' : all.p75 <= poorT ? 'warn' : 'danger';
    return (
        <div className={`admin-panel vital-card vital-${tone}`}>
            <span className="label">{label}</span>
            <strong className="value" style={{ fontSize: '1.8rem' }}>{fmtV(metric, all.p75)}</strong>
            <span className="sub">{hint} · iyi ≤ {fmtV(metric, goodT)}</span>
            {all.n > 0 && (
                <>
                    <div className="vital-bar" role="img" aria-label={`%${Math.round(all.good * 100)} iyi, %${Math.round(all.ni * 100)} orta, %${Math.round(all.poor * 100)} kötü`}>
                        <i className="g" style={{ width: `${all.good * 100}%` }} /><i className="n" style={{ width: `${all.ni * 100}%` }} /><i className="p" style={{ width: `${all.poor * 100}%` }} />
                    </div>
                    <span className="sub">Mobil {fmtV(metric, summarizeVitals(rows, metric, 'mobil').p75)} · Masaüstü {fmtV(metric, summarizeVitals(rows, metric, 'masaustu').p75)} · {all.n} ölçüm</span>
                </>
            )}
        </div>
    );
}

function Bars({ rows, total }) {
    if (!rows.length) return <p className="hint">Bu aralıkta veri yok.</p>;
    const max = Math.max(...rows.map((r) => r.value), 1);
    return (
        <div className="admin-bars">
            {rows.map((r) => (
                <div key={r.label} className="admin-bar-row">
                    <span title={r.label}>{r.label}</span>
                    <div className="admin-bar-track"><div className="admin-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></div>
                    <strong>{n(r.value)}{total ? <small className="muted"> %{pct(r.value, total)}</small> : null}</strong>
                </div>
            ))}
        </div>
    );
}

export default async function Stats({ searchParams }) {
    await requirePageUser(canPublish);
    const days = RANGES[(await searchParams).gun] ? Number((await searchParams).gun) : 7;
    const today = istanbulDay();
    const from = new Date(today.getTime() - (days - 1) * DAY);
    const prevFrom = new Date(from.getTime() - days * DAY);

    const [byDay, prevTotal, bySource, byDevice, byKind, topArticles, readsByDay, subs, newSubs, pushSubs, issues, vitals] = await Promise.all([
        prisma.pageDailyStat.groupBy({ by: ['day'], where: { day: { gte: from } }, _sum: { views: true } }),
        prisma.pageDailyStat.aggregate({ where: { day: { gte: prevFrom, lt: from } }, _sum: { views: true } }),
        prisma.pageDailyStat.groupBy({ by: ['source'], where: { day: { gte: from }, source: { not: 'site-ici' } }, _sum: { views: true }, orderBy: { _sum: { views: 'desc' } }, take: 12 }),
        prisma.pageDailyStat.groupBy({ by: ['device'], where: { day: { gte: from } }, _sum: { views: true } }),
        prisma.pageDailyStat.groupBy({ by: ['kind'], where: { day: { gte: from } }, _sum: { views: true }, orderBy: { _sum: { views: 'desc' } } }),
        prisma.articleDailyStat.groupBy({ by: ['articleId'], where: { day: { gte: from } }, _sum: { views: true }, orderBy: { _sum: { views: 'desc' } }, take: 15 }),
        prisma.articleDailyStat.groupBy({ by: ['day'], where: { day: { gte: from } }, _sum: { views: true } }),
        prisma.subscriber.count({ where: { active: true, confirmedAt: { not: null } } }),
        prisma.subscriber.count({ where: { confirmedAt: { gte: from } } }),
        prisma.pushSubscription.count(),
        prisma.newsletterIssue.findMany({ where: { status: 'SENT', sentAt: { gte: from } }, select: { sentCount: true } }),
        prisma.vitalDaily.findMany({ where: { day: { gte: from } } }),
    ]);

    const arts = await prisma.article.findMany({
        where: { id: { in: topArticles.map((a) => a.articleId) } },
        select: { id: true, title: true, slug: true, publishedAt: true, category: { select: { label: true } } },
    });
    const artById = new Map(arts.map((a) => [a.id, a]));

    // Kategori dağılımı: en çok okunanların kategorileri değil, aralıktaki tüm okunmaların toplamı
    const catRows = await prisma.$queryRaw`
        SELECT c.label, SUM(s.views)::int AS views FROM "ArticleDailyStat" s
        JOIN "Article" a ON a.id = s."articleId" JOIN "Category" c ON c.id = a."categoryId"
        WHERE s.day >= ${from} GROUP BY c.label ORDER BY views DESC`;

    const series = Array.from({ length: days }, (_, i) => {
        const d = new Date(from.getTime() + i * DAY);
        const key = d.toISOString().slice(0, 10);
        const v = byDay.find((x) => x.day.toISOString().slice(0, 10) === key)?._sum.views || 0;
        const r = readsByDay.find((x) => x.day.toISOString().slice(0, 10) === key)?._sum.views || 0;
        return { key, d, v, r };
    });
    const total = series.reduce((s, x) => s + x.v, 0);
    const reads = series.reduce((s, x) => s + x.r, 0);
    const prev = prevTotal._sum.views || 0;
    const change = prev ? Math.round(((total - prev) / prev) * 100) : null;
    const max = Math.max(...series.map((x) => x.v), 1);
    const sourceTotal = bySource.reduce((s, x) => s + (x._sum.views || 0), 0);
    const mobile = byDevice.find((x) => x.device === 'mobil')?._sum.views || 0;
    const fmtDay = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

    return (
        <>
            <header className="admin-header">
                <div><h1>İstatistik</h1><p>Çerezsiz ve kişisel veri tutmadan toplanan okunma verileri. Botlar ve “izleme” istemeyen tarayıcılar sayılmaz.</p></div>
            </header>
            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    {Object.entries(RANGES).map(([k, label]) => (
                        <Link key={k} href={`/admin/istatistik?gun=${k}`} className={`admin-tab ${days === Number(k) ? 'active' : ''}`}>{label}</Link>
                    ))}
                </nav>
            </div>

            <div className="admin-stats">
                <div className="admin-panel admin-stat"><span className="label">Sayfa görüntüleme</span><strong className="value">{n(total)}</strong>
                    {change !== null && <small className={`sub ${change >= 0 ? 'up' : 'down'}`}>{change >= 0 ? '▲' : '▼'} %{Math.abs(change)} önceki döneme göre</small>}</div>
                <div className="admin-panel admin-stat"><span className="label">Haber okunması</span><strong className="value">{n(reads)}</strong></div>
                <div className="admin-panel admin-stat"><span className="label">Mobil oranı</span><strong className="value">%{pct(mobile, total)}</strong></div>
                <div className="admin-panel admin-stat"><span className="label">Bülten abonesi</span><strong className="value">{n(subs)}</strong><small className="sub">+{n(newSubs)} bu dönemde · {issues.length} sayı, {n(issues.reduce((s, i) => s + i.sentCount, 0))} e-posta</small></div>
                <div className="admin-panel admin-stat"><span className="label">Bildirim abonesi</span><strong className="value">{n(pushSubs)}</strong></div>
            </div>

            <section className="admin-panel">
                <h2 style={{ marginTop: 0 }}>Günlük görüntüleme</h2>
                <div className="st-chart" role="img" aria-label={`${days} günlük görüntüleme grafiği`}>
                    {series.map((x) => (
                        <div key={x.key} className="st-col" title={`${fmtDay.format(x.d)}: ${n(x.v)} görüntüleme, ${n(x.r)} haber okunması`}>
                            <div className="st-bar" style={{ height: `${(x.v / max) * 100}%` }}><div className="st-bar-in" style={{ height: `${x.v ? (x.r / x.v) * 100 : 0}%` }} /></div>
                            <span>{days <= 14 || x.d.getUTCDate() % 5 === 1 ? fmtDay.format(x.d) : ''}</span>
                        </div>
                    ))}
                </div>
                <p className="hint" style={{ marginTop: 8 }}><span className="st-key" /> Tüm sayfalar <span className="st-key in" /> Haber okunması</p>
            </section>

            <section style={{ marginBottom: 16 }}>
                <h2>Gerçek kullanıcı hızı <small className="hint" style={{ fontWeight: 400 }}>(okurların tarayıcılarından, %75&apos;lik dilim — Google sıralamasında kullanılan ölçü)</small></h2>
                {!vitals.length ? <p className="hint">Henüz ölçüm yok; okurlar siteyi gezdikçe birikir.</p> : (
                    <div className="admin-stats">{VITALS.map(([m, l, h]) => <VitalCard key={m} metric={m} label={l} hint={h} rows={vitals} />)}</div>
                )}
            </section>

            <div className="admin-grid-2">
                <section className="admin-panel">
                    <h2 style={{ marginTop: 0 }}>En çok okunan haberler</h2>
                    {!topArticles.length ? <p className="hint">Bu aralıkta okunma yok.</p> : (
                        <ol className="admin-list" style={{ paddingLeft: 18 }}>
                            {topArticles.map((t) => {
                                const a = artById.get(t.articleId);
                                return a && (
                                    <li key={t.articleId} className="admin-list-row">
                                        <a href={`/haber/${a.slug}`} target="_blank" rel="noreferrer" style={{ flex: 1 }}>{a.title}<small className="muted" style={{ display: 'block' }}>{a.category.label}</small></a>
                                        <strong>{n(t._sum.views)}</strong>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </section>
                <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
                    <section className="admin-panel">
                        <h2 style={{ marginTop: 0 }}>Okurlar nereden geliyor</h2>
                        <Bars total={sourceTotal} rows={bySource.map((s) => ({ label: SOURCE[s.source] || s.source, value: s._sum.views || 0 }))} />
                    </section>
                    <section className="admin-panel">
                        <h2 style={{ marginTop: 0 }}>Kategoriler (haber okunması)</h2>
                        <Bars total={reads} rows={catRows.map((c) => ({ label: c.label, value: c.views }))} />
                    </section>
                    <section className="admin-panel">
                        <h2 style={{ marginTop: 0 }}>Sayfa türleri</h2>
                        <Bars total={total} rows={byKind.map((k) => ({ label: KIND[k.kind] || k.kind, value: k._sum.views || 0 }))} />
                    </section>
                </div>
            </div>
        </>
    );
}
