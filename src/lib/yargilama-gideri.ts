// Yargılama gideri hesabı. Mantık ve döküm metni canlıdaki assets/js/yargilamagideri.js ile aynıdır
// (kullanıcılar dökümü UYAP'a yapıştırdığı için metin biçimi bilerek değiştirilmedi).
// Canlıda "ayrı ayrı göster" anahtarı gizli ve hep açıktı; yalnızca o kip taşındı.

export type Tablo = 'posta' | 'etebligat' | 'eyazisma' | 'kep' | 'kesifharci';
export interface UcretSatiri { tutar: number; baslangic: string; bitis: string | null; para?: string }
export type Ucretler = Record<Tablo, UcretSatiri[]>;
export const TABLOLAR: Tablo[] = ['posta', 'etebligat', 'eyazisma', 'kep', 'kesifharci'];

export const GIDER_KALEMLERI = [
  { id: 'postaGideri', baslik: 'Posta gideri', dokum: 'Posta Gideri' },
  { id: 'atkGideri', baslik: 'Adli Tıp (ATK) gideri', dokum: 'ATK Gideri' },
  { id: 'bilirkisi', baslik: 'Bilirkişi ücreti', dokum: 'Bilirkişi Gideri' },
  { id: 'kesifGideri', baslik: 'Keşif gideri', dokum: 'Keşif Gideri' },
  { id: 'uzlastirmaci', baslik: 'Uzlaştırmacı ücreti', dokum: 'Uzlaşma Gideri' },
  { id: 'ilanGideri', baslik: 'İlan gideri', dokum: 'İlan Gideri' },
  { id: 'yasaYolu', baslik: 'Yasa yolu gideri', dokum: 'Yasa Yolu Gidiş Dönüş Gideri' },
] as const;
export type GiderId = (typeof GIDER_KALEMLERI)[number]['id'];
// Dökümde satırların sırası canlıdaki gibidir.
const DOKUM_SIRASI: GiderId[] = ['postaGideri', 'ilanGideri', 'yasaYolu', 'atkGideri', 'kesifGideri', 'uzlastirmaci', 'bilirkisi'];

// Canlıdaki fmtTL: "₺" + noktalı iki ondalık.
export const dokumTL = (n: number) => {
  const v = Number.isFinite(n) ? n : 0;
  return `${v < 0 ? '-' : ''}₺${Math.abs(v).toFixed(2)}`;
};

export interface Girdi {
  adetler: Record<Tablo, number[]>;           // ücret satırıyla aynı sırada adet
  giderler: Partial<Record<GiderId, number[]>>; // her kalemde eklenen tutarlar
}

export function hesapla(u: Ucretler, g: Girdi) {
  const ozet = {} as Record<Tablo, { adet: number; tutar: number }>;
  for (const t of TABLOLAR) {
    let adet = 0;
    let tutar = 0;
    u[t].forEach((satir, i) => {
      const n = g.adetler[t]?.[i] ?? 0;
      adet += n;
      tutar += n * satir.tutar;
    });
    ozet[t] = { adet, tutar };
  }
  const satirlar: string[] = [];
  let toplam = 0;
  const ekle = (adet: number, tutar: number, ad: string) => {
    if (tutar > 0) { satirlar.push(`${adet} adet ${ad} : ${dokumTL(tutar)}`); toplam += tutar; }
  };
  ekle(ozet.posta.adet, ozet.posta.tutar, 'Tebligat Gideri');
  ekle(ozet.etebligat.adet, ozet.etebligat.tutar, 'E-Tebligat Gideri');
  ekle(ozet.eyazisma.adet, ozet.eyazisma.tutar, 'E-Yazışma Ücreti');
  ekle(ozet.kep.adet, ozet.kep.tutar, 'KEP İletim Ücreti');
  ekle(ozet.kesifharci.adet, ozet.kesifharci.tutar, 'Keşif Harcı');
  const kalemToplam = {} as Record<GiderId, number>;
  for (const id of DOKUM_SIRASI) {
    const v = (g.giderler[id] ?? []).reduce((a, b) => a + b, 0);
    kalemToplam[id] = v;
    if (v > 0) {
      satirlar.push(`${GIDER_KALEMLERI.find(k => k.id === id)!.dokum} : ${dokumTL(v)}`);
      toplam += v;
    }
  }
  satirlar.push('--------------------------');
  satirlar.push(`TOPLAM : ${dokumTL(toplam)}`);
  return { ozet, kalemToplam, toplam, dokum: satirlar.join('\n') };
}

// ── Ücret satırı seçimi ──
const gece = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const isoGun = (s: string) => { const [y, m, g] = s.split('-').map(Number); return new Date(y, m - 1, g).getTime(); };
export function satirBul(satirlar: UcretSatiri[], tarih: Date) {
  const t = gece(tarih);
  // Canlıdaki gibi başlangıcı en yeni olandan geriye doğru aranır.
  const sirali = satirlar.map((s, i) => ({ s, i })).sort((a, b) => b.s.baslangic.localeCompare(a.s.baslangic));
  for (const { s, i } of sirali) {
    if (t >= isoGun(s.baslangic) && (s.bitis === null || t <= isoGun(s.bitis))) return i;
  }
  return -1;
}

// ── UYAP tebligat Excel'i ──
export const normTR = (s: unknown) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/[Şş]/g, 's').replace(/[Ğğ]/g, 'g')
  .replace(/[Öö]/g, 'o').replace(/[Üü]/g, 'u').replace(/[Çç]/g, 'c')
  .toLowerCase().replace(/\s+/g, ' ').trim();
const elektronikMi = (raw: unknown) => {
  const t = normTR(raw);
  return /\b(elektronik(?:\s+tebligat)?)\b/.test(t) || /\be[-\s]?tebligat\b/.test(t) || /\beteb\b/.test(t) || /\be-teb\b/.test(t);
};
const apsMi = (raw: unknown) => { const t = normTR(raw); return /\baps\b/.test(t) || /\bhizli\s+gonderi\b/.test(t); };
export function turBul(raw: unknown): 'kep' | 'eyazisma' | 'aps' | 'etebligat' | 'normal' {
  const t = normTR(raw);
  if (/\bkep\b/.test(t)) return 'kep';
  if (/eyazis?ma|e[-\s]?yaz/i.test(String(raw ?? '')) || /eyazisma|e-yazisma|e yazisma/.test(t)) return 'eyazisma';
  if (apsMi(t)) return 'aps';
  if (elektronikMi(t)) return 'etebligat';
  return 'normal';
}
export const esasBul = (v: unknown) => { const m = String(v ?? '').trim().match(/\b(\d{4})\s*\/\s*(\d{1,6})\b/); return m ? `${m[1]}/${m[2]}` : ''; };
export function tarihOku(d: unknown): Date | null {
  if (!d) return null;
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
  const s = String(d).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return new Date(Date.UTC(1899, 11, 30) + Math.round(parseFloat(s) * 86400000));
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : t;
}
const BASLIK = {
  esas: ['esas', 'dosya no', 'esas no', 'dosyano', 'dosya'],
  tur: ['gönderi tipi', 'gonderi tipi', 'tebligat türü', 'tur', 'tür', 'tebliğ şekli', 'tebligat sekli', 'usul'],
  tarih: ['tebligat oluşturma tarihi', 'tebligat olusturma tarihi', 'oluşturma tarihi', 'olusturulma', 'tebligat tarihi', 'tarih'],
};
const sec = (satir: Record<string, unknown>, anahtarlar: string[]) => {
  const k = Object.keys(satir).find(kk => anahtarlar.some(h => normTR(kk).includes(normTR(h))));
  return k === undefined ? undefined : satir[k];
};

// Excel satırlarını (başlık → değer) ücret tablolarındaki adetlere çevirir. APS gönderisi canlıdaki gibi 2 adet sayılır.
export function excelSay(satirlar: Record<string, unknown>[], u: Ucretler) {
  const adetler = Object.fromEntries(TABLOLAR.map(t => [t, u[t].map(() => 0)])) as Record<Tablo, number[]>;
  const sayac = { aps: 0, normal: 0, etebligat: 0, eyazisma: 0, kep: 0, tarihsiz: 0 };
  const esaslar = new Set<string>();
  for (const r of satirlar) {
    const esas = esasBul(sec(r, BASLIK.esas));
    if (!esas) continue;
    esaslar.add(esas);
    const turHam = sec(r, BASLIK.tur);
    const tur = turBul(turHam);
    const tarih = tarihOku(sec(r, BASLIK.tarih));
    // Canlıdaki sıra: KEP, e-yazışma, sonra metinde "elektronik" geçen her şey e-tebligat; kalanı posta (APS 2 adet).
    const elektronik = tur !== 'kep' && tur !== 'eyazisma' && elektronikMi(turHam);
    const aps = !elektronik && (tur === 'aps' || apsMi(turHam));
    const tablo: Tablo = tur === 'kep' ? 'kep' : tur === 'eyazisma' ? 'eyazisma' : elektronik ? 'etebligat' : 'posta';
    const i = tarih ? satirBul(u[tablo], tarih) : -1;
    if (i < 0) { sayac.tarihsiz++; continue; }
    adetler[tablo][i] += aps ? 2 : 1;
    sayac[tablo === 'posta' ? (aps ? 'aps' : 'normal') : tablo]++;
  }
  return { adetler, sayac, esaslar: [...esaslar] };
}
