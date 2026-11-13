import LegalPage from '@/components/LegalPage';
import { company } from '@/lib/company';

export const metadata = { title: 'Gizlilik ve KVKK Aydınlatma Metni | Gazetelerde', alternates: { canonical: '/gizlilik' } };

// ⚠️ Bu metin, sitenin bugün gerçekten yaptığı veri işlemelerini anlatan bir taslaktır.
// Yayına almadan önce bir hukukçuya kontrol ettirin.
export default function Gizlilik() {
    return (
        <LegalPage title="Gizlilik ve KVKK" kicker="Aydınlatma metni">
            <h2>1. Veri sorumlusu</h2>
            <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusu {company.title} ({company.address})&apos;dir.
            </p>

            <h2>2. Hangi verileri işliyoruz?</h2>
            <ul>
                <li><strong>Üyelik bilgileri:</strong> ad soyad, e-posta adresi ve şifrenizin geri döndürülemez şekilde şifrelenmiş (hash) hali.</li>
                <li><strong>Site içi etkileşimler:</strong> yorumlarınız, beğendiğiniz ve kaydettiğiniz haberler, takip ettiğiniz kategoriler, şikayetleriniz.</li>
                <li><strong>Bülten:</strong> abone olursanız e-posta adresiniz.</li>
                <li><strong>Teknik veriler:</strong> güvenlik amacıyla (ör. kötüye kullanım ve deneme sınırlaması) IP adresi; okunma sayılarını hesaplamak için anonim sayım.</li>
            </ul>

            <h2>3. Çerezler ve tarayıcı depolaması</h2>
            <ul>
                <li><strong>Oturum çerezi (zorunlu):</strong> giriş yaptığınızda oturumunuzu tanımak için kullanılır, 30 gün geçerlidir.</li>
                <li><strong>Tema tercihi:</strong> açık/koyu tema seçiminiz tarayıcınızda saklanır.</li>
                <li>Reklam veya üçüncü taraf takip çerezi kullanılmamaktadır.</li>
            </ul>

            <h2>4. İşleme amaçları ve hukuki sebepler</h2>
            <p>
                Verileriniz; üyelik ve site hizmetlerinin sunulması (sözleşmenin ifası, KVKK m.5/2-c), güvenliğin sağlanması ve
                kötüye kullanımın önlenmesi (meşru menfaat, m.5/2-f), yasal yükümlülüklerin yerine getirilmesi (m.5/2-ç) ve
                bülten gönderimi (açık rıza, m.5/1) amaçlarıyla işlenir.
            </p>

            <h2>5. Aktarım</h2>
            <p>
                Verileriniz satılmaz ve reklam amacıyla paylaşılmaz. Yalnızca barındırma hizmeti aldığımız {company.hosting} ile
                ve yasal zorunluluk halinde yetkili kurumlarla paylaşılabilir.
            </p>

            <h2>6. Saklama süresi</h2>
            <p>
                Üyelik verileriniz hesabınızı silene kadar saklanır. Hesabınızı profil sayfasından dilediğiniz an silebilirsiniz;
                bu durumda yorumlarınız, beğenileriniz ve kayıtlarınız da kalıcı olarak silinir. Bülten aboneliğinden e-postalardaki
                bağlantıyla çıkabilirsiniz.
            </p>

            <h2>7. Haklarınız (KVKK m.11)</h2>
            <p>
                Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme ve itiraz etme
                haklarına sahipsiniz. Taleplerinizi {company.kvkkEmail} adresine iletebilirsiniz.
            </p>
        </LegalPage>
    );
}
