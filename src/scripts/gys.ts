import {
  dugumBul,
  dugumSorulari,
  dugumYolu,
  hataliSorulariGetir,
  karistir,
  kitapcikOlustur,
  sonsuzSonrakiSoru,
  soruyuHazirla,
  unvanSorulari,
  type GysAgacDugum,
  type GysSoru,
  type GysUnvan,
  type HataKaydi,
  type HazirSoru,
  type SinavModu,
  type SoruKisiselIstatistik,
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

interface AgacVeri {
  kok: GysAgacDugum;
}

interface KisiselDurum {
  unvanId: string;
  seciliDugumId: string;
  sonKanun: string;
  toplamCozulen: number;
  toplamDogru: number;
  hatalar: Record<string, HataKaydi>;
  soruGecmisi: Record<string, SoruKisiselIstatistik>;
}

interface GenelSoruIstatistik {
  cozum: number;
  dogru: number;
  yanlis: number;
  oran: number | null;
}

const STORE_KEY = '657:gys:durum';
const GYS_API = '/_657-servis/api/gys/soru';

function bugunIstanbul(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const root = document.querySelector<HTMLElement>('[data-gys-app]');
if (root) {
  const mufredat: MufredatVeri = JSON.parse(document.querySelector('#gys-mufredat-veri')!.textContent || '{}');
  const agacVeri: AgacVeri = JSON.parse(document.querySelector('#gys-agac-veri')!.textContent || '{}');
  const tumSorular: GysSoru[] = JSON.parse(document.querySelector('#gys-sorular-veri')!.textContent || '[]');
  const kanunMap = new Map(mufredat.kanunlar.map((k) => [k.id, k]));

  const elUnvan = root.querySelector<HTMLSelectElement>('[data-gys-unvan]')!;
  const elHavuzSayi = root.querySelector<HTMLElement>('[data-gys-havuz-sayi]')!;
  const elStToplam = root.querySelector<HTMLElement>('[data-gys-st-toplam]')!;
  const elStOran = root.querySelector<HTMLElement>('[data-gys-st-oran]')!;
  const elStHata = root.querySelector<HTMLElement>('[data-gys-st-hata]')!;
  const elSonDers = root.querySelector<HTMLElement>('[data-gys-son-ders]')!;

  const elAgac = root.querySelector<HTMLElement>('[data-gys-agac]')!;
  const elDugumBaslik = root.querySelector<HTMLElement>('[data-gys-dugum-baslik]')!;
  const elDugumYol = root.querySelector<HTMLElement>('[data-gys-dugum-yol]')!;

  const elTabs = [...root.querySelectorAll<HTMLButtonElement>('[data-gys-tab]')];
  const elPanels = [...root.querySelectorAll<HTMLElement>('[data-gys-panel]')];

  const elKanun = root.querySelector<HTMLSelectElement>('[data-gys-kanun]')!;
  const elSeviye = root.querySelector<HTMLSelectElement>('[data-gys-seviye]')!;
  const elMod = root.querySelector<HTMLSelectElement>('[data-gys-mod]')!;
  const elAdet = root.querySelector<HTMLSelectElement>('[data-gys-adet]')!;
  const elAktifMod = root.querySelector<HTMLElement>('[data-gys-aktif-mod]')!;
  const elSure = root.querySelector<HTMLElement>('[data-gys-sure]')!;
  const elSeri = root.querySelector<HTMLElement>('[data-gys-seri]')!;
  const elBaslat = root.querySelector<HTMLButtonElement>('[data-gys-baslat]')!;
  const elKarisik = root.querySelector<HTMLButtonElement>('[data-gys-karisik]')!;
  const elSonsuz = root.querySelector<HTMLButtonElement>('[data-gys-sonsuz]')!;
  const elDeneme = root.querySelector<HTMLButtonElement>('[data-gys-deneme]')!;

  const elSahne = root.querySelector<HTMLElement>('[data-gys-sahne]')!;
  const elSira = root.querySelector<HTMLElement>('[data-gys-sira]')!;
  const elRozet = root.querySelector<HTMLElement>('[data-gys-rozet]')!;
  const elVaryasyon = root.querySelector<HTMLElement>('[data-gys-varyasyon]')!;
  const elSoruIstatistik = root.querySelector<HTMLElement>('[data-gys-soru-istatistik]')!;
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
          seciliDugumId: ham.seciliDugumId || agacVeri.kok.id,
          sonKanun: ham.sonKanun || '',
          toplamCozulen: Number(ham.toplamCozulen) || 0,
          toplamDogru: Number(ham.toplamDogru) || 0,
          hatalar: ham.hatalar || {},
          soruGecmisi: ham.soruGecmisi || {},
        };
      }
    } catch {
      /* geç */
    }
    return {
      unvanId: mufredat.unvanlar[0].id,
      seciliDugumId: agacVeri.kok.id,
      sonKanun: '',
      toplamCozulen: 0,
      toplamDogru: 0,
      hatalar: {},
      soruGecmisi: {},
    };
  }

  let durum = durumOku();
  let genelIstatistikler: Record<string, GenelSoruIstatistik> = {};
  let aktifTest: HazirSoru[] = [];
  let aktifHavuz: GysSoru[] = [];
  let aktifIdx = 0;
  let testDogru = 0;
  let testCozulen = 0;
  let seri = 0;
  let sonsuzMod = false;
  let sonSoruId: string | null = null;
  let testYanlislar: GysSoru[] = [];
  let hataFiltre: 'tumu' | 'gunluk' | 'haftalik' | 'aylik' | 'encok' = 'tumu';
  let sonKitapcikHtml = '';
  let kronometreId: ReturnType<typeof setInterval> | null = null;
  let kalanSaniye = 0;

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

  function aktifDugum(): GysAgacDugum {
    return dugumBul(agacVeri.kok, durum.seciliDugumId) ?? agacVeri.kok;
  }

  function kronometreyiDurdur() {
    if (kronometreId) {
      clearInterval(kronometreId);
      kronometreId = null;
    }
    elSure.hidden = true;
  }

  function kronometreBaslat(dakika: number) {
    kronometreyiDurdur();
    kalanSaniye = dakika * 60;
    const yaz = () => {
      const dk = Math.floor(kalanSaniye / 60);
      const sn = kalanSaniye % 60;
      elSure.textContent = `${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
    };
    yaz();
    elSure.hidden = false;
    kronometreId = setInterval(() => {
      kalanSaniye--;
      yaz();
      if (kalanSaniye <= 0) {
        kronometreyiDurdur();
        sonucuGoster();
      }
    }, 1000);
  }

  async function genelIstatistikleriYukle() {
    try {
      const r = await fetch(GYS_API, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.sorular && typeof d.sorular === 'object') {
        genelIstatistikler = d.sorular;
        if (!elSahne.hidden && aktifTest[aktifIdx]) {
          soruIstatistikCiz(aktifTest[aktifIdx].soru.id);
        }
      }
    } catch {
      /* sunucu istatistiği opsiyoneldir; yerel mod kesintisiz sürer */
    }
  }

  async function genelIstatistikGonder(soruId: string, dogru: boolean) {
    try {
      const r = await fetch(GYS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ istekId: crypto.randomUUID(), soruId, dogru }),
        keepalive: true,
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.sorular) genelIstatistikler = d.sorular;
      else if (d && typeof d.cozum === 'number') {
        genelIstatistikler[soruId] = { cozum: d.cozum, dogru: d.dogru, yanlis: d.yanlis, oran: d.oran };
      }
      if (!elSahne.hidden && aktifTest[aktifIdx]?.soru.id === soruId) {
        soruIstatistikCiz(soruId);
      }
    } catch {
      /* sessizce yerel istatistikle devam et */
    }
  }

  function soruIstatistikCiz(soruId: string) {
    const k = durum.soruGecmisi[soruId];
    const kOran = k && k.cozum ? Math.round((k.dogru / k.cozum) * 100) : null;
    const kMetin = k
      ? `Sen: ${k.cozum} çözüm · ${k.dogru} doğru / ${k.yanlis} yanlış (%${kOran})`
      : 'Sen: İlk kez çözüyorsun';
    const g = genelIstatistikler[soruId];
    const gMetin =
      g && g.cozum > 0
        ? `Genel: %${g.oran ?? Math.round((g.dogru / g.cozum) * 100)} doğru (${g.cozum.toLocaleString('tr-TR')} çözüm · ${g.dogru}D / ${g.yanlis}Y)`
        : 'Genel: İlk veriler toplanıyor';
    elSoruIstatistik.innerHTML = `<span class="gys-ist-pill">${kMetin}</span><span class="gys-ist-pill">${gMetin}</span>`;
  }

  function agacCiz() {
    const yolIds = new Set(dugumYolu(agacVeri.kok, durum.seciliDugumId).map((d) => d.id));
    function renderDugum(dugum: GysAgacDugum, derinlik: number): string {
      const sorular = dugumSorulari(dugum, tumSorular);
      const cozulen = sorular.filter((s) => (durum.soruGecmisi[s.id]?.cozum ?? 0) > 0).length;
      const secili = dugum.id === durum.seciliDugumId;
      const rozet = `${sorular.length}${cozulen ? ` · ${cozulen}✓` : ''}`;
      const btn = `<button type="button" class="gys-dugum-btn" data-gys-dugum-sec="${esc(dugum.id)}" aria-current="${secili ? 'true' : 'false'}"><span>${esc(dugum.ad)}</span><span class="gys-dugum-sayi">${rozet}</span></button>`;
      if (!dugum.cocuklar?.length) return btn;
      const acik = derinlik < 2 || yolIds.has(dugum.id);
      return `<details ${acik ? 'open' : ''}><summary>${btn}</summary><div class="gys-agac-cocuk">${dugum.cocuklar.map((c) => renderDugum(c, derinlik + 1)).join('')}</div></details>`;
    }
    elAgac.innerHTML = renderDugum(agacVeri.kok, 0);
    elAgac.querySelectorAll<HTMLButtonElement>('[data-gys-dugum-sec]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        durum.seciliDugumId = b.dataset.gysDugumSec!;
        durum.sonKanun = '';
        durumKaydet();
        ustBilgileriGuncelle();
      });
    });
  }

  function sekmeAc(hedef: string) {
    elTabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.gysTab === hedef)));
    elPanels.forEach((p) => (p.hidden = p.dataset.gysPanel !== hedef));
    if (hedef === 'hatalar') hataListesiniCiz();
  }

  function ustBilgileriGuncelle() {
    const dugum = aktifDugum();
    const havuz = dugumSorulari(dugum, tumSorular);
    const yol = dugumYolu(agacVeri.kok, dugum.id);

    elHavuzSayi.textContent = String(havuz.length);
    elDugumBaslik.textContent = dugum.ad;
    elDugumYol.textContent = yol.map((d) => d.ad).join(' › ');
    elStToplam.textContent = String(durum.toplamCozulen);
    const oran = durum.toplamCozulen ? Math.round((durum.toplamDogru / durum.toplamCozulen) * 100) : 0;
    elStOran.textContent = `%${oran}`;
    const bekleyenHata = Object.values(durum.hatalar).filter((h) => !h.sonDogru && h.hataSayisi > 0).length;
    elStHata.textContent = String(bekleyenHata);

    const kanunAd = durum.sonKanun ? (kanunMap.get(durum.sonKanun)?.kisa ?? durum.sonKanun) : dugum.ad;
    elSonDers.textContent = `Aktif alan: ${kanunAd} (${havuz.length} soru) · Tercihleriniz ve kişisel istatistikleriniz tarayıcınızda hatırlanır.`;

    const kanunSayilari = new Map<string, number>();
    for (const s of havuz) kanunSayilari.set(s.kanun, (kanunSayilari.get(s.kanun) ?? 0) + 1);
    const secenekler = [
      `<option value="">Tüm Seçili Alan (${havuz.length} soru)</option>`,
      ...[...kanunSayilari.entries()].map(
        ([kid, adet]) => `<option value="${kid}">${kanunMap.get(kid)?.kisa ?? kid} (${adet} soru)</option>`
      ),
    ].join('');
    elKanun.innerHTML = secenekler;
    elPdfKanun.innerHTML = secenekler;
    if (durum.sonKanun && kanunSayilari.has(durum.sonKanun)) {
      elKanun.value = durum.sonKanun;
    }
    agacCiz();
  }

  function filtreliHavuz(): GysSoru[] {
    let havuz = dugumSorulari(aktifDugum(), tumSorular);
    if (elKanun.value) havuz = havuz.filter((s) => s.kanun === elKanun.value);
    if (elSeviye.value) havuz = havuz.filter((s) => s.seviye === (elSeviye.value as Zorluk));
    return havuz;
  }

  function testiBaslat(secenek: { ozelSorular?: GysSoru[]; sonsuz?: boolean; deneme?: boolean; karisik?: boolean } = {}) {
    kronometreyiDurdur();
    const mod = elMod.value as SinavModu;
    sonsuzMod = Boolean(secenek.sonsuz);
    elSeri.hidden = !sonsuzMod;
    seri = 0;
    sonSoruId = null;

    if (secenek.ozelSorular) {
      aktifHavuz = secenek.ozelSorular;
      aktifTest = karistir(secenek.ozelSorular).map((s) => soruyuHazirla(s, mod));
    } else {
      aktifHavuz = filtreliHavuz();
      if (!aktifHavuz.length) {
        elSonuc.hidden = false;
        elSahne.hidden = true;
        elSonuc.innerHTML = '<p>Seçilen filtrelerde soru bulunamadı. Sol ağaçtan daha geniş bir alan veya "Tüm Seviyeler" seçebilirsiniz.</p>';
        return;
      }
      if (sonsuzMod) {
        const ilk = sonsuzSonrakiSoru(aktifHavuz, null, mod)!;
        sonSoruId = ilk.soru.id;
        aktifTest = [ilk];
      } else {
        const dugum = aktifDugum();
        const hedef = secenek.deneme ? Math.min(dugum.sinavSoruSayisi ?? 80, aktifHavuz.length) : Math.min(Number(elAdet.value) || 20, aktifHavuz.length);
        aktifTest = karistir(aktifHavuz).slice(0, hedef).map((s) => soruyuHazirla(s, mod));
        if (secenek.deneme) kronometreBaslat(dugum.sinavSureDk ?? 90);
      }
    }

    if (!aktifTest.length) return;
    durum.sonKanun = elKanun.value;
    durumKaydet();
    aktifIdx = 0;
    testDogru = 0;
    testCozulen = 0;
    testYanlislar = [];
    elAktifMod.textContent = sonsuzMod
      ? `∞ Sonsuz Test (${mod === 'ikili' ? '2 Şık' : '5 Şık'})`
      : secenek.deneme
        ? `Deneme Sınavı (${mod === 'ikili' ? '2 Şık' : '5 Şık'})`
        : mod === 'ikili'
          ? 'Hızlı Tekrar (2 Şık)'
          : 'Klasik Mod (5 Şık)';
    elSonuc.hidden = true;
    elSahne.hidden = false;
    soruyuCiz();
  }

  function soruyuCiz() {
    const item = aktifTest[aktifIdx];
    if (!item) return;
    elSira.textContent = sonsuzMod ? `∞ Soru #${testCozulen + 1}` : `Soru ${aktifIdx + 1} / ${aktifTest.length}`;
    elSeri.textContent = `Seri: ${seri}`;
    const kanun = kanunMap.get(item.soru.kanun);
    elRozet.textContent = `${kanun?.kisa ?? item.soru.kanun} · ${item.soru.seviye.toUpperCase()}${item.soru.tur ? ' · ' + item.soru.tur : ''}`;
    elVaryasyon.textContent = item.varyasyonSayisi > 1 ? `Kombinatoryal: ${item.varyasyonSayisi.toLocaleString('tr-TR')} varyasyon` : '';
    soruIstatistikCiz(item.soru.id);
    elSoruMetin.textContent = item.soru.soru;
    elAciklama.hidden = true;
    elSonraki.hidden = true;
    elSiklar.innerHTML = item.siklar
      .map((s) => `<button type="button" class="gys-sik" data-gys-sik="${s.harf}"><strong>${s.harf})</strong> <span>${esc(s.metin)}</span></button>`)
      .join('');

    elSiklar.querySelectorAll<HTMLButtonElement>('[data-gys-sik]').forEach((btn) => {
      btn.addEventListener('click', () => cevabiIsle(btn.dataset.gysSik!));
    });
  }

  function cevabiIsle(secilenHarf: string) {
    const item = aktifTest[aktifIdx];
    const butonlar = [...elSiklar.querySelectorAll<HTMLButtonElement>('[data-gys-sik]')];
    butonlar.forEach((b) => {
      b.disabled = true;
      const h = b.dataset.gysSik!;
      if (h === item.dogruHarf) b.classList.add('gys-sik--dogru');
      else if (h === secilenHarf) b.classList.add('gys-sik--yanlis');
    });

    const dogruMu = secilenHarf === item.dogruHarf;
    const bugun = bugunIstanbul();
    durum.toplamCozulen++;
    testCozulen++;

    const sg = durum.soruGecmisi[item.soru.id] ?? { cozum: 0, dogru: 0, yanlis: 0 };
    sg.cozum++;
    if (dogruMu) {
      sg.dogru++;
      durum.toplamDogru++;
      testDogru++;
      seri++;
      if (durum.hatalar[item.soru.id]) durum.hatalar[item.soru.id].sonDogru = true;
    } else {
      sg.yanlis++;
      seri = 0;
      testYanlislar.push(item.soru);
      const mevcut = durum.hatalar[item.soru.id];
      durum.hatalar[item.soru.id] = {
        soruId: item.soru.id,
        tarih: bugun,
        hataSayisi: (mevcut?.hataSayisi ?? 0) + 1,
        sonDogru: false,
      };
    }
    durum.soruGecmisi[item.soru.id] = sg;
    durumKaydet();
    ustBilgileriGuncelle();
    soruIstatistikCiz(item.soru.id);
    void genelIstatistikGonder(item.soru.id, dogruMu);

    const mevzuatUrl = item.soru.mevzuatUrl || kanunMap.get(item.soru.kanun)?.kaynak || 'https://www.mevzuat.gov.tr/';
    elAciklama.innerHTML = `
      <strong>${dogruMu ? '✓ Doğru Cevap!' : `✗ Yanlış. Doğru Cevap: ${item.dogruHarf}`}</strong>
      <p style="margin:6px 0;">${esc(item.soru.aciklama)}</p>
      <small><strong>Kaynak:</strong> ${esc(item.soru.kaynak)} · <a href="${esc(mevzuatUrl)}" target="_blank" rel="noopener noreferrer">Mevzuat.gov.tr →</a></small>
    `;
    elAciklama.hidden = false;
    elSonraki.textContent = sonsuzMod
      ? 'Sonraki Rastgele Soru →'
      : aktifIdx + 1 < aktifTest.length
        ? 'Sonraki Soru →'
        : 'Sonucu Gör';
    elSonraki.hidden = false;
  }

  function sonucuGoster() {
    kronometreyiDurdur();
    elSahne.hidden = true;
    const toplam = Math.max(1, testCozulen);
    const puan = Math.round((testDogru / toplam) * 100);
    const baraj = aktifDugum().gecmePuani ?? 60;
    const yanlisBtn = testYanlislar.length
      ? `<button type="button" class="btn btn--kucuk" data-gys-yanlis-tekrar>Hatalı ${testYanlislar.length} Soruyu Tam Öğrenene Kadar Tekrar Çöz →</button>`
      : '<strong>Tebrikler! Bu oturumda hiç hata yapmadınız.</strong>';
    elSonuc.innerHTML = `
      <h3>Oturum Tamamlandı: ${testDogru} / ${testCozulen} Doğru (${puan} Puan · Baraj: ${baraj})</h3>
      <p>${puan >= baraj ? 'Yazılı sınav barajını geçtiniz.' : 'Hatalı soruları hemen tekrar çözerek tam öğrenmeyi sağlayın.'}</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;">
        ${yanlisBtn}
        <button type="button" class="btn btn--quiet btn--kucuk" data-gys-yeniden>Yeni Karma Test Başlat</button>
      </div>
    `;
    elSonuc.hidden = false;
    elSonuc.querySelector<HTMLButtonElement>('[data-gys-yanlis-tekrar]')?.addEventListener('click', () => {
      testiBaslat({ ozelSorular: [...testYanlislar] });
    });
    elSonuc.querySelector<HTMLButtonElement>('[data-gys-yeniden]')?.addEventListener('click', () => {
      testiBaslat({ karisik: true });
    });
  }

  function hataListesiniCiz() {
    const liste = hataliSorulariGetir(durum.hatalar, tumSorular, hataFiltre, bugunIstanbul());
    elHataCoz.disabled = !liste.length;
    if (!liste.length) {
      elHataListe.innerHTML = '<p style="color:var(--color-muted);">Bu dönemde bekleyen hatalı sorunuz bulunmuyor.</p>';
      return;
    }
    elHataListe.innerHTML = `<ol style="padding-left:20px;display:grid;gap:8px;">${liste
      .map((s) => {
        const k = durum.hatalar[s.id];
        return `<li><strong>${esc(s.kaynak)}</strong> (${k?.hataSayisi ?? 1} kez hata · ${k?.tarih ?? ''}): ${esc(s.soru.slice(0, 140))}…</li>`;
      })
      .join('')}</ol>`;
  }

  function kitapcikUret() {
    const mod = elPdfMod.value as SinavModu;
    const adet = Math.min(100, Math.max(5, Number(elPdfAdet.value) || 20));
    const agirlikli = elPdfTip.value === 'agirlikli';
    const dugum = aktifDugum();
    let sorular: HazirSoru[];
    if (agirlikli) {
      sorular = kitapcikOlustur(aktifUnvan(), tumSorular, { mod, toplamSoru: adet, agirlikli: true });
    } else {
      let havuz = dugumSorulari(dugum, tumSorular);
      if (elPdfKanun.value) havuz = havuz.filter((s) => s.kanun === elPdfKanun.value);
      sorular = karistir(havuz).slice(0, adet).map((s) => soruyuHazirla(s, mod));
    }

    if (!sorular.length) {
      elPdfOnizleme.innerHTML = '<p>Seçilen kriterlerde soru bulunamadı.</p>';
      elPdfEylem.hidden = true;
      return;
    }

    const tarih = bugunIstanbul();
    const baslik = `${dugum.ad} — 2026 Test Kitapçığı`;
    const soruBloklari = sorular
      .map(
        (item, idx) => `
      <div class="kitap-soru">
        <div class="kitap-soru-ust">
          <span class="kitap-no">${idx + 1}</span>
          <span class="kitap-etiket">${esc(kanunMap.get(item.soru.kanun)?.kisa ?? item.soru.kanun)} · ${esc(item.soru.seviye.toUpperCase())}</span>
        </div>
        <p class="kitap-metin">${esc(item.soru.soru)}</p>
        <ul class="kitap-siklar">
          ${item.siklar.map((s) => `<li><span class="optik">${s.harf}</span> <span>${esc(s.metin)}</span></li>`).join('')}
        </ul>
      </div>`
      )
      .join('');

    const cevaplar = sorular
      .map((item, idx) => `<div class="cevap-kutu"><strong>${idx + 1}. ${item.dogruHarf}</strong><small>${esc(item.soru.kaynak)}</small></div>`)
      .join('');

    sonKitapcikHtml = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${esc(baslik)} | gys.657.com.tr</title>
<style>
@page{size:A4;margin:14mm 12mm 16mm 12mm;}
body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:16px;font-size:10.5pt;line-height:1.45;}
.kapak{background:linear-gradient(135deg,#132036,#1e3a5f);color:#fff;padding:14px 18px;border-radius:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #c8102e;}
.kapak h1{margin:0;font-size:14pt;letter-spacing:.01em;}
.kapak p{margin:4px 0 0;font-size:9pt;opacity:.9;}
.damga{font-size:9pt;font-weight:800;background:#c8102e;color:#fff;padding:4px 10px;border-radius:999px;white-space:nowrap;}
.sutunlar{column-count:2;column-gap:22px;column-rule:1px solid #e5e7eb;}
.kitap-soru{break-inside:avoid;margin-bottom:12px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa;}
.kitap-soru-ust{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.kitap-no{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#132036;color:#fff;font-weight:700;font-size:9pt;}
.kitap-etiket{font-size:7.5pt;font-weight:700;color:#991b1b;background:#fee2e2;padding:2px 6px;border-radius:4px;}
.kitap-metin{margin:0 0 6px;font-weight:600;}
.kitap-siklar{list-style:none;margin:0;padding:0;display:grid;gap:3px;}
.kitap-siklar li{display:flex;gap:6px;align-items:flex-start;font-size:9.5pt;}
.optik{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1.2px solid #132036;border-radius:50%;font-size:8pt;font-weight:700;flex:0 0 16px;margin-top:2px;}
.cevap-bolum{page-break-before:always;margin-top:20px;border-top:3px solid #132036;padding-top:12px;}
.cevap-bolum h2{margin:0 0 10px;font-size:12pt;color:#132036;}
.cevap-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
.cevap-kutu{border:1px solid #d1d5db;border-radius:4px;padding:5px 7px;background:#f9fafb;}
.cevap-kutu strong{display:block;font-size:9.5pt;color:#132036;}
.cevap-kutu small{font-size:7.5pt;color:#4b5563;}
.alt-damga{position:fixed;bottom:4mm;right:6mm;font-size:8pt;color:#6b7280;font-weight:700;}
@media print{body{padding:0;}.kapak{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.kitap-no,.kitap-etiket,.damga{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="alt-damga">gys.657.com.tr · 657.com.tr</div>
<div class="kapak">
  <div><h1>${esc(baslik)}</h1><p>${sorular.length} Soru · ${mod === 'ikili' ? 'İkili Hızlı Tekrar' : 'Klasik 5 Şıklı'} · Tarih: ${tarih}</p></div>
  <div class="damga">gys.657.com.tr · 657.com.tr</div>
</div>
<div class="sutunlar">${soruBloklari}</div>
<div class="cevap-bolum"><h2>Cevap Anahtarı ve Mevzuat Kaynakları</h2><div class="cevap-grid">${cevaplar}</div></div>
</body></html>`;

    elPdfOnizleme.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #132036;padding-bottom:8px;margin-bottom:12px;">
        <div><strong>${esc(baslik)}</strong> (${sorular.length} soru · 2 Sütunlu Kitap Baskısı)</div>
        <span style="font-size:12px;font-weight:800;background:#c8102e;color:#fff;padding:3px 9px;border-radius:999px;">gys.657.com.tr · 657.com.tr</span>
      </div>
      <div style="column-count:2;column-gap:20px;column-rule:1px solid #e5e7eb;">${soruBloklari}</div>
      <div style="margin-top:16px;padding-top:12px;border-top:2px solid #132036;"><strong>Cevap Anahtarı:</strong> ${sorular.map((x, i) => `${i + 1}-${x.dogruHarf}`).join(' · ')}</div>
    `;
    elPdfEylem.hidden = false;
  }

  // Olay bağlamaları
  elUnvan.value = durum.unvanId;
  elUnvan.addEventListener('change', () => {
    durum.unvanId = elUnvan.value;
    const eslesenDugum = dugumBul(agacVeri.kok, elUnvan.value);
    if (eslesenDugum) durum.seciliDugumId = eslesenDugum.id;
    durumKaydet();
    ustBilgileriGuncelle();
  });

  elTabs.forEach((b) => b.addEventListener('click', () => sekmeAc(b.dataset.gysTab!)));
  elBaslat.addEventListener('click', () => testiBaslat());
  elKarisik.addEventListener('click', () => testiBaslat({ karisik: true }));
  elSonsuz.addEventListener('click', () => testiBaslat({ sonsuz: true }));
  elDeneme.addEventListener('click', () => testiBaslat({ deneme: true }));
  elSonraki.addEventListener('click', () => {
    if (sonsuzMod) {
      const mod = elMod.value as SinavModu;
      const yeni = sonsuzSonrakiSoru(aktifHavuz, sonSoruId, mod);
      if (yeni) {
        sonSoruId = yeni.soru.id;
        aktifTest = [yeni];
        aktifIdx = 0;
        soruyuCiz();
      }
      return;
    }
    if (aktifIdx + 1 < aktifTest.length) {
      aktifIdx++;
      soruyuCiz();
    } else {
      sonucuGoster();
    }
  });
  elBitir.addEventListener('click', sonucuGoster);

  elHataFiltreBtns.forEach((b) => {
    b.addEventListener('click', () => {
      hataFiltre = b.dataset.gysHataFiltre as typeof hataFiltre;
      elHataFiltreBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      hataListesiniCiz();
    });
  });
  elHataCoz.addEventListener('click', () => {
    const liste = hataliSorulariGetir(durum.hatalar, tumSorular, hataFiltre, bugunIstanbul());
    if (!liste.length) return;
    sekmeAc('sinav');
    testiBaslat({ ozelSorular: liste });
  });
  elIstatistikSifirla.addEventListener('click', () => {
    durum = {
      unvanId: elUnvan.value,
      seciliDugumId: durum.seciliDugumId,
      sonKanun: '',
      toplamCozulen: 0,
      toplamDogru: 0,
      hatalar: {},
      soruGecmisi: {},
    };
    durumKaydet();
    ustBilgileriGuncelle();
    hataListesiniCiz();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-gys-kitap-coz]').forEach((b) => {
    b.addEventListener('click', () => {
      sekmeAc('sinav');
      durum.seciliDugumId = agacVeri.kok.id;
      ustBilgileriGuncelle();
      if ([...elKanun.options].some((o) => o.value === b.dataset.gysKitapCoz)) {
        elKanun.value = b.dataset.gysKitapCoz!;
      }
      testiBaslat();
    });
  });

  elPdfUret.addEventListener('click', kitapcikUret);
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `657-gys-kitapcik-${durum.seciliDugumId}-${bugunIstanbul()}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  ustBilgileriGuncelle();
  void genelIstatistikleriYukle();
}
