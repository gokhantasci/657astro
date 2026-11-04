# Cloudflare yayın kuralları

Site GitHub Pages'e geçtiğinde Cloudflare'de gereken kurallar. Bu belge yalnız taslaktır; DNS ya da Cloudflare ayarlarında henüz hiçbir değişiklik yapılmadı. Yol haritası maddeleri: [P0-1, P0-3, P0-5](seo-aio-geo-aeo-denetimi-20261103.md#6-yol-haritası) ve paylaşılabilir hesap adresleri.

## Neden tek bir Worker

GitHub Pages yeniden yazma (rewrite) yapamaz ve gerçek 301 veremez. Gereken işler şunlar:

- 61 aracın paylaşım alt yolu
- eski sunucuda kalan yollar
- etiket ve yazar yönlendirmeleri

Hepsi tek bir Worker'la çözülür. Ücretsiz plandaki Transform Rule sınırına (10 kural) takılmaz. Kural listesi depodaki dosyalardan üretildiği için elle eşitlemek gerekmez.

## 1. Eski Nginx sunucusunda kalan yollar

Bu yollar GitHub Pages'te yoktur; isteğin bugünkü kaynağa (Hestia/Nginx) gitmesi gerekir:

| Yol | İçerik |
|---|---|
| `/dosyalar/uygulamalar/*` | 9 Windows/arşiv uygulaması (`src/data/dosyalar.json`) |
| `/_657-servis/*` | öneri, okunma ve indirme sayacı API'si |
| `/modeller/*` | asistan modeli (`/modeller/resolve/…`) ve Piper sesli okuma dosyaları (`/modeller/piper/…`) |
| `/denetimtutanagi.docx` | teftiş kalem denetimi şablonu |

## 2. Paylaşılabilir hesap adresleri

`/memur-maas-hesaplama/zabit-katibi/7-2/12-yil/…` gibi bir alt yol, aracın kök sayfasını **200** ile döndürmelidir. Seçimleri tarayıcı betiği (`src/scripts/paylasim-adresi.ts`) okur, sayfanın canonical adresi kök sayfa olarak kalır.

- Kök yol listesi: `scripts/paylasim-yollari.mjs` → `paylasimYollari()`. Bugün 61 yol var: maaş, harç, hukuk ve uygulama alanlarında taşınmış araçlar. Teftiş araçları ve alt sayfası olan dizinler bu listede yoktur.
- Worker yoksa GitHub Pages'in `404.html` yedeği aynı adreste aracı açar (`src/components/HataSayfasi.astro`). Bağlantı çalışır, ama HTTP durumu 404'tür ve sosyal ağ önizlemeleri genel görseli gösterir. Worker bunu düzeltir.

## 3. Yönlendirmeler

- `/tag/<etiket>/` ve `/tag/<etiket>/page/<n>/` → `/yazilar/?q=<etiket>` (301). Worker yoksa 404 yedeği aynı yönlendirmeyi tarayıcıda yapar.
- `src/data/wp-yonlendirmeler.json` kuralları ve `[...wp].astro` / `[eski]` sayfaları bugün meta-refresh ile çalışır. Worker aynı listeyi gerçek 301'e çevirir. Kuralları derleme sırasında bir JSON'a yazmak (`/yonlendirmeler.json`) ve Worker'ın bunu okuması, iki listenin ayrışmasını önler.
- Kişisel veri nedeniyle kaldırılan 11 yazı ([seo-canli-eksik-adresler.json](seo-canli-eksik-adresler.json) içinde `not` alanı olanlar) → **410**. Bunlar başka bir adrese yönlendirilmez.

## Worker taslağı

```js
// 657.com.tr/* rotasına bağlanır. ORIGIN_NGINX: bugünkü sunucunun Cloudflare'de proxy'lenen ayrı ana bilgisayar adı (ör. kaynak.657.com.tr).
const NGINX = [/^\/dosyalar\/uygulamalar\//, /^\/_657-servis\//, /^\/modeller\//, /^\/denetimtutanagi\.docx$/];
const GONE = new Set([/* seo-canli-eksik-adresler.json içinde not alanı olan 11 yol */]);
const PAYLASIM = [/* paylasimYollari() çıktısı, uzundan kısaya */];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const yol = decodeURIComponent(url.pathname);
    if (NGINX.some(r => r.test(yol))) { url.hostname = env.ORIGIN_NGINX; return fetch(new Request(url, req)); }
    if (GONE.has(yol)) return new Response('Bu içerik yayından kaldırıldı.', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const etiket = yol.match(/^\/tag\/([^/]+)\/?(?:page\/\d+\/?)?$/);
    if (etiket) return Response.redirect(`${url.origin}/yazilar/?q=${encodeURIComponent(etiket[1].replace(/-/g, ' '))}`, 301);
    const kok = !/\.[a-z0-9]{1,8}$/i.test(yol) && PAYLASIM.find(p => yol.startsWith(p) && yol.length > p.length);
    if (kok) { url.pathname = kok; const yanit = await fetch(new Request(url, req)); return new Response(yanit.body, { status: 200, headers: yanit.headers }); }
    return fetch(req);
  },
};
```

Yayından sonra doğrulanacaklar:

1. Eski sunucuya kalan yollar 200 dönüyor: `curl -I https://657.com.tr/modeller/piper/hazir.json`, `…/dosyalar/uygulamalar/kesinlesme.exe`.
2. Bir paylaşım alt yolu 200 dönüyor ve sayfanın canonical'ı kök araç adresi.
3. `/tag/gys/` 301 ile `/yazilar/?q=gys` adresine gidiyor.
4. Kaldırılan 11 yazıdan biri 410 dönüyor.
5. "Block AI bots" ve yönetilen `robots.txt` kapalı.


## Uygulama (04.11.2026)

Worker kaynağı depoda üretilir: `node scripts/cloudflare-worker.mjs` → `cloudflare/worker.js` (test: `tests/cloudflare-worker.spec.ts`). Liste değişince betik yeniden çalıştırılır ve Worker yeniden yüklenir.

Ücretsiz planda Origin Rule ile kaynak değiştirilemez ("not entitled to use the Origin Host override"). Bu yüzden eski sunucu yolları Worker'da `cf.resolveOverride` ile `kaynak.657.com.tr` kaydına gider; Host başlığı `657.com.tr` kalır ve sunucuda değişiklik gerekmez.

| Ayar | Değer |
|---|---|
| DNS kök | A → 185.199.108.153, .109, .110, .111 (proxy açık) |
| DNS `kaynak` | A → eski sunucu (proxy açık) |
| DNS `www` | CNAME → `657.com.tr`; Redirect Rule ile köke 301 |
| Worker rotası | `657.com.tr/*` → `657-yonlendirme`, sınır aşılırsa fail open |
| Worker'sız rotalar | `/_astro/*`, `/og/*`, `/fonts/*` (günlük 100.000 istek sınırı için) |
| SSL | Full (alan geneli, değişmedi) |

Önbellek kuralları (yalnız `657.com.tr`; alt alan adlarının kuralları değişmedi; sonraki kural öncekini ezer):

| Kural | Eşleşme | Edge | Tarayıcı |
|---|---|---|---|
| HTML ve geri kalan | eski sunucu yolları dışı | 30 dakika (4xx 60 sn, 5xx yok) | 5 dakika |
| Karma adlı varlıklar | `/_astro/*` | 1 yıl | 1 yıl |
| Görsel ve font | `/og/*`, `/fonts/*`, görsel ve font uzantıları | 30 gün | 7 gün |
| Site haritası, besleme, metin | `.xml`, `.txt` | 1 saat | 10 dakika |
| Atla | `/_657-servis/*`, `/wp-admin*`, `/wp-login.php`, `/wp-json/*` | önbelleğe alınmaz | |

Yayından sonra önbellek temizleme için `CLOUDFLARE_API_TOKEN` (yalnız Cache Purge yetkili) ve `CLOUDFLARE_ZONE_ID` GitHub secret'ları eklenmelidir; yoksa iş akışı adımı atlar ve HTML en çok 30 dakika eski kalır.

Geri alma: kök A kayıtlarını tek kayda (eski sunucu IP'si) döndürmek ve `657.com.tr/*` Worker rotalarını silmek yeterlidir. WordPress sunucusunda hiçbir şey değiştirilmedi.
