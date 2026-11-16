// Hazır haber kaynakları: yönetim panelinde (İçerik Çek → Kaynaklar) tek tıkla açılıp kapatılır.
// Açıldığında kaynak düzenli taranır, yeni haberler otomatik yayımlanır ve "son dakika" olarak işaretlenir;
// BREAKING_HOURS sonra son dakikadan düşer, keepDays gün sonra arşivlenir.
// Yeni kaynak eklemek için listeye bir satır eklemek yeterli.
export const PRESETS = [
    {
        key: 'tvf', name: 'TVF Haberler', url: 'https://tvf.org.tr/icerikler/haberler', kind: 'HTML', linkPattern: '/icerik/',
        sport: 'voleybol', description: 'Türkiye Voleybol Federasyonu: ligler, milli takımlar, duyurular.',
    },
    {
        key: 'fivb', name: 'FIVB', url: 'https://www.fivb.com/feed/', kind: 'RSS',
        sport: 'voleybol', description: 'Uluslararası Voleybol Federasyonu haberleri (İngilizce; yapay zekâ Türkçeleştirir).',
    },
    {
        key: 'voleybolplus', name: 'Voleybol Plus', url: 'https://www.voleybolplus.com/feed', kind: 'RSS',
        sport: 'voleybol', description: 'Türk voleybolu haber sitesi.',
    },
    {
        key: 'aa-spor', name: 'AA Spor', url: 'https://www.aa.com.tr/tr/rss/default?cat=spor', kind: 'RSS',
        sport: 'spor', description: 'Anadolu Ajansı spor haberleri.',
    },
    {
        key: 'trt-spor', name: 'TRT Haber Spor', url: 'https://www.trthaber.com/spor_articles.rss', kind: 'RSS',
        sport: 'spor', description: 'TRT Haber spor bölümü.',
    },
];

// Hazır kaynak açılınca uygulanan ayarlar
export const PRESET_DEFAULTS = { mode: 'PUBLISH', breaking: true, rewrite: true, keepDays: 7 };

export const presetByKey = (key) => PRESETS.find((p) => p.key === key) || null;
