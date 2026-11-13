import Story from '@/components/Story';

// Eski adıyla kullanılan yerler için ince sarmalayıcı
export default function NewsCard({ news, index = 0 }) {
    return <Story item={news} variant="card" index={index} />;
}
