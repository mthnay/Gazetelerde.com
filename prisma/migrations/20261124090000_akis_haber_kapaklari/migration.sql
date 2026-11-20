-- Kaynağın yayınladığı kapaklarla, eski içe aktarıcının boş bıraktığı haberleri tamamla.
UPDATE "Article" AS a
SET image = c.image, "imageCredit" = COALESCE(a."imageCredit", 'Voleybol Plus'), "updatedAt" = NOW()
FROM (VALUES
    ('https://www.voleybolplus.com/a-milli-erkek-takiminda-orkun-ozel-ayrildi-yanki-uslu-geldi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/baf8b3e7-b5c2-4b06-aa22-1f588cd7e66a.jpg-960x564.webp'),
    ('https://www.voleybolplus.com/aras-kargo-fenerbahce-maci-ertelendi/',
     'https://www.voleybolplus.com/wp-content/uploads/2023/10/Vodafone-Sultanlar-Ligi-Logo.png'),
    ('https://www.voleybolplus.com/aras-kargoda-gida-zehirlenmesi-suphesi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HWnMoxDWgAAOC-h-960x640.jpeg'),
    ('https://www.voleybolplus.com/eczacibasi-peron-istanbul-kuzeyboru-karsilasmasinda-retro-forma-gunu/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/PHOTO-2026-11-20-13-53-49-960x1430.jpg'),
    ('https://www.voleybolplus.com/fenerbahce-medicana-dortlu-finale-yukseldi-2/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HXaoeo9WMAAkuSn-960x960.jpeg'),
    ('https://www.voleybolplus.com/fenerbahcede-yigit-gulmezoglu-kadro-disi-birakildi/',
     'https://www.voleybolplus.com/wp-content/uploads/2025/09/2eaee173-2244-4063-9be1-f6fb86d6146e-960x848.jpeg'),
    ('https://www.voleybolplus.com/gebze-bld-gaziantep-genclik-deplasmaninda/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/10/Gebze-Belediyespor-mac-sonu-1-960x640.jpeg'),
    ('https://www.voleybolplus.com/ilbankli-oyunculardan-eda-erdem-sozleri-herkes-buna-ayni-cevabi-verecektir/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/6afd8a94f155b0b0d53f4576.jpg.webp'),
    ('https://www.voleybolplus.com/istanbul-genclik-tarafsiz-sahada-maccabi-yeadim-tel-avivle-karsilasacak/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/10/SaveClip.App_858118938_17957811975258516_2982464520432622595_n-960x1200.jpg'),
    ('https://www.voleybolplus.com/son-bilet-galatasaray-daikinin/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HXgIeahX0AACI5e-960x540.jpeg'),
    ('https://www.voleybolplus.com/tvf-baskani-mehmet-akif-ustundagin-baskentte-yeni-salon-hedefi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/08/21735478-0-62-1200-675.jpeg.webp'),
    ('https://www.voleybolplus.com/vakifbankta-dangubic-sahalara-geri-donuyor/',
     'https://www.voleybolplus.com/wp-content/uploads/2025/05/dangubic_fotograf-min-960x1200.png'),
    ('https://www.voleybolplus.com/eczacibasi-peron-istanbul-aras-kargo-ile-evinde-yari-final-icin-mucadele-edecek/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/Elif-Sahin-960x640.jpeg'),
    ('https://www.voleybolplus.com/axa-sigorta-kadinlar-kupa-voleyde-yson-3-yari-finalist-belli-oluyor/',
     'https://www.voleybolplus.com/wp-content/uploads/2022/01/axa-sigorta-kupa-voley.jpeg'),
    ('https://www.voleybolplus.com/ilbank-kuzeyboru-deplasmaninda-kazandi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/SaveClip.App_861214656_17938366005396554_5852444569264495995_n-960x644.jpg'),
    ('https://www.voleybolplus.com/besiktasin-3-galibiyeti-afyondan/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HXLy8CzXwAA_j6s-960x640.jpeg'),
    ('https://www.voleybolplus.com/kilis-genclik-galatasaray-karsisinda-zorlanmadi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/SaveClip.App_899270197_17947121871361754_3037603676394883276_n-960x720.jpg'),
    ('https://www.voleybolplus.com/goztepe-basladi-galatasaray-bitirdi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HXLA3apWUAAjbr0-960x849.jpeg'),
    ('https://www.voleybolplus.com/fenerbahce-medicana-rahat-kazandi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HXKerrDWAAA0Hvl-960x640.jpeg'),
    ('https://www.voleybolplus.com/eczacibasi-ankarada-kazandi/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HXKr7qUXIAAaKfX-960x1200.jpeg'),
    ('https://www.voleybolplus.com/vakifbanktan-9da-9/',
     'https://www.voleybolplus.com/wp-content/uploads/2026/11/HXKn6t3XAAAFNnG-960x960.jpeg')
) AS c(source_url, image)
WHERE a."sourceUrl" = c.source_url AND a.image IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM "ArticleRevision" AS r WHERE r."articleId" = a.id AND r."userId" IS NOT NULL
  );
