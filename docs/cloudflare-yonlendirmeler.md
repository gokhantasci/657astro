# Cloudflare yönlendirmeleri

GitHub Pages HTTP 301 veremez. Site eski adresler için `canonical + noindex + meta refresh` sayfaları üretir; arama motorları bunları çoğunlukla yönlendirme gibi işler ama gerçek 301 daha güvenlidir. Alan adı Cloudflare'de kaldığı için aşağıdaki kurallar **Rules → Redirect Rules (Single Redirects)** altında kurulabilir. Kurulana kadar statik sayfalar çalışmaya devam eder; kurulduktan sonra da zarar vermez.

## Kalıp kuralları (wildcard)

| Sıra | Eşleşen istek | Hedef | Durum |
| --- | --- | --- | --- |
| 1 | `https://657.com.tr/posts/adlicevre/*-adli-yargi-cevresi/*` | `https://657.com.tr/adlicevre/${1}-adliyesi-yargi-cevresi/` | 301 |
| 2 | `https://657.com.tr/posts/kelimeler/*/*` | `https://657.com.tr/kelime/${1}/` | 301 |
| 3 | `https://657.com.tr/posts/sozlukyeni/*/*` | `https://657.com.tr/${1}/` | 301 |
| 4 | `https://657.com.tr/kelimeler/*/` | `https://657.com.tr/kelime/${1}/` | 301 |
| 5 | `https://657.com.tr/sozlukyeni/*/` | `https://657.com.tr/${1}/` | 301 |

"Preserve query string" açık kalabilir. 1. kural WordPress'teki `/posts/adlicevre/([^/]+)-adli-yargi-cevresi/` (6.154 ziyaret) ve `/feed/` varyantının karşılığıdır.

## Tek adres kuralları

`src/data/wp-yonlendirmeler.json` WordPress Redirection eklentisindeki etkin 301 kurallarıdır (96 kural). Derleme, kaynağı sitede sayfa olan ya da hedefi henüz sitede bulunmayan kuralları atlar ve atlananları `[wp-yonlendirme]` uyarısıyla yazar. Cloudflare **Bulk Redirects** listesine aynı dosyadan aktarılabilir (`eski` → `https://657.com.tr` + `yeni`).

WordPress aramasına (`/?s=...`) giden 6 kural statik sitede arama sayfası olmadığından alınmadı: `/teskilat-semasi/`, `/categories/zabt-katibi-maaşları/`, `/posts/category/personel-alimi/adalet-bakanligi-personel-alimi/`, `/vhki-veri-hazirlama-kontrol-isletmeni-maasi/`, `/tags/tanık-ücreti/`, `/categories/tanıklık-ücret-tarifesi/`.

## Adli çevre eski adresleri

`src/data/adlicevre-eski.json → yonlendir`: `19-may`, `t-asova`, `eyup`, `cagliyancerit`, `bahsili-…-2` adresleri kaynaktaki güncel kayda yönlenir. Bunlar da tek adres kuralı olarak eklenebilir.
