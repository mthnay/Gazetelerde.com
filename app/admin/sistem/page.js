import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canManageUsers } from '@/lib/permissions';
import { mailMode } from '@/lib/mail/mailer';
import { pushEnabled } from '@/lib/push';
import ErrorList from '@/components/admin/ErrorList';

export const metadata = { title: 'Sistem | Yönetim' };
export const dynamic = 'force-dynamic';

const JOBS = { rss: 'RSS tarama', bildirim: 'Bildirim kuyruğu', bulten: 'Bülten kuyruğu', temizlik: 'Günlük temizlik' };
const mb = (b) => `${Math.round(b / 1024 / 1024)} MB`;
const dur = (s) => { const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60); return `${d ? `${d} g ` : ''}${h} sa ${m} dk`; };
const ago = (iso) => { if (!iso) return '—'; const s = Math.round((Date.now() - new Date(iso)) / 1000); return s < 60 ? `${s} sn önce` : s < 3600 ? `${Math.round(s / 60)} dk önce` : `${Math.round(s / 3600)} sa önce`; };

async function collect(show) {
    const t0 = Date.now();
    let dbOk = true;
    try { await prisma.$queryRaw`SELECT 1`; } catch { dbOk = false; }
    const dbMs = Date.now() - t0;

    const [size, errors, openCount, last24, pendingMail, pendingPush, media] = await Promise.all([
        prisma.$queryRaw`SELECT COALESCE(SUM(pg_total_relation_size(c.oid)), 0)::bigint AS bytes FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = current_schema() AND c.relkind = 'r'`.catch(() => [{ bytes: 0n }]),
        prisma.errorEvent.findMany({ where: show === 'open' ? { resolved: false } : {}, orderBy: { lastSeen: 'desc' }, take: 100 }),
        prisma.errorEvent.count({ where: { resolved: false } }),
        prisma.errorEvent.aggregate({ where: { lastSeen: { gte: new Date(Date.now() - 86400000) } }, _sum: { count: true } }),
        prisma.newsletterDelivery.count({ where: { status: 'PENDING' } }),
        prisma.pushMessage.count({ where: { sentAt: null } }),
        prisma.media.aggregate({ _sum: { size: true }, _count: true }),
    ]);
    const day = new Date(Date.now() - 86400000);
    const [staffNo2fa, failed24, lockedEmails] = await Promise.all([
        prisma.user.findMany({ where: { role: { not: 'READER' }, totpEnabledAt: null }, select: { name: true, email: true, role: true, lastLoginAt: true } }),
        prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: day } } }),
        prisma.loginAttempt.groupBy({ by: ['email'], where: { success: false, createdAt: { gte: day } }, _count: true, orderBy: { _count: { email: 'desc' } }, take: 5 }),
    ]);
    return { dbOk, dbMs, size, errors, openCount, last24, pendingMail, pendingPush, media, staffNo2fa, failed24, lockedEmails };
}

export default async function SystemPage({ searchParams }) {
    await requirePageUser(canManageUsers);
    const show = (await searchParams).goster === 'tumu' ? 'all' : 'open';
    const { dbOk, dbMs, size, errors, openCount, last24, pendingMail, pendingPush, media, staffNo2fa, failed24, lockedEmails } = await collect(show);
    const mem = process.memoryUsage();
    const jobs = globalThis.__jobs || {};
    const limit = Number(process.env.MEMORY_LIMIT_MB) || 768;

    const cards = [
        ['Veritabanı', dbOk ? `${dbMs} ms` : 'ULAŞILAMIYOR', `${mb(Number(size[0]?.bytes || 0))} veri · ${media._count} görsel (${mb(media._sum.size || 0)})`, dbOk ? 'ok' : 'danger'],
        ['Bellek', mb(mem.rss), `sınır ~${limit} MB · yığın ${mb(mem.heapUsed)}`, mem.rss / 1024 / 1024 > limit * 0.85 ? 'danger' : 'ok'],
        ['Çalışma süresi', dur(process.uptime()), `Node ${process.version}`, 'ok'],
        ['Açık hata', String(openCount), `son 24 saatte ${last24._sum.count || 0} olay`, openCount ? 'warn' : 'ok'],
    ];

    return (
        <>
            <header className="admin-header">
                <div><h1>Sistem</h1><p>Sunucu sağlığı, arka plan işleri ve yakalanan hatalar. Dış izleme için <code>/api/health</code> adresini bir uptime servisine ekleyin.</p></div>
            </header>
            <div className="admin-stats">
                {cards.map(([label, value, sub, tone]) => (
                    <div key={label} className={`admin-panel admin-stat sys-${tone}`}>
                        <span className="label"><i className="sys-dot" />{label}</span>
                        <strong className="value" style={{ fontSize: '1.9rem' }}>{value}</strong>
                        <small className="sub">{sub}</small>
                    </div>
                ))}
            </div>

            <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <section className="admin-panel">
                    <h2 style={{ marginTop: 0 }}>Arka plan işleri</h2>
                    <table className="admin-table">
                        <thead><tr><th>İş</th><th>Son çalışma</th><th>Durum</th></tr></thead>
                        <tbody>
                            {Object.entries(JOBS).map(([k, label]) => {
                                const j = jobs[k];
                                return (
                                    <tr key={k}>
                                        <td style={{ fontWeight: 600 }}>{label}</td>
                                        <td className="muted">{j ? `${ago(j.at)} · ${j.ms} ms` : 'henüz çalışmadı'}</td>
                                        <td>{!j ? <span className="badge">Bekliyor</span> : j.ok ? <span className="badge ok">Çalışıyor</span> : <span className="badge danger" title={j.error}>Hata</span>}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
                <section className="admin-panel">
                    <h2 style={{ marginTop: 0 }}>Servisler</h2>
                    <ul className="admin-list">
                        <li className="admin-list-row"><span style={{ flex: 1 }}>E-posta gönderimi</span>{mailMode() === 'smtp' ? <span className="badge ok">SMTP bağlı</span> : mailMode() === 'outbox' ? <span className="badge warn">Geliştirme (dosyaya)</span> : <span className="badge danger">Yapılandırılmadı</span>}</li>
                        <li className="admin-list-row"><span style={{ flex: 1 }}>Web push bildirimleri</span>{pushEnabled() ? <span className="badge ok">Açık</span> : <span className="badge danger">VAPID anahtarı yok</span>}</li>
                        <li className="admin-list-row"><span style={{ flex: 1 }}>Kuyrukta bekleyen e-posta</span><strong>{pendingMail}</strong></li>
                        <li className="admin-list-row"><span style={{ flex: 1 }}>Kuyrukta bekleyen bildirim</span><strong>{pendingPush}</strong></li>
                        <li className="admin-list-row"><span style={{ flex: 1 }}>Site adresi</span><code>{process.env.NEXT_PUBLIC_SITE_URL || '—'}</code></li>
                    </ul>
                </section>
            </div>

            <section className="admin-panel" style={{ marginTop: 16 }}>
                <h2 style={{ marginTop: 0 }}>Güvenlik</h2>
                <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                        <strong>İki adımlı doğrulaması kapalı personel</strong>
                        {!staffNo2fa.length ? <p className="hint">Tüm personelde açık. ✓</p> : (
                            <ul className="admin-list">
                                {staffNo2fa.map((u) => <li key={u.email} className="admin-list-row"><span style={{ flex: 1 }}>{u.name}<small className="muted" style={{ display: 'block' }}>{u.email}</small></span><span className="badge warn">{u.role}</span></li>)}
                            </ul>
                        )}
                        <p className="hint">Her kullanıcı Profil → Hesap ve güvenlik bölümünden açabilir.</p>
                    </div>
                    <div>
                        <strong>Son 24 saatte {failed24} hatalı giriş denemesi</strong>
                        {lockedEmails.length > 0 && (
                            <ul className="admin-list">
                                {lockedEmails.map((l) => <li key={l.email} className="admin-list-row"><span style={{ flex: 1 }}>{l.email}</span><strong>{l._count}</strong></li>)}
                            </ul>
                        )}
                        <p className="hint">Bir hesaba 15 dakikada 8, bir IP adresinden 30 hatalı deneme olunca giriş 15 dakika kilitlenir.</p>
                    </div>
                </div>
            </section>

            <ErrorList show={show} errors={errors.map((e) => ({
                id: e.id, source: e.source, message: e.message, stack: e.stack, path: e.path, count: e.count, resolved: e.resolved,
                firstSeen: e.firstSeen.toISOString(), lastSeen: e.lastSeen.toISOString(),
            }))} />
        </>
    );
}
