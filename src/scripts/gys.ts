import { canliSinavBagla } from './canli-sinav';
import { platformSayacYenile } from './platform-sayac';
import {
  type GysKonu,
  bugunCozulenArtir,
  bugunCozulenOku,
  kayitliSorularKaydet,
  kayitliSorularOku,
  konularPaneliniBagla,
  otomatikGecisKaydet,
  otomatikGecisOku,
} from './gys-ux';
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
const OZEL_STORE_KEY = '657:gys:ozel-sorular';
const GYS_API = '/_657-servis/api/gys/soru';
const GYS_ONERILEN_API = '/_657-servis/api/gys/onerilen';
const GYS_OYLA_API = '/_657-servis/api/gys/oyla';
const GYS_BILDIR_API = '/_657-servis/api/gys/bildir';

interface ToplulukSorusu extends GysSoru {
  durum?: 'bekliyor' | 'onayli' | 'reddedildi';
  onayOy?: number;
  redOy?: number;
  kullaniciEkledi?: boolean;
}

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
  const elZayifBar = root.querySelector<HTMLElement>('[data-gys-zayif]');

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
  const elToplulukCoz = root.querySelector<HTMLButtonElement>('[data-gys-topluluk-coz]')!;
  const elBekleyenSayi = root.querySelector<HTMLElement>('[data-gys-bekleyen-sayi]')!;
  const elJsonIndir = root.querySelector<HTMLButtonElement>('[data-gys-json-indir]')!;

  const elSahne = root.querySelector<HTMLElement>('[data-gys-sahne]')!;
  const elToplulukUyari = root.querySelector<HTMLElement>('[data-gys-topluluk-uyari]')!;
  const elSira = root.querySelector<HTMLElement>('[data-gys-sira]')!;
  const elRozet = root.querySelector<HTMLElement>('[data-gys-rozet]')!;
  const elVaryasyon = root.querySelector<HTMLElement>('[data-gys-varyasyon]')!;
  const elSoruIstatistik = root.querySelector<HTMLElement>('[data-gys-soru-istatistik]')!;
  const elSoruMetin = root.querySelector<HTMLElement>('[data-gys-soru-metin]')!;
  const elSiklar = root.querySelector<HTMLElement>('[data-gys-siklar]')!;
  const elAciklama = root.querySelector<HTMLElement>('[data-gys-aciklama]')!;
  const elOylaBar = root.querySelector<HTMLElement>('[data-gys-oyla-bar]')!;
  const elOySonuc = root.querySelector<HTMLElement>('[data-gys-oy-sonuc]')!;
  const elBildirForm = root.querySelector<HTMLFormElement>('[data-gys-bildir-form]')!;
  const elBildirTur = root.querySelector<HTMLInputElement>('[data-gys-bildir-tur]')!;
  const elBildirBaslik = root.querySelector<HTMLElement>('[data-gys-bildir-baslik]')!;
  const elBildirMetin = root.querySelector<HTMLTextAreaElement>('[data-gys-bildir-metin]')!;
  const elBildirDurum = root.querySelector<HTMLElement>('[data-gys-bildir-durum]')!;
  const elSonraki = root.querySelector<HTMLButtonElement>('[data-gys-sonraki]')!;
  const elOnceki = root.querySelector<HTMLButtonElement>('[data-gys-onceki]');
  const elBitir = root.querySelector<HTMLButtonElement>('[data-gys-bitir]')!;
  const elSonuc = root.querySelector<HTMLElement>('[data-gys-sonuc]')!;
  const elKaydet = root.querySelector<HTMLButtonElement>('[data-gys-kaydet]');
  const elOtomatik = root.querySelector<HTMLInputElement>('[data-gys-otomatik]');
  const elIlerlemeDolgu = root.querySelector<HTMLElement>('[data-gys-ilerleme-dolgu]');
  const elRayDogru = root.querySelector<HTMLElement>('[data-gys-ray-dogru]');
  const elRayYanlis = root.querySelector<HTMLElement>('[data-gys-ray-yanlis]');
  const elRayBugun = root.querySelector<HTMLElement>('[data-gys-ray-bugun]');
  const elRayPuanKutu = root.querySelector<HTMLElement>('[data-gys-ray-puan-kutu]');
  const elRayPuan = root.querySelector<HTMLElement>('[data-gys-ray-puan]');
  const elUstBugun = root.querySelector<HTMLElement>('[data-gys-ust-bugun]');
  const elKayitliSayi = root.querySelector<HTMLElement>('[data-gys-kayitli-sayi]');
  const elHizli10 = root.querySelector<HTMLButtonElement>('[data-gys-hizli-10]');
  const elHizliRastgele = root.querySelector<HTMLButtonElement>('[data-gys-hizli-rastgele]');
  const elYaris60 = root.querySelector<HTMLButtonElement>('[data-gys-yaris-60]');
  const elKayitliCoz = root.querySelector<HTMLButtonElement>('[data-gys-kayitli-coz]');
  const elZayifCoz = root.querySelector<HTMLButtonElement>('[data-gys-zayif-coz]');

  const konularVeri: GysKonu[] = (() => {
    try {
      return JSON.parse(root.querySelector('#gys-konular-veri')?.textContent || '[]');
    } catch {
      return [];
    }
  })();
  const kayitliSet = kayitliSorularOku();
  let yarisModu = false;
  let yarisPuan = 0;
  let otoZamanlayici: number | null = null;
  let soruZamanlayici: number | null = null;

  function otoTemizle() {
    if (otoZamanlayici !== null) {
      window.clearTimeout(otoZamanlayici);
      otoZamanlayici = null;
    }
    if (soruZamanlayici !== null) {
      window.clearInterval(soruZamanlayici);
      soruZamanlayici = null;
    }
  }

  const elSbDogru = root.querySelector<HTMLElement>('[data-gys-sb-dogru]');
  const elSbYanlis = root.querySelector<HTMLElement>('[data-gys-sb-yanlis]');
  const elBarajBar = root.querySelector<HTMLElement>('[data-gys-baraj-bar]');

  function skorRayGuncelle() {
    const bugunSayi = bugunCozulenOku();
    if (elRayDogru) elRayDogru.textContent = String(testDogru);
    if (elRayYanlis) elRayYanlis.textContent = String(Math.max(0, testCozulen - testDogru));
    if (elRayBugun) elRayBugun.textContent = String(bugunSayi);
    if (elUstBugun) elUstBugun.textContent = `${bugunSayi} / 50`;
    if (elKayitliSayi) elKayitliSayi.textContent = String(kayitliSet.size);
    if (elRayPuanKutu) elRayPuanKutu.hidden = !yarisModu;
    if (elRayPuan) elRayPuan.textContent = String(yarisPuan);
    if (elSbDogru) elSbDogru.textContent = String(durum.toplamDogru);
    if (elSbYanlis) elSbYanlis.textContent = String(Math.max(0, durum.toplamCozulen - durum.toplamDogru));
    if (elBarajBar) {
      const oran = durum.toplamCozulen ? Math.round((durum.toplamDogru / durum.toplamCozulen) * 100) : 0;
      elBarajBar.style.width = `${oran}%`;
    }
  }

  function kaydetButonGuncelle(soruId?: string) {
    if (!elKaydet || !soruId) return;
    const varMi = kayitliSet.has(soruId);
    elKaydet.textContent = varMi ? '★ Kaydedildi' : '🔖 Soruyu Kaydet';
    elKaydet.classList.toggle('gys-kayitli-aktif', varMi);
  }

  if (elOtomatik) {
    elOtomatik.checked = otomatikGecisOku();
    elOtomatik.addEventListener('change', () => otomatikGecisKaydet(elOtomatik.checked));
  }

  const elEkleForm = root.querySelector<HTMLFormElement>('[data-gys-ekle-form]')!;
  const elEkleDurum = root.querySelector<HTMLElement>('[data-gys-ekle-durum]')!;
  const elOzelIndir = root.querySelector<HTMLButtonElement>('[data-gys-ozel-indir]')!;
  const elOzelListe = root.querySelector<HTMLElement>('[data-gys-ozel-liste]')!;

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
  let bekleyenToplulukSorulari: ToplulukSorusu[] = [];
  let ozelSorular: GysSoru[] = (() => {
    try {
      const ham = JSON.parse(localStorage.getItem(OZEL_STORE_KEY) || '[]');
      return Array.isArray(ham) ? ham : [];
    } catch {
      return [];
    }
  })();
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
      void platformSayacYenile();
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
    elTabs.forEach((b) => {
      const aktif = b.dataset.gysTab === hedef;
      b.setAttribute('aria-selected', String(aktif));
      b.classList.toggle('is-active', aktif);
    });
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

    // Akıllı Zayıf Konu Analizi (en düşük başarı oranına sahip en fazla 3 ders)
    if (elZayifBar) {
      const dersStats = new Map<string, { d: number; y: number }>();
      for (const s of tumSorular) {
        const st = durum.soruGecmisi[s.id];
        if (!st || st.cozum === 0) continue;
        const cur = dersStats.get(s.kanun) ?? { d: 0, y: 0 };
        cur.d += st.dogru;
        cur.y += st.yanlis;
        dersStats.set(s.kanun, cur);
      }
      const zayiflar = [...dersStats.entries()]
        .map(([k, v]) => ({ k, oran: Math.round((v.d / Math.max(1, v.d + v.y)) * 100), top: v.d + v.y }))
        .filter((x) => x.oran < 80)
        .sort((a, b) => a.oran - b.oran || b.top - a.top)
        .slice(0, 3);
      if (zayiflar.length) {
        elZayifBar.hidden = false;
        elZayifBar.innerHTML =
          `<strong>Zayıf Konu Analizi:</strong>` +
          zayiflar
            .map((z) => {
              const ad = kanunMap.get(z.k)?.kisa ?? z.k;
              return `<button type="button" class="gys-zayif-chip" data-zayif-kanun="${z.k}">${ad} · %${z.oran} (${z.top} soru)</button>`;
            })
            .join('');
        elZayifBar.querySelectorAll<HTMLButtonElement>('[data-zayif-kanun]').forEach((btn) => {
          btn.addEventListener('click', () => {
            elKanun.value = btn.dataset.zayifKanun || '';
            durum.sonKanun = elKanun.value;
            durumKaydet();
            elBaslat.click();
          });
        });
      } else {
        elZayifBar.hidden = true;
      }
    }

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

  function testiBaslat(secenek: { ozelSorular?: GysSoru[]; sonsuz?: boolean; deneme?: boolean; karisik?: boolean; yaris?: boolean; hedefAdet?: number } = {}) {
    kronometreyiDurdur();
    otoTemizle();
    const mod = elMod.value as SinavModu;
    sonsuzMod = Boolean(secenek.sonsuz);
    yarisModu = Boolean(secenek.yaris);
    yarisPuan = 0;
    elSeri.hidden = !sonsuzMod && !yarisModu;
    seri = 0;
    sonSoruId = null;

    if (secenek.ozelSorular) {
      aktifHavuz = secenek.ozelSorular;
      const limit = secenek.hedefAdet ? Math.min(secenek.hedefAdet, secenek.ozelSorular.length) : secenek.ozelSorular.length;
      aktifTest = karistir(secenek.ozelSorular).slice(0, limit).map((s) => soruyuHazirla(s, mod));
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
        const hedef = secenek.hedefAdet
          ? Math.min(secenek.hedefAdet, aktifHavuz.length)
          : secenek.deneme
            ? Math.min(dugum.sinavSoruSayisi ?? 80, aktifHavuz.length)
            : Math.min(Number(elAdet.value) || 20, aktifHavuz.length);
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
    elAktifMod.textContent = yarisModu
      ? '⏱ 60 sn Yarış (+10 / -3)'
      : sonsuzMod
        ? `∞ Sonsuz Test (${mod === 'ikili' ? '2 Şık' : '5 Şık'})`
        : secenek.deneme
          ? `Deneme Sınavı (${mod === 'ikili' ? '2 Şık' : '5 Şık'})`
          : mod === 'ikili'
            ? 'Hızlı Tekrar (2 Şık)'
            : 'Klasik Mod (5 Şık)';
    elSonuc.hidden = true;
    elSahne.hidden = false;
    skorRayGuncelle();
    soruyuCiz();
  }

  function soruyuCiz() {
    otoTemizle();
    const item = aktifTest[aktifIdx];
    if (!item) return;
    const tSoru = item.soru as ToplulukSorusu;
    const onayBekliyor = Boolean(tSoru.kullaniciEkledi && tSoru.durum !== 'onayli');
    elToplulukUyari.hidden = !onayBekliyor;
    elOylaBar.hidden = true;
    elOySonuc.textContent = '';
    elBildirForm.hidden = true;
    elBildirDurum.textContent = '';
    elSira.textContent = sonsuzMod ? `∞ Soru #${testCozulen + 1}` : `Soru ${aktifIdx + 1} / ${aktifTest.length}`;
    if (elIlerlemeDolgu) {
      const yuzde = sonsuzMod ? Math.min(100, (testCozulen % 20) * 5 + 5) : Math.round(((aktifIdx + 1) / Math.max(1, aktifTest.length)) * 100);
      elIlerlemeDolgu.style.width = `${yuzde}%`;
    }
    if (elOnceki) elOnceki.hidden = sonsuzMod || aktifIdx === 0;
    elSeri.textContent = yarisModu ? `Puan: ${yarisPuan}` : `Seri: ${seri}`;
    const kanun = kanunMap.get(item.soru.kanun);
    elRozet.textContent = `${kanun?.kisa ?? item.soru.kanun} · ${item.soru.seviye.toUpperCase()}${item.soru.tur ? ' · ' + item.soru.tur : ''}`;
    elVaryasyon.textContent = item.varyasyonSayisi > 1 ? `Kombinatoryal: ${item.varyasyonSayisi.toLocaleString('tr-TR')} varyasyon` : '';
    soruIstatistikCiz(item.soru.id);
    kaydetButonGuncelle(item.soru.id);
    skorRayGuncelle();
    elSoruMetin.textContent = item.soru.soru;
    elAciklama.hidden = true;
    elSonraki.hidden = true;
    elSiklar.innerHTML = item.siklar
      .map((s) => `<button type="button" class="gys-sik" data-gys-sik="${s.harf}"><strong>${s.harf})</strong> <span>${esc(s.metin)}</span></button>`)
      .join('');

    elSiklar.querySelectorAll<HTMLButtonElement>('[data-gys-sik]').forEach((btn) => {
      btn.addEventListener('click', () => cevabiIsle(btn.dataset.gysSik!));
    });

    if (yarisModu) {
      let kalanSn = 60;
      elSure.hidden = false;
      elSure.textContent = `01:00`;
      soruZamanlayici = window.setInterval(() => {
        kalanSn--;
        const s = Math.max(0, kalanSn);
        elSure.textContent = `00:${String(s).padStart(2, '0')}`;
        if (s <= 0) {
          otoTemizle();
          cevabiIsle('');
        }
      }, 1000);
    }
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
    if (yarisModu) yarisPuan += dogruMu ? 10 : -3;
    bugunCozulenArtir();
    otoTemizle();
    durumKaydet();
    ustBilgileriGuncelle();
    skorRayGuncelle();
    soruIstatistikCiz(item.soru.id);
    void genelIstatistikGonder(item.soru.id, dogruMu);

    const mevzuatUrl = item.soru.mevzuatUrl || kanunMap.get(item.soru.kanun)?.kaynak || 'https://www.mevzuat.gov.tr/';
    elAciklama.innerHTML = `
      <strong>${dogruMu ? '✓ Doğru Cevap!' : `✗ Yanlış. Doğru Cevap: ${item.dogruHarf}`}</strong>
      <p style="margin:6px 0;">${esc(item.soru.aciklama)}</p>
      <small><strong>Kaynak:</strong> ${esc(item.soru.kaynak)} · <a href="${esc(mevzuatUrl)}" target="_blank" rel="noopener noreferrer">Mevzuat.gov.tr →</a></small>
    `;
    elAciklama.hidden = false;
    const tSoru = item.soru as ToplulukSorusu;
    if (tSoru.kullaniciEkledi && tSoru.durum !== 'onayli') {
      elOylaBar.hidden = false;
      elOylaBar.querySelectorAll<HTMLButtonElement>('[data-gys-oy]').forEach((b) => (b.disabled = false));
    }
    elSonraki.textContent = sonsuzMod
      ? 'Sonraki Rastgele Soru →'
      : aktifIdx + 1 < aktifTest.length
        ? 'Sonraki Soru →'
        : 'Sonucu Gör';
    elSonraki.hidden = false;
    if (elOtomatik?.checked && (sonsuzMod || aktifIdx + 1 < aktifTest.length)) {
      otoZamanlayici = window.setTimeout(() => elSonraki.click(), 3000);
    }
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

  async function toplulukSorulariniYukle() {
    try {
      const r = await fetch(`${GYS_ONERILEN_API}?durum=tumu`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!r.ok) return;
      const d = await r.json();
      const liste: ToplulukSorusu[] = Array.isArray(d?.sorular) ? d.sorular : [];
      bekleyenToplulukSorulari = liste.filter((s) => s.durum === 'bekliyor');
      const onaylilar = liste.filter((s) => s.durum === 'onayli');
      const mevcutIds = new Set(tumSorular.map((s) => s.id));
      for (const s of onaylilar) {
        if (!mevcutIds.has(s.id)) {
          tumSorular.push(s);
          mevcutIds.add(s.id);
        }
      }
      elBekleyenSayi.textContent = String(bekleyenToplulukSorulari.length);
      if (onaylilar.length) ustBilgileriGuncelle();
    } catch {
      /* çevrimdışı modda sessizce geç */
    }
  }

  function ozelListeyiCiz() {
    elOzelIndir.hidden = ozelSorular.length === 0;
    if (!ozelSorular.length) {
      elOzelListe.innerHTML = '';
      return;
    }
    elOzelListe.innerHTML = `<h3 style="margin:var(--space-md) 0 var(--space-xs);font-size:var(--text-sm);">Yerel Hazırladığınız Sorular (${ozelSorular.length})</h3><ol style="padding-left:20px;font-size:13px;display:grid;gap:6px;">${ozelSorular
      .map((s) => `<li><strong>${esc(s.bolum)}</strong> · ${esc(s.soru.slice(0, 120))}…</li>`)
      .join('')}</ol>`;
  }

  function formdanSoruOku(): GysSoru | null {
    const kanun = root!.querySelector<HTMLSelectElement>('[data-gys-ekle-kanun]')!.value;
    const bolum = root!.querySelector<HTMLSelectElement>('[data-gys-ekle-bolum]')!.value;
    const seviye = root!.querySelector<HTMLSelectElement>('[data-gys-ekle-seviye]')!.value as Zorluk;
    const soru = root!.querySelector<HTMLTextAreaElement>('[data-gys-ekle-soru]')!.value.trim();
    const dogru = root!.querySelector<HTMLTextAreaElement>('[data-gys-ekle-dogru]')!.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const yanlis = root!.querySelector<HTMLTextAreaElement>('[data-gys-ekle-yanlis]')!.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const kaynak = root!.querySelector<HTMLInputElement>('[data-gys-ekle-kaynak]')!.value.trim();
    const aciklama = root!.querySelector<HTMLInputElement>('[data-gys-ekle-aciklama]')!.value.trim();
    if (soru.length < 20 || dogru.length < 1 || yanlis.length < 4 || kaynak.length < 3 || aciklama.length < 10) {
      elEkleDurum.textContent = 'Lütfen en az 1 doğru, 4 yanlış şık, 20 karakter soru ve kaynak/açıklama girin.';
      return null;
    }
    return {
      id: `ozel-${Date.now().toString(36)}`,
      kanun,
      bolum,
      seviye,
      tur: 'madde',
      soru,
      dogru,
      yanlis,
      kaynak,
      aciklama,
    };
  }

  elJsonIndir.addEventListener('click', () => {
    const havuz = filtreliHavuz();
    const blob = new Blob([JSON.stringify(havuz, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `657-gys-sorular-${durum.seciliDugumId}-${bugunIstanbul()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  elToplulukCoz.addEventListener('click', () => {
    if (!bekleyenToplulukSorulari.length) {
      elSonuc.hidden = false;
      elSahne.hidden = true;
      elSonuc.innerHTML = '<p>Şu an topluluk onayı bekleyen soru bulunmuyor. "Soru Hazırla & Yükle" sekmesinden ilk soruyu ekleyebilirsiniz.</p>';
      return;
    }
    testiBaslat({ ozelSorular: bekleyenToplulukSorulari });
  });

  elOylaBar.querySelectorAll<HTMLButtonElement>('[data-gys-oy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const soruId = aktifTest[aktifIdx]?.soru.id;
      if (!soruId) return;
      elOylaBar.querySelectorAll<HTMLButtonElement>('[data-gys-oy]').forEach((b) => (b.disabled = true));
      try {
        const r = await fetch(GYS_OYLA_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ istekId: crypto.randomUUID(), soruId, onay: btn.dataset.gysOy === 'evet' }),
        });
        if (!r.ok) throw Error();
        const d = await r.json();
        elOySonuc.textContent = d.durum === 'onayli'
          ? 'Teşekkürler! Soru yeterli oya ulaşarak resmî havuza eklendi.'
          : `Oyunuz kaydedildi (Onay: ${d.onayOy} · Red: ${d.redOy}).`;
      } catch {
        elOySonuc.textContent = 'Oy kaydedilemedi; daha sonra tekrar deneyin.';
      }
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-gys-bildir-ac]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tur = btn.dataset.gysBildirAc!;
      elBildirTur.value = tur;
      elBildirBaslik.textContent = tur === 'telif' ? 'Telif İhlali Bildirimi (Kaynak / Hak Sahibi Bilgisi)' : 'Soru veya Cevap Hatası Bildirimi (Madde / Gerekçe)';
      elBildirForm.hidden = false;
      elBildirMetin.focus();
    });
  });
  root.querySelector<HTMLButtonElement>('[data-gys-bildir-iptal]')?.addEventListener('click', () => {
    elBildirForm.hidden = true;
  });
  elBildirForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const soruId = aktifTest[aktifIdx]?.soru.id;
    if (!soruId) return;
    elBildirDurum.textContent = 'Gönderiliyor…';
    try {
      const r = await fetch(GYS_BILDIR_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soruId, tur: elBildirTur.value, aciklama: elBildirMetin.value.trim() }),
      });
      if (!r.ok) throw Error();
      elBildirMetin.value = '';
      elBildirDurum.textContent = '✓ Bildiriminiz inceleme kuyruğuna kaydedildi.';
    } catch {
      elBildirDurum.textContent = 'Bildirim gönderilemedi (en az 10 karakter girin).';
    }
  });

  root.querySelector<HTMLButtonElement>('[data-gys-ekle-yerel]')?.addEventListener('click', () => {
    const yeni = formdanSoruOku();
    if (!yeni) return;
    ozelSorular.push(yeni);
    try { localStorage.setItem(OZEL_STORE_KEY, JSON.stringify(ozelSorular)); } catch {}
    ozelListeyiCiz();
    elEkleDurum.textContent = `✓ Yerel listenize eklendi (${ozelSorular.length} soru). JSON olarak indirebilirsiniz.`;
    elEkleForm.reset();
  });
  elOzelIndir.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(ozelSorular, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `657-kendi-sorularim-${bugunIstanbul()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  elEkleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const yeni = formdanSoruOku();
    if (!yeni) return;
    elEkleDurum.textContent = 'Sisteme yükleniyor…';
    try {
      const r = await fetch(GYS_ONERILEN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yeni),
      });
      if (!r.ok) throw Error();
      elEkleDurum.textContent = '✓ Sorunuz topluluk ve yönetici onayına gönderildi! Diğer kullanıcılar oylayabilir.';
      elEkleForm.reset();
      void toplulukSorulariniYukle();
    } catch {
      elEkleDurum.textContent = 'Sunucuya yüklenemedi; önce yerel listenize kaydedebilirsiniz.';
    }
  });

  // Kişisel Performans Paneli + Hash / Üst Menü Sekme Geçişi + Mevzuat Paketi İndir + Canlı Sınav
  const elPerfListe = root.querySelector<HTMLElement>('[data-gys-perf-liste]');
  const elMevzuatIndir = root.querySelector<HTMLButtonElement>('[data-gys-mevzuat-indir]');
  const elMevzuatVeri = document.getElementById('gys-mevzuat-veri');

  function performansCiz() {
    if (!elPerfListe) return;
    const dersler = new Map<string, { cozum: number; dogru: number; yanlis: number }>();
    for (const s of tumSorular) {
      const st = durum.soruGecmisi[s.id];
      if (!st || st.cozum === 0) continue;
      const cur = dersler.get(s.kanun) ?? { cozum: 0, dogru: 0, yanlis: 0 };
      cur.cozum += st.cozum;
      cur.dogru += st.dogru;
      cur.yanlis += st.yanlis;
      dersler.set(s.kanun, cur);
    }
    const satirlar = [...dersler.entries()].sort((a, b) => b[1].cozum - a[1].cozum);
    if (!satirlar.length) {
      elPerfListe.innerHTML = '<p class="gys-ipucu">Henüz çözülmüş soru bulunmuyor. Sınav &amp; Sonsuz Test sekmesinden soru çözdükçe ders bazlı performansınız burada anlık oluşur.</p>';
      return;
    }
    elPerfListe.innerHTML = satirlar
      .map(([kod, v]) => {
        const ad = kanunMap.get(kod)?.ad ?? kod;
        const oran = Math.round((v.dogru / Math.max(1, v.dogru + v.yanlis)) * 100);
        return `<div class="gys-perf-satir">
          <strong>${ad}</strong>
          <span class="num">${v.dogru} D / ${v.yanlis} Y (%${oran})</span>
          <div class="gys-perf-ray"><div class="gys-perf-dolgu" style="width:${oran}%"></div></div>
          <button type="button" class="btn btn--quiet btn--kucuk" data-perf-calis="${kod}">Çalış</button>
        </div>`;
      })
      .join('');
    elPerfListe.querySelectorAll<HTMLButtonElement>('[data-perf-calis]').forEach((b) => {
      b.addEventListener('click', () => {
        sekmeAc('sinav');
        elKanun.value = b.dataset.perfCalis || '';
        durum.sonKanun = elKanun.value;
        durumKaydet();
        elBaslat.click();
      });
    });
  }

  const HASH_TAB_MAP: Record<string, string> = {
    '#gys-sinav-alani': 'sinav',
    '#gys-agac-bolum': 'sinav',
    '#gys-canli-sinav': 'canli',
    '#gys-performans': 'performans',
    '#gys-studyo': 'ekle',
    '#gys-takvim': 'takvim',
  };

  function hashUygula() {
    const h = window.location.hash;
    const tab = HASH_TAB_MAP[h];
    if (!tab) return;
    sekmeAc(tab);
    if (tab === 'performans') performansCiz();
    const target = document.querySelector<HTMLElement>(h);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  window.addEventListener('hashchange', hashUygula);
  document.querySelectorAll<HTMLAnchorElement>('.sub-nav a[href^="#gys-"]').forEach((a) => {
    a.addEventListener('click', () => {
      const tab = HASH_TAB_MAP[a.getAttribute('href') || ''];
      if (tab) {
        sekmeAc(tab);
        if (tab === 'performans') performansCiz();
      }
    });
  });

  elMevzuatIndir?.addEventListener('click', () => {
    if (!elMevzuatVeri) return;
    try {
      const veri = JSON.parse(elMevzuatVeri.textContent || '{}') as {
        mevzuatlar: Array<{ kod: string; ad: string; grup: string; sinavlar: string[]; url: string }>;
      };
      const seciliId = durum.seciliDugumId || durum.unvanId;
      const ilgili = veri.mevzuatlar.filter((m) => m.sinavlar.includes(seciliId));
      const liste = ilgili.length ? ilgili : veri.mevzuatlar;
      const icerik = [
        `657.com.tr — GYS Resmî Mevzuat & Konu Çalışma Paketi (${new Date().toLocaleDateString('tr-TR')})`,
        `Seçili Alan/Ünvan: ${seciliId}`,
        `Toplam Mevzuat: ${liste.length} resmî kaynak (mevzuat.gov.tr)`,
        '='.repeat(70),
        '',
        ...liste.map((m, i) => `${i + 1}. [${m.grup}] ${m.ad}\n   Resmî Bağlantı: ${m.url}`),
        '',
        'Kaynak: https://gys.657.com.tr/ & https://www.mevzuat.gov.tr/',
      ].join('\n');
      const blob = new Blob([icerik], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `657-gys-mevzuat-paketi-${seciliId}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch { /* geç */ }
  });

  canliSinavBagla(root.querySelector<HTMLElement>('[data-gys-canli-root]'), 'gys', () => {
    if (!durum.toplamCozulen) return null;
    const oran = Math.round((durum.toplamDogru / Math.max(1, durum.toplamCozulen)) * 100);
    return {
      skor: oran,
      dogru: durum.toplamDogru,
      yanlis: Math.max(0, durum.toplamCozulen - durum.toplamDogru),
      sureSn: 0,
      detay: `${durum.toplamCozulen} soru · %${oran}`,
    };
  });

  ozelListeyiCiz();
  ustBilgileriGuncelle();
  skorRayGuncelle();
  performansCiz();

  konularPaneliniBagla(root, konularVeri, tumSorular, (konu, havuz) => {
    sekmeAc('sinav');
    elDugumBaslik.textContent = `${konu.no}. ${konu.kisa}`;
    elDugumYol.textContent = konu.ad;
    testiBaslat({ ozelSorular: havuz, hedefAdet: Math.min(20, havuz.length) });
    elSahne.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  elHizli10?.addEventListener('click', () => {
    sekmeAc('sinav');
    testiBaslat({ hedefAdet: 10 });
    elSahne.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  elHizliRastgele?.addEventListener('click', () => {
    sekmeAc('sinav');
    testiBaslat({ sonsuz: true });
    elSahne.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  elYaris60?.addEventListener('click', () => {
    sekmeAc('sinav');
    testiBaslat({ yaris: true, hedefAdet: 15 });
    elSahne.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  elKayitliCoz?.addEventListener('click', () => {
    const liste = tumSorular.filter((s) => kayitliSet.has(s.id));
    if (!liste.length) {
      sekmeAc('sinav');
      elSonuc.hidden = false;
      elSahne.hidden = true;
      elSonuc.innerHTML = '<p>Henüz kaydettiğiniz soru yok. Soru çözerken <strong>🔖 Soruyu Kaydet</strong> düğmesiyle önemli soruları listeye ekleyebilirsiniz.</p>';
      return;
    }
    sekmeAc('sinav');
    testiBaslat({ ozelSorular: liste });
    elSahne.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  elZayifCoz?.addEventListener('click', () => {
    const dersler = new Map<string, { d: number; y: number }>();
    for (const s of tumSorular) {
      const st = durum.soruGecmisi[s.id];
      if (!st || !st.cozum) continue;
      const cur = dersler.get(s.kanun) ?? { d: 0, y: 0 };
      cur.d += st.dogru;
      cur.y += st.yanlis;
      dersler.set(s.kanun, cur);
    }
    const enZayif = [...dersler.entries()].sort((a, b) => a[1].d / Math.max(1, a[1].d + a[1].y) - b[1].d / Math.max(1, b[1].d + b[1].y))[0];
    sekmeAc('sinav');
    if (enZayif) {
      const zHavuz = tumSorular.filter((s) => s.kanun === enZayif[0]);
      testiBaslat({ ozelSorular: zHavuz, hedefAdet: 15 });
    } else {
      testiBaslat({ hedefAdet: 15 });
    }
    elSahne.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  elKaydet?.addEventListener('click', () => {
    const item = aktifTest[aktifIdx];
    if (!item) return;
    if (kayitliSet.has(item.soru.id)) kayitliSet.delete(item.soru.id);
    else kayitliSet.add(item.soru.id);
    kayitliSorularKaydet(kayitliSet);
    kaydetButonGuncelle(item.soru.id);
    skorRayGuncelle();
  });
  elOnceki?.addEventListener('click', () => {
    if (aktifIdx > 0) {
      aktifIdx--;
      soruyuCiz();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (elSahne.hidden) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const k = e.key.toLowerCase();
    const harfMap: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
    if (harfMap[k]) {
      const btn = elSiklar.querySelector<HTMLButtonElement>(`[data-gys-sik="${harfMap[k]}"]:not(:disabled)`);
      if (btn) btn.click();
    } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && !elSonraki.hidden) {
      e.preventDefault();
      elSonraki.click();
    } else if (k === 'k' && elKaydet) {
      elKaydet.click();
    }
  });

  const initialTab = root.dataset.gysInitialTab;
  if (initialTab && initialTab !== 'sinav') {
    sekmeAc(initialTab);
    if (initialTab === 'performans') performansCiz();
  }
  hashUygula();
  void genelIstatistikleriYukle();
  void toplulukSorulariniYukle();
}
