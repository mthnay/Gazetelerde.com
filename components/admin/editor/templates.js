// Hazır haber şablonları. Köşeli parantezli yerler editörün dolduracağı ipuçlarıdır.
// Her şablon içerikle birlikte uygun sayfa düzenini de önerir.
const u = (id) => `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;
const IMG = {
    a: u('photo-1547347298-4074fc3086f0'),
    b: u('photo-1686753767715-37cb0c34212c'),
    c: u('photo-1729564615215-9df5ef19b971'),
    d: u('photo-1567781830902-685fb3401f1d'),
    e: u('photo-1673058577973-68b6b6d53ccd'),
    f: u('photo-1728971124745-423b12df446d'),
};
const fig = (src, cap, align = 'center') => `<figure data-align="${align}"><img src="${src}" alt=""><figcaption>${cap}</figcaption></figure>`;

export const BUILTIN_TEMPLATES = [
    {
        id: 'standart',
        name: 'Standart haber',
        description: 'Giriş, ara başlıklar, görsel ve kaynak notu.',
        layout: { hero: 'classic', width: 'normal', aside: true, dropcap: true },
        html: `<p>[Haberin en önemli bilgisi: kim, ne, nerede, ne zaman — tek paragrafta.]</p>
<p>[Ayrıntılar ve bağlam.]</p>
<h2>[Ara başlık]</h2>
<p>[Gelişmenin arka planı ya da etkileri.]</p>
${fig(IMG.a, '[Görsel altyazısı — fotoğrafta ne var, kim çekti]')}
<p>[Kapanış: sırada ne var?]</p>`,
    },
    {
        id: 'mac-sonucu',
        name: 'Maç sonucu',
        description: 'Skor kutusu, set set anlatım, öne çıkanlar ve sıradaki maç.',
        layout: { hero: 'immersive', width: 'normal', aside: true, dropcap: false },
        html: `<div class="score" data-meta="[Lig] · [Hafta] · [Salon]" data-home="[Ev sahibi]" data-away="[Konuk]" data-home-score="3" data-away-score="1" data-sets="25-20, 17-25, 25-17, 25-18"></div>
<p>[Maçın tek cümlelik özeti: kim, kimi, hangi skorla yendi.]</p>
<h2>Set set</h2>
<ul><li><p><strong>1. set:</strong> [Nasıl geçti?]</p></li><li><p><strong>2. set:</strong> [Nasıl geçti?]</p></li><li><p><strong>3. set:</strong> [Nasıl geçti?]</p></li><li><p><strong>4. set:</strong> [Nasıl geçti?]</p></li></ul>
<h2>Öne çıkanlar</h2>
<p>[Maçın yıldızı, kritik anlar, istatistikler.]</p>
${fig(IMG.b, '[Maçtan bir kare]', 'wide')}
<aside class="callout" data-tone="highlight"><h3>Sıradaki maç</h3><p>[Takım], ligin [hafta]. haftasında [tarih] günü [rakip] ile karşılaşacak.</p></aside>`,
    },
    {
        id: 'galeri',
        name: 'Fotoğraf galerisi',
        description: 'Kısa giriş ve 3 sütunlu galeri.',
        layout: { hero: 'minimal', width: 'wide', aside: false, dropcap: false },
        html: `<p>[Galerinin ne anlattığını iki cümleyle özetleyin.]</p>
<div class="gallery gallery-3"><figure class="gallery-item"><img src="${IMG.a}" alt=""></figure><figure class="gallery-item"><img src="${IMG.b}" alt=""></figure><figure class="gallery-item"><img src="${IMG.c}" alt=""></figure><figure class="gallery-item"><img src="${IMG.d}" alt=""></figure><figure class="gallery-item"><img src="${IMG.e}" alt=""></figure><figure class="gallery-item"><img src="${IMG.f}" alt=""></figure></div>
<p>[Fotoğraflar: kaynak / fotoğrafçı adı]</p>`,
    },
    {
        id: 'video',
        name: 'Video haber',
        description: 'Video en üstte, altında özet ve öne çıkanlar.',
        layout: { hero: 'minimal', width: 'wide', aside: true, dropcap: false },
        html: `<aside class="callout" data-tone="info"><p>Soldaki <strong>Video</strong> bloğuyla YouTube videosunu buraya ekleyin, sonra bu kutuyu silin.</p></aside>
<p>[Videoda ne var? İki-üç cümlelik özet.]</p>
<h2>Videodan öne çıkanlar</h2>
<ul><li><p>[Önemli an 1 — dakika]</p></li><li><p>[Önemli an 2 — dakika]</p></li><li><p>[Önemli an 3 — dakika]</p></li></ul>`,
    },
    {
        id: 'roportaj',
        name: 'Röportaj',
        description: 'Giriş, yan görsel, soru-cevap akışı ve öne çıkan alıntı.',
        layout: { hero: 'split', width: 'normal', aside: true, dropcap: true },
        html: `<p>[Röportaj yapılan kişiyi ve konuşmanın bağlamını tanıtın.]</p>
${fig(IMG.c, '[Kişinin adı, unvanı]', 'right')}
<p><strong>[Soru 1]</strong></p>
<p>[Cevap 1]</p>
<p><strong>[Soru 2]</strong></p>
<p>[Cevap 2]</p>
<blockquote><p>[Röportajın en çarpıcı cümlesi]</p></blockquote>
<p><strong>[Soru 3]</strong></p>
<p>[Cevap 3]</p>`,
    },
    {
        id: 'analiz',
        name: 'Analiz (iki sütun)',
        description: 'Karşılaştırmalı iki sütun ve bilgi kutusu.',
        layout: { hero: 'classic', width: 'wide', aside: false, dropcap: true },
        html: `<p>[Analizin ana sorusu ve neden önemli olduğu.]</p>
<div class="cols cols-2"><div class="col"><h3>[Taraf / takım A]</h3><p>[Güçlü ve zayıf yönler.]</p></div><div class="col"><h3>[Taraf / takım B]</h3><p>[Güçlü ve zayıf yönler.]</p></div></div>
<aside class="callout" data-tone="info"><h3>Rakamlarla</h3><ul><li><p>[İstatistik 1]</p></li><li><p>[İstatistik 2]</p></li></ul></aside>
<h2>[Sonuç]</h2>
<p>[Değerlendirme.]</p>`,
    },
    {
        id: 'canli',
        name: 'Dakika dakika',
        description: 'Saat damgalı canlı anlatım akışı.',
        layout: { hero: 'classic', width: 'normal', aside: true, dropcap: false },
        html: `<aside class="callout" data-tone="warning"><p><strong>CANLI</strong> — Bu sayfa gelişmeler oldukça güncellenir.</p></aside>
<p><strong>[21.40]</strong> [En son gelişme en üste.]</p>
<p><strong>[21.25]</strong> [Bir önceki gelişme.]</p>
<p><strong>[21.10]</strong> [İlk gelişme.]</p>`,
    },
];
