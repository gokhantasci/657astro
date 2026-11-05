# Tarife kalemi seçimi — 5 Kasım 2026

Uzlaştırmacı tarifesinde ilk birkaç seçenek fare ve dokunma ile seçilebiliyordu. Bütün kalemleri sırayla tıklayan test, alt seçeneklerde takıldı: sabit çerez şeridi açılır listenin altını örtüyor ve tıklamayı yakalıyordu. Test günlüğünde `.cerez__ic intercepts pointer events` görüldü; bu durumda seçilen kalem ve önceki rakamlar değişmiyordu.

Ortak seçim kutusunun konumu artık görünen çerez şeridinin üst sınırını kullanılabilir alanın sonu olarak dikkate alır. Aşağıda yeterli alan yoksa liste yukarı açılır. Çerez şeridinin katmanı veya izin davranışı değiştirilmedi. Çerez şeridi gizliyken önceki konum hesabı korunur.

Tarife alanlarının kimlikleri ve etiketleri açık tanımlandı; seçenek değerleri görüntü metninden bağımsız belirtildi. Karşılaştırma hem input hem change olayına yanıt verir, aynı seçim için iki kez çizim yapmaz. Seçili kalem grafik üzerinde yazılır ve `kalem` URL parametresiyle sayfa yenilendiğinde korunur. Geçersiz kalem parametresi ilk geçerli seçeneğe döner.

Grafik her kalemin en yüksek tutarını kendi ölçeği olarak kullandığından farklı kalemler benzer çubuk oranları gösterebilir. Bazı ayrı kalemlerin kayıtlı ücretleri de aynıdır. Tutarlar, geçmiş ücretler ve artış hesabı değiştirilmedi; seçimden sonra veride bulunan karşılık gösterilir.
