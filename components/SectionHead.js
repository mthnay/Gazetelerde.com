import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function SectionHead({ title, kicker, href, linkLabel = 'Tümü' }) {
    return (
        <div className="section-head" data-reveal="fade">
            <div>
                {kicker && <span className="kicker" style={{ marginBottom: 8, display: 'inline-flex' }}>{kicker}</span>}
                <h2 className="section-title">{title}</h2>
            </div>
            {href && <Link href={href} className="section-more">{linkLabel} <ArrowRight size={15} /></Link>}
        </div>
    );
}
