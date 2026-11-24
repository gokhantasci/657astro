import {
  hataliSorulariGetir,
  kitapcikOlustur,
  soruyuHazirla,
  unvanSorulari,
  type GysSoru,
  type GysUnvan,
  type HataKaydi,
  type HazirSoru,
  type SinavModu,
  type Zorluk,
} from '../lib/gys-motor';

interface KanunTanim {
  id: string;
  ad: string;
  kisa: string;
  kaynak: string;
}

interface MufredatVeri {
  kanunlar: KanunTanim[];
  unvanlar: GysUnvan[];
}

interface KisiselDurum {
  unvanId: string;
  sonKanun: string;
  toplamCozulen: number;
  toplamDogru: number;
  hatalar: Record<string, HataKaydi>;
}

const STORE_KEY = '657:gys:durum';

function bugunIstanbul(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const root = document.querySelector<HTMLElement>('[data-gys-app]');
if (root) {
  const mufredat: MufredatVeri = JSON.parse(document.querySelector('#gys-mufredat-veri')!.textContent || '{}');
  const tumSorular: GysSoru[] = JSON.parse(document.querySelector('#gys-sorular-veri')!.textContent || '[]');
  const kanunMap = new Map(mufredat.kanunlar.map((k) => [k.id, k]));

  const elUnvan = root.querySelector<HTMLSelectElement>('[data-gys-unvan]')!;
  const elHavuzSayi = root.querySelector<HTMLElement>('[data-gys-havuz-sayi]')!;
  const elStToplam = root.querySelector<HTMLElement>('[data-gys-st-toplam]')!;
  const elStOran = root.querySelector<HTMLElement>('[data-gys-st-oran]')!;
  const elStHata = root.querySelector<HTMLElement>('[data-gys-st-hata]')!;
  const elSonDers = root.querySelector<HTMLElement>('[data-gys-son-ders]')!;

  const elTabs = [...root.querySelectorAll<HTMLButtonElement>('[data-gys-tab]')];
  const elPanels = [...root.querySelectorAll<HTMLElement>('[data-gys-panel]')];

  const elKanun = root.querySelector<HTMLSelectElement>('[data-gys-kanun]')!;
  const elSeviye = root.querySelector<HTMLSelectElement>('[data-gys-seviye]')!;
  const elMod = root.querySelector<HTMLSelectElement>('[data-gys-mod]')!;
  const elAdet = root.querySelector<HTMLSelectElement>('[data-gys-adet]')!;
  const elAktifMod = root.querySelector<HTMLElement>('[data-gys-aktif-mod]')!;
  const elBaslat = root.querySelector<HTMLButtonElement>('[data-gys-baslat]')!;

  const elSahne = root.querySelector<HTMLElement>('[data-gys-sahne]')!;
  const elSira = root.querySelector<HTMLElement>('[data-gys-sira]')!;
  const elRozet = root.querySelector<HTMLElement>('[data-gys-rozet]')!;
  const elVaryasyon = root.querySelector<HTMLElement>('[data-gys-varyasyon]')!;
  const elSoruMetin = root.querySelector<HTMLElement>('[data-gys-soru-metin]')!;
  const elSiklar = root.querySelector<HTMLElement>('[data-gys-siklar]')!;
  const elAciklama = root.querySelector<HTMLElement>('[data-gys-aciklama]')!;
  const elSonraki = root.querySelector<HTMLButtonElement>('[data-gys-sonraki]')!;
  const elBitir = root.querySelector<HTMLButtonElement>('[data-gys-bitir]')!;
  const elSonuc = root.querySelector<HTMLElement>('[data-gys-sonuc]')!;

  const elHataFiltreBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-gys-hata-filtre]')];
  const elHataListe = root.querySelector<HTMLElement>('[data-gys-hata-liste]')!;
  const elHataCoz = root.querySelector<HTMLButtonElement>('[data-gys-hata-coz]')!;
  const elIstatistikSifirla = root.querySelector<HTMLButtonElement>('[data-gys-istatistik-sifirla]')!;

  const elPdfTip = root.querySelector<HTMLSelectElement>('[data-gys-pdf-tip]')!;
  const elPdfKanun = root.querySelector<HTMLSelectElement>('[data-gys-pdf-kanun]')!;
  const elPdfAdet = root.querySelector<HTMLInputElement>('[data-gys-pdf-adet]')!;
  const elPdfMod = root.querySelector<HTMLSelectElement>('[data-gys-pdf-mod]')!;
  const elPdfUret = root.querySelector<HTMLButtonElement>('[data-gys-pdf-uret]')!;
  const elPdfEylem = root.querySelector<HTMLElement>('[data-gys-pdf-eylem]')!;
  const elPdfYazdir = root.querySelector<HTMLButtonElement>('[data-gys-pdf-yazdir]')!;
  const elPdfIndir = root.querySelector<HTMLButtonElement>('[data-gys-pdf-indir]')!;
  const elPdfOnizleme = root.querySelector<HTMLElement>('[data-gys-pdf-onizleme]')!;

  function durumOku(): KisiselDurum {
    try {
      const ham = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (ham && typeof ham === 'object') {
        return {
          unvanId: ham.unvanId || mufredat.unvanlar[0].id,
          sonKanun: ham.sonKanun || '',
          toplamCozulen: Number(ham.toplamCozulen) || 0,
          toplamDogru: Number(ham.toplamDogru) || 0,
          hatalar: ham.hatalar || {},
        };
      }
    } catch {
      /* geç */
    }
    return { unvanId: mufredat.unvanlar[0].id, sonKanun: '', toplamCozulen: 0, toplamDogru: 0, hatalar: {} };
  }

  let durum = durumOku();
  let aktifTest: HazirSoru[] = [];
  let aktifIdx = 0;
  let testDogru = 0;
  let testYanlislar: GysSoru[] = [];
  let hataFiltre: 'tumu' | 'gunluk' | 'haftalik' | 'aylik' | 'encok' = 'tumu';
  let sonKitapcikHtml = '';

  function durumKaydet() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(durum));
    } catch {
      /* geç */
    }
  }

  function aktifUnvan(): GysUnvan {
    return mufredat.unvanlar.find((u) => u.id === durum.unvanId) ?? mufredat.unvanlar[0];
  }

  function sekmeAc(hedef: string) {
    elTabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.gysTab === hedef)));
    elPanels.forEach((p) => (p.hidden = p.dataset.gysPanel !== hedef));
    if (hedef === 'hatalar') hataListesiniCiz();
  }

  function ustBilgileriGuncelle() {
    const unvan = aktifUnvan();
    const havuz = unvanSorulari(unvan, tumSorular);
    elHavuzSayi.textContent = String(havuz.length);
    elStToplam.textContent = String(durum.toplamCozulen);
    const oran = durum.toplamCozulen ? Math.round((durum.toplamDogru / durum.toplamCozulen) * 100) : 0;
    elStOran.textContent = `%${oran}`;
    const bekleyenHata = Object.values(durum.hatalar).filter((h) => !h.sonDogru && h.hataSayisi > 0).length;
    elStHata.textContent = String(bekleyenHata);

    const kanunAd = durum.sonKanun ? (kanunMap.get(durum.sonKanun)?.kisa ?? durum.sonKanun) : 'Tüm Müfredat';
    elSonDers.textContent = `Seçili ünvan: ${unvan.ad} · Son çalışılan ders: ${kanunAd} · İstatistikleriniz yalnız bu tarayıcıda saklanır.`;

    // Ders seçicilerini ünvanın sorumlu olduğu kanunlara göre doldur
    const kanunSayilari = new Map<string, number>();
    for (const s of havuz) kanunSayilari.set(s.kanun, (kanunSayilari.get(s.kanun) ?? 0) + 1);
    const secenekler = [
      `<option value="">Tüm Dersler (${havuz.length} soru)</option>`,
      ...[...kanunSayilari.entries()].map(
        ([kid, adet]) => `<option value="${kid}">${kanunMap.get(kid)?.kisa ?? kid} (${adet} soru)</option>`
      ),
    ].join('');
    elKanun.innerHTML = secenekler;
    elPdfKanun.innerHTML = secenekler;
    if (durum.sonKanun && kanunSayilari.has(durum.sonKanun)) {
      elKanun.value = durum.sonKanun;
      elPdfKanun.value = durum.sonKanun;
    }
  }

  function soruyuGoster() {
    const item = aktifTest[aktifIdx];
    if (!item) {
      testiBitir();
      return;
    }
    elSira.textContent = `Soru ${aktifIdx + 1} / ${aktifTest.length}`;
    elRozet.textContent = `${item.soru.madde} · ${item.soru.seviye.toLocaleUpperCase('tr-TR')}`;
    elVaryasyon.textContent = item.varyasyonSayisi > 1 ? `Kombinatoryal havuz (${item.varyasyonSayisi} farklı şık düzeni)` : '';
    elSoruMetin.textContent = item.soru.soru;
    elAciklama.hidden = true;
    elSonraki.hidden = true;

    elSiklar.innerHTML = '';
    for (const s of item.siklar) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gys-sik';
      btn.innerHTML = `<strong>${s.harf})</strong><span>${s.metin}</span>`;
      btn.addEventListener('click', () => cevapla(item, s.dogru, btn));
      elSiklar.append(btn);
    }
  }

  function cevapla(item: HazirSoru, dogruMu: boolean, secilenBtn: HTMLButtonElement) {
    const butonlar = [...elSiklar.querySelectorAll<HTMLButtonElement>('.gys-sik')];
    butonlar.forEach((b, idx) => {
      b.disabled = true;
      if (item.siklar[idx]?.dogru) b.classList.add('is-ok');
    });

    durum.toplamCozulen++;
    const mevcutHata = durum.hatalar[item.soru.id];
    if (dogruMu) {
      testDogru++;
      durum.toplamDogru++;
      if (mevcutHata) mevcutHata.sonDogru = true;
    } else {
      secilenBtn.classList.add('is-err');
      testYanlislar.push(item.soru);
      durum.hatalar[item.soru.id] = {
        soruId: item.soru.id,
        tarih: bugunIstanbul(),
        hataSayisi: (mevcutHata?.hataSayisi ?? 0) + 1,
        sonDogru: false,
      };
    }
    durumKaydet();
    ustBilgileriGuncelle();

    elAciklama.innerHTML = `<strong>${dogruMu ? 'Doğru!' : `Yanlış — Doğru cevap: ${item.dogruHarf})`}</strong><br/>${item.soru.aciklama}<br/><small>Kaynak: <strong>${item.soru.madde}</strong> · <a href="${item.soru.kaynak}" target="_blank" rel="noopener noreferrer">Mevzuat.gov.tr ↗</a></small>`;
    elAciklama.hidden = false;
    elSonraki.hidden = false;
    elSonraki.textContent = aktifIdx + 1 < aktifTest.length ? 'Sonraki Soru →' : 'Sonucu Gör';
  }

  function testiBitir() {
    elSahne.hidden = true;
    const toplam = aktifTest.length;
    const puan = toplam ? Math.round((testDogru / toplam) * 100) : 0;
    const benzersizYanlis = [...new Map(testYanlislar.map((s) => [s.id, s])).values()];
    elSonuc.innerHTML = `
      <h3>Test Tamamlandı · Puan: ${puan} / 100</h3>
      <p>Toplam: <strong>${toplam}</strong> · Doğru: <strong>${testDogru}</strong> · Hatalı: <strong>${benzersizYanlis.length}</strong></p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${benzersizYanlis.length > 0 ? `<button type="button" class="btn" data-gys-yanlis-dongu>Hatalı ${benzersizYanlis.length} Soruyu Doğru Yapana Kadar Tekrarla →</button>` : '<strong style="color:var(--color-green);">Tebrikler! Tüm soruları hatasız tamamladınız.</strong>'}
        <button type="button" class="btn btn--quiet" data-gys-yeni-test>Yeni Test Başlat</button>
      </div>`;
    elSonuc.hidden = false;
    elSonuc.querySelector('[data-gys-yanlis-dongu]')?.addEventListener('click', () => {
      testBaslatOzel(benzersizYanlis);
    });
    elSonuc.querySelector('[data-gys-yeni-test]')?.addEventListener('click', () => {
      elSonuc.hidden = true;
      elBaslat.click();
    });
  }

  function testBaslatOzel(soruListesi: GysSoru[]) {
    const mod = (elMod.value as SinavModu) || 'klasik';
    elAktifMod.textContent = mod === 'ikili' ? 'İkili Hızlı Tekrar (2 Şık)' : 'Klasik Mod (5 Şık)';
    aktifTest = soruListesi.map((s) => soruyuHazirla(s, mod));
    aktifIdx = 0;
    testDogru = 0;
    testYanlislar = [];
    elSonuc.hidden = true;
    elSahne.hidden = false;
    sekmeAc('sinav');
    soruyuGoster();
  }

  function hataListesiniCiz() {
    const liste = hataliSorulariGetir(durum.hatalar, tumSorular, hataFiltre, bugunIstanbul());
    elHataCoz.disabled = liste.length === 0;
    if (!liste.length) {
      elHataListe.innerHTML = '<p style="color:var(--color-muted);margin:0;">Seçili dönemde hatalı soru kaydı yok. Test çözdükçe yanlış yaptığınız sorular burada toplanır.</p>';
      return;
    }
    elHataListe.innerHTML = `<ul style="margin:0;padding-left:1.25rem;display:grid;gap:8px;">${liste
      .map((s) => {
        const k = durum.hatalar[s.id];
        return `<li><strong>${s.madde}</strong> (${k?.hataSayisi ?? 1} hata · son: ${k?.tarih ?? ''}) — ${s.soru}</li>`;
      })
      .join('')}</ul>`;
  }

  function kitapcikSayfaHtml(baslik: string, sorularListe: HazirSoru[]): string {
    const sorularHtml = sorularListe
      .map(
        (item, i) => `<div class="q" style="break-inside:avoid;margin-bottom:14px;">
          <p style="margin:0 0 6px;font-weight:700;">${i + 1}. ${item.soru.soru} <span style="font-weight:400;color:#555;">(${item.soru.madde})</span></p>
          <div style="display:grid;gap:3px;padding-left:12px;">${item.siklar.map((s) => `<div><strong>${s.harf})</strong> ${s.metin}</div>`).join('')}</div>
        </div>`
      )
      .join('');
    const cevapAnahtari = sorularListe.map((x, i) => `${i + 1}-${x.dogruHarf}`).join(' · ');
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"/><title>${baslik} | 657.com.tr</title>
<style>body{font-family:Georgia,serif;color:#111;margin:24px;line-height:1.5;} .kose{position:fixed;top:10px;right:18px;font-size:12px;font-weight:700;color:#b91c1c;} .grid{column-count:2;column-gap:28px;} @media print{.grid{column-count:2;}} h1{font-size:18px;border-bottom:2px solid #111;padding-bottom:6px;}</style>
</head><body><div class="kose">657.com.tr</div><h1>${baslik}</h1><p style="font-size:12px;color:#444;">Ücretsiz 2026 GYS Deneme Kitapçığı · Kaynak: https://657.com.tr/gys/</p><div class="grid">${sorularHtml}</div><hr/><h2>Cevap Anahtarı</h2><p style="font-size:13px;">${cevapAnahtari}</p></body></html>`;
  }

  // Event bindings
  elTabs.forEach((btn) => btn.addEventListener('click', () => sekmeAc(btn.dataset.gysTab || 'sinav')));

  elUnvan.addEventListener('change', () => {
    durum.unvanId = elUnvan.value;
    durumKaydet();
    ustBilgileriGuncelle();
  });

  elBaslat.addEventListener('click', () => {
    const unvan = aktifUnvan();
    const kanunFiltre = elKanun.value;
    durum.sonKanun = kanunFiltre;
    durumKaydet();
    ustBilgileriGuncelle();

    const mod = (elMod.value as SinavModu) || 'klasik';
    elAktifMod.textContent = mod === 'ikili' ? 'İkili Hızlı Tekrar (2 Şık)' : 'Klasik Mod (5 Şık)';
    aktifTest = kitapcikOlustur(unvan, tumSorular, {
      mod,
      toplamSoru: Number(elAdet.value) || 20,
      agirlikli: !kanunFiltre,
      kanunFiltre: kanunFiltre || undefined,
      seviyeFiltre: (elSeviye.value as Zorluk | '') || '',
    });
    if (!aktifTest.length) {
      elSonuc.innerHTML = '<p>Seçilen filtrede soru bulunamadı; lütfen "Tüm Seviyeler" veya "Tüm Dersler" seçeneğini deneyin.</p>';
      elSonuc.hidden = false;
      elSahne.hidden = true;
      return;
    }
    aktifIdx = 0;
    testDogru = 0;
    testYanlislar = [];
    elSonuc.hidden = true;
    elSahne.hidden = false;
    soruyuGoster();
  });

  elSonraki.addEventListener('click', () => {
    aktifIdx++;
    soruyuGoster();
  });
  elBitir.addEventListener('click', testiBitir);

  elHataFiltreBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      hataFiltre = (btn.dataset.gysHataFiltre as typeof hataFiltre) || 'tumu';
      elHataFiltreBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      hataListesiniCiz();
    })
  );

  elHataCoz.addEventListener('click', () => {
    const liste = hataliSorulariGetir(durum.hatalar, tumSorular, hataFiltre, bugunIstanbul());
    if (liste.length) testBaslatOzel(liste);
  });

  elIstatistikSifirla.addEventListener('click', () => {
    durum.toplamCozulen = 0;
    durum.toplamDogru = 0;
    durum.hatalar = {};
    durumKaydet();
    ustBilgileriGuncelle();
    hataListesiniCiz();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-gys-kitap-coz]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const kid = btn.dataset.gysKitapCoz || '';
      if (kid) elKanun.value = kid;
      sekmeAc('sinav');
      elBaslat.click();
    })
  );

  elPdfUret.addEventListener('click', () => {
    const unvan = aktifUnvan();
    const agirlikli = elPdfTip.value === 'agirlikli';
    const adet = Math.max(5, Math.min(100, Number(elPdfAdet.value) || 20));
    const mod = (elPdfMod.value as SinavModu) || 'klasik';
    const hazir = kitapcikOlustur(unvan, tumSorular, {
      mod,
      toplamSoru: adet,
      agirlikli,
      kanunFiltre: agirlikli ? undefined : elPdfKanun.value || undefined,
    });
    const baslik = `${unvan.ad} — 2026 GYS Deneme Kitapçığı (${hazir.length} Soru)`;
    sonKitapcikHtml = kitapcikSayfaHtml(baslik, hazir);
    elPdfEylem.hidden = false;
    elPdfOnizleme.innerHTML = `<div class="gys-kitap-kagit">
      <div class="gys-kitap-kose">657.com.tr</div>
      <h3 style="margin:0;">${baslik}</h3>
      <div class="gys-kitap-grid">${hazir
        .map(
          (x, i) => `<div><strong>${i + 1}.</strong> ${x.soru.soru}<br/>${x.siklar
            .map((s) => `<span style="display:block;font-size:13px;"><strong>${s.harf})</strong> ${s.metin}</span>`)
            .join('')}</div>`
        )
        .join('')}</div>
      <p style="font-size:12px;border-top:1px solid #ddd;padding-top:8px;margin:0;"><strong>Cevap Anahtarı:</strong> ${hazir
        .map((x, i) => `${i + 1}-${x.dogruHarf}`)
        .join(' · ')}</p>
    </div>`;
  });

  elPdfYazdir.addEventListener('click', () => {
    if (!sonKitapcikHtml) return;
    const w = window.open('', '_blank', 'width=960,height=800');
    if (!w) return;
    w.document.open();
    w.document.write(sonKitapcikHtml);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  });

  elPdfIndir.addEventListener('click', () => {
    if (!sonKitapcikHtml) return;
    const blob = new Blob([sonKitapcikHtml], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `657-gys-deneme-kitapcigi-${bugunIstanbul()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // URL ?unvan= desteği + başlangıç yüklemesi
  const qUnvan = new URLSearchParams(window.location.search).get('unvan');
  if (qUnvan && mufredat.unvanlar.some((u) => u.id === qUnvan)) {
    durum.unvanId = qUnvan;
  }
  elUnvan.value = durum.unvanId;
  ustBilgileriGuncelle();
}
