// Tek veri kaynağı: tüm sayfalar haberleri ve kategorileri buradan okur.
// İleride bir veritabanı / CMS bağlandığında yalnızca bu dosyadaki
// fonksiyonların içi değiştirilecek.

export const categories = [
    { slug: 'gundem', label: 'GÜNDEM', desc: 'Türkiye ve dünyadan sıcak gelişmeler.' },
    { slug: 'dunya', label: 'DÜNYA', desc: 'Sınırsız habercilik, küresel bakış.' },
    { slug: 'ekonomi', label: 'EKONOMİ', desc: 'Piyasalar, analizler ve finans dünyası.' },
    { slug: 'spor', label: 'SPOR', desc: 'Sahalardan en son skorlar ve transfer haberleri.' },
    { slug: 'teknoloji', label: 'TEKNOLOJİ', desc: 'Geleceği şekillendiren inovasyonlar.' },
    { slug: 'bilim', label: 'BİLİM', desc: 'Keşifler, araştırmalar ve uzay.' },
    { slug: 'kultur', label: 'KÜLTÜR', desc: 'Sanat, sinema, edebiyat ve festivaller.' },
    { slug: 'yasam', label: 'YAŞAM', desc: 'Sağlık, seyahat ve şehir hayatı.' },
];

const img = (id, w = 800) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const news = [
    {
        id: 1, category: 'teknoloji', featured: true, author: 'Mert H.', publishedAt: '2026-11-14T09:10:00+03:00',
        title: 'Yapay Zeka Devrimi: İnsanlık İçin Yeni Bir Çağ mı?',
        summary: 'Büyük dil modelleri iş hayatından eğitime kadar her alanı dönüştürüyor. Uzmanlar fırsatları ve riskleri değerlendirdi.',
        img: img('photo-1620712943543-bcc4688e7485'),
        content: [
            'Yapay zeka modellerinin yetenekleri son iki yılda beklenenden hızlı gelişti. Şirketler müşteri hizmetlerinden yazılım geliştirmeye kadar pek çok süreci bu araçlarla yeniden tasarlıyor.',
            'Uzmanlar, verimlilik artışının yanında veri gizliliği, telif hakları ve istihdam üzerindeki etkilerin de dikkatle izlenmesi gerektiğini vurguluyor.',
        ],
    },
    {
        id: 2, category: 'ekonomi', author: 'Selin Y.', publishedAt: '2026-11-14T08:20:00+03:00',
        title: 'Global Piyasalarda Rüzgar Tersine Döndü',
        summary: 'Merkez bankalarının faiz sinyalleri sonrası hisse senetlerinde satış baskısı arttı.',
        img: img('photo-1621416894569-0f39ed31d247'),
        content: [
            'Haftaya yükselişle başlayan küresel borsalar, merkez bankalarından gelen açıklamaların ardından yön değiştirdi.',
            'Analistler, önümüzdeki günlerde açıklanacak enflasyon verilerinin piyasaların yönünü belirleyeceğini belirtiyor.',
        ],
    },
    {
        id: 3, category: 'spor', author: 'Can A.', publishedAt: '2026-11-13T18:45:00+03:00',
        title: "İstanbul Maratonu'nda Rekor Katılım",
        summary: 'Kıtalararası koşuya bu yıl 50 binden fazla sporcu katıldı.',
        img: img('photo-1461896836934-ffe607ba8211'),
        content: [
            'Köprüden başlayan ve iki kıtayı birleştiren parkurda bu yıl katılım rekoru kırıldı.',
            'Organizasyon komitesi, gelecek yıl için kontenjanın artırılmasını değerlendirdiklerini açıkladı.',
        ],
    },
    {
        id: 4, category: 'bilim', author: 'Elif K.', publishedAt: '2026-11-13T15:00:00+03:00',
        title: 'Mars Kolonisi İçin İlk Adımlar Atılıyor',
        summary: 'Uzay ajansları kızıl gezegende kalıcı üs kurulmasına yönelik yol haritasını paylaştı.',
        img: img('photo-1451187580459-43490279c0fa'),
        content: [
            'Yeni yol haritasında ilk aşamada insansız kargo görevleriyle yaşam modüllerinin taşınması planlanıyor.',
            'Bilim insanları, su buzunun bulunduğu bölgelerin üs için en uygun konumlar olduğunu belirtiyor.',
        ],
    },
    {
        id: 5, category: 'teknoloji', author: 'Teknoloji Ed.', publishedAt: '2026-11-13T11:30:00+03:00',
        title: 'Elektrikli Araçlar İçin Yeni Batarya Teknolojisi',
        summary: 'Katı hal bataryalar şarj süresini dakikalar seviyesine indirmeyi vaat ediyor.',
        img: img('photo-1617788138017-80ad40651399'),
        content: [
            'Yeni nesil katı hal bataryalar, mevcut lityum-iyon hücrelere göre daha yüksek enerji yoğunluğu sunuyor.',
            'Üreticiler ilk seri üretim modellerinin önümüzdeki iki yıl içinde yollara çıkmasını hedefliyor.',
        ],
    },
    {
        id: 6, category: 'kultur', author: 'Sanat E.', publishedAt: '2026-11-12T20:00:00+03:00',
        title: 'Ödüllü Filmler Festivali Başlıyor',
        summary: 'Festival boyunca 40 ülkeden 120 film izleyiciyle buluşacak.',
        img: img('photo-1489599849927-2ee91cede3ba'),
        content: [
            'Bu yıl festivalin açılış filmi, uluslararası arenada çok sayıda ödül alan bir yerli yapım oldu.',
            'Gösterimlerin yanı sıra yönetmenlerle söyleşiler ve atölyeler de programda yer alıyor.',
        ],
    },
    {
        id: 101, category: 'gundem', author: 'Haber Merkezi', publishedAt: '2026-11-14T07:30:00+03:00',
        title: "Ankara'da Kritik Zirve: Yeni Kararlar Açıklandı",
        summary: 'Zirvenin ardından yapılan açıklamada ekonomi ve eğitim alanında yeni adımlar duyuruldu.',
        img: img('photo-1555848962-6e79363ec58f'),
        content: ['Uzun süren toplantının ardından yapılan açıklamada alınan kararların önümüzdeki ay yürürlüğe gireceği bildirildi.'],
    },
    {
        id: 102, category: 'gundem', author: 'Haber Merkezi', publishedAt: '2026-11-12T10:00:00+03:00',
        title: 'Eğitim Sisteminde Köklü Değişiklik Hazırlığı',
        summary: 'Müfredat ve sınav sisteminde yapılacak değişiklikler kamuoyuyla paylaşıldı.',
        img: img('photo-1503676260728-1c00da094a0b'),
        content: ['Taslak çalışmaya göre yeni müfredat kademeli olarak uygulamaya alınacak.'],
    },
    {
        id: 201, category: 'dunya', author: 'Dış Haberler', publishedAt: '2026-11-13T09:00:00+03:00',
        title: "Avrupa'da Enerji Krizi: Yeni Önlemler Masada",
        summary: 'Kış öncesi enerji arzını güvenceye almak için yeni paket tartışılıyor.',
        img: img('photo-1486406146926-c627a92ad1ab'),
        content: ['Avrupa ülkeleri ortak alım mekanizması ve tasarruf hedefleri üzerinde uzlaşmaya çalışıyor.'],
    },
    {
        id: 202, category: 'dunya', author: 'Dış Haberler', publishedAt: '2026-11-11T13:00:00+03:00',
        title: 'Asya Piyasalarında Sert Rüzgarlar',
        summary: 'Bölge borsalarında dalgalanma sürüyor.',
        img: img('photo-1504711434969-e33886168f5c'),
        content: ['Yatırımcılar ihracat verilerindeki zayıflamanın etkilerini değerlendiriyor.'],
    },
    {
        id: 301, category: 'ekonomi', author: 'Ekonomi Servisi', publishedAt: '2026-11-13T14:00:00+03:00',
        title: 'Merkez Bankası Faiz Kararını Açıkladı',
        summary: 'Politika faizi piyasa beklentilerine paralel belirlendi.',
        img: img('photo-1551288049-bebda4e38f71'),
        content: ['Karar metninde enflasyondaki ana eğilimin yakından izleneceği vurgulandı.'],
    },
    {
        id: 302, category: 'ekonomi', author: 'Ekonomi Servisi', publishedAt: '2026-11-12T18:10:00+03:00',
        title: "Borsa İstanbul'da Rekor Kapanış",
        summary: 'Endeks günü tüm zamanların en yüksek seviyesinden tamamladı.',
        img: img('photo-1590283603385-17ffb3a7f29f'),
        content: ['Bankacılık ve sanayi hisselerindeki yükseliş endeksi yukarı taşıdı.'],
    },
    {
        id: 401, category: 'spor', author: 'Spor Servisi', publishedAt: '2026-11-12T22:00:00+03:00',
        title: 'Dev Derbi Öncesi Nefesler Tutuldu',
        summary: 'Hafta sonu oynanacak derbi için biletler tükendi.',
        img: img('photo-1574629810360-7efbbe195018'),
        content: ['İki takım da eksik oyuncularının son durumunu maç gününe kadar takip edecek.'],
    },
    {
        id: 402, category: 'spor', author: 'Spor Servisi', publishedAt: '2026-11-11T16:00:00+03:00',
        title: 'Milli Takım Kamp Kadrosu Belli Oldu',
        summary: 'Teknik direktör eleme maçları için 26 kişilik kadroyu açıkladı.',
        img: img('photo-1518609878373-06d740f60d8b'),
        content: ['Kadroda üç yeni isim ilk kez milli formayla tanışacak.'],
    },
    {
        id: 503, category: 'teknoloji', author: 'Teknoloji Ed.', publishedAt: '2026-11-10T12:00:00+03:00',
        title: 'Karma Gerçeklik Gözlükleri Yaygınlaşıyor',
        summary: 'Yeni nesil cihazlar daha hafif ve daha uygun fiyatlı.',
        img: img('photo-1677442136019-21780ecad995'),
        content: ['Üreticiler iş dünyası ve eğitim uygulamalarına odaklanıyor.'],
    },
    {
        id: 601, category: 'yasam', author: 'Yaşam Servisi', publishedAt: '2026-11-12T08:00:00+03:00',
        title: 'Sağlıklı Yaşam: Güne Zinde Başlamanın 5 Yolu',
        summary: 'Uzmanlar sabah rutinine eklenebilecek basit alışkanlıkları sıraladı.',
        img: img('photo-1470071459604-3b5ec3a7fe05'),
        content: ['Düzenli uyku, su tüketimi ve kısa bir yürüyüş güne enerjik başlamanın anahtarları arasında.'],
    },
    {
        id: 602, category: 'yasam', author: 'Yaşam Servisi', publishedAt: '2026-11-09T11:00:00+03:00',
        title: "İstanbul'un En İyi 10 Kahve Mekanı",
        summary: 'Kahve tutkunları için şehrin dört bir yanından seçkiler.',
        img: img('photo-1497935586351-b67a49e012bf'),
        content: ['Listede hem köklü mekanlar hem de yeni açılan üçüncü dalga kahveciler yer alıyor.'],
    },
];

export function getCategory(slug) {
    return categories.find((c) => c.slug === slug) || null;
}

function withCategory(item) {
    const cat = getCategory(item.category);
    return { ...item, categoryLabel: cat ? cat.label : item.category.toUpperCase() };
}

export function getAllNews() {
    return [...news]
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .map(withCategory);
}

export function getNewsById(id) {
    const item = news.find((n) => String(n.id) === String(id));
    return item ? withCategory(item) : null;
}

export function getNewsByCategory(slug) {
    return getAllNews().filter((n) => n.category === slug);
}

export function getRelatedNews(item, limit = 3) {
    return getAllNews().filter((n) => n.category === item.category && n.id !== item.id).slice(0, limit);
}

// Türkçe karakterleri dikkate alan basit arama
export function searchNews(query) {
    const q = (query || '').trim().toLocaleLowerCase('tr');
    if (!q) return [];
    return getAllNews().filter((n) =>
        `${n.title} ${n.summary} ${n.categoryLabel}`.toLocaleLowerCase('tr').includes(q)
    );
}

export function formatDate(iso) {
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Istanbul',
    }).format(new Date(iso));
}

export function readingTime(item) {
    const words = item.content.join(' ').split(/\s+/).length + item.summary.split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}
