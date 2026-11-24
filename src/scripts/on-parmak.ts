import { canliSinavBagla } from './canli-sinav';
import { platformSayacYenile } from './platform-sayac';
import {
  metinHazirla,
  sinavDegerlendir,
  type DegerlendirmeSonucu,
  type YazimModu,
} from '../lib/klavye-degerlendirme';
import { yerelYol } from '../lib/site-yolu';

interface MetinOge {
  ad: string;
  t: number;
  k: number;
}
interface MetinGrup {
  id: string;
  kurum: string;
  yil: number;
  baslik: string;
  tarih: string;
  kaynak: string;
  ogeler: MetinOge[];
}
interface VeriPaketi {
  metinler: string[];
  gruplar: MetinGrup[];
}
interface GecmisKaydi {
  tarih: string;
  grup: string;
  metin: string;
  sure: number;
  net: number;
  dogru: number;
  hatali: number;
  atlanan: number;
  dks: number;
  dogruluk: number;
  basarili: boolean;
}

type KlavyeDuzeni = 'f' | 'q';
type GorunumModu = 'klasik' | 'akis';

// Türkçe F ve Q Klavye satır düzeni + parmak sınıfı (1: sol serçe .. 4: sol işaret, 5: başparmak, 6: sağ işaret .. 9: sağ serçe)
interface TusTanim {
  ch: string;
  label?: string;
  parmak: number;
  genis?: boolean;
}

const KLAVYE_F: TusTanim[][] = [
  [
    { ch: '1', parmak: 1 }, { ch: '2', parmak: 1 }, { ch: '3', parmak: 2 }, { ch: '4', parmak: 3 },
    { ch: '5', parmak: 4 }, { ch: '6', parmak: 4 }, { ch: '7', parmak: 6 }, { ch: '8', parmak: 6 },
    { ch: '9', parmak: 7 }, { ch: '0', parmak: 8 }, { ch: '/', parmak: 9 }, { ch: '-', parmak: 9 },
  ],
  [
    { ch: 'f', parmak: 1 }, { ch: 'g', parmak: 2 }, { ch: 'ğ', parmak: 3 }, { ch: 'ı', parmak: 4 },
    { ch: 'o', parmak: 4 }, { ch: 'd', parmak: 6 }, { ch: 'r', parmak: 6 }, { ch: 'n', parmak: 7 },
    { ch: 'h', parmak: 8 }, { ch: 'p', parmak: 9 }, { ch: 'q', parmak: 9 }, { ch: 'w', parmak: 9 },
  ],
  [
    { ch: 'u', parmak: 1 }, { ch: 'i', parmak: 2 }, { ch: 'e', parmak: 3 }, { ch: 'a', parmak: 4 },
    { ch: 'ü', parmak: 4 }, { ch: 't', parmak: 6 }, { ch: 'k', parmak: 6 }, { ch: 'm', parmak: 7 },
    { ch: 'l', parmak: 8 }, { ch: 'y', parmak: 9 }, { ch: 'ş', parmak: 9 }, { ch: 'x', parmak: 9 },
  ],
  [
    { ch: 'j', parmak: 1 }, { ch: 'ö', parmak: 2 }, { ch: 'v', parmak: 3 }, { ch: 'c', parmak: 4 },
    { ch: 'ç', parmak: 4 }, { ch: 'z', parmak: 6 }, { ch: 's', parmak: 6 }, { ch: 'b', parmak: 7 },
    { ch: '.', parmak: 8 }, { ch: ',', parmak: 9 },
  ],
  [{ ch: ' ', label: 'Boşluk (Başparmak)', parmak: 5, genis: true }],
];

const KLAVYE_Q: TusTanim[][] = [
  [
    { ch: '1', parmak: 1 }, { ch: '2', parmak: 1 }, { ch: '3', parmak: 2 }, { ch: '4', parmak: 3 },
    { ch: '5', parmak: 4 }, { ch: '6', parmak: 4 }, { ch: '7', parmak: 6 }, { ch: '8', parmak: 6 },
    { ch: '9', parmak: 7 }, { ch: '0', parmak: 8 }, { ch: '*', parmak: 9 }, { ch: '-', parmak: 9 },
  ],
  [
    { ch: 'q', parmak: 1 }, { ch: 'w', parmak: 2 }, { ch: 'e', parmak: 3 }, { ch: 'r', parmak: 4 },
    { ch: 't', parmak: 4 }, { ch: 'y', parmak: 6 }, { ch: 'u', parmak: 6 }, { ch: 'ı', parmak: 7 },
    { ch: 'o', parmak: 8 }, { ch: 'p', parmak: 9 }, { ch: 'ğ', parmak: 9 }, { ch: 'ü', parmak: 9 },
  ],
  [
    { ch: 'a', parmak: 1 }, { ch: 's', parmak: 2 }, { ch: 'd', parmak: 3 }, { ch: 'f', parmak: 4 },
    { ch: 'g', parmak: 4 }, { ch: 'h', parmak: 6 }, { ch: 'j', parmak: 6 }, { ch: 'k', parmak: 7 },
    { ch: 'l', parmak: 8 }, { ch: 'ş', parmak: 9 }, { ch: 'i', parmak: 9 }, { ch: ',', parmak: 9 },
  ],
  [
    { ch: 'z', parmak: 1 }, { ch: 'x', parmak: 2 }, { ch: 'c', parmak: 3 }, { ch: 'v', parmak: 4 },
    { ch: 'b', parmak: 4 }, { ch: 'n', parmak: 6 }, { ch: 'm', parmak: 6 }, { ch: 'ö', parmak: 7 },
    { ch: 'ç', parmak: 8 }, { ch: '.', parmak: 9 },
  ],
  [{ ch: ' ', label: 'Boşluk (Başparmak)', parmak: 5, genis: true }],
];

const PARMAK_ADLARI: Record<number, string> = {
  1: 'Sol Serçe',
  2: 'Sol Yüzük',
  3: 'Sol Orta',
  4: 'Sol İşaret',
  5: 'Başparmak',
  6: 'Sağ İşaret',
  7: 'Sağ Orta',
  8: 'Sağ Yüzük',
  9: 'Sağ Serçe',
};

const HATA_ETIKETLERI: Record<string, string> = {
  dogru: 'Doğru',
  'fazla-vurus': 'Fazla vuruş hatası',
  'eksik-vurus': 'Eksik vuruş hatası',
  'harf-yer-degistirme': 'Harf yer değiştirme hatası',
  karakter: 'Karakter hatası',
  'kelime-bolme': 'Kelime bölme hatası',
  'kelime-birlestirme': 'Kelime birleştirme hatası',
  karisik: 'Karışık hata',
  atlanan: 'Atlanan kelime',
};

const STORAGE_KEY = '657:onparmak:gecmis';
const STATS_KEY = '657:onparmak:metin-istatistik';
const SES_KEY = '657:onparmak:ses';
const KLAVYE_API = '/_657-servis/api/klavye-istatistik';

interface YerelMetinKaydi {
  gun: string; // YYYY-MM-DD
  metinId: string;
  hataOrani: number;
  net: number;
  basarili: boolean;
}

interface MetinIstatistikOzeti {
  metinId: string;
  bugun: number;
  buHafta: number;
  buAy: number;
  buYil: number;
  toplam: number;
  ortalamaHataOrani: number;
  ortalamaNet: number;
  basariOrani: number;
}

const root = document.querySelector<HTMLElement>('[data-onparmak]');
if (root) {
  const elGrup = root.querySelector<HTMLSelectElement>('[data-op-grup]')!;
  const elMetin = root.querySelector<HTMLSelectElement>('[data-op-metin]')!;
  const elRastgele = root.querySelector<HTMLButtonElement>('[data-op-rastgele]')!;
  const elOzelBtn = root.querySelector<HTMLButtonElement>('[data-op-ozel-ac]')!;
  const elOzelKutu = root.querySelector<HTMLElement>('[data-op-ozel-kutu]')!;
  const elOzelAlan = root.querySelector<HTMLTextAreaElement>('[data-op-ozel-metin]')!;
  const elOzelUygula = root.querySelector<HTMLButtonElement>('[data-op-ozel-uygula]')!;
  const elSureBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-op-sure]')];
  const elModBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-op-mod]')];
  const elGorunumBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-op-gorunum]')];
  const elKlavyeBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-op-klavye-duzen]')];
  const elBoyutBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-op-boyut]')];
  const elGeriSayimChk = root.querySelector<HTMLInputElement>('[data-op-gerisayim-chk]')!;
  const elHataGosterChk = root.querySelector<HTMLInputElement>('[data-op-hatagoster-chk]')!;
  const elSanalKlavyeChk = root.querySelector<HTMLInputElement>('[data-op-sanalklavye-chk]')!;
  const elSesChk = root.querySelector<HTMLInputElement>('[data-op-ses-chk]');
  const elSesBtn = root.querySelector<HTMLButtonElement>('[data-op-ses-btn]');
  const elTamEkranBtn = root.querySelector<HTMLButtonElement>('[data-op-tamekran]')!;
  const elTamEkranCikBtn = root.querySelector<HTMLButtonElement>('[data-op-tamekran-cik]');
  const elSahne = root.querySelector<HTMLElement>('[data-op-sahne]')!;

  const elBaslat = root.querySelector<HTMLButtonElement>('[data-op-baslat]')!;
  const elDuraklat = root.querySelector<HTMLButtonElement>('[data-op-duraklat]')!;
  const elBitir = root.querySelector<HTMLButtonElement>('[data-op-bitir]')!;
  const elSifirla = root.querySelector<HTMLButtonElement>('[data-op-sifirla]')!;

  const elSureGoster = root.querySelector<HTMLElement>('[data-op-kalan]')!;
  const elIlerleme = root.querySelector<HTMLElement>('[data-op-ilerleme]')!;
  const elCanliDogru = root.querySelector<HTMLElement>('[data-op-c-dogru]')!;
  const elCanliYanlis = root.querySelector<HTMLElement>('[data-op-c-yanlis]')!;
  const elCanliNet = root.querySelector<HTMLElement>('[data-op-c-net]')!;
  const elCanliDks = root.querySelector<HTMLElement>('[data-op-c-dks]')!;
  const elCanliVurus = root.querySelector<HTMLElement>('[data-op-c-vurus]')!;
  const elCanliDogruluk = root.querySelector<HTMLElement>('[data-op-c-dogruluk]')!;
  const elBaraj = root.querySelector<HTMLElement>('[data-op-baraj]');
  const elBarajDolgu = root.querySelector<HTMLElement>('[data-op-baraj-dolgu]');
  const elBarajMetin = root.querySelector<HTMLElement>('[data-op-baraj-metin]');
  function barajGuncelle(net: number) {
    if (!elBaraj || !elBarajDolgu || !elBarajMetin) return;
    const pct = Math.min(100, Math.round((Math.max(0, net) / 120) * 100));
    elBarajDolgu.style.width = `${pct}%`;
    if (net >= 120) {
      elBaraj.dataset.durum = 'hedef';
      elBarajMetin.textContent = `★ 120+ Mülakat Hedefi Aşıldı! (${net} net kelime)`;
    } else if (net >= 90) {
      elBaraj.dataset.durum = 'baraj';
      elBarajMetin.textContent = `✓ 90 Resmî Barajı Aşıldı! (${net} / 120 hedef)`;
    } else {
      elBaraj.dataset.durum = '';
      elBarajMetin.textContent = `Resmî 90 Kelime Barajı: ${net} / 90 net`;
    }
  }

  const elKaynakBilgi = root.querySelector<HTMLElement>('[data-op-kaynak-bilgi]')!;
  const elMetinSayac = root.querySelector<HTMLElement>('[data-op-metin-sayac]');
  const elGeriSayimPerde = root.querySelector<HTMLElement>('[data-op-perde]')!;
  const elGeriSayimRakam = root.querySelector<HTMLElement>('[data-op-perde-rakam]')!;
  const elMetinAlani = root.querySelector<HTMLElement>('[data-op-hedef]')!;
  const elGiris = root.querySelector<HTMLTextAreaElement>('[data-op-giris]')!;
  const elSanalKlavye = root.querySelector<HTMLElement>('[data-op-klavye]')!;
  const elParmakIpucu = root.querySelector<HTMLElement>('[data-op-parmak-ipucu]')!;

  const elSonuc = root.querySelector<HTMLElement>('[data-op-sonuc]')!;
  const elGecmisListe = root.querySelector<HTMLElement>('[data-op-gecmis]')!;
  const elGecmisIndir = root.querySelector<HTMLButtonElement>('[data-op-gecmis-indir]');
  const elGecmisTemizle = root.querySelector<HTMLButtonElement>('[data-op-gecmis-temizle]')!;
  const elZorListe = root.querySelector<HTMLElement>('[data-op-zor]');
  const elYukleniyor = root.querySelector<HTMLElement>('[data-op-yukleniyor]')!;

  let veri: VeriPaketi | null = null;
  let aktifGrupId = 'pgm-2026';
  let aktifMetinIdx = 0;
  let ozelHamMetin: string | null = null;
  let ozelBaslik = 'Özel Metin';

  let sureSaniye = 180;
  let kalanSaniye = 180;
  let yazimModu: YazimModu = 'imlasiz';
  let gorunumModu: GorunumModu = 'klasik';
  let klavyeDuzeni: KlavyeDuzeni = 'f';

  let hedefMetin = '';
  let hedefKelimeler: string[] = [];
  let durum: 'hazir' | 'gerisayim' | 'calisiyor' | 'duraklatildi' | 'bitti' = 'hazir';
  let zamanlayici: number | null = null;
  let geriSayimId: number | null = null;
  let baslangicZamani = 0;
  let gecenMs = 0;
  let hizGecmisi: { sn: number; dks: number }[] = [];
  let sonHizKayitSn = 0;
  let sonSonuc: DegerlendirmeSonucu | null = null;
  let sesAcik = false;
  let audioCtx: AudioContext | null = null;
  let fallbackTamEkran = false;

  try {
    sesAcik = localStorage.getItem(SES_KEY) === '1';
  } catch {
    sesAcik = false;
  }

  function sesDurumunuUygula(acik: boolean) {
    sesAcik = acik;
    if (elSesChk) elSesChk.checked = acik;
    if (elSesBtn) {
      elSesBtn.setAttribute('aria-pressed', String(acik));
      elSesBtn.textContent = acik ? 'Ses: Açık' : 'Ses: Kapalı';
    }
    try {
      localStorage.setItem(SES_KEY, acik ? '1' : '0');
    } catch {
      /* geç */
    }
  }

  function klavyeSesiCal(tur: 'normal' | 'bosluk' | 'sil') {
    if (!sesAcik) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') void audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      const basFreq = tur === 'bosluk' ? 240 : tur === 'sil' ? 310 : 520 + (Math.random() * 60 - 30);
      const sonFreq = tur === 'bosluk' ? 95 : 140;
      const sure = tur === 'bosluk' ? 0.032 : 0.022;
      osc.frequency.setValueAtTime(basFreq, now);
      osc.frequency.exponentialRampToValueAtTime(sonFreq, now + sure);
      gain.gain.setValueAtTime(tur === 'bosluk' ? 0.09 : 0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + sure);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + sure);
    } catch {
      /* ses motoru yoksa sessiz devam et */
    }
  }

  function metinOnizleme(ham: string, maxKelime = 5, maxUzunluk = 44): string {
    const temiz = ham.replace(/\s+/g, ' ').trim();
    if (!temiz) return '';
    const parca = temiz.split(' ').slice(0, maxKelime).join(' ');
    return parca.length > maxUzunluk
      ? `${parca.slice(0, maxUzunluk - 1).trimEnd()}…`
      : `${parca}…`;
  }

  function metinEtiketi(o: MetinOge, idx: number, ham: string): string {
    const num = idx + 1;
    if (/^Metin\s+\d+$/i.test(o.ad.trim())) {
      const oniz = metinOnizleme(ham);
      return oniz ? `${num} - ${oniz}` : `${num} - ${o.ad}`;
    }
    return `${num} - ${o.ad}`;
  }

  const sureBicim = (sn: number): string => {
    const m = Math.floor(Math.max(0, sn) / 60);
    const s = Math.max(0, sn) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  function klavyeCiz() {
    const satirlar = klavyeDuzeni === 'f' ? KLAVYE_F : KLAVYE_Q;
    elSanalKlavye.innerHTML = '';
    for (const satir of satirlar) {
      const row = document.createElement('div');
      row.className = 'op-kb__row';
      for (const t of satir) {
        const key = document.createElement('span');
        key.className = `op-kb__key op-kb__p${t.parmak}${t.genis ? ' op-kb__key--space' : ''}`;
        key.dataset.key = t.ch;
        key.textContent = t.label ?? t.ch.toLocaleUpperCase('tr-TR');
        row.append(key);
      }
      elSanalKlavye.append(row);
    }
    siradakiTusuVurgula();
  }

  function siradakiTusuVurgula() {
    if (elSanalKlavye.hidden) return;
    elSanalKlavye.querySelectorAll('.is-next').forEach((e) => e.classList.remove('is-next'));
    const yazilan = elGiris.value;
    let nextChar = '';
    if (yazilan.length < hedefMetin.length) {
      // Bulunan kelimedeki bir sonraki karakter
      const parcalar = yazilan.split(/\s+/);
      const sonBosluk = /\s$/.test(yazilan);
      const kelimeIdx = sonBosluk ? parcalar.filter(Boolean).length : Math.max(0, parcalar.length - 1);
      const aktifHedef = hedefKelimeler[kelimeIdx] ?? '';
      const aktifYazilan = sonBosluk ? '' : (parcalar[parcalar.length - 1] ?? '');
      if (aktifYazilan.length < aktifHedef.length) {
        nextChar = aktifHedef[aktifYazilan.length].toLocaleLowerCase('tr-TR');
      } else if (aktifHedef) {
        nextChar = ' ';
      }
    }
    if (!nextChar) return;
    const tusEl = elSanalKlavye.querySelector<HTMLElement>(
      `.op-kb__key[data-key="${CSS.escape(nextChar)}"]`
    );
    if (tusEl) {
      tusEl.classList.add('is-next');
      const satirlar = klavyeDuzeni === 'f' ? KLAVYE_F : KLAVYE_Q;
      const tanim = satirlar.flat().find((x) => x.ch === nextChar);
      if (tanim && elParmakIpucu) {
        elParmakIpucu.textContent = `Sıradaki tuş: "${nextChar === ' ' ? 'BOŞLUK' : nextChar.toLocaleUpperCase('tr-TR')}" · Parmak: ${PARMAK_ADLARI[tanim.parmak]}`;
      }
    }
  }

  function metniYukle() {
    let ham = '';
    let bilgi = '';
    if (ozelHamMetin !== null) {
      ham = ozelHamMetin;
      bilgi = `${ozelBaslik} · ${ham.split(/\s+/).filter(Boolean).length} kelime`;
    } else if (veri) {
      const grup = veri.gruplar.find((g) => g.id === aktifGrupId) ?? veri.gruplar[0];
      if (!grup) return;
      aktifGrupId = grup.id;
      const oge = grup.ogeler[aktifMetinIdx] ?? grup.ogeler[0];
      if (!oge) return;
      ham = veri.metinler[oge.t] ?? '';
      bilgi = `${grup.baslik} · ${metinEtiketi(oge, aktifMetinIdx, ham)} (${oge.k} kelime)`;
    }
    hedefMetin = metinHazirla(ham, yazimModu);
    hedefKelimeler = hedefMetin ? hedefMetin.split(/\s+/) : [];
    elKaynakBilgi.textContent = bilgi;
    sifirla(false);
    void metinSayaciniGuncelle();
  }

  function aktifMetinKimligi(): string {
    return ozelHamMetin !== null ? '' : `${aktifGrupId}:${aktifMetinIdx + 1}`;
  }

  function istanbulBugun(): string {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function yerelIstatistikOku(): YerelMetinKaydi[] {
    try {
      return JSON.parse(localStorage.getItem(STATS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function yerelOzetHesapla(metinId: string): MetinIstatistikOzeti {
    const kayitlar = yerelIstatistikOku().filter((k) => k.metinId === metinId);
    const bugunStr = istanbulBugun();
    const bugunDate = new Date(bugunStr + 'T00:00:00');
    const haftaGunu = (bugunDate.getDay() + 6) % 7; // Pazartesi = 0
    const haftaBasi = new Date(bugunDate);
    haftaBasi.setDate(bugunDate.getDate() - haftaGunu);
    const haftaStr = haftaBasi.toISOString().slice(0, 10);
    const ayStr = bugunStr.slice(0, 8) + '01';
    const yilStr = bugunStr.slice(0, 5) + '01-01';

    let bugun = 0, buHafta = 0, buAy = 0, buYil = 0, basarili = 0, hataTop = 0, netTop = 0;
    for (const k of kayitlar) {
      if (k.gun === bugunStr) bugun++;
      if (k.gun >= haftaStr) buHafta++;
      if (k.gun >= ayStr) buAy++;
      if (k.gun >= yilStr) buYil++;
      if (k.basarili) basarili++;
      hataTop += k.hataOrani;
      netTop += k.net;
    }
    const toplam = kayitlar.length;
    return {
      metinId,
      bugun,
      buHafta,
      buAy,
      buYil,
      toplam,
      ortalamaHataOrani: toplam ? Number((hataTop / toplam).toFixed(2)) : 0,
      ortalamaNet: toplam ? Number((netTop / toplam).toFixed(1)) : 0,
      basariOrani: toplam ? Number(((basarili / toplam) * 100).toFixed(1)) : 0,
    };
  }

  function metinZorlukPuani(metin: string): number {
    const kelimeler = metin.trim().split(/\s+/).filter(Boolean);
    if (!kelimeler.length) return 0;
    const ortUzunluk = kelimeler.reduce((a, w) => a + w.length, 0) / kelimeler.length;
    const zorHarf = (metin.match(/[ğçşöüjfĞÇŞÖÜJF]/g) ?? []).length / Math.max(metin.length, 1);
    const uzunKelimeOrani = kelimeler.filter((w) => w.length >= 10).length / kelimeler.length;
    return Number((ortUzunluk * 6 + zorHarf * 120 + uzunKelimeOrani * 60).toFixed(1));
  }

  function metinAdiniBul(metinId: string): { grupId: string; idx: number; ad: string; grupAd: string } | null {
    if (!veri) return null;
    const [gid, numStr] = metinId.split(':');
    const idx = Math.max(0, (Number(numStr) || 1) - 1);
    const grup = veri.gruplar.find((g) => g.id === gid);
    const oge = grup?.ogeler[idx];
    if (!grup || !oge) return null;
    const ham = veri.metinler[oge.t] ?? '';
    return { grupId: gid, idx, ad: metinEtiketi(oge, idx, ham), grupAd: grup.baslik };
  }

  let uzakZorMetinler: MetinIstatistikOzeti[] = [];

  async function metinSayaciniGuncelle() {
    if (!elMetinSayac) return;
    const mid = aktifMetinKimligi();
    if (!mid) {
      elMetinSayac.textContent = 'Özel metin çalışması (yalnız bu cihazda)';
      return;
    }
    const yerel = yerelOzetHesapla(mid);
    const yaz = (o: MetinIstatistikOzeti) => {
      elMetinSayac.textContent = `Bu metin · Bugün: ${o.bugun} · Hafta: ${o.buHafta} · Ay: ${o.buAy} · Yıl: ${o.buYil} · Toplam: ${o.toplam}`;
    };
    yaz(yerel);
    try {
      const r = await fetch(`${KLAVYE_API}?metinId=${encodeURIComponent(mid)}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const data = await r.json();
        if (data?.secili && data.secili.toplam >= yerel.toplam) {
          yaz(data.secili);
        }
        if (Array.isArray(data?.enZorMetinler)) {
          uzakZorMetinler = data.enZorMetinler;
          enZorMetinleriCiz();
        }
        void platformSayacYenile();
      }
    } catch {
      /* yerel istatistik gösterilmeye devam eder */
    }
  }

  async function metinIstatistikKaydet(sonuc: DegerlendirmeSonucu) {
    const mid = aktifMetinKimligi();
    if (!mid) return;
    const kayitlar = yerelIstatistikOku();
    kayitlar.push({
      gun: istanbulBugun(),
      metinId: mid,
      hataOrani: sonuc.hataOrani,
      net: sonuc.netKelime,
      basarili: sonuc.basarili,
    });
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(kayitlar.slice(-500)));
    } catch {
      /* depolama doluysa geç */
    }
    void metinSayaciniGuncelle();
    enZorMetinleriCiz();
    try {
      const istekId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const r = await fetch(KLAVYE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          istekId,
          metinId: mid,
          hataOrani: sonuc.hataOrani,
          net: sonuc.netKelime,
          basarili: sonuc.basarili,
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data?.enZorMetinler)) {
          uzakZorMetinler = data.enZorMetinler;
          enZorMetinleriCiz();
        }
        void platformSayacYenile();
      }
    } catch {
      /* çevrimdışıysa yerel veri yeterlidir */
    }
  }

  function enZorMetinleriCiz() {
    if (!elZorListe || !veri) return;
    // Uzak API verisi + yerel veriyi birleştir
    const yerelIds = [...new Set(yerelIstatistikOku().map((k) => k.metinId))];
    const birlesik = new Map<string, MetinIstatistikOzeti>();
    for (const u of uzakZorMetinler) birlesik.set(u.metinId, u);
    for (const mid of yerelIds) {
      const y = yerelOzetHesapla(mid);
      const mevcut = birlesik.get(mid);
      if (!mevcut || y.toplam > mevcut.toplam) birlesik.set(mid, y);
    }

    let satirlar: {
      metinId: string;
      grupAd: string;
      ad: string;
      bugun: number;
      buHafta: number;
      buAy: number;
      buYil: number;
      toplam: number;
      zorlukEtiket: string;
    }[] = [];

    const gercekVeri = [...birlesik.values()]
      .filter((x) => x.toplam > 0)
      .sort((a, b) => b.ortalamaHataOrani - a.ortalamaHataOrani || a.basariOrani - b.basariOrani);

    if (gercekVeri.length > 0) {
      for (const s of gercekVeri.slice(0, 10)) {
        const info = metinAdiniBul(s.metinId);
        if (!info) continue;
        satirlar.push({
          metinId: s.metinId,
          grupAd: info.grupAd,
          ad: info.ad,
          bugun: s.bugun,
          buHafta: s.buHafta,
          buAy: s.buAy,
          buYil: s.buYil,
          toplam: s.toplam,
          zorlukEtiket: `%${s.ortalamaHataOrani} ort. hata · ${s.ortalamaNet} net`,
        });
      }
    } else {
      // Henüz yazım verisi yoksa dilsel zorluk puanına göre (uzun kelime + zor Türkçe harfler) en zor 10 resmî metin
      const adaylar: { metinId: string; grupAd: string; ad: string; puan: number }[] = [];
      for (const g of veri.gruplar) {
        if (g.id === 'daktilografi') continue;
        g.ogeler.forEach((o, i) => {
          const txt = veri!.metinler[o.t] ?? '';
          adaylar.push({
            metinId: `${g.id}:${i + 1}`,
            grupAd: g.baslik,
            ad: o.ad,
            puan: metinZorlukPuani(txt),
          });
        });
      }
      const gorulenMetin = new Set<string>();
      adaylar.sort((a, b) => b.puan - a.puan);
      for (const a of adaylar) {
        const key = a.ad + a.puan;
        if (gorulenMetin.has(key)) continue;
        gorulenMetin.add(key);
        satirlar.push({
          metinId: a.metinId,
          grupAd: a.grupAd,
          ad: a.ad,
          bugun: 0,
          buHafta: 0,
          buAy: 0,
          buYil: 0,
          toplam: 0,
          zorlukEtiket: `Zorluk endeksi: ${a.puan}`,
        });
        if (satirlar.length >= 10) break;
      }
    }

    elZorListe.innerHTML = `
      <div class="op-tablo-kap">
        <table class="grid op-tablo">
          <thead><tr><th>Metin</th><th>Zorluk / Hata Oranı</th><th>Bugün</th><th>Hafta</th><th>Ay</th><th>Yıl</th><th></th></tr></thead>
          <tbody>
            ${satirlar
              .map(
                (r) => `<tr>
              <td><strong>${r.ad}</strong><br/><small style="color:var(--color-muted)">${r.grupAd}</small></td>
              <td>${r.zorlukEtiket}</td>
              <td class="num">${r.bugun}</td>
              <td class="num">${r.buHafta}</td>
              <td class="num">${r.buAy}</td>
              <td class="num">${r.buYil}</td>
              <td><button type="button" class="btn btn--quiet op-zor-btn" data-op-zor-sec="${r.metinId}">Çalış →</button></td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;

    elZorListe.querySelectorAll<HTMLButtonElement>('[data-op-zor-sec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const info = metinAdiniBul(btn.dataset.opZorSec || '');
        if (!info) return;
        ozelHamMetin = null;
        aktifGrupId = info.grupId;
        aktifMetinIdx = info.idx;
        elGrup.value = aktifGrupId;
        metinListesiniDoldur();
        elMetin.value = String(aktifMetinIdx);
        metniYukle();
        root?.querySelector('[data-op-sahne]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        elGiris.focus();
      });
    });
  }

  function metinListesiniDoldur() {
    if (!veri) return;
    const grup = veri.gruplar.find((g) => g.id === aktifGrupId) ?? veri.gruplar[0];
    if (!grup) return;
    elMetin.innerHTML = '';
    grup.ogeler.forEach((o, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      const ham = veri!.metinler[o.t] ?? '';
      opt.textContent = `${metinEtiketi(o, i, ham)} (${o.k} kelime)`;
      elMetin.append(opt);
    });
    if (aktifMetinIdx >= grup.ogeler.length) aktifMetinIdx = 0;
    elMetin.value = String(aktifMetinIdx);
  }

  function hedefEkraniCiz() {
    const yazilan = elGiris.value;
    const hataGoster = elHataGosterChk.checked;
    const sonBosluk = /\s$/.test(yazilan);
    const tokens = yazilan.trim() ? yazilan.trim().split(/\s+/) : [];
    const aktifIdx = sonBosluk ? tokens.length : Math.max(0, tokens.length - 1);
    const aktifYazilan = sonBosluk ? '' : (tokens[tokens.length - 1] ?? '');

    const frag = document.createDocumentFragment();
    hedefKelimeler.forEach((w, idx) => {
      const span = document.createElement('span');
      span.className = 'op-w';
      if (idx < aktifIdx) {
        const u = tokens[idx] ?? '';
        if (hataGoster) {
          span.classList.add(u === w ? 'op-w--ok' : 'op-w--err');
        } else {
          span.classList.add('op-w--done');
        }
        span.textContent = w;
      } else if (idx === aktifIdx) {
        span.classList.add('op-w--cur');
        if (gorunumModu === 'akis' && hataGoster && aktifYazilan.length > 0) {
          for (let ci = 0; ci < w.length; ci++) {
            const chSpan = document.createElement('span');
            chSpan.textContent = w[ci];
            if (ci < aktifYazilan.length) {
              chSpan.className = aktifYazilan[ci] === w[ci] ? 'op-ch--ok' : 'op-ch--err';
            }
            span.append(chSpan);
          }
        } else {
          span.textContent = w;
        }
      } else {
        span.textContent = w;
      }
      frag.append(span, document.createTextNode(' '));
    });
    elMetinAlani.replaceChildren(frag);

    // Aktif kelimeyi görünür alanda tut
    const cur = elMetinAlani.querySelector<HTMLElement>('.op-w--cur');
    if (cur) {
      const top = cur.offsetTop - elMetinAlani.offsetTop;
      const targetScroll = Math.max(0, top - elMetinAlani.clientHeight * 0.32);
      elMetinAlani.scrollTop = targetScroll;
    }
  }

  function canliMetrikleriGuncelle() {
    const gecenSn = Math.max(1, sureSaniye - kalanSaniye);
    const deger = sinavDegerlendir(hedefMetin, elGiris.value, gecenSn, sureSaniye);
    elCanliDogru.textContent = String(deger.dogruKelime);
    elCanliYanlis.textContent = String(deger.hataliKelime);
    elCanliNet.textContent = String(deger.netKelime);
    barajGuncelle(deger.netKelime);
    elCanliDks.textContent = String(deger.dks);
    elCanliVurus.textContent = String(deger.toplamVurus);
    elCanliDogruluk.textContent = `%${deger.dogrulukYuzdesi}`;
    return deger;
  }

  function zamaniGuncelle() {
    const simdi = performance.now();
    const toplamGecenSn = Math.floor((gecenMs + (simdi - baslangicZamani)) / 1000);
    kalanSaniye = Math.max(0, sureSaniye - toplamGecenSn);
    elSureGoster.textContent = sureBicim(kalanSaniye);
    elSureGoster.classList.toggle('is-urgent', kalanSaniye <= 15 && kalanSaniye > 0);
    const oran = sureSaniye > 0 ? Math.min(100, (toplamGecenSn / sureSaniye) * 100) : 0;
    elIlerleme.style.width = `${oran}%`;

    if (toplamGecenSn >= sonHizKayitSn + 10 || toplamGecenSn === sureSaniye) {
      sonHizKayitSn = toplamGecenSn;
      const d = canliMetrikleriGuncelle();
      hizGecmisi.push({ sn: toplamGecenSn, dks: d.dks });
    }

    if (kalanSaniye <= 0) {
      sinaviBitir();
    }
  }

  function calismayiBaslat() {
    if (durum === 'calisiyor') return;
    if (durum === 'bitti') sifirla(false);
    durum = 'calisiyor';
    baslangicZamani = performance.now();
    elGiris.disabled = false;
    elGiris.focus();
    elBaslat.disabled = true;
    elDuraklat.disabled = false;
    elBitir.disabled = false;
    elDuraklat.textContent = 'Duraklat';
    if (zamanlayici) window.clearInterval(zamanlayici);
    zamanlayici = window.setInterval(zamaniGuncelle, 250);
  }

  function geriSayimlaBaslat() {
    if (durum === 'calisiyor' || durum === 'gerisayim') return;
    if (durum === 'bitti') sifirla(false);
    if (!elGeriSayimChk.checked) {
      calismayiBaslat();
      return;
    }
    durum = 'gerisayim';
    elGiris.disabled = true;
    elBaslat.disabled = true;
    let kalan = 5;
    elGeriSayimRakam.textContent = String(kalan);
    elGeriSayimPerde.hidden = false;
    if (geriSayimId) window.clearInterval(geriSayimId);
    geriSayimId = window.setInterval(() => {
      kalan--;
      if (kalan > 0) {
        elGeriSayimRakam.textContent = String(kalan);
      } else {
        if (geriSayimId) window.clearInterval(geriSayimId);
        geriSayimId = null;
        elGeriSayimPerde.hidden = true;
        calismayiBaslat();
      }
    }, 1000);
  }

  function duraklatVeyaDevam() {
    if (durum === 'calisiyor') {
      gecenMs += performance.now() - baslangicZamani;
      if (zamanlayici) window.clearInterval(zamanlayici);
      zamanlayici = null;
      durum = 'duraklatildi';
      elGiris.disabled = true;
      elDuraklat.textContent = 'Devam et';
    } else if (durum === 'duraklatildi') {
      calismayiBaslat();
    }
  }

  function sifirla(odakla = true) {
    if (zamanlayici) window.clearInterval(zamanlayici);
    if (geriSayimId) window.clearInterval(geriSayimId);
    zamanlayici = null;
    geriSayimId = null;
    elGeriSayimPerde.hidden = true;
    durum = 'hazir';
    kalanSaniye = sureSaniye;
    gecenMs = 0;
    hizGecmisi = [];
    sonHizKayitSn = 0;
    sonSonuc = null;
    elGiris.value = '';
    elGiris.disabled = false;
    elSureGoster.textContent = sureBicim(sureSaniye);
    elSureGoster.classList.remove('is-urgent');
    elIlerleme.style.width = '0%';
    elCanliDogru.textContent = '0';
    elCanliYanlis.textContent = '0';
    elCanliNet.textContent = '0';
    barajGuncelle(0);
    elCanliDks.textContent = '0';
    elCanliVurus.textContent = '0';
    elCanliDogruluk.textContent = '%100';
    elBaslat.disabled = false;
    elDuraklat.disabled = true;
    elBitir.disabled = true;
    elDuraklat.textContent = 'Duraklat';
    elSonuc.hidden = true;
    hedefEkraniCiz();
    siradakiTusuVurgula();
    if (odakla) elGiris.focus();
  }

  function svgHizGrafigi(noktalar: { sn: number; dks: number }[]): string {
    if (noktalar.length < 2) return '';
    const w = 560;
    const h = 140;
    const pad = 26;
    const maxSn = Math.max(...noktalar.map((n) => n.sn), 1);
    const maxDks = Math.max(...noktalar.map((n) => n.dks), 40);
    const coords = noktalar.map((n) => {
      const x = pad + (n.sn / maxSn) * (w - pad * 2);
      const y = h - pad - (n.dks / maxDks) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `<svg class="op-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Yazım hızı grafiği">
      <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="var(--color-rule)" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="var(--color-rule)" />
      <polyline fill="none" stroke="var(--color-accent)" stroke-width="2.5" points="${coords.join(' ')}" />
      ${noktalar
        .map((n) => {
          const x = pad + (n.sn / maxSn) * (w - pad * 2);
          const y = h - pad - (n.dks / maxDks) * (h - pad * 2);
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--color-accent)"><title>${n.sn}. sn: ${n.dks} DKS</title></circle>`;
        })
        .join('')}
      <text x="${pad}" y="16" font-size="11" fill="var(--color-muted)">En yüksek: ${maxDks} DKS</text>
      <text x="${w - pad}" y="${h - 6}" text-anchor="end" font-size="11" fill="var(--color-muted)">${maxSn} sn</text>
    </svg>`;
  }

  function gecmisOku(): GecmisKaydi[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function gecmisKaydet(sonuc: DegerlendirmeSonucu) {
    const mevcut = gecmisOku();
    const grupAd =
      ozelHamMetin !== null
        ? 'Özel Metin'
        : veri?.gruplar.find((g) => g.id === aktifGrupId)?.baslik ?? aktifGrupId;
    const metinAd =
      ozelHamMetin !== null
        ? ozelBaslik
        : veri?.gruplar.find((g) => g.id === aktifGrupId)?.ogeler[aktifMetinIdx]?.ad ?? 'Metin';
    const kayit: GecmisKaydi = {
      tarih: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
      grup: grupAd,
      metin: metinAd,
      sure: sureSaniye,
      net: sonuc.netKelime,
      dogru: sonuc.dogruKelime,
      hatali: sonuc.hataliKelime,
      atlanan: sonuc.atlananKelime,
      dks: sonuc.dks,
      dogruluk: sonuc.dogrulukYuzdesi,
      basarili: sonuc.basarili,
    };
    const yeni = [kayit, ...mevcut].slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(yeni));
    } catch {
      /* depolama doluysa geç */
    }
    gecmisiCiz();
  }

  function gecmisiCiz() {
    const liste = gecmisOku();
    if (!liste.length) {
      elGecmisListe.innerHTML =
        '<p class="op-gecmis__bos">Henüz tamamlanmış bir çalışma yok. İlk sınavınızı tamamladığınızda sonuçlarınız burada (yalnız tarayıcınızda) saklanır.</p>';
      elGecmisTemizle.hidden = true;
      if (elGecmisIndir) elGecmisIndir.hidden = true;
      return;
    }
    elGecmisTemizle.hidden = false;
    if (elGecmisIndir) elGecmisIndir.hidden = false;
    const enIyiNet = Math.max(...liste.map((k) => k.net));
    const enIyiDks = Math.max(...liste.map((k) => k.dks));
    const basariSayisi = liste.filter((k) => k.basarili).length;

    elGecmisListe.innerHTML = `
      <div class="op-gecmis__ozet">
        <span>Toplam çalışma: <strong>${liste.length}</strong></span>
        <span>Başarılı: <strong>${basariSayisi}</strong></span>
        <span>En yüksek net: <strong>${enIyiNet}</strong></span>
        <span>En yüksek hız: <strong>${enIyiDks} DKS</strong></span>
      </div>
      <div class="op-tablo-kap">
        <table class="grid op-tablo">
          <thead><tr><th>Tarih</th><th>Metin</th><th>Süre</th><th>Net</th><th>Hata</th><th>DKS</th><th>Doğruluk</th><th>Durum</th></tr></thead>
          <tbody>
            ${liste
              .map(
                (k) => `<tr>
              <td>${k.tarih}</td>
              <td>${k.metin}</td>
              <td class="num">${sureBicim(k.sure)}</td>
              <td class="num"><strong>${k.net}</strong></td>
              <td class="num">${k.hatali}</td>
              <td class="num">${k.dks}</td>
              <td class="num">%${k.dogruluk}</td>
              <td><span class="op-rozet ${k.basarili ? 'op-rozet--ok' : 'op-rozet--err'}">${k.basarili ? 'Başarılı' : 'Baraj altı'}</span></td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  function sinaviBitir() {
    if (durum === 'bitti') return;
    if (zamanlayici) window.clearInterval(zamanlayici);
    if (geriSayimId) window.clearInterval(geriSayimId);
    zamanlayici = null;
    geriSayimId = null;

    if (durum === 'calisiyor') {
      gecenMs += performance.now() - baslangicZamani;
    }
    durum = 'bitti';
    elGiris.disabled = true;
    elBaslat.disabled = false;
    elDuraklat.disabled = true;
    elBitir.disabled = true;

    const gecenSn = Math.max(1, Math.min(sureSaniye, Math.round(gecenMs / 1000) || sureSaniye));
    const sonuc = sinavDegerlendir(hedefMetin, elGiris.value, gecenSn, sureSaniye);
    sonSonuc = sonuc;
    hizGecmisi.push({ sn: gecenSn, dks: sonuc.dks });

    canliMetrikleriGuncelle();
    gecmisKaydet(sonuc);
    void metinIstatistikKaydet(sonuc);
    sonucTutanaginiGoster(sonuc, gecenSn);
  }

  function sonucTutanaginiGoster(s: DegerlendirmeSonucu, gecenSn: number) {
    const hd = s.hataDagilimi;
    const hataliHedefKelimeler = [
      ...new Set(
        s.detay
          .filter((d) => d.durum !== 'dogru' && d.durum !== 'atlanan' && d.hedef.length >= 3)
          .map((d) => d.hedef.toLocaleLowerCase('tr-TR'))
      ),
    ];

    const zayifHtml =
      s.zayifTuslar.length || hataliHedefKelimeler.length
        ? `<div class="op-zayif">
          ${
            s.zayifTuslar.length
              ? `<h4>En Çok Hata Yapılan Tuşlar</h4>
                 <div class="op-zayif__liste">${s.zayifTuslar
                   .map(
                     (z) =>
                       `<span class="op-zayif__chip"><strong>${z.tus.toLocaleUpperCase('tr-TR')}</strong> (${z.hata} hata)</span>`
                   )
                   .join('')}</div>`
              : ''
          }
          <div class="op-zayif__eylem" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
            ${
              hataliHedefKelimeler.length
                ? `<button type="button" class="btn btn--kucuk" data-op-benzer-calis>Hatalı kelimelere benzer kelimelerle çalış →</button>`
                : ''
            }
            ${
              s.zayifTuslar.length
                ? `<button type="button" class="btn btn--quiet btn--kucuk" data-op-zayif-calis>Zayıf tuşlarla çalış →</button>`
                : ''
            }
          </div>
        </div>`
        : '';

    const detayHtml = s.detay
      .map((d) => {
        if (d.durum === 'dogru') {
          return `<span class="op-d op-d--ok">${d.yazilan}</span>`;
        }
        if (d.durum === 'atlanan') {
          return `<span class="op-d op-d--skip" title="Atlanan kelime">${d.hedef}</span>`;
        }
        const label = HATA_ETIKETLERI[d.durum] || 'Hata';
        return `<span class="op-d op-d--err" title="${label} · Doğrusu: ${d.hedef}">${d.yazilan || '∅'}<small> (${d.hedef})</small></span>`;
      })
      .join(' ');

    elSonuc.innerHTML = `
      <div class="panel__head">
        <h2>Uygulama Sonuç Tutanağı</h2>
        <div class="op-sonuc__eylem">
          <button type="button" class="btn btn--quiet btn--kucuk" data-op-yazdir>Tutanağı yazdır</button>
          <button type="button" class="btn btn--kucuk" data-op-tekrar>Aynı metinle tekrar dene</button>
        </div>
      </div>
      <div class="op-sonuc__govde">
        <div class="op-durum-bant ${s.basarili ? 'op-durum-bant--ok' : 'op-durum-bant--err'}">
          <strong>${s.basarili ? 'BAŞARILI · Resmî baraj ve anlam bütünlüğü sağlandı' : 'BAŞARISIZ · Resmî kriterler sağlanamadı'}</strong>
          ${s.basarisizlikNedeni.length ? `<ul>${s.basarisizlikNedeni.map((n) => `<li>${n}</li>`).join('')}</ul>` : ''}
        </div>

        <div class="op-sonuc-kartlar">
          <div class="op-sk op-sk--ana"><span>Net Kelime</span><strong class="num">${s.netKelime}</strong><small>3 dk eşdeğeri: ${s.ucDakikaEsdegeri}</small></div>
          <div class="op-sk"><span>Doğru Kelime</span><strong class="num">${s.dogruKelime}</strong><small>Toplam yazılan: ${s.toplamYazilan}</small></div>
          <div class="op-sk"><span>Hatalı Kelime</span><strong class="num">${s.hataliKelime}</strong><small>Hata oranı: %${s.hataOrani} (Sınır: %25)</small></div>
          <div class="op-sk"><span>Atlanan Kelime</span><strong class="num">${s.atlananKelime}</strong><small>Sınır: 22 kelime</small></div>
          <div class="op-sk"><span>Hız (DKS)</span><strong class="num">${s.dks}</strong><small>Süre: ${sureBicim(gecenSn)}</small></div>
          <div class="op-sk"><span>Vuruş (Bilgi)</span><strong class="num">${s.toplamVurus}</strong><small>Doğruluk: %${s.dogrulukYuzdesi}</small></div>
        </div>

        <div class="op-sonuc-iki">
          <div>
            <h3>Resmî Hata Türleri Dağılımı</h3>
            <table class="grid op-tablo">
              <tbody>
                <tr><th>Fazla Vuruş Hatası</th><td class="num">${hd.fazlaVurus}</td></tr>
                <tr><th>Eksik Vuruş Hatası</th><td class="num">${hd.eksikVurus}</td></tr>
                <tr><th>Harf Yer Değiştirme Hatası</th><td class="num">${hd.harfYerDegistirme}</td></tr>
                <tr><th>Karakter Hatası</th><td class="num">${hd.karakter}</td></tr>
                <tr><th>Kelime Bölme Hatası</th><td class="num">${hd.kelimeBolme}</td></tr>
                <tr><th>Kelime Birleştirme Hatası</th><td class="num">${hd.kelimeBirlestirme}</td></tr>
                <tr><th>Fazla Boşluk Hatası</th><td class="num">${hd.fazlaBosluk}</td></tr>
                <tr><th>Karışık Hata</th><td class="num">${hd.karisik}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Yazım Hızı Seyri ve Zayıf Tuşlar</h3>
            ${svgHizGrafigi(hizGecmisi) || '<p class="op-kisa-not">Hız grafiği için en az 10 saniye çalışma gerekir.</p>'}
            ${zayifHtml}
          </div>
        </div>

        <div class="op-karsilastirma">
          <h3>Kelime Bazlı Karşılaştırma</h3>
          <p class="op-karsilastirma__aciklama"><span class="op-d op-d--ok">Doğru</span> · <span class="op-d op-d--err">Hatalı (Doğrusu)</span> · <span class="op-d op-d--skip">Atlanan</span></p>
          <div class="op-karsilastirma__metin">${detayHtml || 'Henüz kelime yazılmadı.'}</div>
        </div>
      </div>`;

    elSonuc.hidden = false;
    elSonuc.scrollIntoView({ behavior: 'smooth', block: 'start' });

    elSonuc.querySelector('[data-op-tekrar]')?.addEventListener('click', () => sifirla(true));
    elSonuc.querySelector('[data-op-yazdir]')?.addEventListener('click', () => window.print());
    elSonuc.querySelector('[data-op-benzer-calis]')?.addEventListener('click', () => {
      if (!hataliHedefKelimeler.length) return;
      const kokler = hataliHedefKelimeler.map((w) => w.slice(0, Math.min(4, w.length)));
      const havuz = (veri?.metinler.slice(0, 30).join(' ') ?? hedefMetin)
        .toLocaleLowerCase('tr-TR')
        .split(/[^a-zçğıöşü]+/)
        .filter((w) => w.length >= 4);
      const benzer = [
        ...new Set([
          ...hataliHedefKelimeler,
          ...havuz.filter((w) => kokler.some((k) => w.startsWith(k) || w.includes(k))),
        ]),
      ];
      const secilen: string[] = [];
      for (let i = 0; i < 120 && benzer.length > 0; i++) {
        secilen.push(benzer[(i * 3) % benzer.length]);
      }
      ozelHamMetin = secilen.join(' ');
      ozelBaslik = `Benzer Kelime Egzersizi (${hataliHedefKelimeler.slice(0, 4).join(', ')}...)`;
      metniYukle();
      elGiris.focus();
    });
    elSonuc.querySelector('[data-op-zayif-calis]')?.addEventListener('click', () => {
      if (!sonSonuc || !sonSonuc.zayifTuslar.length) return;
      const harfler = sonSonuc.zayifTuslar.map((z) => z.tus);
      // Tüm metin havuzundan bu harfleri yoğun içeren kelimeleri derle
      const havuzKelimeler = (veri?.metinler.slice(0, 15).join(' ') ?? hedefMetin)
        .toLocaleLowerCase('tr-TR')
        .split(/[^a-zçğıöşü]+/)
        .filter((w) => w.length >= 4 && harfler.some((h) => w.includes(h)));
      const benzersiz = [...new Set(havuzKelimeler)];
      const secilen: string[] = [];
      for (let i = 0; i < 120 && benzersiz.length > 0; i++) {
        secilen.push(benzersiz[(i * 7) % benzersiz.length]);
      }
      ozelHamMetin = secilen.join(' ');
      ozelBaslik = `Zayıf Tuş Egzersizi (${harfler.map((h) => h.toLocaleUpperCase('tr-TR')).join(', ')})`;
      metniYukle();
      elGiris.focus();
    });
  }

  // Event bindings
  elGrup.addEventListener('change', () => {
    ozelHamMetin = null;
    aktifGrupId = elGrup.value;
    aktifMetinIdx = 0;
    metinListesiniDoldur();
    metniYukle();
  });

  elMetin.addEventListener('change', () => {
    ozelHamMetin = null;
    aktifMetinIdx = Number(elMetin.value) || 0;
    metniYukle();
  });

  elRastgele.addEventListener('click', () => {
    if (!veri) return;
    ozelHamMetin = null;
    const grup = veri.gruplar.find((g) => g.id === aktifGrupId) ?? veri.gruplar[0];
    if (!grup || !grup.ogeler.length) return;
    aktifMetinIdx = Math.floor(Math.random() * grup.ogeler.length);
    elMetin.value = String(aktifMetinIdx);
    metniYukle();
  });

  elOzelBtn.addEventListener('click', () => {
    elOzelKutu.hidden = !elOzelKutu.hidden;
    if (!elOzelKutu.hidden) elOzelAlan.focus();
  });

  elOzelUygula.addEventListener('click', () => {
    const val = elOzelAlan.value.trim();
    if (val.split(/\s+/).length < 5) return;
    ozelHamMetin = val;
    ozelBaslik = 'Kişisel Özel Metin';
    elOzelKutu.hidden = true;
    metniYukle();
  });

  elSureBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      elSureBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      sureSaniye = Number(btn.dataset.opSure) || 180;
      sifirla(false);
    })
  );

  elModBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      elModBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      yazimModu = (btn.dataset.opMod as YazimModu) || 'imlasiz';
      metniYukle();
    })
  );

  elGorunumBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      elGorunumBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      gorunumModu = (btn.dataset.opGorunum as GorunumModu) || 'klasik';
      root.dataset.gorunum = gorunumModu;
      hedefEkraniCiz();
    })
  );

  elKlavyeBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      elKlavyeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      klavyeDuzeni = (btn.dataset.opKlavyeDuzen as KlavyeDuzeni) || 'f';
      klavyeCiz();
    })
  );

  elBoyutBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      elBoyutBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      root.dataset.boyut = btn.dataset.opBoyut || 'orta';
    })
  );

  elHataGosterChk.addEventListener('change', () => hedefEkraniCiz());
  elSanalKlavyeChk.addEventListener('change', () => {
    elSanalKlavye.hidden = !elSanalKlavyeChk.checked;
    elParmakIpucu.hidden = !elSanalKlavyeChk.checked;
    if (!elSanalKlavye.hidden) siradakiTusuVurgula();
  });

  function tamEkranAktifMi(): boolean {
    return document.fullscreenElement === elSahne || fallbackTamEkran;
  }

  function tamEkranArayuzGuncelle() {
    const aktif = tamEkranAktifMi();
    elSahne.classList.toggle('is-tamekran', fallbackTamEkran);
    elTamEkranBtn.setAttribute('aria-pressed', String(aktif));
    elTamEkranBtn.textContent = aktif ? 'Tam ekrandan çık' : 'Tam ekran';
    if (elTamEkranCikBtn) elTamEkranCikBtn.hidden = !aktif;
  }

  async function tamEkranaGir() {
    if (elSahne.requestFullscreen) {
      try {
        await elSahne.requestFullscreen();
        tamEkranArayuzGuncelle();
        elGiris.focus();
        return;
      } catch {
        /* tarayıcı engellediyse CSS tam ekran moduna geç */
      }
    }
    fallbackTamEkran = true;
    tamEkranArayuzGuncelle();
    elGiris.focus();
  }

  async function tamEkrandanCik() {
    fallbackTamEkran = false;
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* geç */
      }
    }
    tamEkranArayuzGuncelle();
  }

  elSesChk?.addEventListener('change', () => sesDurumunuUygula(elSesChk.checked));
  elSesBtn?.addEventListener('click', () => {
    sesDurumunuUygula(!sesAcik);
    if (sesAcik) klavyeSesiCal('normal');
  });

  elTamEkranBtn.addEventListener('click', () => {
    if (tamEkranAktifMi()) void tamEkrandanCik();
    else void tamEkranaGir();
  });

  elTamEkranCikBtn?.addEventListener('click', () => void tamEkrandanCik());
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) fallbackTamEkran = false;
    tamEkranArayuzGuncelle();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tamEkranAktifMi()) {
      void tamEkrandanCik();
    }
  });

  elBaslat.addEventListener('click', () => geriSayimlaBaslat());
  elDuraklat.addEventListener('click', () => duraklatVeyaDevam());
  elBitir.addEventListener('click', () => sinaviBitir());
  elSifirla.addEventListener('click', () => sifirla(true));
  elGecmisTemizle.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    gecmisiCiz();
  });
  elGecmisIndir?.addEventListener('click', () => {
    const liste = gecmisOku();
    if (!liste.length) return;
    const baslik = 'Tarih;Grup;Metin;Sure(sn);Net;Dogru;Hatali;Atlanan;DKS;Dogruluk(%);Durum';
    const satirlar = liste.map(
      (k) =>
        `${k.tarih};"${k.grup}";"${k.metin}";${k.sure};${k.net};${k.dogru};${k.hatali};${k.atlanan};${k.dks};${k.dogruluk};${k.basarili ? 'Basarili' : 'Baraj Alti'}`
    );
    const blob = new Blob(['\uFEFF' + [baslik, ...satirlar].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `657-on-parmak-sonuclari-${istanbulBugun()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Gerçek sınav kuralı: kopyala-yapıştır engeli
  elGiris.addEventListener('paste', (e) => e.preventDefault());

  elGiris.addEventListener('input', () => {
    if (durum === 'hazir' && elGiris.value.length > 0) {
      calismayiBaslat();
    }
    if (durum === 'calisiyor') {
      hedefEkraniCiz();
      canliMetrikleriGuncelle();
      siradakiTusuVurgula();
      // Hedef metnin tamamı yazıldıysa otomatik bitir
      const yazilanSayisi = elGiris.value.trim().split(/\s+/).filter(Boolean).length;
      if (hedefKelimeler.length > 0 && yazilanSayisi >= hedefKelimeler.length && /\s$/.test(elGiris.value)) {
        sinaviBitir();
      }
    }
  });

  elGiris.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === ' ') klavyeSesiCal('bosluk');
      else if (e.key === 'Backspace') klavyeSesiCal('sil');
      else if (e.key.length === 1) klavyeSesiCal('normal');
    }
    if (!elSanalKlavye.hidden) {
      const k = e.key === ' ' ? ' ' : e.key.toLocaleLowerCase('tr-TR');
      const keyEl = elSanalKlavye.querySelector<HTMLElement>(
        `.op-kb__key[data-key="${CSS.escape(k)}"]`
      );
      if (keyEl) {
        keyEl.classList.add('is-pressed');
        window.setTimeout(() => keyEl.classList.remove('is-pressed'), 130);
      }
    }
  });

  // Başlangıç yüklemesi
  sesDurumunuUygula(sesAcik);
  tamEkranArayuzGuncelle();
  klavyeCiz();
  gecmisiCiz();

  fetch(yerelYol('/veri/klavye-metinleri.json'))
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((paket: VeriPaketi) => {
      veri = paket;
      elGrup.innerHTML = '';
      for (const g of paket.gruplar) {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `${g.baslik} (${g.ogeler.length} metin)`;
        elGrup.append(opt);
      }
      // URL query parametrelerini uygula (?grup=pgm-2026&metin=3)
      const params = new URLSearchParams(window.location.search);
      const qGrup = params.get('grup');
      const qMetin = Number(params.get('metin'));
      if (qGrup && paket.gruplar.some((g) => g.id === qGrup)) {
        aktifGrupId = qGrup;
      } else {
        aktifGrupId = paket.gruplar[0]?.id ?? 'pgm-2026';
      }
      elGrup.value = aktifGrupId;
      aktifMetinIdx = Number.isInteger(qMetin) && qMetin >= 1 ? qMetin - 1 : 0;
      metinListesiniDoldur();
      metniYukle();
      enZorMetinleriCiz();
      elYukleniyor.hidden = true;
    })
    .catch(() => {
      elYukleniyor.textContent = 'Metin arşivi yüklenemedi. Sayfayı yenileyerek tekrar deneyebilirsiniz.';
    });

  // Seçili sınav grubunu çevrimdışı .txt paketi olarak indir
  root.querySelector<HTMLButtonElement>('[data-op-paket-indir]')?.addEventListener('click', () => {
    if (!veri) return;
    const grup = veri.gruplar.find((g) => g.id === aktifGrupId) ?? veri.gruplar[0];
    if (!grup) return;
    const metinler = grup.ogeler.map((o, i) => `--- METİN ${i + 1} (${o.k} kelime) ---\n${veri!.metinler[o.t] ?? ''}`);
    const icerik = [
      `657.com.tr — On Parmak Resmî Sınav Metinleri Paketi`,
      `Grup: ${grup.baslik} (${grup.ogeler.length} metin)`,
      `Kaynak: https://onparmak.657.com.tr/`,
      '='.repeat(70),
      '',
      ...metinler,
    ].join('\n\n');
    const blob = new Blob([icerik], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `657-onparmak-${grup.id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  // Zamanlı Canlı Klavye Sınavı & Sıralama (Leaderboard)
  canliSinavBagla(root.querySelector<HTMLElement>('[data-op-canli-root]'), 'klavye', () => {
    if (sonSonuc) {
      return {
        skor: sonSonuc.netKelime,
        dogru: sonSonuc.dogruKelime,
        yanlis: sonSonuc.hataliKelime,
        sureSn: gecmisOku()[0]?.sure ?? 180,
        detay: `${klavyeDuzeni.toUpperCase()} klavye · %${sonSonuc.dogrulukYuzdesi} doğruluk`,
      };
    }
    const gecmis = gecmisOku();
    const son = gecmis[0];
    if (!son) return null;
    return {
      skor: son.net,
      dogru: son.dogru,
      yanlis: son.hatali,
      sureSn: son.sure,
      detay: `${klavyeDuzeni.toUpperCase()} klavye · %${son.dogruluk}`,
    };
  });

  const odakMap: Record<string, string> = { canli: '#op-canli-sinav', arsiv: '#op-arsiv', kriterler: '#op-kriterler' };
  const odakTarget = odakMap[root.dataset.opOdak || ''];
  if (odakTarget) {
    const el = document.querySelector<HTMLElement>(odakTarget);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}
