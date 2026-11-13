// Künye / KVKK / iletişim sayfalarında kullanılan kurum bilgileri.
// ⚠️ Yayına almadan önce .env dosyasından gerçek bilgilerle doldurun.
// Doldurulmamış alanlar sayfada "[ ... ]" olarak, dikkat çekecek şekilde görünür.
const v = (key, placeholder) => process.env[key]?.trim() || `[${placeholder}]`;

export const company = {
    title: v('COMPANY_TITLE', 'Şirket unvanı'),
    address: v('COMPANY_ADDRESS', 'Açık adres'),
    taxInfo: v('COMPANY_TAX', 'Vergi dairesi / numarası'),
    publisher: v('COMPANY_PUBLISHER', 'İmtiyaz sahibi'),
    editorInChief: v('COMPANY_EDITOR', 'Sorumlu yazı işleri müdürü'),
    email: v('CONTACT_EMAIL', 'iletisim@alanadiniz.com'),
    kvkkEmail: v('KVKK_EMAIL', 'kvkk@alanadiniz.com'),
    phone: v('CONTACT_PHONE', 'Telefon'),
    hosting: v('HOSTING_PROVIDER', 'Yer sağlayıcı'),
};
