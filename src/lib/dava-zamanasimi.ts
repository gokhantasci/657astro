export type CezaKademesiId =
  | '5-yil-alti'
  | '5-20-yil'
  | '20-yil-ustu'
  | 'muebbet'
  | 'agir-muebbet';

export type YasGrubuId = 'yetiskin' | '15-18' | '12-15';

export type KesmeTuru = 'iddianame' | 'savci-ifade' | 'sorgu' | 'tutuklama' | 'mahkumiyet';

export type DurmaTuru = 'hagb' | 'kacaklik' | 'izin' | 'karar' | 'bekletici';

export type EtkisizTuru =
  | 'seri-muhakeme'
  | 'kolluk-ifade'
  | 'yakalama'
  | 'yeni-esas'
  | 'hatali-kesinlesme'
  | 'infaz-durma'
  | 'diger';

export interface KesmeOlayi {
  id?: string;
  tur: KesmeTuru;
  tarih: string; // YYYY-MM-DD
  aciklama?: string;
  ihtiyatliHaric?: boolean;
}

export interface DurmaDonemi {
  id?: string;
  tur: DurmaTuru;
  baslangic: string; // YYYY-MM-DD
  bitis: string; // YYYY-MM-DD
  aciklama?: string;
}

export interface EtkisizOlay {
  id?: string;
  tur: EtkisizTuru;
  tarih: string; // YYYY-MM-DD
  bitis?: string; // YYYY-MM-DD (seri muhakeme aralığı gibi)
  aciklama?: string;
}

export interface ZamanasimiGirdi {
  sucTarihi: string; // YYYY-MM-DD
  incelemeTarihi: string; // YYYY-MM-DD
  cezaKademesi: CezaKademesiId;
  yasGrubu: YasGrubuId;
  kesmeler: KesmeOlayi[];
  durmalar: DurmaDonemi[];
  etkisizler?: EtkisizOlay[];
}

export interface CezaKademesi {
  id: CezaKademesiId;
  ad: string;
  dayanak: string;
  olaganYil: number;
  uzamisYil: number;
}

export const CEZA_KADEMELERI: CezaKademesi[] = [
  {
    id: '5-yil-alti',
    ad: '5 yıla kadar hapis veya adlî para cezası',
    dayanak: 'TCK m. 66/1-e',
    olaganYil: 8,
    uzamisYil: 12,
  },
  {
    id: '5-20-yil',
    ad: '5 yıldan fazla, 20 yıldan az hapis',
    dayanak: 'TCK m. 66/1-d',
    olaganYil: 15,
    uzamisYil: 22.5,
  },
  {
    id: '20-yil-ustu',
    ad: '20 yıldan aşağı olmamak üzere hapis',
    dayanak: 'TCK m. 66/1-c',
    olaganYil: 20,
    uzamisYil: 30,
  },
  {
    id: 'muebbet',
    ad: 'Müebbet hapis',
    dayanak: 'TCK m. 66/1-b',
    olaganYil: 25,
    uzamisYil: 37.5,
  },
  {
    id: 'agir-muebbet',
    ad: 'Ağırlaştırılmış müebbet hapis',
    dayanak: 'TCK m. 66/1-a',
    olaganYil: 30,
    uzamisYil: 45,
  },
];

export const YAS_GRUPLARI: { id: YasGrubuId; ad: string; dayanak: string; carpan: number }[] = [
  { id: 'yetiskin', ad: '18 yaş ve üzeri (Yetişkin)', dayanak: 'TCK m. 66/1', carpan: 1 },
  { id: '15-18', ad: '15–18 yaş (15’i doldurmuş, 18’i doldurmamış — 2/3)', dayanak: 'TCK m. 66/2', carpan: 2 / 3 },
  { id: '12-15', ad: '12–15 yaş (12’yi doldurmuş, 15’i doldurmamış — 1/2)', dayanak: 'TCK m. 66/2', carpan: 0.5 },
];

export const KESME_ETIKETLERI: Record<KesmeTuru, { ad: string; dayanak: string }> = {
  iddianame: { ad: 'İddianame düzenlenmesi', dayanak: 'TCK m. 67/2-c' },
  'savci-ifade': { ad: 'Savcı huzurunda ifade alınması', dayanak: 'TCK m. 67/2-a' },
  sorgu: { ad: 'Hâkim / mahkeme huzurunda sorgu', dayanak: 'TCK m. 67/2-a' },
  tutuklama: { ad: 'Tutuklama kararı verilmesi', dayanak: 'TCK m. 67/2-b' },
  mahkumiyet: { ad: 'Mahkûmiyet kararı verilmesi', dayanak: 'TCK m. 67/2-d' },
};

export const DURMA_ETIKETLERI: Record<DurmaTuru, { ad: string; dayanak: string }> = {
  hagb: { ad: 'HAGB denetim süresi (kesinleşme → yeni kasıtlı suç)', dayanak: 'CMK m. 231/8' },
  kacaklik: { ad: 'Kaçaklık kararı', dayanak: 'TCK m. 67/1 · CMK m. 247' },
  izin: { ad: 'Soruşturma / kovuşturma izni beklenilmesi', dayanak: 'TCK m. 67/1' },
  karar: { ad: 'Başka merciden karar alınması', dayanak: 'TCK m. 67/1' },
  bekletici: { ad: 'Başka mercide bekletici mesele', dayanak: 'TCK m. 67/1' },
};

export const ETKISIZ_ETIKETLERI: Record<EtkisizTuru, { ad: string; dayanak: string }> = {
  'seri-muhakeme': { ad: 'Seri muhakeme durma süreci (mahsup edilmez)', dayanak: 'Yargıtay 12. CD · 0 gün' },
  'kolluk-ifade': { ad: 'Kollukta ifade alınması (kesmez)', dayanak: 'TCK m. 67/2-a (hariç)' },
  yakalama: { ad: 'Yakalama emri (durdurmaz / kesmez)', dayanak: 'TCK m. 67/1 (hariç)' },
  'yeni-esas': { ad: 'İhbar / yeni esasa kayıt (kesmez)', dayanak: 'Bilgi amaçlı' },
  'hatali-kesinlesme': { ad: 'Hatalı / geçersiz kesinleşme şerhi', dayanak: 'Dikkate alınmaz' },
  'infaz-durma': { ad: 'İnfazın durdurulması kararı', dayanak: 'Bilgi amaçlı' },
  diger: { ad: 'Diğer bilgi amaçlı işlem', dayanak: '0 gün etki' },
};

const GUN_MS = 86_400_000;

export function parseIsoUtc(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return NaN;
  return t;
}

export function formatIsoUtc(ms: number): string {
  const dt = new Date(ms);
  const y = String(dt.getUTCFullYear()).padStart(4, '0');
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTrTarih(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

export function diffDays(startIso: string, endIso: string): number {
  const a = parseIsoUtc(startIso);
  const b = parseIsoUtc(endIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / GUN_MS);
}

export function addDaysIso(iso: string, days: number): string {
  const t = parseIsoUtc(iso);
  if (!Number.isFinite(t)) return iso;
  return formatIsoUtc(t + days * GUN_MS);
}

export function addMonthsIso(iso: string, months: number): string {
  const t = parseIsoUtc(iso);
  if (!Number.isFinite(t)) return iso;
  const dt = new Date(t);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + months;
  const d = dt.getUTCDate();
  const targetYear = y + Math.floor(m / 12);
  const targetMonth = ((m % 12) + 12) % 12;
  const maxDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return formatIsoUtc(Date.UTC(targetYear, targetMonth, Math.min(d, maxDay)));
}

export function diffYmd(startIso: string, endIso: string): { yil: number; ay: number; gun: number } {
  const a = parseIsoUtc(startIso);
  const b = parseIsoUtc(endIso);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return { yil: 0, ay: 0, gun: 0 };
  const s = new Date(a);
  const e = new Date(b);
  let yil = e.getUTCFullYear() - s.getUTCFullYear();
  let ay = e.getUTCMonth() - s.getUTCMonth();
  let gun = e.getUTCDate() - s.getUTCDate();
  if (gun < 0) {
    const prevMonthLastDay = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 0)).getUTCDate();
    gun += prevMonthLastDay;
    ay -= 1;
  }
  if (ay < 0) {
    ay += 12;
    yil -= 1;
  }
  return { yil, ay, gun };
}

export function ayMetni(aySayisi: number): string {
  const yil = Math.floor(aySayisi / 12);
  const ay = aySayisi % 12;
  if (yil > 0 && ay > 0) return `${yil} yıl ${ay} ay`;
  if (yil > 0) return `${yil} yıl`;
  return `${ay} ay`;
}

export function ymdMetni(ymd: { yil: number; ay: number; gun: number }): string {
  const parcalar: string[] = [];
  if (ymd.yil > 0) parcalar.push(`${ymd.yil} yıl`);
  if (ymd.ay > 0) parcalar.push(`${ymd.ay} ay`);
  if (ymd.gun > 0 || parcalar.length === 0) parcalar.push(`${ymd.gun} gün`);
  return parcalar.join(' ');
}

interface Aralik {
  bas: number;
  bit: number;
}

function birlestirAraliklar(durmalar: DurmaDonemi[]): Aralik[] {
  const gecerli: Aralik[] = durmalar
    .map((d) => ({ bas: parseIsoUtc(d.baslangic), bit: parseIsoUtc(d.bitis) }))
    .filter((a) => Number.isFinite(a.bas) && Number.isFinite(a.bit) && a.bit > a.bas)
    .sort((a, b) => a.bas - b.bas || a.bit - b.bit);

  const sonuc: Aralik[] = [];
  for (const aralik of gecerli) {
    const son = sonuc.at(-1);
    if (!son || aralik.bas > son.bit) {
      sonuc.push({ ...aralik });
    } else if (aralik.bit > son.bit) {
      son.bit = aralik.bit;
    }
  }
  return sonuc;
}

function durmaGunuAralikta(araliklar: Aralik[], basIso: string, bitIso: string): number {
  const bas = parseIsoUtc(basIso);
  const bit = parseIsoUtc(bitIso);
  if (!Number.isFinite(bas) || !Number.isFinite(bit) || bit <= bas) return 0;
  let toplam = 0;
  for (const a of araliklar) {
    const s = Math.max(a.bas, bas);
    const e = Math.min(a.bit, bit);
    if (e > s) toplam += Math.round((e - s) / GUN_MS);
  }
  return toplam;
}

function durmaGunuSonrasinda(araliklar: Aralik[], basIso: string): number {
  const bas = parseIsoUtc(basIso);
  if (!Number.isFinite(bas)) return 0;
  let toplam = 0;
  for (const a of araliklar) {
    const s = Math.max(a.bas, bas);
    if (a.bit > s) toplam += Math.round((a.bit - s) / GUN_MS);
  }
  return toplam;
}

export interface ModSonucu {
  mod: 'ihtiyatli' | 'standart';
  baslik: string;
  esasBaslangic: string;
  esasBaslangicEtiket: string;
  olaganAy: number;
  uzamisAy: number;
  olaganDurmaHaric: string;
  olaganDurmaDahil: string;
  olaganToplamGun: number;
  uzamisDurmaHaric: string;
  uzamisDurmaDahil: string;
  etkinSinir: string;
  etkinSinirTuru: 'olagan' | 'uzamis';
  olaganDurmaGun: number;
  uzamisDurmaGun: number;
  incelemeTakvimGun: number;
  incelemeIsleyenGun: number;
  kalanGun: number;
  gerceklesti: boolean;
  gecersizKesmeler: string[];
}

export interface CizelgeSatiri {
  tarih: string;
  islem: string;
  dayanak: string;
  etkiTuru: 'baslangic' | 'kesilme' | 'durma' | 'devam' | 'etkisiz' | 'degerlendirme' | 'gecersiz';
  etkiMetni: string;
  sayacDurumu: string;
  guncelOlaganSinir: string;
}

export interface KarsilastirmaSenaryosu {
  ad: string;
  baslangic: string;
  durmaDahilTarih: string;
  gerceklesti: boolean;
  kalanGun: number;
}

export interface ZamanasimiSonuc {
  kademe: CezaKademesi;
  yasGrubu: (typeof YAS_GRUPLARI)[number];
  olaganAy: number;
  uzamisAy: number;
  toplamDurmaGun: number;
  toplamDurmaYmd: { yil: number; ay: number; gun: number };
  seriMuhakemeGun: number;
  ihtiyatli: ModSonucu;
  standart: ModSonucu;
  cizelge: CizelgeSatiri[];
  senaryolar: KarsilastirmaSenaryosu[];
  uyarilar: string[];
  suctanToplamTakvimGun: number;
  suctanMahsupSonrasiGun: number;
}

function hesaplaMod(
  mod: 'ihtiyatli' | 'standart',
  girdi: ZamanasimiGirdi,
  olaganAy: number,
  uzamisAy: number,
  birlesikDurmalar: Aralik[]
): ModSonucu {
  const kesmeler = [...girdi.kesmeler]
    .filter((k) => Number.isFinite(parseIsoUtc(k.tarih)) && k.tarih >= girdi.sucTarihi && k.tarih <= girdi.incelemeTarihi)
    .filter((k) => (mod === 'ihtiyatli' ? k.tur !== 'mahkumiyet' && !k.ihtiyatliHaric : true))
    .sort((a, b) => a.tarih.localeCompare(b.tarih));

  let activeStart = girdi.sucTarihi;
  let activeLabel = 'Suç tarihi';
  const gecersizKesmeler: string[] = [];

  for (const k of kesmeler) {
    const olaganTaban = addMonthsIso(activeStart, olaganAy);
    const olaganDurma = durmaGunuAralikta(birlesikDurmalar, activeStart, k.tarih);
    const olaganSinir = addDaysIso(olaganTaban, olaganDurma);

    const uzamisTaban = addMonthsIso(girdi.sucTarihi, uzamisAy);
    const uzamisDurma = durmaGunuAralikta(birlesikDurmalar, girdi.sucTarihi, k.tarih);
    const uzamisSinir = addDaysIso(uzamisTaban, uzamisDurma);

    const etkinOAn = olaganSinir <= uzamisSinir ? olaganSinir : uzamisSinir;
    if (k.tarih >= etkinOAn) {
      gecersizKesmeler.push(
        `${formatTrTarih(k.tarih)} (${k.aciklama || KESME_ETIKETLERI[k.tur].ad}): Bu tarihten önce (${formatTrTarih(etkinOAn)}) zamanaşımı dolduğu için süreyi kesmez.`
      );
      continue;
    }
    activeStart = k.tarih;
    activeLabel = k.aciklama?.trim() || KESME_ETIKETLERI[k.tur].ad;
  }

  const olaganDurmaHaric = addMonthsIso(activeStart, olaganAy);
  const olaganToplamGun = diffDays(activeStart, olaganDurmaHaric);
  const olaganDurmaGun = durmaGunuSonrasinda(birlesikDurmalar, activeStart);
  const olaganDurmaDahil = addDaysIso(olaganDurmaHaric, olaganDurmaGun);

  const uzamisDurmaHaric = addMonthsIso(girdi.sucTarihi, uzamisAy);
  const uzamisDurmaGun = durmaGunuSonrasinda(birlesikDurmalar, girdi.sucTarihi);
  const uzamisDurmaDahil = addDaysIso(uzamisDurmaHaric, uzamisDurmaGun);

  const etkinSinirTuru: 'olagan' | 'uzamis' = olaganDurmaDahil <= uzamisDurmaDahil ? 'olagan' : 'uzamis';
  const etkinSinir = etkinSinirTuru === 'olagan' ? olaganDurmaDahil : uzamisDurmaDahil;

  const incelemeTakvimGun = diffDays(activeStart, girdi.incelemeTarihi);
  const incelemeDurmaGun = durmaGunuAralikta(birlesikDurmalar, activeStart, girdi.incelemeTarihi);
  const incelemeIsleyenGun = Math.max(0, incelemeTakvimGun - incelemeDurmaGun);
  const kalanGun = diffDays(girdi.incelemeTarihi, etkinSinir);
  const gerceklesti = girdi.incelemeTarihi >= etkinSinir;

  return {
    mod,
    baslik:
      mod === 'ihtiyatli'
        ? 'İhtiyatlı Hesaplama (Sanık Lehine / Mahkûmiyet Hariç)'
        : 'Standart Hesaplama (Tüm Geçerli Kesilmeler Dahil)',
    esasBaslangic: activeStart,
    esasBaslangicEtiket: activeLabel,
    olaganAy,
    uzamisAy,
    olaganDurmaHaric,
    olaganDurmaDahil,
    olaganToplamGun,
    uzamisDurmaHaric,
    uzamisDurmaDahil,
    etkinSinir,
    etkinSinirTuru,
    olaganDurmaGun,
    uzamisDurmaGun,
    incelemeTakvimGun,
    incelemeIsleyenGun,
    kalanGun,
    gerceklesti,
    gecersizKesmeler,
  };
}

export function hesaplaDavaZamanasimi(girdi: ZamanasimiGirdi): ZamanasimiSonuc {
  const kademe = CEZA_KADEMELERI.find((k) => k.id === girdi.cezaKademesi) ?? CEZA_KADEMELERI[0];
  const yasGrubu = YAS_GRUPLARI.find((y) => y.id === girdi.yasGrubu) ?? YAS_GRUPLARI[0];

  const olaganAy = Math.round(kademe.olaganYil * 12 * yasGrubu.carpan);
  const uzamisAy = Math.round(olaganAy * 1.5);

  const uyarilar: string[] = [];
  if (!Number.isFinite(parseIsoUtc(girdi.sucTarihi))) {
    uyarilar.push('Geçerli bir suç tarihi girilmelidir.');
  }
  if (!Number.isFinite(parseIsoUtc(girdi.incelemeTarihi))) {
    uyarilar.push('Geçerli bir inceleme / kesinleşme tarihi girilmelidir.');
  } else if (girdi.incelemeTarihi < girdi.sucTarihi) {
    uyarilar.push('İnceleme / kesinleşme tarihi suç tarihinden önce olamaz.');
  }

  for (const k of girdi.kesmeler) {
    if (!Number.isFinite(parseIsoUtc(k.tarih))) continue;
    if (k.tarih < girdi.sucTarihi) {
      uyarilar.push(`Kronoloji uyarısı: "${k.aciklama || KESME_ETIKETLERI[k.tur].ad}" (${formatTrTarih(k.tarih)}) suç tarihinden önce.`);
    }
    if (k.tarih > girdi.incelemeTarihi) {
      uyarilar.push(`Kronoloji uyarısı: "${k.aciklama || KESME_ETIKETLERI[k.tur].ad}" (${formatTrTarih(k.tarih)}) inceleme tarihinden sonra olduğu için hesaba katılmadı.`);
    }
  }

  for (const d of girdi.durmalar) {
    if (!Number.isFinite(parseIsoUtc(d.baslangic)) || !Number.isFinite(parseIsoUtc(d.bitis))) continue;
    if (d.bitis < d.baslangic) {
      uyarilar.push(`Durma dönemi hatası: "${d.aciklama || DURMA_ETIKETLERI[d.tur].ad}" bitiş tarihi başlangıç tarihinden önce.`);
    }
    if (d.baslangic < girdi.sucTarihi) {
      uyarilar.push(`Durma dönemi uyarısı: "${d.aciklama || DURMA_ETIKETLERI[d.tur].ad}" başlangıcı suç tarihinden önce.`);
    }
  }

  const birlesikDurmalar = birlestirAraliklar(girdi.durmalar);
  const toplamDurmaGun = durmaGunuSonrasinda(birlesikDurmalar, girdi.sucTarihi);

  // Eğer tek durma dönemi varsa tam takvim Y/A/G farkını göster, çokluysa toplam günü referans al.
  const gecerliDurmalar = girdi.durmalar.filter(
    (d) => Number.isFinite(parseIsoUtc(d.baslangic)) && Number.isFinite(parseIsoUtc(d.bitis)) && d.bitis > d.baslangic
  );
  const toplamDurmaYmd =
    gecerliDurmalar.length === 1
      ? diffYmd(gecerliDurmalar[0].baslangic, gecerliDurmalar[0].bitis)
      : diffYmd(girdi.sucTarihi, addDaysIso(girdi.sucTarihi, toplamDurmaGun));

  const seriMuhakemeGun = (girdi.etkisizler ?? [])
    .filter((e) => e.tur === 'seri-muhakeme' && e.bitis && e.bitis > e.tarih)
    .reduce((acc, e) => acc + diffDays(e.tarih, e.bitis!), 0);

  const ihtiyatli = hesaplaMod('ihtiyatli', girdi, olaganAy, uzamisAy, birlesikDurmalar);
  const standart = hesaplaMod('standart', girdi, olaganAy, uzamisAy, birlesikDurmalar);

  for (const msg of ihtiyatli.gecersizKesmeler) uyarilar.push(msg);

  // Kronolojik çizelge (ihtiyatlı mod sayacı referanslı)
  type HamOlay = {
    tarih: string;
    sira: number;
    tur: 'baslangic' | 'kesme' | 'durma-bas' | 'durma-bit' | 'etkisiz' | 'inceleme';
    islem: string;
    dayanak: string;
    kesmeTur?: KesmeTuru;
    ihtiyatliHaric?: boolean;
    bilgiGun?: number;
  };

  const hamlar: HamOlay[] = [
    {
      tarih: girdi.sucTarihi,
      sira: 0,
      tur: 'baslangic',
      islem: 'Suç tarihi (zamanaşımı başlangıcı)',
      dayanak: kademe.dayanak,
    },
  ];

  for (const k of girdi.kesmeler) {
    if (!Number.isFinite(parseIsoUtc(k.tarih)) || k.tarih < girdi.sucTarihi) continue;
    hamlar.push({
      tarih: k.tarih,
      sira: 2,
      tur: 'kesme',
      islem: k.aciklama?.trim() || KESME_ETIKETLERI[k.tur].ad,
      dayanak: KESME_ETIKETLERI[k.tur].dayanak,
      kesmeTur: k.tur,
      ihtiyatliHaric: k.tur === 'mahkumiyet' || Boolean(k.ihtiyatliHaric),
    });
  }

  for (const d of gecerliDurmalar) {
    const gunFarki = diffDays(d.baslangic, d.bitis);
    hamlar.push({
      tarih: d.baslangic,
      sira: 3,
      tur: 'durma-bas',
      islem: `${d.aciklama?.trim() || DURMA_ETIKETLERI[d.tur].ad} — Durma başlangıcı`,
      dayanak: DURMA_ETIKETLERI[d.tur].dayanak,
    });
    hamlar.push({
      tarih: d.bitis,
      sira: 4,
      tur: 'durma-bit',
      islem: `${d.aciklama?.trim() || DURMA_ETIKETLERI[d.tur].ad} — Yeniden işlemeye başlama`,
      dayanak: DURMA_ETIKETLERI[d.tur].dayanak,
      bilgiGun: gunFarki,
    });
  }

  for (const e of girdi.etkisizler ?? []) {
    if (!Number.isFinite(parseIsoUtc(e.tarih))) continue;
    const aralikGun = e.bitis && e.bitis > e.tarih ? diffDays(e.tarih, e.bitis) : 0;
    hamlar.push({
      tarih: e.tarih,
      sira: 5,
      tur: 'etkisiz',
      islem:
        (e.aciklama?.trim() || ETKISIZ_ETIKETLERI[e.tur].ad) +
        (aralikGun > 0 ? ` (${formatTrTarih(e.tarih)}–${formatTrTarih(e.bitis!)}: ${aralikGun} gün)` : ''),
      dayanak: ETKISIZ_ETIKETLERI[e.tur].dayanak,
      bilgiGun: aralikGun,
    });
  }

  hamlar.push({
    tarih: girdi.incelemeTarihi,
    sira: 9,
    tur: 'inceleme',
    islem: 'İnceleme / Kesinleşme tarihi',
    dayanak: 'Değerlendirme anı',
  });

  hamlar.sort((a, b) => a.tarih.localeCompare(b.tarih) || a.sira - b.sira);

  const cizelge: CizelgeSatiri[] = [];
  let aktifBaslangic = girdi.sucTarihi;
  let birikenDurma = 0;

  for (const o of hamlar) {
    const gecenTakvim = diffDays(aktifBaslangic, o.tarih);
    const aradakiDurma = durmaGunuAralikta(birlesikDurmalar, aktifBaslangic, o.tarih);
    const isleyen = Math.max(0, gecenTakvim - aradakiDurma);
    const anlikSinir = addDaysIso(addMonthsIso(aktifBaslangic, olaganAy), aradakiDurma);

    if (o.tur === 'baslangic') {
      cizelge.push({
        tarih: o.tarih,
        islem: o.islem,
        dayanak: o.dayanak,
        etkiTuru: 'baslangic',
        etkiMetni: 'Başlangıç',
        sayacDurumu: '0. gün',
        guncelOlaganSinir: addMonthsIso(o.tarih, olaganAy),
      });
    } else if (o.tur === 'kesme') {
      if (o.ihtiyatliHaric) {
        cizelge.push({
          tarih: o.tarih,
          islem: o.islem,
          dayanak: o.dayanak,
          etkiTuru: 'kesilme',
          etkiMetni: 'Kesilme (İhtiyatlı modda hariç)',
          sayacDurumu: `İhtiyatlı sayaç: ${isleyen.toLocaleString('tr-TR')}. gün`,
          guncelOlaganSinir: anlikSinir,
        });
      } else if (o.tarih >= anlikSinir) {
        cizelge.push({
          tarih: o.tarih,
          islem: o.islem,
          dayanak: o.dayanak,
          etkiTuru: 'gecersiz',
          etkiMetni: 'Süre dolduğu için kesmez',
          sayacDurumu: `${isleyen.toLocaleString('tr-TR')}. gün (dolmuş)`,
          guncelOlaganSinir: anlikSinir,
        });
      } else {
        aktifBaslangic = o.tarih;
        birikenDurma = 0;
        cizelge.push({
          tarih: o.tarih,
          islem: o.islem,
          dayanak: o.dayanak,
          etkiTuru: 'kesilme',
          etkiMetni: 'Süre kesildi (sıfırlandı)',
          sayacDurumu: `${isleyen.toLocaleString('tr-TR')} gün → 0 gün`,
          guncelOlaganSinir: addMonthsIso(o.tarih, olaganAy),
        });
      }
    } else if (o.tur === 'durma-bas') {
      cizelge.push({
        tarih: o.tarih,
        islem: o.islem,
        dayanak: o.dayanak,
        etkiTuru: 'durma',
        etkiMetni: 'Sayaç durdu',
        sayacDurumu: `${isleyen.toLocaleString('tr-TR')}. günde durdu`,
        guncelOlaganSinir: anlikSinir,
      });
    } else if (o.tur === 'durma-bit') {
      birikenDurma += o.bilgiGun ?? 0;
      const yeniSinir = addDaysIso(addMonthsIso(aktifBaslangic, olaganAy), durmaGunuAralikta(birlesikDurmalar, aktifBaslangic, o.tarih));
      cizelge.push({
        tarih: o.tarih,
        islem: o.islem,
        dayanak: o.dayanak,
        etkiTuru: 'devam',
        etkiMetni: `+${(o.bilgiGun ?? 0).toLocaleString('tr-TR')} gün eklendi`,
        sayacDurumu: `${isleyen.toLocaleString('tr-TR')}. günden devam`,
        guncelOlaganSinir: yeniSinir,
      });
    } else if (o.tur === 'etkisiz') {
      cizelge.push({
        tarih: o.tarih,
        islem: o.islem,
        dayanak: o.dayanak,
        etkiTuru: 'etkisiz',
        etkiMetni: 'Etkisiz (0 gün)',
        sayacDurumu: `${isleyen.toLocaleString('tr-TR')}. gün (işlemeye devam)`,
        guncelOlaganSinir: addDaysIso(addMonthsIso(aktifBaslangic, olaganAy), Math.max(aradakiDurma, birikenDurma)),
      });
    } else if (o.tur === 'inceleme') {
      const kalan = diffDays(o.tarih, ihtiyatli.etkinSinir);
      cizelge.push({
        tarih: o.tarih,
        islem: o.islem,
        dayanak: o.dayanak,
        etkiTuru: 'degerlendirme',
        etkiMetni: kalan > 0 ? `Dolmadı (${kalan.toLocaleString('tr-TR')} gün kaldı)` : `Doldu (${Math.abs(kalan).toLocaleString('tr-TR')} gün aştı)`,
        sayacDurumu: `${ihtiyatli.incelemeIsleyenGun.toLocaleString('tr-TR')} / ${ihtiyatli.olaganToplamGun.toLocaleString('tr-TR')} gün`,
        guncelOlaganSinir: ihtiyatli.etkinSinir,
      });
    }
  }

  // Karşılaştırma senaryoları
  const senaryolar: KarsilastirmaSenaryosu[] = [];
  const ekleSenaryo = (ad: string, bas: string) => {
    const dGun = durmaGunuSonrasinda(birlesikDurmalar, bas);
    const tarih = addDaysIso(addMonthsIso(bas, olaganAy), dGun);
    const kalan = diffDays(girdi.incelemeTarihi, tarih);
    senaryolar.push({ ad, baslangic: bas, durmaDahilTarih: tarih, gerceklesti: girdi.incelemeTarihi >= tarih, kalanGun: kalan });
  };

  ekleSenaryo('Hiç kesilme olmasaydı (Suç tarihi esaslı)', girdi.sucTarihi);
  const ilkIddianame = girdi.kesmeler
    .filter((k) => k.tur === 'iddianame' && k.tarih >= girdi.sucTarihi && k.tarih <= girdi.incelemeTarihi)
    .sort((a, b) => a.tarih.localeCompare(b.tarih))[0];
  if (ilkIddianame && ilkIddianame.tarih !== ihtiyatli.esasBaslangic) {
    ekleSenaryo('Yalnızca iddianame kesmiş olsaydı', ilkIddianame.tarih);
  }
  if (ihtiyatli.esasBaslangic !== girdi.sucTarihi) {
    ekleSenaryo(`İhtiyatlı hesap (${ihtiyatli.esasBaslangicEtiket})`, ihtiyatli.esasBaslangic);
  }
  if (standart.esasBaslangic !== ihtiyatli.esasBaslangic) {
    ekleSenaryo(`Tüm kesilmeler dahil (${standart.esasBaslangicEtiket})`, standart.esasBaslangic);
  }

  const suctanToplamTakvimGun = diffDays(girdi.sucTarihi, girdi.incelemeTarihi);
  const suctanDurma = durmaGunuAralikta(birlesikDurmalar, girdi.sucTarihi, girdi.incelemeTarihi);

  return {
    kademe,
    yasGrubu,
    olaganAy,
    uzamisAy,
    toplamDurmaGun,
    toplamDurmaYmd,
    seriMuhakemeGun,
    ihtiyatli,
    standart,
    cizelge,
    senaryolar,
    uyarilar,
    suctanToplamTakvimGun,
    suctanMahsupSonrasiGun: Math.max(0, suctanToplamTakvimGun - suctanDurma),
  };
}
