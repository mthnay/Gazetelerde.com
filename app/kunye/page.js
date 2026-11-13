import LegalPage from '@/components/LegalPage';
import { company } from '@/lib/company';

export const metadata = { title: 'Künye | Gazetelerde', alternates: { canonical: '/kunye' } };

export default function Kunye() {
    const rows = [
        ['Yayın adı', 'Gazetelerde.com'],
        ['Yayın türü', 'Yaygın süreli internet haber sitesi'],
        ['İmtiyaz sahibi', company.publisher],
        ['Sorumlu yazı işleri müdürü', company.editorInChief],
        ['Şirket unvanı', company.title],
        ['Adres', company.address],
        ['E-posta', company.email],
        ['Telefon', company.phone],
        ['Yer sağlayıcı', company.hosting],
    ];
    return (
        <LegalPage title="Künye">
            <dl className="legal-dl">
                {rows.map(([k, val]) => (
                    <div key={k}><dt>{k}</dt><dd>{val}</dd></div>
                ))}
            </dl>
            <p>
                Gazetelerde.com, 5187 sayılı Basın Kanunu ve 7418 sayılı Kanun ile getirilen düzenlemeler çerçevesinde
                yayın yapmaktadır. Sitede yer alan haberlerin, aksi belirtilmedikçe, her türlü hakkı yayıncıya aittir;
                kaynak gösterilmeden kopyalanamaz.
            </p>
        </LegalPage>
    );
}
