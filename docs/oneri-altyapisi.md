# Öneri kaydı ve yönetici onayı

Akış: site formu → ayrı Python/Flask servisi → özel SQLite kuyruğu → yönetici incelemesi → onaylı JSON için GitHub commit → mevcut GitHub Actions / Pages yayını.

GitHub Pages yalnız statik siteyi sunar; veritabanı ve yönetici oturumu ayrı servistedir. WordPress'e veya mevcut canlı sunucuya bu çalışma kapsamında dosya yazılmaz. Servisin canlıya kurulması, alt alan adı/TLS ve yayın anahtarı ayrıca yapılandırılır.

## Yerel kullanım

```powershell
python -m venv artifacts/oneri-venv
artifacts/oneri-venv/Scripts/python -m pip install -r services/oneriler/requirements.txt
artifacts/oneri-venv/Scripts/python services/oneriler/run-local.py
```

Form: `http://127.0.0.1:4322/oneri/?tur=mulakat`. Yönetim: `http://127.0.0.1:4326/`. Yerel yönetim yalnızca loopback IP ve localhost/127.0.0.1 Host başlığıyla açılır; başka bilgisayarlara sunulmaz. Veritabanı ve oturum anahtarı git dışında `artifacts/oneri-servisi/` içinde kalır. Yerel mod canlıda kullanılmaz.

GitHub anahtarı yokken kayıt alınır ve panel açılır, fakat onaylı içerik GitHub'a gönderilemez; panel bunu açıkça belirtir. GitHub aktarımı testlerde sahte uzak uçla denetlenir; test içerikleri gerçek depoya yayımlanmaz.

## Sunucu kurulumu

`services/oneriler` ayrı bir dizine alınır. Docker Compose yalnız `127.0.0.1:4326` portunu açar. `.env` sunucuda oluşturulur, depoya eklenmez:

```dotenv
ONERI_SECRET=uzun-rastgele-oturum-anahtari
ONERI_ADMIN_PASSWORD_HASH=werkzeug-ile-uretilmis-parola-ozeti
ONERI_ORIGINS=https://657.com.tr,https://gokhantasci.github.io
ONERI_TRUST_PROXY=1
GITHUB_TOKEN=yalniz-hedef-depoya-yetkili-yayin-anahtari
```

Parola özeti sunucuda `python -c "from getpass import getpass; from werkzeug.security import generate_password_hash; print(generate_password_hash(getpass()))"` ile hazırlanabilir. Düz parola dosyaya veya kaynak koda yazılmaz. Rastgele oturum anahtarı `python -c "import secrets; print(secrets.token_urlsafe(48))"` ile üretilir. Canlı mod, oturum anahtarı/parola özeti olmadan başlamaz. `ONERI_LOCAL` tanımlanmaz.

GitHub için `gokhantasci/657astro` ile sınırlı, Contents: Read and write yetkili fine-grained PAT veya eşdeğer GitHub App kurulum anahtarı gerekir. Mevcut publisher doğrudan PAT/kurulum erişim tokenı alır; GitHub App token yenilemesini kendi başına yapmaz. Anahtarın süresi bitince kuyruk korunur, yayın hata durumuna geçer. Tarayıcıya anahtar verilmez. Contents API ile `main` dalında yalnız `src/data/onayli-oneriler/<uuid>.json` oluşturulur. Anahtarın teknik depo yetkisi daha geniş olduğundan ayrı depoya sınırlama ve sunucu sırlarının korunması önemlidir.

Alt alan adı (örneğin `oneri.657.com.tr`) TLS ters proxy ile servise yönlendirilir. Örnek Nginx konumu:

```nginx
location / {
    client_max_body_size 16k;
    proxy_pass http://127.0.0.1:4326;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
}
```

`ONERI_TRUST_PROXY=1` yalnız servise dışarıdan doğrudan ulaşılamıyorsa kullanılır. Nginx örneği başlığı yeniden yazar; gelen ziyaretçi başlığına güvenmez. Cloudflare varsa gerçek IP yalnız güvenilir Cloudflare aralıklarıyla ayrıca tanımlanmalıdır. Aksi halde tüm ziyaretçiler proxy IP'sini paylaşarak gönderim sınırına birlikte takılabilir. TLS, güvenli yönetici çerezleri için zorunludur.

Sitede derleme değişkeni `PUBLIC_ONERI_API=https://oneri.657.com.tr/api/oneriler` ayarlanır. GitHub Actions bu değeri depo değişkeninden alır. Yerel sitede varsayılan loopback servisi kullanılır; diğer adreslerde bu değişken boşsa gönderim düğmesi kapalıdır ve kullanıcıya kayıt servisi bağlı değil mesajı gösterilir. Yanlış başarı mesajı veya e-posta yönlendirmesi yoktur.

## Onay ve hata davranışı

Panelde başlık, cevap/anlam ve kaynak düzenlenir. “Onayla ve GitHub'a gönder” ile yalnız kamuya açık içerik hazırlanır. Gönderen adı, IP özeti ve bekleyen öneriler depoya gönderilmez. Kaynak alanı kişisel bilgi içermemesi için yönetici tarafından kontrol edilir.

Yayın isteği başladıktan sonra içerik dondurulur. Bağlantı koparsa yeniden denemede aynı dosya kontrol edilir; aynı içerik ikinci kez oluşturulmaz. Farklı içerikle aynı UUID varsa üzerine yazılmaz. Onay sonrası paneldeki durum GitHub'a aktarımı ifade eder; sitenin derlenip yayına çıkması GitHub Actions'ta ayrıca takip edilir. Yayın iş akışı başarısız olursa çalışan Pages sürümü korunur, hata giderildikten sonra iş akışı yeniden çalıştırılır.

Yeni içerikler çakışmayı önleyen `...-oneri-<uuid-ilk-8>` adresiyle yayımlanır. Var olan bir terimin/sorunun doğrudan üzerine yazılması bu ilk sürümde desteklenmez; düzeltme önerisi yönetici tarafından değerlendirilir. Veri şeması bilinmeyen alanları reddeder; özel alanların yanlışlıkla JSON'a konması derlemeyi durdurur. Mevcut soru/terim sayfaları, arama dizinleri, kartlar ve sitemap onaylı JSON'u otomatik kullanır.

Bekleyen/reddedilen kayıtlar 90 gün sonra servis isteği sırasında temizlenir. Onaylanan kayıttaki gönderen adı silinir. Yayın hataları çözüm için korunur. SQLite dosyası kalıcı Docker volume'dedir; düzenli, şifreli sunucu yedeği alınmalıdır. Kayıp disk/yedek yönetimi Docker'ın kendisi tarafından çözülmez.

Testler: `cd services/oneriler; python -m unittest -v test_app`. Kimlik doğrulama, CSRF, Origin, gönderim sınırı, XSS kaçışı, özel alanların dışarı çıkmaması, düzenleyerek onay, red, yayın hatası ve idempotent GitHub yeniden denemesi kapsanır. Ön yüzün kayıt ve hata davranışı Playwright ile kontrol edilir.

Kaynaklar: [Flask canlı kurulum](https://flask.palletsprojects.com/en/stable/deploying/), [güvenilir ters proxy](https://flask.palletsprojects.com/en/stable/deploying/proxy_fix/), [GitHub Contents API](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents).
