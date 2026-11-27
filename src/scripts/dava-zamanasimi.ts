import {
  hesaplaDavaZamanasimi,
  KESME_ETIKETLERI,
  DURMA_ETIKETLERI,
  ETKISIZ_ETIKETLERI,
  formatTrTarih,
  ayMetni,
  ymdMetni,
  type CezaKademesiId,
  type YasGrubuId,
  type KesmeOlayi,
  type KesmeTuru,
  type DurmaDonemi,
  type DurmaTuru,
  type EtkisizOlay,
  type EtkisizTuru,
  type ZamanasimiSonuc,
} from '../lib/dava-zamanasimi';

const root = document.querySelector<HTMLElement>('[data-dz-app]');
if (root) {
  const sucEl = root.querySelector<HTMLInputElement>('#dz-suc')!;
  const incelemeEl = root.querySelector<HTMLInputElement>('#dz-inceleme')!;
  const kademeEl = root.querySelector<HTMLSelectElement>('#dz-kademe')!;
  const yasEl = root.querySelector<HTMLSelectElement>('#dz-yas')!;

  const kesmeListeEl = root.querySelector<HTMLElement>('[data-dz-kesme-liste]')!;
  const durmaListeEl = root.querySelector<HTMLElement>('[data-dz-durma-liste]')!;
  const etkisizListeEl = root.querySelector<HTMLElement>('[data-dz-etkisiz-liste]')!;

  const uyariEl = root.querySelector<HTMLElement>('[data-dz-uyarilar]')!;
  const durumEl = root.querySelector<HTMLElement>('[data-dz-durum]')!;
  const kartlarEl = root.querySelector<HTMLElement>('[data-dz-kartlar]')!;
  const modlarEl = root.querySelector<HTMLElement>('[data-dz-modlar]')!;
  const cizelgeEl = root.querySelector<HTMLElement>('[data-dz-cizelge]')!;
  const senaryoEl = root.querySelector<HTMLElement>('[data-dz-senaryolar]')!;
  const kopyalaBtn = root.querySelector<HTMLButtonElement>('[data-dz-kopyala]')!;

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

  let sonSonuc: ZamanasimiSonuc | null = null;

  function kesmeSatiriEkle(k: Partial<KesmeOlayi> = {}) {
    const row = document.createElement('div');
    row.className = 'dz-satir';
    row.dataset.dzKesme = '';
    const turOptions = (Object.entries(KESME_ETIKETLERI) as [KesmeTuru, { ad: string; dayanak: string }][])
      .map(([val, info]) => `<option value="${val}"${k.tur === val ? ' selected' : ''}>${esc(info.ad)} (${esc(info.dayanak)})</option>`)
      .join('');
    row.innerHTML = `
      <select class="dz-inp" data-f="tur" aria-label="Kesme nedeni">${turOptions}</select>
      <input class="dz-inp" type="date" data-f="tarih" aria-label="İşlem tarihi" value="${esc(k.tarih ?? '')}" />
      <input class="dz-inp" type="text" data-f="aciklama" placeholder="Kısa not (opsiyonel)" value="${esc(k.aciklama ?? '')}" />
      <button type="button" class="btn btn--quiet btn--kucuk dz-sil" aria-label="Satırı sil">Sil</button>
    `;
    row.querySelector('.dz-sil')!.addEventListener('click', () => {
      row.remove();
      guncelle();
    });
    row.addEventListener('input', guncelle);
    row.addEventListener('change', guncelle);
    kesmeListeEl.appendChild(row);
  }

  function durmaSatiriEkle(d: Partial<DurmaDonemi> = {}) {
    const row = document.createElement('div');
    row.className = 'dz-satir dz-satir--aralik';
    row.dataset.dzDurma = '';
    const turOptions = (Object.entries(DURMA_ETIKETLERI) as [DurmaTuru, { ad: string; dayanak: string }][])
      .map(([val, info]) => `<option value="${val}"${d.tur === val ? ' selected' : ''}>${esc(info.ad)}</option>`)
      .join('');
    row.innerHTML = `
      <select class="dz-inp" data-f="tur" aria-label="Durma nedeni">${turOptions}</select>
      <input class="dz-inp" type="date" data-f="baslangic" aria-label="Durma başlangıcı" value="${esc(d.baslangic ?? '')}" />
      <input class="dz-inp" type="date" data-f="bitis" aria-label="Yeniden başlama tarihi" value="${esc(d.bitis ?? '')}" />
      <input class="dz-inp" type="text" data-f="aciklama" placeholder="Açıklama (opsiyonel)" value="${esc(d.aciklama ?? '')}" />
      <button type="button" class="btn btn--quiet btn--kucuk dz-sil" aria-label="Satırı sil">Sil</button>
    `;
    row.querySelector('.dz-sil')!.addEventListener('click', () => {
      row.remove();
      guncelle();
    });
    row.addEventListener('input', guncelle);
    row.addEventListener('change', guncelle);
    durmaListeEl.appendChild(row);
  }

  function etkisizSatiriEkle(e: Partial<EtkisizOlay> = {}) {
    const row = document.createElement('div');
    row.className = 'dz-satir dz-satir--aralik';
    row.dataset.dzEtkisiz = '';
    const turOptions = (Object.entries(ETKISIZ_ETIKETLERI) as [EtkisizTuru, { ad: string; dayanak: string }][])
      .map(([val, info]) => `<option value="${val}"${e.tur === val ? ' selected' : ''}>${esc(info.ad)}</option>`)
      .join('');
    row.innerHTML = `
      <select class="dz-inp" data-f="tur" aria-label="Etkisiz işlem türü">${turOptions}</select>
      <input class="dz-inp" type="date" data-f="tarih" aria-label="İşlem / başlangıç tarihi" value="${esc(e.tarih ?? '')}" />
      <input class="dz-inp" type="date" data-f="bitis" aria-label="Bitiş tarihi (varsa)" value="${esc(e.bitis ?? '')}" />
      <input class="dz-inp" type="text" data-f="aciklama" placeholder="Not (opsiyonel)" value="${esc(e.aciklama ?? '')}" />
      <button type="button" class="btn btn--quiet btn--kucuk dz-sil" aria-label="Satırı sil">Sil</button>
    `;
    row.querySelector('.dz-sil')!.addEventListener('click', () => {
      row.remove();
      guncelle();
    });
    row.addEventListener('input', guncelle);
    row.addEventListener('change', guncelle);
    etkisizListeEl.appendChild(row);
  }

  function okuGirdi() {
    const kesmeler: KesmeOlayi[] = [...kesmeListeEl.querySelectorAll<HTMLElement>('[data-dz-kesme]')].map((row) => ({
      tur: (row.querySelector<HTMLSelectElement>('[data-f="tur"]')!.value as KesmeTuru) || 'sorgu',
      tarih: row.querySelector<HTMLInputElement>('[data-f="tarih"]')!.value,
      aciklama: row.querySelector<HTMLInputElement>('[data-f="aciklama"]')!.value.trim(),
    }));
    const durmalar: DurmaDonemi[] = [...durmaListeEl.querySelectorAll<HTMLElement>('[data-dz-durma]')].map((row) => ({
      tur: (row.querySelector<HTMLSelectElement>('[data-f="tur"]')!.value as DurmaTuru) || 'hagb',
      baslangic: row.querySelector<HTMLInputElement>('[data-f="baslangic"]')!.value,
      bitis: row.querySelector<HTMLInputElement>('[data-f="bitis"]')!.value,
      aciklama: row.querySelector<HTMLInputElement>('[data-f="aciklama"]')!.value.trim(),
    }));
    const etkisizler: EtkisizOlay[] = [...etkisizListeEl.querySelectorAll<HTMLElement>('[data-dz-etkisiz]')].map((row) => ({
      tur: (row.querySelector<HTMLSelectElement>('[data-f="tur"]')!.value as EtkisizTuru) || 'seri-muhakeme',
      tarih: row.querySelector<HTMLInputElement>('[data-f="tarih"]')!.value,
      bitis: row.querySelector<HTMLInputElement>('[data-f="bitis"]')!.value || undefined,
      aciklama: row.querySelector<HTMLInputElement>('[data-f="aciklama"]')!.value.trim(),
    }));
    return {
      sucTarihi: sucEl.value,
      incelemeTarihi: incelemeEl.value,
      cezaKademesi: kademeEl.value as CezaKademesiId,
      yasGrubu: yasEl.value as YasGrubuId,
      kesmeler,
      durmalar,
      etkisizler,
    };
  }

  function ornekYukle() {
    sucEl.value = '2016-09-05';
    incelemeEl.value = '2026-07-14';
    kademeEl.value = '5-yil-alti';
    yasEl.value = 'yetiskin';
    kesmeListeEl.innerHTML = '';
    durmaListeEl.innerHTML = '';
    etkisizListeEl.innerHTML = '';

    kesmeSatiriEkle({ tur: 'iddianame', tarih: '2016-10-16', aciklama: 'İddianame düzenlenmesi' });
    kesmeSatiriEkle({ tur: 'sorgu', tarih: '2017-01-26', aciklama: 'Sanığın mahkeme huzurunda sorgusu' });
    kesmeSatiriEkle({ tur: 'mahkumiyet', tarih: '2025-04-21', aciklama: 'Hükmün açıklanması / mahkûmiyet' });
    durmaSatiriEkle({ tur: 'hagb', baslangic: '2017-02-15', bitis: '2018-08-28', aciklama: 'HAGB kesinleşme → denetimde yeni kasıtlı suç' });
    etkisizSatiriEkle({ tur: 'seri-muhakeme', tarih: '2025-07-11', bitis: '2025-11-17', aciklama: 'Seri muhakeme durma süreci (mahsup edilmez)' });
    guncelle();
  }

  function temizle() {
    const bugun = new Date().toISOString().slice(0, 10);
    sucEl.value = '2020-01-15';
    incelemeEl.value = bugun;
    kademeEl.value = '5-yil-alti';
    yasEl.value = 'yetiskin';
    kesmeListeEl.innerHTML = '';
    durmaListeEl.innerHTML = '';
    etkisizListeEl.innerHTML = '';
    kesmeSatiriEkle({ tur: 'iddianame', tarih: '' });
    durmaSatiriEkle({ tur: 'hagb', baslangic: '', bitis: '' });
    guncelle();
  }

  function guncelle() {
    const girdi = okuGirdi();
    if (!girdi.sucTarihi || !girdi.incelemeTarihi) return;
    const s = hesaplaDavaZamanasimi(girdi);
    sonSonuc = s;

    // Uyarılar
    if (s.uyarilar.length) {
      uyariEl.hidden = false;
      uyariEl.innerHTML = `<strong>Dikkat edilmesi gereken noktalar:</strong><ul>${s.uyarilar.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>`;
    } else {
      uyariEl.hidden = true;
      uyariEl.innerHTML = '';
    }

    // Ana durum bandı (İhtiyatlı mod esas)
    const ih = s.ihtiyatli;
    const st = s.standart;
    durumEl.className = `dz-durum ${ih.gerceklesti ? 'is-doldu' : 'is-dolmadi'}`;
    durumEl.innerHTML = `
      <div>
        <span class="dz-durum__etiket">${ih.gerceklesti ? 'ZAMANAŞIMI GERÇEKLEŞTİ' : 'ZAMANAŞIMI GERÇEKLEŞMEDİ'}</span>
        <strong>${formatTrTarih(girdi.incelemeTarihi)} itibarıyla (İhtiyatlı Hesaplama): ${
          ih.gerceklesti
            ? `Süre ${Math.abs(ih.kalanGun).toLocaleString('tr-TR')} gün aşıldı.`
            : `Olağan sınırın dolmasına ${ih.kalanGun.toLocaleString('tr-TR')} gün kaldı.`
        }</strong>
        <p>Esas alınan başlangıç: <b>${formatTrTarih(ih.esasBaslangic)}</b> (${esc(ih.esasBaslangicEtiket)}) · Etkin zamanaşımı sınırı: <b>${formatTrTarih(ih.etkinSinir)}</b> (${ih.etkinSinirTuru === 'olagan' ? 'Olağan + durma' : 'Uzamış + durma'})</p>
      </div>
    `;

    // Özet kartları
    kartlarEl.innerHTML = `
      <div class="dz-kart">
        <span>Olağan Süre (${esc(s.kademe.dayanak)})</span>
        <strong class="num">${esc(ayMetni(s.olaganAy))}</strong>
        <small>Durma hariç: ${formatTrTarih(ih.olaganDurmaHaric)} (${ih.olaganToplamGun.toLocaleString('tr-TR')} gün)</small>
      </div>
      <div class="dz-kart">
        <span>Durma Dahil Olağan Sınır</span>
        <strong class="num">${formatTrTarih(ih.olaganDurmaDahil)}</strong>
        <small>İşleyen: ${ih.incelemeIsleyenGun.toLocaleString('tr-TR')} / ${ih.olaganToplamGun.toLocaleString('tr-TR')} gün</small>
      </div>
      <div class="dz-kart">
        <span>Uzamış (Olağanüstü) Sınır</span>
        <strong class="num">${formatTrTarih(ih.uzamisDurmaDahil)}</strong>
        <small>${esc(ayMetni(s.uzamisAy))} · Durma hariç: ${formatTrTarih(ih.uzamisDurmaHaric)}</small>
      </div>
      <div class="dz-kart">
        <span>Toplam Geçerli Durma</span>
        <strong class="num">${s.toplamDurmaGun.toLocaleString('tr-TR')} gün</strong>
        <small>${esc(ymdMetni(s.toplamDurmaYmd))}${s.seriMuhakemeGun > 0 ? ` · Seri muhakeme: ${s.seriMuhakemeGun} gün (0 gün mahsup)` : ''}</small>
      </div>
    `;

    // İki mod karşılaştırması
    const modKart = (m: typeof ih) => `
      <div class="dz-mod ${m.gerceklesti ? 'is-doldu' : 'is-dolmadi'}">
        <h3>${esc(m.baslik)}</h3>
        <dl>
          <div><dt>Esas Başlangıç</dt><dd class="num">${formatTrTarih(m.esasBaslangic)} (${esc(m.esasBaslangicEtiket)})</dd></div>
          <div><dt>Olağan Sınır (Durma Hariç)</dt><dd class="num">${formatTrTarih(m.olaganDurmaHaric)}</dd></div>
          <div><dt>Olağan Sınır (Durma Dahil)</dt><dd class="num"><strong>${formatTrTarih(m.olaganDurmaDahil)}</strong></dd></div>
          <div><dt>Uzamış Sınır (Durma Dahil)</dt><dd class="num">${formatTrTarih(m.uzamisDurmaDahil)}</dd></div>
          <div><dt>Toplam Takvim / İşleyen Gün</dt><dd class="num">${m.incelemeTakvimGun.toLocaleString('tr-TR')} / ${m.incelemeIsleyenGun.toLocaleString('tr-TR')} gün</dd></div>
          <div><dt>Sonuç (${formatTrTarih(girdi.incelemeTarihi)})</dt><dd><strong>${m.gerceklesti ? `Gerçekleşti (${Math.abs(m.kalanGun).toLocaleString('tr-TR')} gün aştı)` : `Gerçekleşmedi (${m.kalanGun.toLocaleString('tr-TR')} gün kaldı)`}</strong></dd></div>
        </dl>
      </div>
    `;
    modlarEl.innerHTML = modKart(ih) + modKart(st);

    // Kronolojik çizelge
    cizelgeEl.innerHTML = s.cizelge
      .map(
        (r) => `
        <tr class="dz-etki--${r.etkiTuru}">
          <td class="num"><strong>${formatTrTarih(r.tarih)}</strong></td>
          <td>${esc(r.islem)}</td>
          <td><span class="chip">${esc(r.dayanak)}</span></td>
          <td>${esc(r.etkiMetni)}</td>
          <td class="num">${esc(r.sayacDurumu)}</td>
          <td class="num"><strong>${formatTrTarih(r.guncelOlaganSinir)}</strong></td>
        </tr>
      `
      )
      .join('');

    // Karşılaştırma senaryoları
    senaryoEl.innerHTML = s.senaryolar
      .map(
        (sc) => `
        <tr>
          <td>${esc(sc.ad)}</td>
          <td class="num">${formatTrTarih(sc.baslangic)}</td>
          <td class="num"><strong>${formatTrTarih(sc.durmaDahilTarih)}</strong></td>
          <td class="num">${
            sc.gerceklesti
              ? `<span class="dz-rozet dz-rozet--kirmizi">Doldu (${Math.abs(sc.kalanGun).toLocaleString('tr-TR')} gün)</span>`
              : `<span class="dz-rozet dz-rozet--yesil">Dolmadı (${sc.kalanGun.toLocaleString('tr-TR')} gün kaldı)</span>`
          }</td>
        </tr>
      `
      )
      .join('');
  }

  kopyalaBtn.addEventListener('click', async () => {
    if (!sonSonuc) return;
    const g = okuGirdi();
    const s = sonSonuc;
    const ih = s.ihtiyatli;
    const ozet = [
      'DAVA ZAMANAŞIMI HESAPLAMA ÖZETİ (657.com.tr)',
      `Suç Tarihi: ${formatTrTarih(g.sucTarihi)} | İnceleme Tarihi: ${formatTrTarih(g.incelemeTarihi)}`,
      `Kademe: ${s.kademe.ad} (${s.kademe.dayanak}) | Yaş Grubu: ${s.yasGrubu.ad}`,
      `Olağan / Uzamış Süre: ${ayMetni(s.olaganAy)} / ${ayMetni(s.uzamisAy)}`,
      `Geçerli Durma Süresi: ${s.toplamDurmaGun} gün (${ymdMetni(s.toplamDurmaYmd)})`,
      s.seriMuhakemeGun > 0 ? `Seri Muhakeme Durma: ${s.seriMuhakemeGun} gün (Mahsup edilmez: 0 gün)` : '',
      `İhtiyatlı Hesap Başlangıcı: ${formatTrTarih(ih.esasBaslangic)} (${ih.esasBaslangicEtiket})`,
      `Olağan Sınır (Durma Hariç / Dahil): ${formatTrTarih(ih.olaganDurmaHaric)} / ${formatTrTarih(ih.olaganDurmaDahil)}`,
      `Uzamış Sınır (Durma Hariç / Dahil): ${formatTrTarih(ih.uzamisDurmaHaric)} / ${formatTrTarih(ih.uzamisDurmaDahil)}`,
      `İşleyen Gün: ${ih.incelemeIsleyenGun} / ${ih.olaganToplamGun} gün`,
      `Sonuç: ${ih.gerceklesti ? `Dava zamanaşımı gerçekleşti (${Math.abs(ih.kalanGun)} gün aşıldı)` : `Dava zamanaşımı gerçekleşmedi (${ih.kalanGun} gün kaldı)`}`,
      'Not: Bilgilendirme amaçlıdır; resmî işlemde dosya kapsamı ve mevzuat esas alınır.',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(ozet);
      const eski = kopyalaBtn.textContent;
      kopyalaBtn.textContent = 'Özet kopyalandı ✓';
      setTimeout(() => {
        kopyalaBtn.textContent = eski;
      }, 2000);
    } catch {
      alert(ozet);
    }
  });

  root.querySelector('[data-dz-ekle-kesme]')!.addEventListener('click', () => kesmeSatiriEkle({ tur: 'sorgu' }));
  root.querySelector('[data-dz-ekle-durma]')!.addEventListener('click', () => durmaSatiriEkle({ tur: 'hagb' }));
  root.querySelector('[data-dz-ekle-etkisiz]')!.addEventListener('click', () => etkisizSatiriEkle({ tur: 'seri-muhakeme' }));
  root.querySelector('[data-dz-ornek]')!.addEventListener('click', ornekYukle);
  root.querySelector('[data-dz-temizle]')!.addEventListener('click', temizle);

  [sucEl, incelemeEl, kademeEl, yasEl].forEach((el) => {
    el.addEventListener('input', guncelle);
    el.addEventListener('change', guncelle);
  });

  ornekYukle();
}
