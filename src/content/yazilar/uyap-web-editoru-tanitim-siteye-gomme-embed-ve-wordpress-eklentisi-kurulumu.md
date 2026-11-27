---
title: "UYAP Web Kelime İşlemci (udf.657.com.tr): Java’sız UDF Editörü, Siteye Gömme (Embed) ve WordPress Eklentisi Kurulumu"
description: "Java kurmadan tarayıcıda .udf açma, düzenleme, PDF/Word dışa aktarma, KVKK maskeleme ve yerel AI Hukuk Asistanı sunan UYAP Web Kelime İşlemci tanıtımı; 1 satırda siteye embed etme ve WordPress eklentisi kurulum rehberi."
date: "2026-11-24"
updated: "2026-11-24"
kategori: ["Faydalı", "Haberler"]
kaynak: "https://udf.657.com.tr/"
gorsel: "./gorseller/kapak-adalet-mevzuat.jpg"
gorselAlt: "Adalet Bakanlığı, yargı kararları ve mevzuat düzenlemelerini temsil eden 657.com.tr kapak görseli"
---

Adliye çalışanları, avukatlar, bilirkişiler ve vatandaşlar için geliştirdiğimiz açık kaynaklı **UYAP Web Kelime İşlemci ([udf.657.com.tr](https://udf.657.com.tr/))**, Java JRE kurulumuna gerek kalmadan doğrudan tarayıcı içinde `.udf` belgelerini açmanıza, düzenlemenize, orijinal UYAP XML (1.8) şemasına uygun kaydetmenize ve PDF/Word olarak dışa aktarmanıza imkân tanır.

Tüm işlemler **%100 istemci taraflı (Zero-Server)** çalışır; açtığınız veya yazdığınız hiçbir dilekçe ya da mahkeme kararı herhangi bir sunucuya gönderilmez.

## Öne Çıkan Özellikler (`udf.adalet.gov.tr` Paritesi + Güncel Editör Araçları)

| Kategori | Özellikler |
|---|---|
| **Tam UYAP Hizalama & Sayfalama** | Gerçek A4/A5 dikey-yatay sayfalama, çok sayfalı liste (`<ol>`/`<ul>`) ve tablo bölme, `TabSet` sekme durakları, 2. sayfadan itibaren üst yazı, alt bilgi, sayfa numarası, karekod ve filigran paritesi. |
| **Biçimlendirme & Stil** | 20+ UYAP yazı tipi, sola/ortala/sağa/iki yana yasla, satır aralığı, ilk satır ve asılı girinti (`Hanging`), 25+ renkli palet, tablo/resim/barkod ekleme, üst/alt yazıya çift tıklayarak yerinde düzenleme. |
| **Güncel Kelime İşlemci Araçları** | Slash (`/`) hızlı ekleme menüsü, Zen odaklanma modu, Belge Karşılaştırma (Diff), Sürüm Geçmişi, Hukuki Bölüm Gezgini (İddia/Savunma/Gerekçe/Hüküm/Kanun Yolu), Metin Genişletici ve Türkçe imla denetimi. |
| **Hukuk Asistanı & KVKK** | Tarayıcı içi yerel yapay zeka ile karar özeti ve istinaf/temyiz süresi kontrolü; tek tıkla T.C. Kimlik, telefon, IBAN, adres ve ad-soyad **KVKK maskeleme**. |
| **Sesli Okuma & Sanal Yazıcı** | Tarayıcıda çalışan Türkçe **Piper TTS** sesli okuma; Windows için tek komutla kurulan **"UYAP'a Yazdır (Print to UDF)"** sanal yazıcısı. |
| **E-İmza Desteği** | E-imzalı belgeleri salt okunur güvenlik bandıyla açma ve bilgisayardaki yerel **Adalet E-İmza** uygulamasıyla doğrudan imzalama. |

- **Canlı Web Editörü:** [https://udf.657.com.tr/](https://udf.657.com.tr/)
- **Açık Kaynak GitHub Deposu:** [https://github.com/gokhantasci/uyap-kelime-islemci](https://github.com/gokhantasci/uyap-kelime-islemci)

---

## Web Sitenize 1 Satır Kodla Nasıl Gömebilirsiniz? (Embed SDK)

Kendi hukuk bürosu sitenize, baro portalınıza veya mevzuat blogunuza tek bir `<script>` etiketiyle **UDF Düzenleyici** veya **Salt Okunur UDF Görüntüleyici** ekleyebilirsiniz.

### 1. Düzenleyici (Editor) Modu

Ziyaretçilerinizin doğrudan sayfanızda dilekçe yazıp `.udf` olarak indirebilmesi için:

```html
<script
  src="https://udf.657.com.tr/embed.js"
  data-mode="editor"
  data-theme="light"
  data-width="100%"
  data-height="720px">
</script>
```

### 2. Görüntüleyici (Viewer) Modu

Sitenizde barındırdığınız bir `.udf` karar veya dilekçe örneğini ziyaretçilerinize doğrudan okutmak için:

```html
<script
  src="https://udf.657.com.tr/embed.js"
  data-mode="viewer"
  data-src="https://siteniz.com/dosyalar/ornek-dilekce.udf"
  data-theme="light"
  data-width="100%"
  data-height="650px">
</script>
```

### 3. JavaScript API ile Belirli Bir Kutuya Yerleştirme

```html
<div id="uyap-alani"></div>
<script src="https://udf.657.com.tr/embed.js"></script>
<script>
  window.UkiEmbed.create({
    container: '#uyap-alani',
    mode: 'editor',   // 'editor' veya 'viewer'
    theme: 'light',   // 'light' veya 'dark'
    width: '100%',
    height: '720px'
  });
</script>
```

| Parametre (`data-*`) | Varsayılan | Açıklama |
|---|---|---|
| `data-mode` | `editor` | `editor` (düzenleme + indirme) veya `viewer` (salt okunur görüntüleme) |
| `data-src` | *(boş)* | Açılışta yüklenecek `.udf` dosyasının tam HTTPS adresi |
| `data-theme` | `light` | `light` (aydınlık) veya `dark` (karanlık) tema |
| `data-width` / `data-height` | `100%` / `700px` | Çerçeve genişliği ve yüksekliği |
| `data-target` | *(otomatik)* | Editörün içine yerleştirileceği CSS seçicisi (ör. `#uyap-alani`) |

---

## WordPress Eklentisi Nasıl Kurulur ve Kullanılır?

WordPress tabanlı siteler için hazırlanan ücretsiz resmi eklentiyle hiçbir kod yazmadan kısa kod (**shortcode**) kullanarak editörü yazı ve sayfalarınıza ekleyebilirsiniz.

### Kurulum Adımları

1. **Eklenti ZIP dosyasını indirin:** [uyap-kelime-islemci-wordpress-plugin.zip (GitHub)](https://github.com/gokhantasci/uyap-kelime-islemci/raw/master/releases/uyap-kelime-islemci-wordpress-plugin.zip)
2. WordPress yönetim panelinde **Eklentiler → Yeni Eklenti Ekle → Eklenti Yükle** bölümüne girip indirdiğiniz `.zip` dosyasını seçin ve **Şimdi Kur** butonuna tıklayın.
3. Kurulum bittiğinde **Eklentiyi Etkinleştir** seçeneğine tıklayın.

### Kısa Kodlar (Shortcodes)

Herhangi bir yazı veya sayfa bloğuna (Kısa Kod bloğu) aşağıdaki ifadelerden birini yapıştırmanız yeterlidir:

- **Düzenleyici eklemek için:**
  ```text
  [uyap_editor width="100%" height="720px" theme="light"]
  ```
- **Mevcut bir `.udf` dosyasını görüntülemek için:**
  ```text
  [uyap_viewer src="https://siteniz.com/wp-content/uploads/ornek-karar.udf" width="100%" height="650px" theme="light"]
  ```

---

## Masaüstünde Tek Komutla Kurulum ve Kaynaklar

- **Canlı Editör:** [udf.657.com.tr](https://udf.657.com.tr/)
- **657.com.tr Hızlı UDF Araçları:** [UDF Görüntüleyici](/udf-goruntuleyici/) · [UDF Metin Düzenleme](/udf-editor/) · [UDF Birleştirme](/udf-birlestirme/)
- **GitHub Deposu ve Sürümler:** [github.com/gokhantasci/uyap-kelime-islemci](https://github.com/gokhantasci/uyap-kelime-islemci) · [Releases](https://github.com/gokhantasci/uyap-kelime-islemci/releases)
