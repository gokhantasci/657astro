# Ortak veri güncelleme

## AAÜT

`src/data/hukuk-tarifeleri.json` → `vekalet` dizisi. Önceki kaydın `bitis` değerini yeni yürürlük tarihinden bir gün önceye ayarlayın; yeni kayıt için `baslangic`, kaynak PDF, nispi `basamaklar` ve mahkemelerin `maktu` tutarlarını girin. Harçlar ayrı `harclar` dizisidir; AAÜT değişti diye harç tutarları değiştirilmez.

03/11/2026 tarife girişi yapıldı. Önceki dönem 02/11/2026 tarihinde kapanır. Asliye/Aile 62.000 TL, ilk nispi dilim 800.000 TL ve %16. Karar/işlem tarihine göre seçim yapılır.

## Aylık TÜFE

`src/data/enflasyon.json` → `aylar` içindeki ilgili yıl/ay kaydına `degisim` yazın. Örneğin Ekim 2026 için `{"yil":2026,"ay":10,"degisim":2.58}`. Resmî genel endeksi biliyorsanız `endeks` de yazın. Eksik endeks oranlardan hesaplanır ve ekranda yaklaşık olarak işaretlenir; resmî endeks diye sunulmaz.

`kayitTarihi`, `kaynakUrl` ve `kaynak` açıklamasını güncelleyin. Ekim 2026 aylık %2,58, TÜİK 58291 bülteni kaynak gösterilerek girildi. Endeks ek tablosuna erişilemediği için Ekim endeksi türetilmiştir.

## Yayın

`npm run build` doğrulama, dönem arşivleme ve aylık haber üretimini çalıştırır. JSON değişikliği depoya gönderildiğinde GitHub Actions aynı işlemi yapar. `npm run preview -- --port 4322` yerel çıktıyı açar. Beklenmeyen hesap farkında önce işlem tarihini ve seçilen dönemi kontrol edin.

Mevcut canlı yönetim paneli yalnız öneri onayı ve sayaç içindir; tarife/TÜFE düzenleme formu henüz eklenmedi. Bu iki kayıt şimdilik dosya üzerinden güncellenir.
