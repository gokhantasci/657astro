export {};
// Tarihte Bugün: Wikimedia/Wikipedia TR OnThisDay REST API + doğrulanmış Türk hukuk/Cumhuriyet tarihi yedeği

interface Olay {
  yil: number;
  metin: string;
  url?: string;
}

const YEREL_OLAYLAR: Record<string, Olay[]> = {
  '11-24': [
    { yil: 1928, metin: 'Millet Mektepleri Talimatnamesi yayımlandı; Gazi Mustafa Kemal Atatürk’e "Başöğretmen" unvanı verildi.' },
    { yil: 1934, metin: 'TBMM tarafından 2587 sayılı Kanunla Gazi Mustafa Kemal Paşa’ya "Atatürk" soyadı verildi.' },
    { yil: 1981, metin: '24 Kasım, Türkiye’de ilk kez resmî olarak "Öğretmenler Günü" olarak kutlandı.' },
  ],
  '10-29': [
    { yil: 1923, metin: 'Türkiye Büyük Millet Meclisi’nde Cumhuriyet ilan edildi; Mustafa Kemal Atatürk ilk Cumhurbaşkanı seçildi.' },
  ],
  '04-23': [
    { yil: 1920, metin: 'Türkiye Büyük Millet Meclisi Ankara’da açıldı; ulusal egemenlik ilkesi resmen ilan edildi.' },
  ],
  '07-14': [
    { yil: 1965, metin: '657 sayılı Devlet Memurları Kanunu TBMM tarafından kabul edildi.' },
  ],
  '01-20': [
    { yil: 1921, metin: 'Teşkilât-ı Esasiye Kanunu (1921 Anayasası) TBMM tarafından kabul edildi.' },
  ],
  '04-20': [
    { yil: 1924, metin: '491 sayılı 1924 Anayasası (Teşkilât-ı Esasiye Kanunu) kabul edildi.' },
  ],
};

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const root = document.querySelector<HTMLElement>('[data-tarihte-bugun]');
if (root) {
  const elAy = root.querySelector<HTMLSelectElement>('[data-tb-ay]')!;
  const elGun = root.querySelector<HTMLSelectElement>('[data-tb-gun]')!;
  const elBugunBtn = root.querySelector<HTMLButtonElement>('[data-tb-bugun]')!;
  const elBaslik = document.querySelector<HTMLElement>('[data-tb-baslik]');
  const elDurum = root.querySelector<HTMLElement>('[data-tb-durum]')!;
  const elOlaylar = root.querySelector<HTMLElement>('[data-tb-olaylar]')!;
  const elDogumlar = root.querySelector<HTMLElement>('[data-tb-dogumlar]')!;
  const elOlumler = root.querySelector<HTMLElement>('[data-tb-olumler]')!;

  function listeCiz(el: HTMLElement, items: Olay[], bosMetin: string) {
    if (!items.length) {
      el.innerHTML = `<p style="color:var(--color-muted);font-size:var(--text-sm);margin:0;">${bosMetin}</p>`;
      return;
    }
    el.innerHTML = `<ul class="tb-liste">${items
      .map(
        (x) => `<li><strong class="num">${x.yil}</strong><span>${x.metin}${x.url ? ` <a href="${x.url}" target="_blank" rel="noopener noreferrer">Kaynak ↗</a>` : ''}</span></li>`
      )
      .join('')}</ul>`;
  }

  async function yukle(ay: number, gun: number) {
    const mm = String(ay).padStart(2, '0');
    const dd = String(gun).padStart(2, '0');
    if (elBaslik) elBaslik.textContent = `${gun} ${AYLAR[ay - 1]} Tarihte Bugün`;
    elDurum.textContent = 'Doğrulanmış tarih kayıtları yükleniyor…';

    const yerel = YEREL_OLAYLAR[`${mm}-${dd}`] ?? [];
    if (yerel.length) listeCiz(elOlaylar, yerel, '');

    try {
      const r = await fetch(`https://tr.wikipedia.org/api/rest_v1/feed/onthisday/all/${mm}/${dd}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const mapItems = (arr: any[]): Olay[] =>
        (Array.isArray(arr) ? arr : [])
          .filter((x) => x && typeof x.year === 'number' && typeof x.text === 'string')
          .sort((a, b) => b.year - a.year)
          .slice(0, 20)
          .map((x) => ({
            yil: x.year,
            metin: x.text,
            url: x.pages?.[0]?.content_urls?.desktop?.page,
          }));
      const olaylar = mapItems(data.events);
      const dogumlar = mapItems(data.births);
      const olumler = mapItems(data.deaths);
      listeCiz(elOlaylar, olaylar.length ? olaylar : yerel, 'Bu gün için kayıt bulunamadı.');
      listeCiz(elDogumlar, dogumlar, 'Bu gün için doğum kaydı bulunamadı.');
      listeCiz(elOlumler, olumler, 'Bu gün için vefat kaydı bulunamadı.');
      elDurum.textContent = `${olaylar.length} olay · ${dogumlar.length} doğum · ${olumler.length} vefat kaydı (Kaynak: Vikipedi TR Arşivi)`;
    } catch {
      listeCiz(elOlaylar, yerel, 'Canlı tarih servisine şu an ulaşılamadı; başka bir gün seçerek yeniden deneyebilirsiniz.');
      listeCiz(elDogumlar, [], 'Çevrimdışı modda doğum kayıtları gösterilemiyor.');
      listeCiz(elOlumler, [], 'Çevrimdışı modda vefat kayıtları gösterilemiyor.');
      elDurum.textContent = yerel.length ? 'Yerel doğrulanmış tarih kayıtları gösteriliyor.' : 'Canlı tarih servisine ulaşılamadı.';
    }
  }

  function buguneGit() {
    const now = new Date();
    elAy.value = String(now.getMonth() + 1);
    elGun.value = String(now.getDate());
    void yukle(now.getMonth() + 1, now.getDate());
  }

  elAy.addEventListener('change', () => void yukle(Number(elAy.value), Number(elGun.value)));
  elGun.addEventListener('change', () => void yukle(Number(elAy.value), Number(elGun.value)));
  elBugunBtn.addEventListener('click', buguneGit);
  buguneGit();
}
