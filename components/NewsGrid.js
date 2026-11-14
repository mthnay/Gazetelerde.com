import Story from '@/components/Story';

// Haber kartı ızgarası (arama, ilgili haberler, kategori)
export default function NewsGrid({ items, min = 260, summary = false, level = 3 }) {
    return (
        <div className="grid-auto" style={{ '--min': `${min}px` }}>
            {items.map((n, i) => <Story key={n.id} item={n} variant="card" summary={summary} index={i % 4} level={level} />)}
        </div>
    );
}
