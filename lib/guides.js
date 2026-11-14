// Voleybol rehberleri: yeni izleyiciler için kalıcı açıklayıcı içerikler (FIVB kurallarına göre).
// Her rehber: başlık, özet, bölümler [{ h, p: [paragraf...] }] ve sık sorulanlar [{ q, a }] (SSS şeması için).
export const GUIDES = [
    {
        slug: 'voleybol-kurallari',
        title: 'Voleybol kuralları: yeni başlayanlar için temel rehber',
        summary: 'Sahada kaç oyuncu olur, setler kaç sayıda biter, kaç dokunuş hakkı vardır? Voleybolun temel kuralları sade bir dille.',
        sections: [
            { h: 'Takımlar ve saha', p: ['Her takım sahada 6 oyuncuyla oynar. Saha 18 x 9 metredir ve ortasındaki fileyle ikiye bölünür. File yüksekliği kadınlarda 2,24 m, erkeklerde 2,43 m\'dir.', 'Çizgiye değen top içeride sayılır.'] },
            { h: 'Sayı ve set', p: ['Voleybolda her ralli sayıyla biter: servisi hangi takım atmış olursa olsun, ralliyi kazanan takım sayıyı alır ve bir sonraki servisi atar.', 'Setler 25 sayıya oynanır ve en az 2 sayı fark gerekir; 24-24\'te set 2 fark oluşana kadar sürer (26-24, 30-28 gibi). Maçlar 5 set üzerinden oynanır, 3 seti alan kazanır. Durum 2-2 olursa 5. set (tie-break) 15 sayıya oynanır, yine 2 fark gerekir.'] },
            { h: 'Dokunuşlar', p: ['Bir takım topu rakip sahaya en fazla 3 dokunuşla göndermelidir. Blokta yapılan dokunuş bu üç dokunuşa sayılmaz.', 'Aynı oyuncu topa art arda iki kez dokunamaz (bloktan sonraki dokunuş hariç). Top tutulamaz ya da fırlatılamaz; temiz vurulmalıdır.'] },
            { h: 'Sık görülen hatalar', p: ['Fileye dokunmak (oyun sırasında, top oynanırken), orta çizgiyi geçip rakibin oyununu engellemek, servisi düdükten sonra 8 saniye içinde atmamak ve rotasyon (dizilim) hatası sayı kaybettirir.'] },
        ],
        faq: [
            { q: 'Voleybolda bir set kaç sayıdır?', a: 'Setler 25 sayıya, 5. set (tie-break) 15 sayıya oynanır; her durumda en az 2 sayı fark gerekir.' },
            { q: 'Voleybol maçı kaç set sürer?', a: 'Maçlar 5 set üzerinden oynanır; 3 seti ilk alan takım kazanır. Bu yüzden maç 3, 4 ya da 5 set sürebilir.' },
            { q: 'Blok dokunuşu sayılır mı?', a: 'Hayır. Blokta topa dokunmak takımın 3 dokunuş hakkından sayılmaz; bloktan sonra takım hâlâ 3 kez dokunabilir.' },
        ],
    },
    {
        slug: 'voleybol-mevkileri',
        title: 'Voleybolda mevkiler: pasör, smaçör, orta oyuncu, pasör çaprazı ve libero',
        summary: 'Sahadaki altı oyuncunun her birinin görevi farklıdır. Mevkileri ve takımdaki rollerini tanıyın.',
        sections: [
            { h: 'Pasör', p: ['Takımın oyun kurucusudur. Genellikle ikinci dokunuşu yapar ve topu hücum oyuncularına dağıtır. Hangi oyuncunun nereden vuracağına çoğu zaman o karar verir.'] },
            { h: 'Pasör çaprazı', p: ['Rotasyonda pasörün karşısında yer alır. Genellikle karşılamaya girmez, ağırlıklı olarak hücum eder ve takımın en çok sayı üreten oyuncularından biridir. Sağ kanattan ve arka alandan vurur.'] },
            { h: 'Smaçör', p: ['Sol kanat (dış) oyuncularıdır. Hem servis karşılamada hem hücumda görev alırlar; çok yönlü oyuncular olmaları beklenir.'] },
            { h: 'Orta oyuncu', p: ['Filenin ortasında blokta en önemli görevi üstlenir; hızlı (kısa) toplarla hücum eder. Genellikle takımın en uzun oyuncularıdır. Arka alana geçtiklerinde çoğu zaman yerlerini libero alır.'] },
            { h: 'Libero', p: ['Savunma uzmanıdır: servis karşılama ve defanstan sorumludur. Farklı renkte forma giyer, hücum vuruşu yapamaz, servis atamaz (bazı lig kurallarında istisnalar vardır) ve blok yapamaz.'] },
        ],
        faq: [
            { q: 'Voleybolda kaç mevki vardır?', a: 'Temel olarak beş mevki vardır: pasör, pasör çaprazı, smaçör, orta oyuncu ve libero. Sahada aynı anda 6 oyuncu bulunur.' },
            { q: 'Pasör çaprazı ne iş yapar?', a: 'Rotasyonda pasörün karşısında oynar, karşılamaya genellikle girmez ve ağırlıklı olarak hücum eder.' },
        ],
    },
    {
        slug: 'rotasyon-nedir',
        title: 'Voleybolda rotasyon nedir, nasıl yapılır?',
        summary: 'Takımlar servis hakkını kazandıkça saat yönünde döner. Rotasyonun mantığı ve rotasyon hatası.',
        sections: [
            { h: 'Pozisyonlar', p: ['Sahada altı pozisyon vardır: arka sağ 1 (servis atan), ön sağ 2, ön orta 3, ön sol 4, arka sol 5 ve arka orta 6.'] },
            { h: 'Saat yönünde dönüş', p: ['Bir takım rakibin servisinde rallyi kazanıp servis hakkını aldığında oyuncular saat yönünde bir pozisyon kayar: 2 numaradaki oyuncu 1\'e geçer ve servisi atar.', 'Böylece her oyuncu zamanla hem ön hem arka alanda oynar.'] },
            { h: 'Rotasyon hatası', p: ['Servis vurulduğu an oyuncuların dizilim sırasına uygun yerde olması gerekir (önündeki ve yanındaki oyuncuyla olan konumu). Servisten sonra oyuncular serbestçe yer değiştirebilir; pasörün hep aynı bölgeye koşması bu yüzdendir.', 'Arka alandaki oyuncular hücum çizgisinin önünden, top file üst kenarının üzerindeyken vuruş yapamaz.'] },
        ],
        faq: [{ q: 'Voleybolda rotasyon ne zaman yapılır?', a: 'Takım rakibin servisinde rallyi kazanıp servis hakkını aldığında, oyuncular saat yönünde bir pozisyon döner.' }],
    },
    {
        slug: 'lig-puanlama-sistemi',
        title: 'Sultanlar Ligi ve Efeler Ligi puanlama sistemi: 3-0, 3-1 ve 3-2 kaç puan?',
        summary: 'Voleybolda galibiyet her zaman aynı puanı getirmez. Puan durumu nasıl hesaplanır, eşitlikte ne olur?',
        sections: [
            { h: 'Maç puanları', p: ['3-0 ya da 3-1 kazanan takım 3 puan alır, kaybeden 0 puan. 3-2 kazanan takım 2 puan, 2-3 kaybeden takım 1 puan alır.', 'Yani tie-break\'e kalan maçta iki takım da puan kazanır.'] },
            { h: 'Eşitlikte sıralama', p: ['Puanlar eşitse sırasıyla galibiyet sayısına, ardından set averajına (alınan set / verilen set) ve sayı averajına (alınan sayı / verilen sayı) bakılır. Lig yönetmelikleri sezondan sezona değişebileceği için kesin kural için TVF yönetmeliğine bakın.'] },
            { h: 'Play-off', p: ['Normal sezonun sonunda üst sıralardaki takımlar play-off\'a kalır; eşleşmeler genellikle birden fazla maç üzerinden (ör. 2 galibiyete ulaşan) oynanır. Maç Merkezi\'ndeki eleme ağacı serilerin durumunu gösterir.'] },
        ],
        faq: [
            { q: 'Voleybolda 3-2 galibiyet kaç puan?', a: '3-2 kazanan takım 2 puan, 2-3 kaybeden takım 1 puan alır.' },
            { q: '3-1 galibiyet kaç puan?', a: '3-0 ve 3-1 galibiyetler 3 puandır; kaybeden takım puan alamaz.' },
        ],
    },
    {
        slug: 'libero-kurallari',
        title: 'Libero nedir? Libero kuralları',
        summary: 'Farklı renk formalı savunma uzmanı libero, hangi kurallara tabidir?',
        sections: [
            { h: 'Görevi', p: ['Libero, servis karşılama ve savunmada uzmanlaşmış oyuncudur. Arka alanda, çoğu zaman orta oyuncunun yerine oyuna girer.'] },
            { h: 'Kısıtlamalar', p: ['Takım arkadaşlarından farklı renkte forma giyer. File üst kenarının üzerindeki topa hücum vuruşu yapamaz, blok yapamaz ve blok denemesine katılamaz.', 'Hücum çizgisinin önünde parmak pasıyla yaptığı pası, bir takım arkadaşı file üst kenarının üzerinden hücuma çeviremez.'] },
            { h: 'Değişiklik', p: ['Liberonun girişleri normal oyuncu değişikliği sayılmaz ve sınırsızdır; ancak iki libero değişikliği arasında en az bir tamamlanmış ralli olmalıdır. Takımlar kadroda iki libero bulundurabilir.'] },
        ],
        faq: [{ q: 'Libero neden farklı renk forma giyer?', a: 'Hakemlerin ve rakiplerin, hücum ve blok yapamayan bu savunma oyuncusunu kolayca ayırt edebilmesi için.' }],
    },
];

export const getGuide = (slug) => GUIDES.find((g) => g.slug === slug) || null;
