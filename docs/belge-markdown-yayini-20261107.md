# Kurum belgelerinin Markdown yayını · 07.11.2026

576 DPB kaydı ve 136 ayrı Adalet Bakanlığı genelgesi artık
`src/content/belgeler/dpb/` ve `src/content/belgeler/genelge/` altında ayrı
Markdown dosyalarıdır. Haber koleksiyonuna eklenmezler. Mevcut adresler,
okunma sayaçları, kaynak PDF'ler ve kaynak SHA256 kimlikleri korunur.

`BelgeSayfasi.astro` özgün Markdown'ı üstte, metne dayalı soruları ve özgün
alıntıları altta gösterir. PDF iframe'i ve her sayfa için açılır kutu yoktur.
Kaynağın başlıkları, paragrafları, numaraları ve tabloları belge yazı tipiyle
gösterilir. Geniş tablolar kendi alanında kaydırılır. Bültenin içindekiler
maddeleri ilgili kaynak sayfasına bağlanır. Kaynak metin tarih biçimlendirme
katmanından `data-metin-koru` ile ayrılır.

## Kaynağa sadakat

- DPB'nin 576 kaydındaki sözcük ve sayılar önceki bağımsız PDF metin çıkarımıyla
  karşılaştırılır. Sayfa referansları, dizgi satırı sonları ve dekoratif boş
  sayfalar dışında ekleme veya kayıp kabul edilmez.
- Genelgelerdeki 851 tarama sayfası yerel Surya ve Türkçe Tesseract best ile
  işlendi. Farklı okunan satırlar yüksek çözünürlükte kırpılarak ve gerektiğinde
  döndürülerek tekrar okundu. OCR bağımlılıkları site derlemesine veya istemci
  paketine eklenmez.
- Kaynak görüntüsüyle karşılaştırılan 123 parça ve 18 tam satır
  `belge-fark-kontrolleri.json` ve `belge-gorsel-kontrolleri.json` içinde
  kaynak kimliği/sayfasıyla saklanır. Bunlar hedefli görsel kontrollerdir;
  taramaların bütün karakterlerinin insan tarafından tek tek doğrulandığı
  anlamına gelmez.
- Bazı PDF'lerde tek glife karşılık gelen hatalı ToUnicode dizilerinin sıfır
  genişlikli ek harfleri ayıklanır; gerçek ligatürler, birleştirici işaretler
  ve Latin dışındaki yazılar korunur. İhbar/İçinde örneği regresyon testindedir.
- Doğrulama kodları OCR ile yeniden üretilmez; kaynak altbilgi görüntüsü korunur.
  Özgün PDF karşılaştırma bağlantısı her belgede bulunur.
- Madde numaraları Markdown'ın otomatik liste numaralandırmasına bırakılmaz.
  Soru-cevap alıntıları ekranda gösterilen aynı Markdown metninden alınır.

## Tekrar üretme ve yayın kapısı

`scripts/belgeleri-markdowna-aktar.py` native PDF aktarımını ve kontrol edilmiş
tarama Markdown'larının birleştirilmesini yapar. Tarama işlemleri ayrı
`genelge-tarama-metinleri.py`, `genelge-ikinci-tanima.py`,
`genelge-fark-kontrol.py` ve `genelge-markdown-duzenle.py` komutlarıyla
yeniden başlatılabilir; ara dosyalar kaynak SHA256/sayfa ile saklanır.

`npm run build` öncesinde `belge-markdown-denetimi.mjs` çalışır: 712 dosyanın
varlığını, kaynak kimliklerini, genelge sayfa kapsamını, DPB sözcük/sayı
korumasını ve görsel kontrolde doğrulanan parçaları denetler. Eksik metinle veya
PDF gömüsüyle derleme yapılamaz. `belge-aktarim-denetimi.py` bağımsız DPB
karşılaştırma raporunu üretir.

`tests/belge-markdown.spec.ts` ve `tests/belge-ve-istatistik.spec.ts`; özgün
alıntıları, bölüm sırasını, içindekiler bağlantısını, kaynak tablo değerlerini,
PDF karakter haritasını, sayaçları ve beş genişlikte iki temayı denetler.
Site araması ve asistan dizini genelge metnini aynı Markdown koleksiyonundan
alır; tarama sayfaları boş metin olarak aramadan düşmez.
