import Link from 'next/link';
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
                <li><strong>Bülten:</strong> abone olursanız e-posta adresiniz, abonelik ve onay tarihleri ile hangi bülten sayısının size gönderildiği.</li>
                <li><strong>Tarayıcı bildirimleri:</strong> izin verirseniz tarayıcınızın bildirim için ürettiği adres ve şifreleme anahtarları. Bu bilgiler sizi kişi olarak tanımlamaz; bildirimleri kapattığınızda silinir.</li>
                <li><strong>Güvenlik kayıtları:</strong> giriş denemeleri (e-posta, başarılı/başarısız, tarih) ve IP adresinizin geri döndürülemez özeti; hesabınızı yetkisiz girişlere karşı korumak için 30 gün saklanır. İki adımlı doğrulamayı açarsanız doğrulama anahtarınız şifreli olarak saklanır.</li>
                <li><strong>Okunma istatistikleri:</strong> çerez kullanılmadan, sayfa türü, geldiğiniz site (ör. Google), cihaz türü (mobil/masaüstü) ve gün bazında <em>toplam sayılar</em> tutulur. IP adresi, kimlik ya da gezinti geçmişi saklanmaz; tarayıcınızda “izlenmek istemiyorum” (Do Not Track / GPC) açıksa hiç sayım yapılmaz.</li>
                <li><strong>Destekçilik:</strong> destek olursanız e-posta adresiniz, paket, tutar ve süre bilgisi (reklamsız okumayı açmak için). Kart bilgileriniz bizde değil, ödeme kuruluşunda işlenir.</li>
                <li><strong>Anket oyları:</strong> hangi seçeneğe oy verildiği ve tekrar oyu önlemek için geri döndürülemez bir özet; kim olduğunuz saklanmaz.</li>
                <li><strong>Yapay zekâ:</strong> editörlerimiz haber metinlerini yazım denetimi ve başlık önerisi için Anthropic şirketinin Claude hizmetine gönderebilir; okurların kişisel verileri bu hizmete gönderilmez.</li>
                <li><strong>Hata kayıtları:</strong> site düzgün çalışmadığında oluşan teknik hata mesajı ve sayfa adresi; kişisel veri içermez.</li>
            </ul>

            <h2>3. Çerezler ve tarayıcı depolaması</h2>
            <ul>
                <li><strong>Oturum çerezi (zorunlu):</strong> giriş yaptığınızda oturumunuzu tanımak için kullanılır, 30 gün geçerlidir.</li>
                <li><strong>Tema tercihi:</strong> açık/koyu tema seçiminiz tarayıcınızda saklanır.</li>
                <li><strong>Çerez tercihi (zorunlu):</strong> reklam çerezlerine izin verip vermediğiniz, 6 ay saklanır.</li>
                <li><strong>Reklam çerezleri (isteğe bağlı):</strong> reklam ağı kodları (ör. Google AdSense) yalnızca çerez bandında izin verirseniz yüklenir ve kendi çerezlerini kullanabilir. Tercihinizi alt bilgideki “Çerez tercihleri” bağlantısından dilediğiniz an değiştirebilirsiniz. Doğrudan sponsor görselleri çerez kullanmaz.</li>
                <li><strong>Anket çerezi (işlevsel):</strong> üye olmadan ankete oy verirseniz aynı ankete ikinci kez oy verilmemesi için rastgele, sizi tanımlamayan bir kimlik 1 yıl saklanır.</li>
                <li>Okunma istatistikleri ve sayfa hızı ölçümleri (yüklenme süresi gibi teknik değerler) çerezsiz çalışır; kişi ya da cihaz kimliği tutulmaz.</li>
            </ul>

            <h2>4. İşleme amaçları ve hukuki sebepler</h2>
            <p>
                Verileriniz; üyelik ve site hizmetlerinin sunulması (sözleşmenin ifası, KVKK m.5/2-c), güvenliğin sağlanması ve
                kötüye kullanımın önlenmesi (meşru menfaat, m.5/2-f), yasal yükümlülüklerin yerine getirilmesi (m.5/2-ç) ve
                bülten ve tarayıcı bildirimi gönderimi (açık rıza, m.5/1) amaçlarıyla işlenir. Bülten için rızanız, e-postanıza gelen
                onay bağlantısına tıkladığınızda alınır (çift onay).
            </p>

            <h2>5. Aktarım</h2>
            <p>
                Verileriniz satılmaz ve reklam amacıyla paylaşılmaz. Yalnızca barındırma hizmeti aldığımız {company.hosting},
                bülten e-postalarını iletmek için kullanılan e-posta gönderim hizmeti ve bildirimleri iletmek için tarayıcınızın
                bildirim hizmeti (ör. Google, Apple, Mozilla) ile ve yasal zorunluluk halinde yetkili kurumlarla paylaşılabilir.
            </p>

            <h2>6. Saklama süresi</h2>
            <p>
                Üyelik verileriniz hesabınızı silene kadar saklanır. Hesabınızı profil sayfasından dilediğiniz an silebilirsiniz;
                bu durumda yorumlarınız, beğenileriniz ve kayıtlarınız da kalıcı olarak silinir. Bülten aboneliğinden e-postalardaki
                bağlantıyla çıkabilirsiniz. Güvenlik kayıtları 30 gün, site içi bildirimler 90 gün sonra kendiliğinden silinir.
            </p>

            <h2>7. Haklarınız (KVKK m.11)</h2>
            <p>
                Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme ve itiraz etme
                haklarına sahipsiniz. Üyeyseniz hakkınızda tutulan verilerin bir kopyasını <Link href="/profile?sekme=security">Profil → Hesap ve güvenlik</Link>
                bölümünden anında indirebilir, hesabınızı aynı yerden silebilirsiniz. Diğer taleplerinizi {company.kvkkEmail} adresine iletebilirsiniz.
            </p>
        </LegalPage>
    );
}
