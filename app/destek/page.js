import Link from 'next/link';
import { Heart, ShieldCheck, EyeOff, Newspaper } from 'lucide-react';
import { prisma, buildSafe } from '@/lib/db';
import { company } from '@/lib/company';

export const revalidate = 300;
export const metadata = {
    title: 'Gazetelerde\'yi Destekleyin | Bağımsız haberciliğe katkı',
    description: 'Bağımsız ve reklamdan bağımsız haberciliği destekleyin; destekçilerimize reklamsız okuma.',
    alternates: { canonical: '/destek' },
};

const PERIOD = { tek: 'tek seferlik', aylik: '/ ay', yillik: '/ yıl' };
const tl = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);

export default async function Support() {
    const tiers = await buildSafe(() => prisma.supportTier.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { amount: 'asc' }] }), []);
    return (
        <div className="container">
            <header className="page-hero">
                <span className="kicker rise">Destek</span>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(44px, 8vw, 104px)' }}>Haberciliğe ortak olun<span className="dot">.</span></h1>
                <p className="page-hero-desc rise" style={{ '--i': 2 }}>Gazetelerde okurlarının desteğiyle büyüyor. Katkınız, doğru ve hızlı habercilik için muhabir, editör ve sunucu giderlerini karşılıyor.</p>
            </header>

            <ul className="support-perks">
                <li><EyeOff size={20} aria-hidden="true" /><span><strong>Reklamsız okuma</strong>Destekçi hesabınızla girdiğinizde sitede hiç reklam görmezsiniz.</span></li>
                <li><Newspaper size={20} aria-hidden="true" /><span><strong>Bağımsız habercilik</strong>Gelirimiz reklamverene değil, okura bağlı kalır.</span></li>
                <li><ShieldCheck size={20} aria-hidden="true" /><span><strong>Güvenli ödeme</strong>Ödeme, kart bilgilerinizi bizim görmediğimiz lisanslı ödeme kuruluşunda yapılır.</span></li>
            </ul>

            {!tiers.length ? (
                <div className="empty"><p className="display">Destek paketleri yakında</p><p>Şimdilik bize <a href={`mailto:${company.email}`}>{company.email}</a> adresinden ulaşabilirsiniz.</p></div>
            ) : (
                <div className="support-tiers">
                    {tiers.map((t, i) => (
                        <article key={t.id} className={`support-tier ${i === Math.min(1, tiers.length - 1) ? 'is-featured' : ''}`}>
                            <h2>{t.name}</h2>
                            <p className="support-price">{tl(t.amount)} <span>{PERIOD[t.period]}</span></p>
                            {t.description && <p className="support-desc">{t.description}</p>}
                            {t.adFree && <p className="support-note">✓ Reklamsız okuma</p>}
                            <a className="btn btn-primary btn-block" href={t.paymentUrl} target="_blank" rel="noopener noreferrer"><Heart size={16} /> Destek ol</a>
                        </article>
                    ))}
                </div>
            )}

            <section className="support-how">
                <h2 className="mc-title">Nasıl çalışır?</h2>
                <ol>
                    <li>Paketi seçip ödeme sayfasında işlemi tamamlayın.</li>
                    <li>Ödemede kullandığınız e-posta ile <Link href="/register">üye olun</Link> ya da <Link href="/login">giriş yapın</Link>.</li>
                    <li>Destekçiliğiniz en geç bir iş günü içinde hesabınıza tanımlanır; reklamsız okuma kendiliğinden başlar. Profilinizde durumunu görebilirsiniz.</li>
                </ol>
                <p className="field-hint">Aboneliği iptal etmek ya da iade için: <a href={`mailto:${company.email}`}>{company.email}</a>. Kişisel verileriniz <Link href="/gizlilik">gizlilik politikamıza</Link> göre işlenir.</p>
            </section>
        </div>
    );
}
