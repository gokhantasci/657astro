# gys.657.com.tr yayını

GYS uygulaması ana siteyle birlikte derlenir ve `657.com.tr/gys-app/` altına yazılır. Alt alan adı
kickhex-production sunucusundaki nginx üzerinden bu dizini gösterir; sunucuda ayrı dosya tutulmaz.

## Adresler

| gys.657.com.tr | Kaynak (657.com.tr) | Not |
| --- | --- | --- |
| `/` | `/gys-app/` | Çalışma ekranı. `?secim=<düğüm>`, `?konu=<konu>`, `?soru=<soru>`, `?ders=<kanun>`, `?baslat=1` parametreleri statik sayfalardan gelen bağlantılardır; uygulama okuduktan sonra adresten siler. |
| `/sinavlar/`, `/sinav/<id>/` | `/gys-app/sinavlar/`, `/gys-app/sinav/<id>/` | Ağaçta soru sayısı ve süresi tanımlı her sınav düğümü bir sayfadır. |
| `/konular/`, `/konu/<id>/` | `/gys-app/konular/`, `/gys-app/konu/<id>/` | `gys-konular.json` kayıtları. |
| `/sorular/`, `/soru/<id>/` | `/gys-app/sorular/`, `/gys-app/soru/<id>/` | Bütün `gys-sorular*.json` soruları. Şıklar soru kimliğinden tohumlanır; her derlemede aynı sırada çıkar. |
| `/mulakat/`, `/canli-sinav/`, `/performans/`, `/studyo/`, `/ilanlar/` | `/gys-app/<aynı>/` | Uygulamanın diğer panelleri. |
| `/sitemap.xml`, `/robots.txt` | `/gys-app/sitemap.xml`, `/gys-app/robots.txt` | Yalnız gys adreslerini içerir; ana sitenin haritasına girmez. |

Bütün sayfaların canonical adresi `https://gys.657.com.tr/...` olur. `657.com.tr/gys-app/...` kopyaları bu yüzden
arama sonuçlarında ayrı sayfa olarak görünmez.

Yeni soru, konu ya da sınav düğümü eklemek için yalnız veri dosyası değişir; sayfa ve site haritası derlemede üretilir.

## Sunucu kuralı

Dosya: `/home/kickadmin/conf/web/gys.657.com.tr/nginx.ssl.conf_gys` (aynısı `nginx.conf_gys`). Hestia'nın
`location /` bloğundaki uzantı kuralı `.xml`, `.txt`, `.svg`, `.webmanifest` isteklerini yerel klasöre yönlendirdiği için
bu dosyalar tam eşleşmeli (`=`) kurallarla ana siteye aktarılır; `=` ve `^~` kuralları düzenli ifade kurallarından önce gelir.

Mevcut dosyanın başına eklenecek bölüm:

```nginx
# Statik GYS dizinleri (657.com.tr/gys-app/ altında derlenir)
location = /sitemap.xml { proxy_pass https://657.com.tr/gys-app/sitemap.xml; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
location = /robots.txt { proxy_pass https://657.com.tr/gys-app/robots.txt; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
location = /favicon.svg { proxy_pass https://657.com.tr/favicon.svg; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
location = /gys-manifest.webmanifest { proxy_pass https://657.com.tr/gys-manifest.webmanifest; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
location = /sw.js { proxy_pass https://657.com.tr/sw.js; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
location ^~ /konu/ { proxy_pass https://657.com.tr/gys-app/konu/; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
location ^~ /soru/ { proxy_pass https://657.com.tr/gys-app/soru/; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
location ^~ /sinav/ { proxy_pass https://657.com.tr/gys-app/sinav/; proxy_ssl_server_name on; proxy_set_header Host 657.com.tr; }
```

Mevcut panel kuralının listesine `mulakat`, `sinavlar` ve `sorular` eklenir:

```nginx
location ~ ^/(konular|canli-sinav|performans|studyo|ilanlar|mulakat|sinavlar|sorular)/?$ {
```

Uygulama: `nginx -t && systemctl reload nginx`. Doğrulama:

```sh
for p in / /sinavlar/ /konular/ /sorular/ /mulakat/ /konu/657-dmk/ /soru/t7201-01/ /sinav/yazi-isleri-muduru/ /sitemap.xml /robots.txt /favicon.svg /gys-manifest.webmanifest; do
  printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://gys.657.com.tr$p"
done
```

## Search Console

1. `gys.657.com.tr` için ayrı bir URL öneki mülkü (`https://gys.657.com.tr/`) yoksa eklenir. `sc-domain:657.com.tr`
   alan mülkü varsa alt alan adı zaten onun kapsamındadır; site haritası oraya da gönderilebilir.
2. Site haritaları bölümüne `https://gys.657.com.tr/sitemap.xml` girilir.
3. Birkaç örnek adres (`/sorular/`, `/konular/`, bir `/soru/...`) URL denetimiyle dizine eklenmeye istenir.

Site haritası yalnız sunucu kuralından sonra 200 döner; önce kural, sonra Search Console.
