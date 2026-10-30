# Sonraki dönem maaş tahmini

30.10.2026: Kadrolu ve sözleşmeli memur, memur/asker emeklisi, ücretli öğretmen, muhtar, belediye başkanı, ek ders ve akademik ek ders hesaplarında sonraki dönem neti gösterilir. Güncel unvan maaşı sayfalarında düşük ve kıdemli profil için de hesaplanır. Geçmiş dönem arşivlerine tahmin eklenmez.

## Ortak veri ve hesap

`maas-tahmini-veri.ts`, enflasyon robotuyla aynı `enflasyon.json`, ortak katsayı ayarları ve vergi verisini kullanır. Açıklanmış aylar bu kaynaktan gelir; tarayıcı kaydı resmî ayları değiştiremez. Açıklanmayan aylar için robotta girilen tahminler aynı tarayıcıdaki `657:enflasyon-tahmin:<dönem>` kaydından okunur; boş ay %0 kabul edilir.

Enflasyon farkı dönem başındaki toplu sözleşme artışından arındırılır. Pozitif fark ve sonraki dönem artışı bileşik uygulanır. Ocak 2027 için %5 artış, [Çalışma ve Sosyal Güvenlik Bakanlığı açıklaması](https://www.csgb.gov.tr/cgm/haberler/27082025/) ve [Hakem Kurulu kararı](https://www.resmigazete.gov.tr/eskiler/2025/08/20250827-18.pdf) ile karşılaştırılmıştır.

Net maaş doğrudan zam oranıyla çarpılmaz. Yeni aylık, taban ve yan ödeme katsayılarıyla ilgili hesap motoru yeniden çalışır. Derece, hizmet yılı, aile ve kişisel kesintiler aynı tutulur. Yıl değişiyorsa kümülatif vergi matrahı sıfırlanır. Veri setinde yeni yılın vergi/asgari ücret bilgisi bulunmadığında mevcut yıl değerleri kullanıldığı ekranda belirtilir; bu bir kesin bordro değildir.

Sözleşme ücreti katsayı artışı oranında yükseltilir. Belediye başkanında elle girilen çalışan primi de aynı oranda artırılır. Muhtarda mevcut asgari ücret tabanı korunur. Emekli ikramiyesi ayrıca yeniden hesaplanır.

4/D işçi ücretine memur katsayı artışı uygulanmaz. Kullanıcı kurum/TİS zam senaryosunu girince ücret ve ilgili brüt kalemler bu oranda artırılır; mevcut vergi, prim, istisna kuralları korunur. TİS alanı boşken gelecek neti gösterilmez.

## Kontroller

`tests/maas-tahmini.spec.ts`: resmî ayların korunması, bileşik artış, matrah sıfırlanması, netin yeniden hesaplanması, robot senaryosunun maaş sayfalarına taşınması, form değişikliği, mobil açık/koyu tema, TİS alanı ve geçmiş unvan sayfalarının korunması.
