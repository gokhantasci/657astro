import { canliSinavBagla } from './canli-sinav';
import { platformSayacYenile } from './platform-sayac';
import { mulakatPaneliniBagla } from './gys-mulakat';
import { normalize } from '../lib/normalize';
import {
  type GysKonu,
  bugunCozulenArtir,
  bugunCozulenOku,
  kayitliSorularKaydet,
  kayitliSorularOku,
  konuHavuzu,
  otomatikGecisKaydet,
  otomatikGecisOku,
  tamamlananKonularOku,
} from './gys-ux';
import {
  dugumBolumleri,
  dugumBul,
  dugumSorulari,
  dugumYolu,
  hataliSorulariGetir,
  karistir,
  kitapcikOlustur,
  sonsuzSonrakiSoru,
  soruyuHazirla,
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

interface Tercihler {
  adet: string;
  mod: SinavModu;
  seviye: string;
}

interface KisiselDurum {
  unvanId: string;
  seciliDugumId: string;
  /** Kullanıcı sınavını en az bir kez seçti ya da onayladı; seçici kapalı açılır. */
  secimOnayli: boolean;
  sonKanun: string;
  tercih: Tercihler;
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

interface ToplulukSorusu extends GysSoru {
  durum?: 'bekliyor' | 'onayli' | 'reddedildi';
  onayOy?: number;
  redOy?: number;
  kullaniciEkledi?: boolean;
}

interface TestSecenek {
  ad?: string;
  ozelSorular?: GysSoru[];
  ilkSoru?: GysSoru;
  sonsuz?: boolean;
  deneme?: boolean;
  yaris?: boolean;
  hedefAdet?: number;
}

const STORE_KEY = '657:gys:durum';
const OZEL_STORE_KEY = '657:gys:ozel-sorular';
const GYS_API = '/_657-servis/api/gys/soru';
const GYS_ONERILEN_API = '/_657-servis/api/gys/onerilen';
const GYS_OYLA_API = '/_657-servis/api/gys/oyla';
const GYS_BILDIR_API = '/_657-servis/api/gys/bildir';
const VARSAYILAN_TERCIH: Tercihler = { adet: '20', mod: 'klasik', seviye: '' };

// mufredat.unvanlar kimlikleri ağaçtaki düğümlerden biraz farklıdır; ağırlıklı kitapçık için eşlenir.
const UNVAN_ESLEME: Record<string, string> = {
  'idari-isler-muduru': 'idari-isleri-muduru',
  'sef-tasra': 'sef',
  'merkez-sef': 'sef',
  'zabit-katibi-gys': 'zabit-katibi',
  'cte-idare-basmemur': 'cte-idare-memuru',
};

function bugunIstanbul(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** "Yazı İşleri Müdürü (80 Soru: …)" gibi adlardaki açıklama parantezini atar. */
const sadeAd = (ad: string) => ad.replace(/\s*\([^)]*\d[^)]*\)\s*$/, '').trim();

function indir(icerik: string, tur: string, dosyaAdi: string) {
  const url = URL.createObjectURL(new Blob([icerik], { type: tur }));
  const a = document.createElement('a');
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const root = document.querySelector<HTMLElement>('[data-gys-app]');
if (root) {
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];

  const mufredat: MufredatVeri = JSON.parse($('#gys-mufredat-veri')?.textContent || '{}');
  const agacKok: GysAgacDugum = JSON.parse($('#gys-agac-veri')?.textContent || '{}').kok;
  const tumSorular: GysSoru[] = JSON.parse($('#gys-sorular-veri')?.textContent || '[]');
  const konularVeri: GysKonu[] = JSON.parse($('#gys-konular-veri')?.textContent || '[]');
  const kanunMap = new Map(mufredat.kanunlar.map((k) => [k.id, k]));
  const kanunKisa = (id: string) => kanunMap.get(id)?.kisa ?? id;
  const ilkBaslik = document.title;

  // Sekmeler ve paneller
  const elSekmeler = $('[data-gys-sekmeler]');
  const elTabs = $$<HTMLButtonElement>('[data-gys-tab]');
  const elPanels = $$('[data-gys-panel]');

  // Seçici
  const elSecimAd = $('[data-gys-secim-ad]')!;
  const elSecimYol = $('[data-gys-secim-yol]')!;
  const elSecimAc = $<HTMLButtonElement>('[data-gys-secim-ac]')!;
  const elSecici = $('[data-gys-secici]')!;
  const elSeciciAra = $<HTMLInputElement>('[data-gys-secici-ara]')!;
  const elSeciciSonuc = $('[data-gys-secici-sonuc]')!;
  const elSeciciSatirlar = $('[data-gys-secici-satirlar]')!;
  const elSeciciNot = $('[data-gys-secici-not]')!;
  const elSecimTamam = $<HTMLButtonElement>('[data-gys-secim-tamam]')!;

  // Ayarlar
  const elKanun = $<HTMLSelectElement>('[data-gys-kanun]')!;
  const elSeviye = $<HTMLSelectElement>('[data-gys-seviye]')!;
  const elAdetRadyo = $$<HTMLInputElement>('input[name="gys-adet"]');
  const elModRadyo = $$<HTMLInputElement>('input[name="gys-mod"]');
  const elHavuzNot = $('[data-gys-havuz-not]')!;
  const elDenemeNot = $('[data-gys-deneme-not]');
  const elBaslat = $<HTMLButtonElement>('[data-gys-baslat]')!;
  const elSonsuz = $<HTMLButtonElement>('[data-gys-sonsuz]')!;
  const elDeneme = $<HTMLButtonElement>('[data-gys-deneme]')!;

  // Özet
  const elStToplam = $('[data-gys-st-toplam]')!;
  const elStOran = $('[data-gys-st-oran]')!;
  const elStHata = $$('[data-gys-st-hata], [data-gys-st-hata-2]');
  const elSbDogru = $('[data-gys-sb-dogru]');
  const elSbYanlis = $('[data-gys-sb-yanlis]');
  const elUstBugun = $('[data-gys-ust-bugun]');
  const elUstKonu = $('[data-gys-ust-konu]');
  const elKayitliSayi = $('[data-gys-kayitli-sayi]');
  const elZayifBar = $('[data-gys-zayif]');

  // Soru ekranı
  const elDugumBaslik = $('[data-gys-dugum-baslik]')!;
  const elDugumYol = $('[data-gys-dugum-yol]')!;
  const elAktifMod = $('[data-gys-aktif-mod]')!;
  const elSure = $('[data-gys-sure]')!;
  const elSeri = $('[data-gys-seri]')!;
  const elSahne = $('[data-gys-sahne]')!;
  const elToplulukUyari = $('[data-gys-topluluk-uyari]')!;
  const elSira = $('[data-gys-sira]')!;
  const elRozet = $('[data-gys-rozet]')!;
  const elSoruIstatistik = $('[data-gys-soru-istatistik]')!;
  const elSoruMetin = $('[data-gys-soru-metin]')!;
  const elSiklar = $('[data-gys-siklar]')!;
  const elAciklama = $('[data-gys-aciklama]')!;
  const elOylaBar = $('[data-gys-oyla-bar]')!;
  const elOySonuc = $('[data-gys-oy-sonuc]')!;
  const elBildirForm = $<HTMLFormElement>('[data-gys-bildir-form]')!;
  const elBildirTur = $<HTMLInputElement>('[data-gys-bildir-tur]')!;
  const elBildirBaslik = $('[data-gys-bildir-baslik]')!;
  const elBildirMetin = $<HTMLTextAreaElement>('[data-gys-bildir-metin]')!;
  const elBildirDurum = $('[data-gys-bildir-durum]')!;
  const elSonraki = $<HTMLButtonElement>('[data-gys-sonraki]')!;
  const elOnceki = $<HTMLButtonElement>('[data-gys-onceki]');
  const elBitir = $<HTMLButtonElement>('[data-gys-bitir]')!;
  const elSonuc = $('[data-gys-sonuc]')!;
  const elKaydet = $<HTMLButtonElement>('[data-gys-kaydet]');
  const elSoruSayfa = $<HTMLAnchorElement>('[data-gys-soru-sayfa]');
  const elOtomatik = $<HTMLInputElement>('[data-gys-otomatik]');
  const elIlerlemeDolgu = $('[data-gys-ilerleme-dolgu]');
  const elRayDogru = $('[data-gys-ray-dogru]');
  const elRayYanlis = $('[data-gys-ray-yanlis]');
  const elRayBugun = $('[data-gys-ray-bugun]');
  const elRayPuanKutu = $('[data-gys-ray-puan-kutu]');
  const elRayPuan = $('[data-gys-ray-puan]');

  // Diğer paneller
  const elHataFiltreBtns = $$<HTMLButtonElement>('[data-gys-hata-filtre]');
  const elHataListe = $('[data-gys-hata-liste]')!;
  const elHataCoz = $<HTMLButtonElement>('[data-gys-hata-coz]')!;
  const elPdfTip = $<HTMLSelectElement>('[data-gys-pdf-tip]')!;
  const elPdfKanun = $<HTMLSelectElement>('[data-gys-pdf-kanun]')!;
  const elPdfAdet = $<HTMLSelectElement>('[data-gys-pdf-adet]')!;
  const elPdfMod = $<HTMLSelectElement>('[data-gys-pdf-mod]')!;
  const elPdfEylem = $('[data-gys-pdf-eylem]')!;
  const elPdfOnizleme = $('[data-gys-pdf-onizleme]')!;
  const elPerfListe = $('[data-gys-perf-liste]');
  const elEkleForm = $<HTMLFormElement>('[data-gys-ekle-form]')!;
  const elEkleDurum = $('[data-gys-ekle-durum]')!;
  const elEkleKanun = $<HTMLSelectElement>('[data-gys-ekle-kanun]')!;
  const elEkleBolum = $<HTMLSelectElement>('[data-gys-ekle-bolum]')!;
  const elOzelIndir = $<HTMLButtonElement>('[data-gys-ozel-indir]')!;
  const elOzelListe = $('[data-gys-ozel-liste]')!;
  const elBekleyenSayi = $('[data-gys-bekleyen-sayi]')!;

  // ---- Kalıcı durum ----
  function durumOku(): KisiselDurum {
    const bos: KisiselDurum = {
      unvanId: '',
      seciliDugumId: agacKok.id,
      secimOnayli: false,
      sonKanun: '',
      tercih: { ...VARSAYILAN_TERCIH },
      toplamCozulen: 0,
      toplamDogru: 0,
      hatalar: {},
      soruGecmisi: {},
    };
    try {
      const ham = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!ham || typeof ham !== 'object') return bos;
      const secili = typeof ham.seciliDugumId === 'string' && dugumBul(agacKok, ham.seciliDugumId) ? ham.seciliDugumId : agacKok.id;
      const t = ham.tercih && typeof ham.tercih === 'object' ? ham.tercih : {};
      return {
        unvanId: String(ham.unvanId || ''),
        seciliDugumId: secili,
        // Eski sürümde seçim kaydı vardı ama onay bilgisi yoktu; kökten farklı bir seçim onay sayılır.
        secimOnayli: Boolean(ham.secimOnayli) || secili !== agacKok.id,
        sonKanun: String(ham.sonKanun || ''),
        tercih: {
          adet: ['10', '20', '40', '0'].includes(t.adet) ? t.adet : VARSAYILAN_TERCIH.adet,
          mod: t.mod === 'ikili' ? 'ikili' : 'klasik',
          seviye: typeof t.seviye === 'string' ? t.seviye : '',
        },
        toplamCozulen: Number(ham.toplamCozulen) || 0,
        toplamDogru: Number(ham.toplamDogru) || 0,
        hatalar: ham.hatalar || {},
        soruGecmisi: ham.soruGecmisi || {},
      };
    } catch {
      return bos;
    }
  }

  let durum = durumOku();
  function durumKaydet() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(durum));
    } catch {
      /* özel gezinti: oturum içinde sürer */
    }
  }

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
  const kayitliSet = kayitliSorularOku();

  let aktifTest: HazirSoru[] = [];
  let aktifHavuz: GysSoru[] = [];
  let aktifIdx = 0;
  let testDogru = 0;
  let testCozulen = 0;
  let seri = 0;
  let sonsuzMod = false;
  let yarisModu = false;
  let yarisPuan = 0;
  let testAdi = '';
  let sonSoruId: string | null = null;
  let testYanlislar: GysSoru[] = [];
  let hataFiltre: 'tumu' | 'gunluk' | 'haftalik' | 'aylik' | 'encok' = 'tumu';
  let sonKitapcikHtml = '';
  let kronometreId: ReturnType<typeof setInterval> | null = null;
  let otoZamanlayici: number | null = null;
  let soruZamanlayici: number | null = null;
  // Her soruda verilen cevap; geri dönüldüğünde yeniden sayılmaz.
  const cevaplar = new Map<number, string>();

  const aktifDugum = (): GysAgacDugum => dugumBul(agacKok, durum.seciliDugumId) ?? agacKok;
  const secimAdi = (d: GysAgacDugum) => (d.id === agacKok.id ? 'Bütün bakanlıklar' : sadeAd(d.ad));

  function aktifUnvan(): GysUnvan {
    const yol = dugumYolu(agacKok, durum.seciliDugumId).reverse();
    for (const d of yol) {
      const id = UNVAN_ESLEME[d.id] ?? d.id;
      const u = mufredat.unvanlar.find((x) => x.id === id);
      if (u) return u;
    }
    // Eşi olmayan sınavlarda ağırlıklar seçili düğümdeki soru dağılımından çıkarılır.
    const d = aktifDugum();
    const havuz = dugumSorulari(d, tumSorular);
    const agirliklar: Record<string, number> = {};
    for (const s of havuz) agirliklar[s.kanun] = (agirliklar[s.kanun] ?? 0) + 1;
    return {
      id: d.id,
      ad: secimAdi(d),
      toplamSoru: d.sinavSoruSayisi ?? 80,
      sureDk: d.sinavSureDk ?? 90,
      bolumler: [...dugumBolumleri(d)],
      agirliklar,
    };
  }

  // ---- Sekmeler ----
  const SEKME_PANELLERI = new Set(elTabs.map((b) => b.dataset.gysTab!));
  function sekmeAc(hedef: string) {
    root!.classList.remove('is-odak');
    if (elSekmeler) elSekmeler.hidden = !SEKME_PANELLERI.has(hedef);
    elTabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.gysTab === hedef)));
    elPanels.forEach((p) => (p.hidden = p.dataset.gysPanel !== hedef));
    if (hedef !== 'sinav' || elSahne.hidden) document.title = ilkBaslik;
    if (hedef === 'hatalar') hataListesiniCiz();
    if (hedef === 'performans') performansCiz();
    if (hedef === 'mulakat') void mulakatPanel.yukle();
  }

  // ---- Sınav seçici ----
  const secilebilir = (d: GysAgacDugum) => d.tur !== 'alan' && d.tur !== 'unite';
  const cocuklar = (d: GysAgacDugum) => (d.cocuklar ?? []).filter(secilebilir);
  const soruSayisi = (d: GysAgacDugum) => dugumSorulari(d, tumSorular).length;

  function satirEtiketi(ust: GysAgacDugum, derinlik: number): string {
    if (derinlik === 0) return 'Bakanlık';
    const c = cocuklar(ust);
    if (c.every((x) => x.tur === 'unvan')) return 'Ünvan';
    if (ust.tur === 'kurum') return 'Birim';
    return 'Sınav türü';
  }

  function seciciCiz() {
    const yol = dugumYolu(agacKok, durum.seciliDugumId);
    const satirlar: string[] = [];
    for (let i = 0; i < yol.length; i++) {
      const ust = yol[i];
      const alt = cocuklar(ust);
      if (!alt.length) break;
      const secili = yol[i + 1]?.id;
      const hepsi = `<button type="button" class="gys-cip" data-gys-dugum-sec="${esc(ust.id)}" aria-pressed="${!secili}">Hepsi <span class="num">${soruSayisi(ust)}</span></button>`;
      const cipler = alt
        .map(
          (c) =>
            `<button type="button" class="gys-cip" data-gys-dugum-sec="${esc(c.id)}" aria-pressed="${c.id === secili}">${esc(sadeAd(c.ad))} <span class="num">${soruSayisi(c)}</span></button>`
        )
        .join('');
      satirlar.push(
        `<div class="gys-secici__satir" role="group" aria-label="${esc(satirEtiketi(ust, i))}"><span>${esc(satirEtiketi(ust, i))}</span><div class="gys-cipler">${hepsi}${cipler}</div></div>`
      );
      if (!secili) break;
    }
    elSeciciSatirlar.innerHTML = satirlar.join('');
    elSeciciSatirlar.querySelectorAll<HTMLButtonElement>('[data-gys-dugum-sec]').forEach((b) => {
      b.addEventListener('click', () => {
        dugumSec(b.dataset.gysDugumSec!);
        // Yeni satır açıldıysa odak kaybolmasın: aynı kimlikli düğmeye dön.
        elSeciciSatirlar.querySelector<HTMLButtonElement>(`[data-gys-dugum-sec="${CSS.escape(b.dataset.gysDugumSec!)}"][aria-pressed="true"]`)?.focus();
      });
    });
    const d = aktifDugum();
    elSeciciNot.textContent = `${secimAdi(d)}: ${soruSayisi(d)} soru`;
  }

  function secimOzetiCiz() {
    const d = aktifDugum();
    const yol = dugumYolu(agacKok, d.id).filter((x) => x.id !== agacKok.id && x.id !== d.id);
    const parcalar = [yol.map((x) => sadeAd(x.ad)).join(' › '), `${soruSayisi(d)} soru`];
    if (d.sinavSoruSayisi) parcalar.push(`gerçek sınav ${d.sinavSoruSayisi} soru, ${d.sinavSureDk ?? 90} dk${d.gecmePuani ? `, baraj ${d.gecmePuani}` : ''}`);
    elSecimAd.textContent = secimAdi(d);
    elSecimYol.textContent = parcalar.filter(Boolean).join(' · ');
    if (elDenemeNot) elDenemeNot.textContent = `(${d.sinavSoruSayisi ?? 80} soru · ${d.sinavSureDk ?? 90} dk)`;
  }

  function seciciAc(ac: boolean) {
    elSecici.hidden = !ac;
    elSecimAc.setAttribute('aria-expanded', String(ac));
    elSecimAc.textContent = ac ? 'Kapat' : 'Sınavı değiştir';
    if (ac) seciciCiz();
  }

  function dugumSec(id: string) {
    if (!dugumBul(agacKok, id)) return;
    durum.seciliDugumId = id;
    durum.secimOnayli = true;
    durum.sonKanun = '';
    durumKaydet();
    ustBilgileriGuncelle();
    if (!elSecici.hidden) seciciCiz();
  }

  // Arama: bütün seçilebilir düğümler yollarıyla birlikte aranır.
  const aramaDizini: { d: GysAgacDugum; yol: string; anahtar: string }[] = [];
  (function dizinle(d: GysAgacDugum, ustYol: string[]) {
    for (const c of cocuklar(d)) {
      const yol = [...ustYol, sadeAd(c.ad)];
      aramaDizini.push({ d: c, yol: ustYol.join(' › '), anahtar: normalize(`${c.ad} ${yol.join(' ')} ${c.aciklama ?? ''}`) });
      dizinle(c, yol);
    }
  })(agacKok, []);

  let aramaSonuclari: GysAgacDugum[] = [];
  let aramaIdx = -1;
  function aramaCiz() {
    const kelimeler = normalize(elSeciciAra.value).split(/\s+/).filter(Boolean);
    if (!kelimeler.length) {
      elSeciciSonuc.hidden = true;
      elSeciciAra.setAttribute('aria-expanded', 'false');
      return;
    }
    const bulunan = aramaDizini.filter((x) => kelimeler.every((k) => x.anahtar.includes(k))).slice(0, 8);
    aramaSonuclari = bulunan.map((x) => x.d);
    aramaIdx = bulunan.length ? 0 : -1;
    elSeciciSonuc.innerHTML = bulunan.length
      ? bulunan
          .map(
            (x, i) =>
              `<li role="option" id="gys-ara-${i}" aria-selected="${i === aramaIdx}"><button type="button" tabindex="-1" data-gys-ara-sec="${esc(x.d.id)}"><span>${esc(sadeAd(x.d.ad))} <span class="num">· ${soruSayisi(x.d)} soru</span></span>${x.yol ? `<small>${esc(x.yol)}</small>` : ''}</button></li>`
          )
          .join('')
      : '<li class="gys-secici__bos">Eşleşen sınav yok. Daha kısa bir sözcük dene.</li>';
    elSeciciSonuc.hidden = false;
    elSeciciAra.setAttribute('aria-expanded', 'true');
    elSeciciAra.setAttribute('aria-activedescendant', aramaIdx >= 0 ? `gys-ara-${aramaIdx}` : '');
    elSeciciSonuc.querySelectorAll<HTMLButtonElement>('[data-gys-ara-sec]').forEach((b) =>
      b.addEventListener('click', () => aramaSecimi(b.dataset.gysAraSec!))
    );
  }
  function aramaSecimi(id: string) {
    elSeciciAra.value = '';
    elSeciciSonuc.hidden = true;
    elSeciciAra.setAttribute('aria-expanded', 'false');
    dugumSec(id);
    elSecimTamam.focus();
  }
  elSeciciAra.addEventListener('input', aramaCiz);
  elSeciciAra.addEventListener('keydown', (e) => {
    if (elSeciciSonuc.hidden || !aramaSonuclari.length) {
      if (e.key === 'Escape') elSeciciAra.value = '';
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      aramaIdx = (aramaIdx + (e.key === 'ArrowDown' ? 1 : -1) + aramaSonuclari.length) % aramaSonuclari.length;
      elSeciciSonuc.querySelectorAll('[role="option"]').forEach((li, i) => li.setAttribute('aria-selected', String(i === aramaIdx)));
      elSeciciAra.setAttribute('aria-activedescendant', `gys-ara-${aramaIdx}`);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (aramaIdx >= 0) aramaSecimi(aramaSonuclari[aramaIdx].id);
    } else if (e.key === 'Escape') {
      elSeciciSonuc.hidden = true;
      elSeciciAra.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('click', (e) => {
    if (!elSeciciSonuc.hidden && !(e.target as HTMLElement).closest('.gys-secici__ara')) elSeciciSonuc.hidden = true;
  });
  elSecimAc.addEventListener('click', () => seciciAc(elSecici.hidden !== false));
  elSecimTamam.addEventListener('click', () => {
    durum.secimOnayli = true;
    durumKaydet();
    seciciAc(false);
    elBaslat.focus();
  });

  // ---- Ayarlar (hatırlanır) ----
  const seciliAdet = () => elAdetRadyo.find((r) => r.checked)?.value ?? '20';
  const seciliMod = (): SinavModu => (elModRadyo.find((r) => r.checked)?.value === 'ikili' ? 'ikili' : 'klasik');
  function tercihleriUygula() {
    elAdetRadyo.forEach((r) => (r.checked = r.value === durum.tercih.adet));
    elModRadyo.forEach((r) => (r.checked = r.value === durum.tercih.mod));
    if ([...elSeviye.options].some((o) => o.value === durum.tercih.seviye)) elSeviye.value = durum.tercih.seviye;
  }
  function tercihleriKaydet() {
    durum.tercih = { adet: seciliAdet(), mod: seciliMod(), seviye: elSeviye.value };
    durum.sonKanun = elKanun.value;
    durumKaydet();
    havuzNotuGuncelle();
  }
  [...elAdetRadyo, ...elModRadyo].forEach((r) => r.addEventListener('change', tercihleriKaydet));
  elSeviye.addEventListener('change', tercihleriKaydet);
  elKanun.addEventListener('change', tercihleriKaydet);

  function filtreliHavuz(): GysSoru[] {
    let havuz = dugumSorulari(aktifDugum(), tumSorular);
    if (elKanun.value) havuz = havuz.filter((s) => s.kanun === elKanun.value);
    if (elSeviye.value) havuz = havuz.filter((s) => s.seviye === (elSeviye.value as Zorluk));
    return havuz;
  }

  function havuzNotuGuncelle() {
    const n = filtreliHavuz().length;
    elHavuzNot.textContent = n ? `Bu ayarlarla ${n} soru var` : 'Bu ayarlarla soru yok; dersi ya da zorluğu genişlet';
    elBaslat.disabled = n === 0;
  }

  // ---- Özet ve istatistik ----
  function skorRayGuncelle() {
    const bugunSayi = bugunCozulenOku();
    if (elRayDogru) elRayDogru.textContent = String(testDogru);
    if (elRayYanlis) elRayYanlis.textContent = String(Math.max(0, testCozulen - testDogru));
    if (elRayBugun) elRayBugun.textContent = String(bugunSayi);
    if (elUstBugun) elUstBugun.textContent = `${bugunSayi} / 50`;
    if (elKayitliSayi) elKayitliSayi.textContent = String(kayitliSet.size);
    if (elRayPuanKutu) elRayPuanKutu.hidden = !yarisModu;
    if (elRayPuan) elRayPuan.textContent = String(yarisPuan);
  }

  function dersIstatistikleri() {
    const dersler = new Map<string, { cozum: number; dogru: number; yanlis: number }>();
    for (const s of tumSorular) {
      const st = durum.soruGecmisi[s.id];
      if (!st || !st.cozum) continue;
      const cur = dersler.get(s.kanun) ?? { cozum: 0, dogru: 0, yanlis: 0 };
      cur.cozum += st.cozum;
      cur.dogru += st.dogru;
      cur.yanlis += st.yanlis;
      dersler.set(s.kanun, cur);
    }
    return dersler;
  }

  function ustBilgileriGuncelle() {
    const dugum = aktifDugum();
    const havuz = dugumSorulari(dugum, tumSorular);

    elStToplam.textContent = String(durum.toplamCozulen);
    const oran = durum.toplamCozulen ? Math.round((durum.toplamDogru / durum.toplamCozulen) * 100) : 0;
    elStOran.textContent = `%${oran}`;
    if (elSbDogru) elSbDogru.textContent = String(durum.toplamDogru);
    if (elSbYanlis) elSbYanlis.textContent = String(Math.max(0, durum.toplamCozulen - durum.toplamDogru));
    const bekleyenHata = Object.values(durum.hatalar).filter((h) => !h.sonDogru && h.hataSayisi > 0).length;
    elStHata.forEach((el) => (el.textContent = String(bekleyenHata)));
    if (elUstKonu) {
      const tamam = tamamlananKonularOku();
      elUstKonu.textContent = `${konularVeri.filter((k) => tamam.has(k.id)).length} / ${konularVeri.length}`;
    }

    if (elZayifBar) {
      const zayiflar = [...dersIstatistikleri().entries()]
        .map(([k, v]) => ({ k, oran: Math.round((v.dogru / Math.max(1, v.dogru + v.yanlis)) * 100), top: v.dogru + v.yanlis }))
        .filter((x) => x.oran < 80)
        .sort((a, b) => a.oran - b.oran || b.top - a.top)
        .slice(0, 3);
      elZayifBar.hidden = !zayiflar.length;
      elZayifBar.innerHTML = zayiflar.length
        ? `<span>Zorlandığın dersler:</span>${zayiflar
            .map((z) => `<button type="button" class="gys-zayif-chip" data-zayif-kanun="${esc(z.k)}">${esc(kanunKisa(z.k))} · %${z.oran}</button>`)
            .join('')}`
        : '';
      elZayifBar.querySelectorAll<HTMLButtonElement>('[data-zayif-kanun]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const k = btn.dataset.zayifKanun || '';
          testiBaslat({ ozelSorular: tumSorular.filter((s) => s.kanun === k), hedefAdet: 15, ad: `${kanunKisa(k)} tekrarı` });
        })
      );
    }

    const kanunSayilari = new Map<string, number>();
    for (const s of havuz) kanunSayilari.set(s.kanun, (kanunSayilari.get(s.kanun) ?? 0) + 1);
    const secenekler = [
      `<option value="">Bütün dersler (${havuz.length})</option>`,
      ...[...kanunSayilari.entries()].map(([kid, adet]) => `<option value="${esc(kid)}">${esc(kanunKisa(kid))} (${adet})</option>`),
    ].join('');
    elKanun.innerHTML = secenekler;
    elPdfKanun.innerHTML = secenekler;
    if (durum.sonKanun && kanunSayilari.has(durum.sonKanun)) elKanun.value = durum.sonKanun;
    secimOzetiCiz();
    havuzNotuGuncelle();
  }

  // ---- Sunucu istatistikleri (isteğe bağlı) ----
  async function genelIstatistikleriYukle() {
    try {
      const r = await fetch(GYS_API, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!r.ok) return;
      const d = await r.json();
      if (d && d.sorular && typeof d.sorular === 'object') {
        genelIstatistikler = d.sorular;
        if (!elSahne.hidden && aktifTest[aktifIdx]) soruIstatistikCiz(aktifTest[aktifIdx].soru.id);
      }
    } catch {
      /* sunucu istatistiği isteğe bağlıdır */
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
      if (!elSahne.hidden && aktifTest[aktifIdx]?.soru.id === soruId) soruIstatistikCiz(soruId);
      void platformSayacYenile();
    } catch {
      /* yerel istatistikle devam */
    }
  }

  function soruIstatistikCiz(soruId: string) {
    const k = durum.soruGecmisi[soruId];
    const kMetin = k && k.cozum ? `Sen: ${k.dogru} doğru, ${k.yanlis} yanlış` : 'Bu soruyu ilk kez çözüyorsun';
    const g = genelIstatistikler[soruId];
    const gMetin = g && g.cozum > 0 ? `Çözenlerin %${g.oran ?? Math.round((g.dogru / g.cozum) * 100)} kadarı doğru yaptı (${g.cozum.toLocaleString('tr-TR')} çözüm)` : '';
    elSoruIstatistik.innerHTML = `<span class="gys-ist-pill">${kMetin}</span>${gMetin ? `<span class="gys-ist-pill">${gMetin}</span>` : ''}`;
  }

  // ---- Test akışı ----
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

  function kronometreyiDurdur() {
    if (kronometreId) {
      clearInterval(kronometreId);
      kronometreId = null;
    }
    elSure.hidden = true;
  }

  function kronometreBaslat(dakika: number) {
    kronometreyiDurdur();
    let kalan = dakika * 60;
    const yaz = () => (elSure.textContent = `${String(Math.floor(kalan / 60)).padStart(2, '0')}:${String(kalan % 60).padStart(2, '0')}`);
    yaz();
    elSure.hidden = false;
    kronometreId = setInterval(() => {
      kalan--;
      yaz();
      if (kalan <= 0) sonucuGoster();
    }, 1000);
  }

  function baslikYaz(onEk: string) {
    document.title = `${onEk} · ${testAdi} | GYS Sınav Platformu`;
  }

  function testiBaslat(secenek: TestSecenek = {}) {
    if (!SEKME_PANELLERI.has('sinav') || $('[data-gys-panel="sinav"]')!.hidden) sekmeAc('sinav');
    kronometreyiDurdur();
    otoTemizle();
    const mod = seciliMod();
    sonsuzMod = Boolean(secenek.sonsuz);
    yarisModu = Boolean(secenek.yaris);
    yarisPuan = 0;
    seri = 0;
    sonSoruId = null;
    cevaplar.clear();
    elSeri.hidden = !sonsuzMod && !yarisModu;

    const dugum = aktifDugum();
    if (secenek.ozelSorular) {
      aktifHavuz = secenek.ozelSorular;
      const limit = secenek.hedefAdet ? Math.min(secenek.hedefAdet, aktifHavuz.length) : aktifHavuz.length;
      let sirali = karistir(aktifHavuz);
      if (secenek.ilkSoru) sirali = [secenek.ilkSoru, ...sirali.filter((s) => s.id !== secenek.ilkSoru!.id)];
      aktifTest = sirali.slice(0, limit).map((s) => soruyuHazirla(s, mod));
    } else {
      aktifHavuz = filtreliHavuz();
      if (!aktifHavuz.length) {
        sonucMesaji('Bu ayarlarla soru bulunamadı. Dersi “Bütün dersler”, zorluğu “Bütün seviyeler” yapabilir ya da daha geniş bir sınav seçebilirsin.');
        return;
      }
      if (sonsuzMod) {
        const ilk = sonsuzSonrakiSoru(aktifHavuz, null, mod)!;
        sonSoruId = ilk.soru.id;
        aktifTest = [ilk];
      } else {
        const adet = Number(seciliAdet());
        const hedef = secenek.hedefAdet
          ? Math.min(secenek.hedefAdet, aktifHavuz.length)
          : secenek.deneme
            ? Math.min(dugum.sinavSoruSayisi ?? 80, aktifHavuz.length)
            : adet > 0
              ? Math.min(adet, aktifHavuz.length)
              : aktifHavuz.length;
        aktifTest = karistir(aktifHavuz).slice(0, hedef).map((s) => soruyuHazirla(s, mod));
        if (secenek.deneme) kronometreBaslat(dugum.sinavSureDk ?? 90);
      }
    }
    if (!aktifTest.length) return;

    testAdi =
      secenek.ad ??
      (yarisModu ? '60 saniye yarışı' : sonsuzMod ? `${secimAdi(dugum)} sınırsız` : secenek.deneme ? `${secimAdi(dugum)} denemesi` : `${secimAdi(dugum)} testi`);
    aktifIdx = 0;
    testDogru = 0;
    testCozulen = 0;
    testYanlislar = [];
    elDugumBaslik.textContent = testAdi;
    const kanunFiltre = !secenek.ozelSorular && elKanun.value ? ` · ${kanunKisa(elKanun.value)}` : '';
    const ustYol = dugumYolu(agacKok, dugum.id)
      .filter((x) => x.id !== agacKok.id && x.id !== dugum.id)
      .map((x) => sadeAd(x.ad))
      .join(' › ');
    elDugumYol.textContent = secenek.ozelSorular || sonsuzMod ? `${sonsuzMod ? 'Sınırsız' : aktifTest.length} soru` : `${ustYol || 'Bütün bakanlıklar'}${kanunFiltre} · ${aktifTest.length} soru`;
    elAktifMod.textContent = yarisModu ? 'Yarış · +10 / −3' : mod === 'ikili' ? '2 şık' : '5 şık';
    elSonuc.hidden = true;
    elSahne.hidden = false;
    root!.classList.add('is-odak');
    skorRayGuncelle();
    soruyuCiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function sonucMesaji(html: string) {
    elSahne.hidden = true;
    elSonuc.innerHTML = `<p>${html}</p>`;
    elSonuc.hidden = false;
  }

  function soruyuCiz() {
    otoTemizle();
    const item = aktifTest[aktifIdx];
    if (!item) return;
    const tSoru = item.soru as ToplulukSorusu;
    elToplulukUyari.hidden = !(tSoru.kullaniciEkledi && tSoru.durum !== 'onayli');
    elOylaBar.hidden = true;
    elOySonuc.textContent = '';
    elBildirForm.hidden = true;
    elBildirDurum.textContent = '';
    const siraMetni = sonsuzMod ? `Soru ${testCozulen + 1}` : `Soru ${aktifIdx + 1} / ${aktifTest.length}`;
    elSira.textContent = siraMetni;
    baslikYaz(siraMetni);
    if (elIlerlemeDolgu) {
      const yuzde = sonsuzMod ? Math.min(100, (testCozulen % 20) * 5 + 5) : Math.round(((aktifIdx + 1) / Math.max(1, aktifTest.length)) * 100);
      elIlerlemeDolgu.style.width = `${yuzde}%`;
    }
    if (elOnceki) elOnceki.hidden = sonsuzMod || aktifIdx === 0;
    elSeri.textContent = yarisModu ? `Puan: ${yarisPuan}` : `Seri: ${seri}`;
    elRozet.textContent = kanunKisa(item.soru.kanun);
    if (elSoruSayfa) {
      const statik = !item.soru.id.startsWith('ozel-') && !tSoru.kullaniciEkledi;
      elSoruSayfa.hidden = !statik;
      elSoruSayfa.href = `/soru/${encodeURIComponent(item.soru.id)}/`;
    }
    soruIstatistikCiz(item.soru.id);
    kaydetButonGuncelle(item.soru.id);
    skorRayGuncelle();
    elSoruMetin.textContent = item.soru.soru;
    elAciklama.hidden = true;
    elSonraki.hidden = true;
    elSiklar.innerHTML = item.siklar
      .map((s) => `<button type="button" class="gys-sik" data-gys-sik="${s.harf}"><strong>${s.harf}</strong><span>${esc(s.metin)}</span></button>`)
      .join('');
    elSiklar.querySelectorAll<HTMLButtonElement>('[data-gys-sik]').forEach((btn) => btn.addEventListener('click', () => cevabiIsle(btn.dataset.gysSik!)));

    // Geri dönülen soruda önceki cevap gösterilir, yeniden sayılmaz.
    const onceki = cevaplar.get(aktifIdx);
    if (onceki !== undefined) {
      cevabiGoster(item, onceki);
      return;
    }

    if (yarisModu) {
      let kalanSn = 60;
      elSure.hidden = false;
      elSure.textContent = '01:00';
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

  function cevabiGoster(item: HazirSoru, secilenHarf: string) {
    elSiklar.querySelectorAll<HTMLButtonElement>('[data-gys-sik]').forEach((b) => {
      b.disabled = true;
      const h = b.dataset.gysSik!;
      if (h === item.dogruHarf) b.classList.add('gys-sik--dogru');
      else if (h === secilenHarf) b.classList.add('gys-sik--yanlis');
    });
    const dogruMu = secilenHarf === item.dogruHarf;
    const mevzuatUrl = item.soru.mevzuatUrl || (/^https?:\/\//.test(item.soru.kaynak) ? item.soru.kaynak : kanunMap.get(item.soru.kanun)?.kaynak) || 'https://www.mevzuat.gov.tr/';
    const dayanak = item.soru.madde || item.soru.kaynak.replace(/https?:\/\/\S+/gi, '').trim();
    elAciklama.className = `gys-aciklama ${dogruMu ? 'gys-aciklama--dogru' : 'gys-aciklama--yanlis'}`;
    elAciklama.innerHTML = `
      <strong>${dogruMu ? 'Doğru.' : secilenHarf ? `Yanlış. Doğru cevap ${item.dogruHarf}.` : `Süre doldu. Doğru cevap ${item.dogruHarf}.`}</strong>
      <p>${esc(item.soru.aciklama)}</p>
      <small>${dayanak ? `Dayanak: ${esc(dayanak)} · ` : ''}<a href="${esc(mevzuatUrl)}" target="_blank" rel="noopener noreferrer">Mevzuat metni ↗</a></small>
    `;
    elAciklama.hidden = false;
    const tSoru = item.soru as ToplulukSorusu;
    if (tSoru.kullaniciEkledi && tSoru.durum !== 'onayli') {
      elOylaBar.hidden = false;
      elOylaBar.querySelectorAll<HTMLButtonElement>('[data-gys-oy]').forEach((b) => (b.disabled = false));
    }
    elSonraki.textContent = sonsuzMod ? 'Sonraki soru →' : aktifIdx + 1 < aktifTest.length ? 'Sonraki soru →' : 'Sonucu gör';
    elSonraki.hidden = false;
  }

  function cevabiIsle(secilenHarf: string) {
    if (cevaplar.has(aktifIdx)) return;
    const item = aktifTest[aktifIdx];
    cevaplar.set(aktifIdx, secilenHarf);
    const dogruMu = secilenHarf === item.dogruHarf;
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
      durum.hatalar[item.soru.id] = { soruId: item.soru.id, tarih: bugunIstanbul(), hataSayisi: (mevcut?.hataSayisi ?? 0) + 1, sonDogru: false };
    }
    durum.soruGecmisi[item.soru.id] = sg;
    if (yarisModu) yarisPuan += dogruMu ? 10 : -3;
    elSeri.textContent = yarisModu ? `Puan: ${yarisPuan}` : `Seri: ${seri}`;
    bugunCozulenArtir();
    otoTemizle();
    durumKaydet();
    ustBilgileriGuncelle();
    skorRayGuncelle();
    soruIstatistikCiz(item.soru.id);
    void genelIstatistikGonder(item.soru.id, dogruMu);
    cevabiGoster(item, secilenHarf);
    if (elOtomatik?.checked && (sonsuzMod || aktifIdx + 1 < aktifTest.length)) {
      otoZamanlayici = window.setTimeout(() => elSonraki.click(), 3000);
    }
  }

  function sonucuGoster() {
    kronometreyiDurdur();
    otoTemizle();
    root!.classList.remove('is-odak');
    elSahne.hidden = true;
    const toplam = Math.max(1, testCozulen);
    const puan = Math.round((testDogru / toplam) * 100);
    const baraj = aktifDugum().gecmePuani ?? 60;
    document.title = `Sonuç ${testDogru}/${testCozulen} · ${testAdi} | GYS Sınav Platformu`;
    const yanlisBtn = testYanlislar.length
      ? `<button type="button" class="btn" data-gys-yanlis-tekrar>Yanlış yaptığın ${testYanlislar.length} soruyu tekrar çöz</button>`
      : '';
    elSonuc.innerHTML = `
      <h3>${testDogru} / ${testCozulen} doğru · ${puan} puan</h3>
      <p>${testCozulen === 0 ? 'Hiç soru cevaplanmadı.' : puan >= baraj ? `Baraj puanı ${baraj}; bu testte barajın üzerindesin.` : `Baraj puanı ${baraj}. Yanlışlarını hemen tekrar etmek kalıcı öğrenmeye yardımcı olur.`}</p>
      <div class="gys-sonuc__eylem">
        ${yanlisBtn}
        <button type="button" class="btn ${testYanlislar.length ? 'btn--quiet' : ''}" data-gys-yeniden>Yeni test</button>
        <button type="button" class="btn btn--quiet" data-gys-ayarlara>Ayarlara dön</button>
      </div>
    `;
    elSonuc.hidden = false;
    elSonuc.querySelector('[data-gys-yanlis-tekrar]')?.addEventListener('click', () =>
      testiBaslat({ ozelSorular: [...testYanlislar], ad: 'Yanlışlarım' })
    );
    elSonuc.querySelector('[data-gys-yeniden]')?.addEventListener('click', () => testiBaslat());
    elSonuc.querySelector('[data-gys-ayarlara]')?.addEventListener('click', () => {
      elSonuc.hidden = true;
      document.title = ilkBaslik;
      elBaslat.focus();
    });
    elSonuc.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function kaydetButonGuncelle(soruId?: string) {
    if (!elKaydet || !soruId) return;
    const varMi = kayitliSet.has(soruId);
    elKaydet.textContent = varMi ? 'Kaydedildi ✓' : 'Soruyu kaydet';
    elKaydet.classList.toggle('gys-kayitli-aktif', varMi);
    elKaydet.setAttribute('aria-pressed', String(varMi));
  }

  // ---- Hatalar ----
  function hataListesiniCiz() {
    const liste = hataliSorulariGetir(durum.hatalar, tumSorular, hataFiltre, bugunIstanbul()).filter(
      (s) => !durum.hatalar[s.id]?.sonDogru || hataFiltre === 'encok'
    );
    elHataCoz.disabled = !liste.length;
    if (!liste.length) {
      elHataListe.innerHTML = '<p class="gys-ipucu">Bu dönemde bekleyen hatalı sorun yok.</p>';
      return;
    }
    elHataListe.innerHTML = `<ul class="gys-bag-liste">${liste
      .map((s) => {
        const k = durum.hatalar[s.id];
        return `<li><a href="/soru/${encodeURIComponent(s.id)}/">${esc(s.soru.length > 160 ? s.soru.slice(0, 160) + '…' : s.soru)}</a><small>${esc(kanunKisa(s.kanun))} · ${k?.hataSayisi ?? 1} kez yanlış · son ${esc(k?.tarih ?? '')}</small></li>`;
      })
      .join('')}</ul>`;
  }
  const hataliHavuz = () =>
    hataliSorulariGetir(durum.hatalar, tumSorular, hataFiltre, bugunIstanbul()).filter((s) => !durum.hatalar[s.id]?.sonDogru || hataFiltre === 'encok');

  // ---- Performans ----
  function performansCiz() {
    if (!elPerfListe) return;
    const satirlar = [...dersIstatistikleri().entries()].sort((a, b) => b[1].cozum - a[1].cozum);
    if (!satirlar.length) {
      elPerfListe.innerHTML = '<p class="gys-ipucu">Henüz soru çözmedin. Test çözdükçe ders bazında başarın burada görünür.</p>';
      return;
    }
    elPerfListe.innerHTML = satirlar
      .map(([kod, v]) => {
        const oran = Math.round((v.dogru / Math.max(1, v.dogru + v.yanlis)) * 100);
        return `<div class="gys-perf-satir">
          <strong>${esc(kanunMap.get(kod)?.ad ?? kod)}</strong>
          <span class="num">${v.dogru} D / ${v.yanlis} Y · %${oran}</span>
          <div class="gys-perf-ray"><div class="gys-perf-dolgu" style="width:${oran}%"></div></div>
          <button type="button" class="btn btn--quiet btn--kucuk" data-perf-calis="${esc(kod)}">Çalış</button>
        </div>`;
      })
      .join('');
    elPerfListe.querySelectorAll<HTMLButtonElement>('[data-perf-calis]').forEach((b) =>
      b.addEventListener('click', () => {
        const k = b.dataset.perfCalis || '';
        testiBaslat({ ozelSorular: tumSorular.filter((s) => s.kanun === k), hedefAdet: 20, ad: `${kanunKisa(k)} çalışması` });
      })
    );
  }

  // ---- Baskı kitapçığı ----
  function kitapcikUret() {
    const mod = elPdfMod.value as SinavModu;
    const adet = Math.min(100, Math.max(5, Number(elPdfAdet.value) || 20));
    const dugum = aktifDugum();
    let sorular: HazirSoru[];
    if (elPdfTip.value === 'agirlikli') {
      sorular = kitapcikOlustur(aktifUnvan(), tumSorular, { mod, toplamSoru: adet, agirlikli: true });
    } else {
      let havuz = dugumSorulari(dugum, tumSorular);
      if (elPdfKanun.value) havuz = havuz.filter((s) => s.kanun === elPdfKanun.value);
      sorular = karistir(havuz).slice(0, adet).map((s) => soruyuHazirla(s, mod));
    }
    if (!sorular.length) {
      elPdfOnizleme.innerHTML = '<p>Bu ayarlarla soru bulunamadı.</p>';
      elPdfEylem.hidden = true;
      return;
    }

    const tarih = bugunIstanbul();
    const baslik = `${secimAdi(dugum)}: test kitapçığı`;
    const soruBloklari = sorular
      .map(
        (item, idx) => `
      <div class="kitap-soru">
        <div class="kitap-soru-ust">
          <span class="kitap-no">${idx + 1}</span>
          <span class="kitap-etiket">${esc(kanunKisa(item.soru.kanun))}</span>
        </div>
        <p class="kitap-metin">${esc(item.soru.soru)}</p>
        <ul class="kitap-siklar">
          ${item.siklar.map((s) => `<li><span class="optik">${s.harf}</span> <span>${esc(s.metin)}</span></li>`).join('')}
        </ul>
      </div>`
      )
      .join('');
    const kaynakTemiz = (k: string) => k.replace(/https?:\/\/\S+/gi, '').replace(/\s{2,}/g, ' ').trim();
    const hizliCevaplar = sorular.map((item, idx) => `<div class="cevap-hap"><span>${idx + 1}</span><strong>${item.dogruHarf}</strong></div>`).join('');
    const ipuclari = sorular
      .map((item, idx) => {
        const dayanak = kaynakTemiz(item.soru.madde || item.soru.kaynak || '');
        const ipucu = (item.soru.aciklama || '').trim();
        return `<div class="ipucu-kutu"><div class="ipucu-ust"><strong>${idx + 1}. Cevap: ${item.dogruHarf}</strong>${dayanak ? `<span class="ipucu-dayanak">${esc(dayanak)}</span>` : ''}</div>${ipucu ? `<p class="ipucu-metin">${esc(ipucu)}</p>` : ''}</div>`;
      })
      .join('');

    // Yazdırılan belge bağımsızdır; site temasından etkilenmemesi için kendi sabit renklerini taşır.
    sonKitapcikHtml = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${esc(baslik)} | gys.657.com.tr</title>
<style>
@page{size:A4;margin:14mm 12mm 16mm 12mm;}
body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:16px;font-size:10.5pt;line-height:1.45;}
.kapak{background:#132036;color:#fff;padding:14px 18px;border-radius:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #c8102e;}
.kapak h1{margin:0;font-size:14pt;}
.kapak p{margin:4px 0 0;font-size:9pt;opacity:.9;}
.damga{font-size:9pt;font-weight:800;background:#c8102e;color:#fff;padding:4px 10px;border-radius:999px;white-space:nowrap;}
.sutunlar{column-count:2;column-gap:22px;column-rule:1px solid #e5e7eb;}
.kitap-soru{break-inside:avoid;margin-bottom:12px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa;}
.kitap-soru-ust{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.kitap-no{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#132036;color:#fff;font-weight:700;font-size:9pt;}
.kitap-etiket{font-size:7.5pt;font-weight:700;color:#34425a;background:#eef1f5;padding:2px 6px;border-radius:4px;}
.kitap-metin{margin:0 0 6px;font-weight:600;}
.kitap-siklar{list-style:none;margin:0;padding:0;display:grid;gap:3px;}
.kitap-siklar li{display:flex;gap:6px;align-items:flex-start;font-size:9.5pt;}
.optik{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1.2px solid #132036;border-radius:50%;font-size:8pt;font-weight:700;flex:0 0 16px;margin-top:2px;}
.cevap-bolum{page-break-before:always;margin-top:20px;border-top:3px solid #132036;padding-top:12px;}
.cevap-bolum h2{margin:0 0 10px;font-size:12pt;color:#132036;}
.cevap-bolum h3{margin:14px 0 8px;font-size:10.5pt;color:#132036;}
.cevap-haplar{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;margin-bottom:12px;}
.cevap-hap{border:1px solid #cbd5e1;border-radius:4px;padding:3px 5px;background:#f8fafc;display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;}
.cevap-hap span{color:#64748b;font-weight:600;}
.ipucu-sutun{column-count:2;column-gap:18px;column-rule:1px solid #e5e7eb;}
.ipucu-kutu{break-inside:avoid;border:1px solid #e2e8f0;border-left:3px solid #132036;border-radius:5px;padding:6px 8px;margin-bottom:8px;background:#f8fafc;}
.ipucu-ust{display:flex;justify-content:space-between;align-items:baseline;gap:6px;margin-bottom:3px;font-size:8.5pt;}
.ipucu-dayanak{font-size:7.5pt;color:#991b1b;font-weight:700;}
.ipucu-metin{margin:0;font-size:8.3pt;color:#334155;line-height:1.4;}
.alt-damga{position:fixed;bottom:4mm;right:6mm;font-size:8pt;color:#6b7280;font-weight:700;}
@media print{body{padding:0;}.kapak,.kitap-no,.kitap-etiket,.damga,.ipucu-kutu{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="alt-damga">gys.657.com.tr</div>
<div class="kapak">
  <div><h1>${esc(baslik)}</h1><p>${sorular.length} soru · ${mod === 'ikili' ? '2 şık' : '5 şık'} · ${tarih}</p></div>
  <div class="damga">gys.657.com.tr</div>
</div>
<div class="sutunlar">${soruBloklari}</div>
<div class="cevap-bolum">
  <h2>Cevap anahtarı</h2>
  <div class="cevap-haplar">${hizliCevaplar}</div>
  <h3>Çözüm ipuçları</h3>
  <div class="ipucu-sutun">${ipuclari}</div>
</div>
</body></html>`;

    elPdfOnizleme.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #132036;padding-bottom:8px;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
        <strong>${esc(baslik)} (${sorular.length} soru)</strong>
        <span style="font-size:12px;font-weight:700;">gys.657.com.tr · 657.com.tr</span>
      </div>
      <div style="column-count:2;column-gap:20px;column-rule:1px solid #e5e7eb;">${soruBloklari}</div>
      <div style="margin-top:16px;padding-top:12px;border-top:2px solid #132036;">
        <strong>Cevap Anahtarı:</strong> ${sorular.map((x, i) => `${i + 1}-${x.dogruHarf}`).join(' · ')}
      </div>
    `;
    elPdfEylem.hidden = false;
  }

  // ---- Topluluk ve stüdyo ----
  async function toplulukSorulariniYukle() {
    try {
      const r = await fetch(`${GYS_ONERILEN_API}?durum=tumu`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!r.ok) return;
      const d = await r.json();
      const liste: ToplulukSorusu[] = Array.isArray(d?.sorular) ? d.sorular : [];
      bekleyenToplulukSorulari = liste.filter((s) => s.durum === 'bekliyor');
      const mevcut = new Set(tumSorular.map((s) => s.id));
      let eklendi = false;
      for (const s of liste.filter((x) => x.durum === 'onayli')) {
        if (!mevcut.has(s.id)) {
          tumSorular.push(s);
          mevcut.add(s.id);
          eklendi = true;
        }
      }
      elBekleyenSayi.textContent = String(bekleyenToplulukSorulari.length);
      if (eklendi) ustBilgileriGuncelle();
    } catch {
      /* çevrimdışı */
    }
  }

  function ozelListeyiCiz() {
    elOzelIndir.hidden = ozelSorular.length === 0;
    elOzelListe.innerHTML = ozelSorular.length
      ? `<h3 style="margin:var(--space-lg) 0 var(--space-xs);font-size:var(--text-md);">Kendi listen (${ozelSorular.length})</h3><ul class="gys-bag-liste">${ozelSorular
          .map((s) => `<li>${esc(s.soru.slice(0, 140))}<small>${esc(kanunKisa(s.kanun))}</small></li>`)
          .join('')}</ul>`
      : '';
  }

  function ekleBolumleriniSuz() {
    const k = elEkleKanun.value;
    let ilk = '';
    [...elEkleBolum.options].forEach((o) => {
      const uygun = o.dataset.kanun === k;
      o.hidden = !uygun;
      o.disabled = !uygun;
      if (uygun && !ilk) ilk = o.value;
    });
    if (elEkleBolum.selectedOptions[0]?.dataset.kanun !== k) elEkleBolum.value = ilk;
  }
  elEkleKanun.addEventListener('change', ekleBolumleriniSuz);
  ekleBolumleriniSuz();

  function formdanSoruOku(): GysSoru | null {
    const deger = (sel: string) => $<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(sel)!.value.trim();
    const satirlar = (sel: string) => deger(sel).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const soru = deger('[data-gys-ekle-soru]');
    const dogru = satirlar('[data-gys-ekle-dogru]');
    const yanlis = satirlar('[data-gys-ekle-yanlis]');
    const kaynak = deger('[data-gys-ekle-kaynak]');
    const aciklama = deger('[data-gys-ekle-aciklama]');
    if (soru.length < 20 || dogru.length < 1 || yanlis.length < 4 || kaynak.length < 3 || aciklama.length < 10) {
      elEkleDurum.textContent = 'En az 20 karakterlik soru, 1 doğru, 4 yanlış şık, dayanak ve açıklama gerekli.';
      return null;
    }
    return {
      id: `ozel-${Date.now().toString(36)}`,
      kanun: elEkleKanun.value,
      bolum: elEkleBolum.value,
      seviye: deger('[data-gys-ekle-seviye]') as Zorluk,
      tur: 'madde',
      soru,
      dogru,
      yanlis,
      kaynak,
      aciklama,
    };
  }

  // ---- Olay bağlamaları ----
  elTabs.forEach((b) => b.addEventListener('click', () => sekmeAc(b.dataset.gysTab!)));
  elTabs.forEach((b, i) =>
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const yeni = elTabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + elTabs.length) % elTabs.length];
      yeni.focus();
      sekmeAc(yeni.dataset.gysTab!);
    })
  );
  elBaslat.addEventListener('click', () => testiBaslat());
  elSonsuz.addEventListener('click', () => testiBaslat({ sonsuz: true }));
  elDeneme.addEventListener('click', () => testiBaslat({ deneme: true }));
  elSonraki.addEventListener('click', () => {
    if (sonsuzMod) {
      const yeni = sonsuzSonrakiSoru(aktifHavuz, sonSoruId, seciliMod());
      if (yeni) {
        sonSoruId = yeni.soru.id;
        aktifTest = [yeni];
        aktifIdx = 0;
        cevaplar.clear();
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
  elOnceki?.addEventListener('click', () => {
    if (aktifIdx > 0) {
      aktifIdx--;
      soruyuCiz();
    }
  });
  elBitir.addEventListener('click', sonucuGoster);

  $('[data-gys-hizli-10]')?.addEventListener('click', () => testiBaslat({ hedefAdet: 10, ad: `${secimAdi(aktifDugum())} hızlı 10` }));
  $('[data-gys-yaris-60]')?.addEventListener('click', () => testiBaslat({ yaris: true, hedefAdet: 15 }));
  $('[data-gys-hatali-coz]')?.addEventListener('click', () => {
    hataFiltre = 'tumu';
    const liste = hataliHavuz();
    if (!liste.length) return sonucMesaji('Bekleyen hatalı sorun yok. Test çözdükçe yanlış yaptığın sorular burada toplanır.');
    testiBaslat({ ozelSorular: liste, ad: 'Hatalı sorularım' });
  });
  $('[data-gys-kayitli-coz]')?.addEventListener('click', () => {
    const liste = tumSorular.filter((s) => kayitliSet.has(s.id));
    if (!liste.length) return sonucMesaji('Henüz kaydettiğin soru yok. Soru çözerken “Soruyu kaydet” ile listene ekleyebilirsin.');
    testiBaslat({ ozelSorular: liste, ad: 'Kaydettiklerim' });
  });
  $('[data-gys-zayif-coz]')?.addEventListener('click', () => {
    const enZayif = [...dersIstatistikleri().entries()].sort(
      (a, b) => a[1].dogru / Math.max(1, a[1].cozum) - b[1].dogru / Math.max(1, b[1].cozum)
    )[0];
    if (!enZayif) return sonucMesaji('Zayıf dersini bulmak için önce birkaç soru çöz.');
    testiBaslat({ ozelSorular: tumSorular.filter((s) => s.kanun === enZayif[0]), hedefAdet: 15, ad: `${kanunKisa(enZayif[0])} tekrarı` });
  });

  elHataFiltreBtns.forEach((b) =>
    b.addEventListener('click', () => {
      hataFiltre = b.dataset.gysHataFiltre as typeof hataFiltre;
      elHataFiltreBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      hataListesiniCiz();
    })
  );
  elHataCoz.addEventListener('click', () => {
    const liste = hataliHavuz();
    if (liste.length) testiBaslat({ ozelSorular: liste, ad: 'Hatalı sorularım' });
  });
  $('[data-gys-istatistik-sifirla]')?.addEventListener('click', () => {
    if (!window.confirm('Çözüm geçmişin ve hatalı soru listen silinsin mi?')) return;
    durum = { ...durum, sonKanun: '', toplamCozulen: 0, toplamDogru: 0, hatalar: {}, soruGecmisi: {} };
    durumKaydet();
    ustBilgileriGuncelle();
    hataListesiniCiz();
  });

  $$<HTMLButtonElement>('[data-gys-kitap-coz]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.gysKitapCoz!;
      testiBaslat({ ozelSorular: tumSorular.filter((s) => s.kanun === k), hedefAdet: 20, ad: `${kanunKisa(k)} çalışması` });
    })
  );

  $('[data-gys-pdf-uret]')?.addEventListener('click', kitapcikUret);
  $('[data-gys-pdf-yazdir]')?.addEventListener('click', () => {
    if (!sonKitapcikHtml) return;
    const w = window.open('', '_blank', 'width=960,height=800');
    if (!w) return;
    w.document.open();
    w.document.write(sonKitapcikHtml);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  });
  $('[data-gys-pdf-indir]')?.addEventListener('click', () => {
    if (sonKitapcikHtml) indir(sonKitapcikHtml, 'text/html;charset=utf-8', `657-gys-kitapcik-${durum.seciliDugumId}-${bugunIstanbul()}.html`);
  });

  $('[data-gys-json-indir]')?.addEventListener('click', () =>
    indir(JSON.stringify(filtreliHavuz(), null, 2), 'application/json;charset=utf-8', `657-gys-sorular-${durum.seciliDugumId}-${bugunIstanbul()}.json`)
  );
  $('[data-gys-topluluk-coz]')?.addEventListener('click', () => {
    if (!bekleyenToplulukSorulari.length) {
      elEkleDurum.textContent = 'Şu an onay bekleyen soru yok.';
      return;
    }
    testiBaslat({ ozelSorular: bekleyenToplulukSorulari, ad: 'Onay bekleyen sorular' });
  });

  elOylaBar.querySelectorAll<HTMLButtonElement>('[data-gys-oy]').forEach((btn) =>
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
        elOySonuc.textContent = d.durum === 'onayli' ? 'Teşekkürler, soru yeterli oyla havuza eklendi.' : `Oyun kaydedildi (onay ${d.onayOy}, red ${d.redOy}).`;
      } catch {
        elOySonuc.textContent = 'Oy kaydedilemedi; sonra tekrar dene.';
      }
    })
  );

  $$<HTMLButtonElement>('[data-gys-bildir-ac]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const tur = btn.dataset.gysBildirAc!;
      elBildirTur.value = tur;
      elBildirBaslik.textContent = tur === 'telif' ? 'Telif bildirimi: kaynak ve hak sahibi (en az 10 karakter)' : 'Hata bildirimi: madde ve gerekçe (en az 10 karakter)';
      elBildirForm.hidden = false;
      elBildirMetin.focus();
    })
  );
  $('[data-gys-bildir-iptal]')?.addEventListener('click', () => (elBildirForm.hidden = true));
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
      elBildirDurum.textContent = 'Bildirimin incelemeye alındı.';
    } catch {
      elBildirDurum.textContent = 'Gönderilemedi; en az 10 karakter yazıp tekrar dene.';
    }
  });

  $('[data-gys-ekle-yerel]')?.addEventListener('click', () => {
    const yeni = formdanSoruOku();
    if (!yeni) return;
    ozelSorular.push(yeni);
    try {
      localStorage.setItem(OZEL_STORE_KEY, JSON.stringify(ozelSorular));
    } catch {
      /* geç */
    }
    ozelListeyiCiz();
    elEkleDurum.textContent = `Listene eklendi (${ozelSorular.length} soru).`;
    elEkleForm.reset();
    ekleBolumleriniSuz();
  });
  elOzelIndir.addEventListener('click', () =>
    indir(JSON.stringify(ozelSorular, null, 2), 'application/json;charset=utf-8', `657-kendi-sorularim-${bugunIstanbul()}.json`)
  );
  elEkleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const yeni = formdanSoruOku();
    if (!yeni) return;
    elEkleDurum.textContent = 'Gönderiliyor…';
    try {
      const r = await fetch(GYS_ONERILEN_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(yeni) });
      if (!r.ok) throw Error();
      elEkleDurum.textContent = 'Sorun onaya gönderildi; diğer kullanıcılar oylayabilir.';
      elEkleForm.reset();
      ekleBolumleriniSuz();
      void toplulukSorulariniYukle();
    } catch {
      elEkleDurum.textContent = 'Sunucuya ulaşılamadı; önce kendi listene ekleyebilirsin.';
    }
  });

  $('[data-gys-mevzuat-indir]')?.addEventListener('click', () => {
    try {
      const veri = JSON.parse(document.getElementById('gys-mevzuat-veri')?.textContent || '{}') as {
        mevzuatlar: Array<{ ad: string; grup: string; sinavlar: string[]; url: string }>;
      };
      const yol = dugumYolu(agacKok, durum.seciliDugumId).map((d) => d.id);
      const ilgili = veri.mevzuatlar.filter((m) => m.sinavlar.some((s) => yol.includes(s)));
      const liste = ilgili.length ? ilgili : veri.mevzuatlar;
      const icerik = [
        `657.com.tr GYS mevzuat listesi (${new Date().toLocaleDateString('tr-TR')})`,
        `Sınav: ${secimAdi(aktifDugum())}`,
        `${liste.length} resmî kaynak`,
        '='.repeat(60),
        '',
        ...liste.map((m, i) => `${i + 1}. [${m.grup}] ${m.ad}\n   ${m.url}`),
        '',
        'Kaynak: https://gys.657.com.tr/ ve https://www.mevzuat.gov.tr/',
      ].join('\n');
      indir(icerik, 'text/plain;charset=utf-8', `657-gys-mevzuat-${durum.seciliDugumId}.txt`);
    } catch {
      /* geç */
    }
  });

  if (elOtomatik) {
    elOtomatik.checked = otomatikGecisOku();
    elOtomatik.addEventListener('change', () => otomatikGecisKaydet(elOtomatik.checked));
  }
  elKaydet?.addEventListener('click', () => {
    const item = aktifTest[aktifIdx];
    if (!item) return;
    if (kayitliSet.has(item.soru.id)) kayitliSet.delete(item.soru.id);
    else kayitliSet.add(item.soru.id);
    kayitliSorularKaydet(kayitliSet);
    kaydetButonGuncelle(item.soru.id);
    skorRayGuncelle();
  });
  document.addEventListener('keydown', (e) => {
    if (elSahne.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const k = e.key.toLowerCase();
    const harfMap: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
    if (harfMap[k]) {
      elSiklar.querySelector<HTMLButtonElement>(`[data-gys-sik="${harfMap[k]}"]:not(:disabled)`)?.click();
    } else if (e.key === 'ArrowRight' && !elSonraki.hidden) {
      e.preventDefault();
      elSonraki.click();
    } else if (k === 'k' && elKaydet) {
      elKaydet.click();
    }
  });

  const mulakatPanel = mulakatPaneliniBagla(root);
  canliSinavBagla($('[data-gys-canli-root]'), 'gys', () => {
    if (!durum.toplamCozulen) return null;
    const oran = Math.round((durum.toplamDogru / Math.max(1, durum.toplamCozulen)) * 100);
    return { skor: oran, dogru: durum.toplamDogru, yanlis: Math.max(0, durum.toplamCozulen - durum.toplamDogru), sureSn: 0, detay: `${durum.toplamCozulen} soru · %${oran}` };
  });

  // ---- Başlangıç ----
  // Eski hash adresleri (#gys-studyo vb.) ilgili paneli açar.
  const HASH_PANEL: Record<string, string> = {
    '#gys-sinav-alani': 'sinav',
    '#gys-canli-sinav': 'canli',
    '#gys-performans': 'performans',
    '#gys-studyo': 'ekle',
    '#gys-takvim': 'takvim',
  };
  function hashUygula() {
    const panel = HASH_PANEL[location.hash];
    if (panel) sekmeAc(panel);
  }
  window.addEventListener('hashchange', hashUygula);

  tercihleriUygula();
  ozelListeyiCiz();
  ustBilgileriGuncelle();
  skorRayGuncelle();
  seciciAc(!durum.secimOnayli);

  const baslangic = root.dataset.gysInitialTab || 'sinav';
  sekmeAc(baslangic);
  hashUygula();

  // Statik sayfalardan gelen bağlantılar: ?secim=<düğüm>, ?konu=<konu>, ?soru=<soru>, ?ders=<kanun>.
  const p = new URLSearchParams(location.search);
  const secimP = p.get('secim');
  const konuP = p.get('konu');
  const soruP = p.get('soru');
  const dersP = p.get('ders');
  if (secimP && dugumBul(agacKok, secimP)) {
    dugumSec(secimP);
    seciciAc(false);
  }
  if (konuP) {
    const konu = konularVeri.find((k) => k.id === konuP);
    if (konu) testiBaslat({ ozelSorular: konuHavuzu(konu, tumSorular), hedefAdet: 20, ad: konu.kisa });
  } else if (soruP) {
    const soru = tumSorular.find((s) => s.id === soruP);
    if (soru) testiBaslat({ ozelSorular: tumSorular.filter((s) => s.bolum === soru.bolum || s.kanun === soru.kanun), ilkSoru: soru, hedefAdet: 10, ad: kanunKisa(soru.kanun) });
  } else if (dersP && kanunMap.has(dersP)) {
    testiBaslat({ ozelSorular: tumSorular.filter((s) => s.kanun === dersP), hedefAdet: 20, ad: kanunKisa(dersP) });
  } else if (secimP && p.get('baslat') === '1') {
    testiBaslat();
  }
  if (secimP || konuP || soruP || dersP) history.replaceState(null, '', location.pathname + location.hash);

  void genelIstatistikleriYukle();
  void toplulukSorulariniYukle();
}
