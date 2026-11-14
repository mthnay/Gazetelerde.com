import Link from 'next/link';
import { GUIDES } from '@/lib/guides';

export const metadata = { title: 'Voleybol Rehberi: Kurallar, Mevkiler, Rotasyon | Gazetelerde', description: 'Voleybolu yeni izlemeye başlayanlar için kurallar, mevkiler, rotasyon, libero ve lig puanlama sistemi.', alternates: { canonical: '/rehber' } };

export default function Guides() {
    return (
        <div className="container">
            <header className="page-hero">
                <Link href="/voleybol" className="kicker rise">Voleybol</Link>
                <h1 className="page-hero-title rise" style={{ '--i': 1, fontSize: 'clamp(44px, 8vw, 104px)' }}>Voleybol rehberi<span className="dot">.</span></h1>
                <p className="page-hero-desc rise" style={{ '--i': 2 }}>Maçı ilk kez izleyenler ve kuralları tazelemek isteyenler için.</p>
            </header>
            <ul className="guide-list">
                {GUIDES.map((g) => <li key={g.slug}><Link href={`/rehber/${g.slug}`}><strong>{g.title}</strong><span>{g.summary}</span></Link></li>)}
            </ul>
        </div>
    );
}
