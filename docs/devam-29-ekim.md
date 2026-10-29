# 29 Ekim 2026 devam kaydı

Bu kayıt Claude aktarımından sonra yapılan değişiklikleri ve açık kapsamı ayırır.

## Eklenen ve düzeltilenler

- Haberler beşli sayfalanır; kaynak filtresi değişince ilk sayfaya döner. Boş, `#`, betik ve anasayfa haber adresleri ayrıştırıcıdan reddedilir. Bakanlığın ilk beş güncel bağlantısı uzaktan okunarak haber başlıklarıyla doğrulandı.
- THH bilirkişi hesabında gelir vergisi oranı değiştirilebilir; varsayılan %15 ve sıfırlama korunur.
- Görünen sayısal tarihler `gg-aa-yyyy`; veriler ve `datetime` öznitelikleri ISO kalır. Eski JSON sözleşmelerindeki noktalı tarih biçimi korunur.
- Mülakat kartı, soru ayrıntısı ve sözlük teriminde isteğe bağlı Türkçe sesli okuma. Tarayıcı sesi veya Piper Fahrettin; Piper Web Worker içinde çalışır, metin sunucuya gönderilmez. Model kullanıcı seçip okuttuğunda Hugging Face'ten, çalışma dosyaları paket/CDN kaynaklarından indirilir. Piper model kartında veri kümesi CC0; paket MIT. Ayrı gerçek tarayıcı testi indirme ve ses üretimini doğruladı.
- Okunmanın arşiv + GA4 toplamı korunur; yenilemede artan bu tarayıcıya ait ziyaret ayrıca gösterilir. Yerel ziyaretler genel toplam diye sunulmaz. Herkesin ortak güncel sayısı için mevcut GA4 hizmet hesabı ve yayın başlangıcı kurulumu hâlâ gerekir; GitHub Pages tek başına yazılabilir sayaç sunmaz.
- 16 eski tema JSON adresi ve 6 kök `/data/` karşılığı aynı veri biçimiyle üretilir. `tatiller.json` 2035'e kadar ortak tatil kaydından; `tebligatlar.json` ortak ücretlerden; `katsayilar.json` güncel katsayılardan; `veriler.json` 2026 yolluk satırı ortak H cetvelinden gelir. Diğer uçlar herkese açık kaynak aktarımıdır. Yönetim/e-posta/not dosyaları aktarılmaz. Liste `src/data/eski-json-manifest.json`, yenileme `node scripts/import-uyumluluk-json.mjs`.

## Sayısal sağlamalar

**Yolluk:** canlı 657'nin 2026 1–4. derece 860 TL, 5–15. derece 850 TL değerleri [yürürlükteki SBB H cetvelinden](https://www.sbb.gov.tr/wp-content/uploads/2025/12/8-H-Cetveli_2026Butcesi.pdf) doğrulandı. Ek gösterge 3600/6400/8000 eşiklerinde 870/880/890 TL uygulanır. Ortak kayıt `src/data/yolluk.json`; bunlar aylık katsayıya bağlı tutarlar değildir. Normal 33(d) konaklama tavanları görev gününe göre ilk 10 gün %160, sonraki 80 gün %50, sonraki 90 gün %40. Ekran 90 güne kadar gündelik hesabını kapsar; uzun görev farklı süre kuralı gerektirir.

YOHEP, 29.10.2026: üç görev günü, iki gece × 2.000 TL, 500+500 TL ulaşım, diğerleri sıfır. 860 TL grubunda brüt **6.332,00**, damga **48,06**, net **6.283,94 TL**. 870/880/890 gruplarında brüt 6.394/6.456/6.518, damga 48,53/49,00/49,47; testler eşleşir.

**Ters ek ders:** UTEDESHEP'te 3.716,24 TL, brüt seçildiğinde 16,85; net seçildiğinde normal gündüz/%15 ve tüketilmiş istisnalarla 20 saattir. Yerel ekranda brüt/net seçimi açıkça ayrılır ve bu örnek açıklanır. Tek bir kadrolu öğretmen ders türünü çözer; karma türlerden kesin saat çıkarılmaz.

**Belediye başkanı:** [2026 K cetveli IV/10](https://www.sbb.gov.tr/wp-content/uploads/2025/12/10-K-Cetveli_2026Butcesi.pdf) +2.280 göstergeyi, [Bakanlık görüşü](https://webdosya.csb.gov.tr/db/yerelyonetimler/icerikler/beled-ye-baskan-vek-l-ne-375-sayili-khk-20231002152634.pdf) 15.965 göstergelik ilave ödemeyi doğrular. İlave yalnız damgaya tabidir. Memurlar.net diğer belediye, 1/1, 01.10.2026 başlangıç, bekâr/kıdem 0 örnekleri:

| Nüfus | Brüt ödenek | İlave ödeme |
| --- | ---: | ---: |
| ≤10.000 | 113.878,01 | 25.153,05 |
| 10.001–50.000 | 129.633,13 | 25.153,05 |
| 100.001–250.000 | 184.776,05 | 25.153,05 |
| >2.000.000 | 365.959,93 | 25.153,05 |

Bu gelir kalemleri aynen eşleşir. Prim başlangıcı kaynaktaki 12.978,97 TL'dir; gerçek prim bordrodan girilir, nüfustan türetilmez. Kaynağın netiyle fark gizlenmez: düşük örnekte kaynak 114.320,00; GİB 33.030 TL asgari ücret ve görünen primle yerel hesap 114.324,01 TL. Aile/dil, rapor, kıst ödeme ve otomatik prim intibakı kapsam dışıdır. MAHEP'te belediye başkan yardımcısının bulunması aynı rejim anlamına gelmez.

## Önceki işlerin durumu

Muhtar dönem tablosu, ana maaş formunun istenen açılış profili, ortak enflasyon katsayıları, sözlük araması, GitHub Pages'te çalışan öneri formu, 50'lik ortak tablo sayfalaması, adli çevre JSON şablonu, aranabilir seçimler, footer, bayrak, kurumsal metinler, tatiller 2035, yarım gün kararı ve GA/GSC etiketleri önceki çalışmada eklenmişti. Testleri devam ettirildi.

Genel unvan envanterinin tamamı doğrulanmış değildir. Eski 4/C geçiş modeli, asker emeklilik cetvelleri, II. öğretim/öz gelirli akademik türler ve bütün kurum/TİS varyantları açık kalır. Kaynak ve profil ayrıntıları `maas-saglama.md` içindedir. GitHub deposunun açılması/yayın ve GA4 hizmet hesabı kurulumu yerel değişikliklerden ayrı takip edilir.

## Yayın hazırlığı

Kullanıcının herkese açık depo seçimiyle `gokhantasci/657astro` oluşturuldu. Pages kaynağı GitHub Actions. Alan adı/DNS değiştirilmez; ilk yayın `/657astro/` proje yolundadır. `BASE_PATH` depo değişkeni yoksa iş akışı bu yolu kullanır; alan adı köküne geçişte `/` olarak ayarlanır. HTML bağlantıları, görseller, yönlendirmeler ve tarayıcı JSON istekleri ortak yol yardımcısıyla uyumludur. Proje önizlemesi noindex olarak üretilir; canonical üretim alan adında kalır.

Doğrulama: genel takımda 296 geçti, ağ/model testi ayrı; statik önizlemede gerçek Piper sesi ve iki tema/dar ekran dahil 3 ses testi geçti. Proje yolu değişikliğinden sonra 33 ilgili test geçti. Normal ve `/657astro/` derlemeleri 16.562 sayfa üretti. Alt dizin altında 7 sayfanın bağlantıları, dosyaları, sözlük araması ve kart verileri gerçek tarayıcıda hatasız çalıştı. Sonraki yayın sonucu aşağıya eklenir.

## Yayın sonucu

Canlı önizleme: https://gokhantasci.github.io/657astro/
Depo: https://github.com/gokhantasci/657astro
GitHub Actions #3 (4c42b11) hem derleme hem Pages dağıtımında başarılı: https://github.com/gokhantasci/657astro/actions/runs/40900776842 . İlk gönderimde paket dosyalarının eksik olması düzeltildi; Piper/ONNX sürümleri package.json ve kilit dosyasıyla depoda. Canlı siteden gerçek Türkçe Piper sesi üretildi; 3 ses testi geçti. Haber sayfası 2/14, sözlük araması, kart yükleme ve 6.283,94 TL yolluk örneği canlı tarayıcıda doğrulandı. Kök JSON uçları 200 döndü, tatiller 2035 ve aylık katsayı 1,575512 doğrulandı. Yerel 4322 önizlemesi korundu; geçici araştırma sunucuları kapatıldı. Alan adı ve DNS değişmedi. GA4 hizmet hesabı kurulumu ve açık maaş varyantları tamamlanmış sayılmaz.
