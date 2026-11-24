// 657.com.tr GYS Sınav Motoru:
// - Tek soru havuzu -> Çoklu ünvan/bölüm eşlemesi (aynı soru birden fazla ünvanda otomatik sayılır)
// - Kombinatoryal şık üretimi (dogru[] havuzundan 1 doğru + yanlis[] havuzundan 4 veya 1 yanlış rastgele)
// - 2 mod: Klasik (5 şık: 1 doğru + 4 yanlış) ve İkili Hızlı Tekrar (2 şık: 1 doğru + 1 yanlış)
// - Zorunlu öğrenme (hatalı sorular doğru yapılana kadar döngü) ve günlük/haftalık/aylık/en çok hatalı filtreler

export type Zorluk = 'kolay' | 'orta' | 'zor' | 'akademik' | 'dip';
export type SinavModu = 'klasik' | 'ikili';

export interface GysSoru {
  id: string;
  kanun: string;
  bolum: string;
  seviye: Zorluk;
  tur?: string;
  madde?: string;
  kaynak: string;
  mevzuatUrl?: string;
  soru: string;
  dogru: string[];
  yanlis: string[];
  aciklama: string;
}

export interface GysAgacDugum {
  id: string;
  ad: string;
  tur: string;
  aciklama?: string;
  sinavSoruSayisi?: number;
  sinavSureDk?: number;
  gecmePuani?: number;
  bolumler?: string[];
  cocuklar?: GysAgacDugum[];
}

export interface SoruKisiselIstatistik {
  cozum: number;
  dogru: number;
  yanlis: number;
}

export interface GysUnvan {
  id: string;
  ad: string;
  toplamSoru: number;
  sureDk: number;
  bolumler: string[];
  agirliklar: Record<string, number>;
}

export interface HazirSoru {
  soru: GysSoru;
  siklar: { harf: string; metin: string; dogru: boolean }[];
  dogruHarf: string;
  varyasyonSayisi: number;
}

export interface HataKaydi {
  soruId: string;
  tarih: string; // YYYY-MM-DD (Europe/Istanbul)
  hataSayisi: number;
  sonDogru: boolean;
}

const HARFLER = ['A', 'B', 'C', 'D', 'E'];

export function karistir<T>(dizi: readonly T[], rng: () => number = Math.random): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

function kombinasyon(n: number, r: number): number {
  if (r > n || r < 0) return 0;
  if (r === 0 || r === n) return 1;
  let ust = 1;
  let alt = 1;
  for (let i = 0; i < r; i++) {
    ust *= n - i;
    alt *= i + 1;
  }
  return Math.round(ust / alt);
}

/**
 * Bir sorudan seçilen moda göre (klasik: 1 doğru + 4 yanlış, ikili: 1 doğru + 1 yanlış)
 * rastgele şık kombinasyonu üretir.
 */
export function soruyuHazirla(
  soru: GysSoru,
  mod: SinavModu = 'klasik',
  rng: () => number = Math.random
): HazirSoru {
  const yanlisAdet = mod === 'ikili' ? 1 : Math.min(4, soru.yanlis.length);
  const secilenDogru = karistir(soru.dogru, rng)[0];
  const secilenYanlislar = karistir(soru.yanlis, rng).slice(0, yanlisAdet);

  const ham = karistir(
    [
      { metin: secilenDogru, dogru: true },
      ...secilenYanlislar.map((m) => ({ metin: m, dogru: false })),
    ],
    rng
  );

  const siklar = ham.map((item, idx) => ({
    harf: HARFLER[idx] ?? String(idx + 1),
    metin: item.metin,
    dogru: item.dogru,
  }));

  const dogruHarf = siklar.find((s) => s.dogru)?.harf ?? 'A';
  const varyasyonSayisi = Math.max(1, soru.dogru.length * kombinasyon(soru.yanlis.length, yanlisAdet));

  return { soru, siklar, dogruHarf, varyasyonSayisi };
}

/** Ünvanın sorumlu olduğu bölümlere göre tek soru havuzundan soruları süzer. */
export function unvanSorulari(unvan: GysUnvan, tumSorular: readonly GysSoru[]): GysSoru[] {
  const bolumSet = new Set(unvan.bolumler);
  return tumSorular.filter((s) => bolumSet.has(s.bolum));
}

/**
 * Resmi sınav ağırlıklarına veya kullanıcının belirlediği konu miktarlarına göre
 * dengeli test kitapçığı oluşturur.
 */
export function kitapcikOlustur(
  unvan: GysUnvan,
  tumSorular: readonly GysSoru[],
  secenek: {
    mod: SinavModu;
    toplamSoru?: number;
    agirlikli?: boolean;
    kanunFiltre?: string;
    seviyeFiltre?: Zorluk | '';
    rng?: () => number;
  }
): HazirSoru[] {
  const rng = secenek.rng ?? Math.random;
  let havuz = unvanSorulari(unvan, tumSorular);
  if (secenek.kanunFiltre) {
    havuz = havuz.filter((s) => s.kanun === secenek.kanunFiltre);
  }
  if (secenek.seviyeFiltre) {
    havuz = havuz.filter((s) => s.seviye === secenek.seviyeFiltre);
  }
  if (!havuz.length) return [];

  const hedef = Math.min(secenek.toplamSoru ?? unvan.toplamSoru, havuz.length);

  if (secenek.agirlikli && !secenek.kanunFiltre) {
    const secilen: GysSoru[] = [];
    const kullanilan = new Set<string>();
    const agirlikToplam = Object.values(unvan.agirliklar).reduce((a, b) => a + b, 0) || 1;

    for (const [kanun, pay] of Object.entries(unvan.agirliklar)) {
      const kota = Math.max(1, Math.round((pay / agirlikToplam) * hedef));
      const adaylar = karistir(
        havuz.filter((s) => s.kanun === kanun && !kullanilan.has(s.id)),
        rng
      ).slice(0, kota);
      for (const a of adaylar) {
        if (secilen.length >= hedef) break;
        secilen.push(a);
        kullanilan.add(a.id);
      }
    }
    // Kalan kontenjanı havuzdaki diğer sorulardan tamamla
    if (secilen.length < hedef) {
      const kalan = karistir(
        havuz.filter((s) => !kullanilan.has(s.id)),
        rng
      );
      for (const k of kalan) {
        if (secilen.length >= hedef) break;
        secilen.push(k);
        kullanilan.add(k.id);
      }
    }
    return secilen.map((s) => soruyuHazirla(s, secenek.mod, rng));
  }

  return karistir(havuz, rng)
    .slice(0, hedef)
    .map((s) => soruyuHazirla(s, secenek.mod, rng));
}

/** Hatalı soruları döneme göre (günlük, haftalık, aylık, en çok hatalı) filtreler. */
export function hataliSorulariGetir(
  kayitlar: Record<string, HataKaydi>,
  tumSorular: readonly GysSoru[],
  filtre: 'tumu' | 'gunluk' | 'haftalik' | 'aylik' | 'encok',
  bugunStr: string
): GysSoru[] {
  const soruMap = new Map(tumSorular.map((s) => [s.id, s]));
  const bugunDate = new Date(bugunStr + 'T00:00:00');
  const haftaBasi = new Date(bugunDate);
  haftaBasi.setDate(bugunDate.getDate() - 6);
  const haftaStr = haftaBasi.toISOString().slice(0, 10);
  const ayBasi = new Date(bugunDate);
  ayBasi.setDate(bugunDate.getDate() - 29);
  const ayStr = ayBasi.toISOString().slice(0, 10);

  const liste = Object.values(kayitlar).filter((k) => {
    if (k.hataSayisi <= 0 || !soruMap.has(k.soruId)) return false;
    if (filtre === 'gunluk') return k.tarih === bugunStr;
    if (filtre === 'haftalik') return k.tarih >= haftaStr;
    if (filtre === 'aylik') return k.tarih >= ayStr;
    return true;
  });

  if (filtre === 'encok') {
    liste.sort((a, b) => b.hataSayisi - a.hataSayisi);
  }
  return liste.map((k) => soruMap.get(k.soruId)!).filter(Boolean);
}

/** Sınırsız derinlikteki kategori ağacında bir düğümün ve tüm alt düğümlerinin kapsadığı bölümleri toplar. */
export function dugumBolumleri(dugum: GysAgacDugum): Set<string> {
  const set = new Set<string>(dugum.bolumler ?? []);
  for (const cocuk of dugum.cocuklar ?? []) {
    for (const b of dugumBolumleri(cocuk)) set.add(b);
  }
  return set;
}

/** Bir düğümün (ve alt düğümlerinin) tek soru havuzundaki benzersiz sorularını döndürür. */
export function dugumSorulari(dugum: GysAgacDugum, tumSorular: readonly GysSoru[]): GysSoru[] {
  const bolumler = dugumBolumleri(dugum);
  return tumSorular.filter((s) => bolumler.has(s.bolum));
}

export function dugumBul(kok: GysAgacDugum, id: string): GysAgacDugum | undefined {
  if (kok.id === id) return kok;
  for (const cocuk of kok.cocuklar ?? []) {
    const bulunan = dugumBul(cocuk, id);
    if (bulunan) return bulunan;
  }
  return undefined;
}

export function dugumYolu(kok: GysAgacDugum, id: string): GysAgacDugum[] {
  if (kok.id === id) return [kok];
  for (const cocuk of kok.cocuklar ?? []) {
    const alt = dugumYolu(cocuk, id);
    if (alt.length) return [kok, ...alt];
  }
  return [];
}

/**
 * Sonsuz Test (Rastgele Akış) modu için havuzdan art arda aynı soruyu getirmeden
 * yeni kombinatoryal şıklarla sonraki soruyu üretir.
 */
export function sonsuzSonrakiSoru(
  havuz: readonly GysSoru[],
  sonSoruId: string | null,
  mod: SinavModu = 'klasik',
  rng: () => number = Math.random
): HazirSoru | null {
  if (!havuz.length) return null;
  const adaylar = havuz.length > 1 && sonSoruId ? havuz.filter((s) => s.id !== sonSoruId) : havuz;
  const secilen = adaylar[Math.floor(rng() * adaylar.length)] ?? havuz[0];
  return soruyuHazirla(secilen, mod, rng);
}
