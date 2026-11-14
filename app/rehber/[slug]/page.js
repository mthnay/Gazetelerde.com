import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES, getGuide } from '@/lib/guides';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

export function generateStaticParams() {
    return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
    const g = getGuide((await params).slug);
    if (!g) return {};
    return { title: `${g.title} | Gazetelerde`, description: g.summary, alternates: { canonical: `/rehber/${g.slug}` } };
}

export default async function Guide({ params }) {
    const g = getGuide((await params).slug);
    if (!g) notFound();
    const jsonLd = [
        { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.summary, url: absoluteUrl(`/rehber/${g.slug}`), publisher: { '@type': 'Organization', name: SITE_NAME } },
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ];
    const others = GUIDES.filter((x) => x.slug !== g.slug);
    return (
        <article className="container" style={{ maxWidth: 820 }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <header className="page-hero">
                <nav className="kicker" aria-label="Konum"><Link href="/voleybol">Voleybol</Link> / <Link href="/rehber">Rehber</Link></nav>
                <h1 className="page-hero-title" style={{ fontSize: 'clamp(34px, 5.5vw, 64px)', lineHeight: 1.05 }}>{g.title}</h1>
                <p className="page-hero-desc">{g.summary}</p>
            </header>
            <div className="article-body">
                {g.sections.map((s) => (
                    <section key={s.h}>
                        <h2>{s.h}</h2>
                        {s.p.map((p) => <p key={p.slice(0, 30)}>{p}</p>)}
                    </section>
                ))}
                <h2>Sık sorulanlar</h2>
                {g.faq.map((f) => <details key={f.q} className="faq"><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
            <aside className="mc-section" aria-label="Diğer rehberler" style={{ marginTop: 40 }}>
                <h2 className="mc-title">Diğer rehberler</h2>
                <ul className="timeline">{others.map((o) => <li key={o.slug}><Link href={`/rehber/${o.slug}`}>{o.title}</Link></li>)}</ul>
            </aside>
        </article>
    );
}
