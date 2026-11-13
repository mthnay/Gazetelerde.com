import LegalPage from '@/components/LegalPage';
import { company } from '@/lib/company';

export const metadata = { title: 'İletişim | Gazetelerde', alternates: { canonical: '/iletisim' } };

export default function Iletisim() {
    return (
        <LegalPage title="İletişim">
            <p>Haber ihbarı, düzeltme talebi, reklam ve iş birliği için bize ulaşabilirsiniz.</p>
            <dl className="legal-dl">
                <div><dt>Genel iletişim</dt><dd>{company.email.startsWith('[') ? company.email : <a href={`mailto:${company.email}`}>{company.email}</a>}</dd></div>
                <div><dt>Telefon</dt><dd>{company.phone}</dd></div>
                <div><dt>Adres</dt><dd>{company.address}</dd></div>
                <div><dt>Kişisel veriler (KVKK)</dt><dd>{company.kvkkEmail}</dd></div>
            </dl>
            <h2>Düzeltme ve cevap hakkı</h2>
            <p>
                Yayınladığımız bir haberde hata olduğunu düşünüyorsanız, haberin bağlantısını ve düzeltme talebinizi
                yukarıdaki e-posta adresine gönderin. Talepler yasal süreler içinde değerlendirilir.
            </p>
        </LegalPage>
    );
}
