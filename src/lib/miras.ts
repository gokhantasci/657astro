// Yasal miras payları (TMK m.495–499). Saf hesap; kesirler tam sayı çifti olarak tutulur, tutar en sonda hesaplanır.
// 1. zümre: altsoy eşit; ölmüş çocuğun yerini kendi altsoyu alır (halefiyet). Altsoyu olmayan ölmüş çocuk sayılmaz.
// 2. zümre: ana ve baba yarı yarıya; ölmüş olanın yerini altsoyu (kardeşler) alır. Tam kardeş iki taraftan da pay alır.
//   Bir tarafta hiç mirasçı yoksa o yarı diğer tarafa geçer (m.496/3).
// 3. zümre: büyük ana ve büyük babalar; ayrıntılı dağılım yapılmaz, zümrenin toplam payı gösterilir.
// Sağ kalan eş: 1. zümreyle 1/4, 2. zümreyle 1/2, 3. zümreyle 3/4, hiçbiri yoksa tamamı (m.499).
// Kapsam dışı: saklı pay ve tasarruf oranı, mal rejimi tasfiyesi, evlatlık, mirastan feragat/ret, devlete kalan miras.
export interface MirasGirdi {
  tutar: number; es: boolean;
  cocuklar: number;              // sağ çocuk sayısı
  olmusCocuklarinTorunlari: number[]; // ölmüş her çocuğun sağ altsoy sayısı (0 → o kol düşer)
  anne: boolean; baba: boolean;
  tamKardes: number; anaBirKardes: number; babaBirKardes: number;
  ucuncuZumre: boolean;          // 1. ve 2. zümre yoksa sağ büyük ana/baba var mı
}
type Kesir = [number, number];
const ebob = (a: number, b: number): number => (b ? ebob(b, a % b) : Math.abs(a));
const sade = ([p, q]: Kesir): Kesir => { const g = ebob(p, q) || 1; return [p / g, q / g]; };
const carp = (a: Kesir, b: Kesir): Kesir => sade([a[0] * b[0], a[1] * b[1]]);
const topla = (a: Kesir, b: Kesir): Kesir => sade([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
export const kesirMetni = ([p, q]: Kesir) => (q === 1 ? String(p) : `${p}/${q}`);

export interface Pay { kim: string; kesir: Kesir; tutar: number }
export function miras(g: MirasGirdi) {
  if (!(g.tutar >= 0)) throw new Error('Miras tutarı sıfır ya da pozitif olmalıdır.');
  const tam = [g.cocuklar, g.tamKardes, g.anaBirKardes, g.babaBirKardes, ...g.olmusCocuklarinTorunlari];
  if (tam.some(n => !Number.isInteger(n) || n < 0)) throw new Error('Kişi sayıları sıfır ya da pozitif tam sayı olmalıdır.');
  const paylar: { kim: string; kesir: Kesir }[] = [];
  const kollar = g.olmusCocuklarinTorunlari.filter(n => n > 0);
  let zumre: 1 | 2 | 3 | 0 = 0;
  const birinci = g.cocuklar + kollar.length;
  const annTarafi = g.anne || g.tamKardes + g.anaBirKardes > 0, babTarafi = g.baba || g.tamKardes + g.babaBirKardes > 0;
  if (birinci > 0) zumre = 1; else if (annTarafi || babTarafi) zumre = 2; else if (g.ucuncuZumre) zumre = 3;
  const esPayi: Kesir = !g.es ? [0, 1] : zumre === 1 ? [1, 4] : zumre === 2 ? [1, 2] : zumre === 3 ? [3, 4] : [1, 1];
  if (g.es) paylar.push({ kim: 'Sağ kalan eş', kesir: esPayi });
  const kalan: Kesir = sade([esPayi[1] - esPayi[0], esPayi[1]]);
  if (zumre === 1) {
    const kisi = carp(kalan, [1, birinci]);
    if (g.cocuklar) paylar.push({ kim: g.cocuklar > 1 ? `Çocuklar (${g.cocuklar} kişi, her biri)` : 'Çocuk', kesir: kisi });
    kollar.forEach((n, i) => paylar.push({ kim: `${i + 1}. ölmüş çocuğun altsoyu (${n} kişi, her biri)`, kesir: carp(kisi, [1, n]) }));
  } else if (zumre === 2) {
    // Her yarı: sağsa ebeveyn, değilse o ebeveynin altsoyu (tam + ana bir ya da baba bir kardeşler) eşit.
    const yari: Kesir = carp(kalan, annTarafi && babTarafi ? [1, 2] : [1, 1]);
    const tamPay: Kesir[] = [];
    if (annTarafi) {
      if (g.anne) paylar.push({ kim: 'Anne', kesir: yari });
      else { const k = carp(yari, [1, g.tamKardes + g.anaBirKardes]); if (g.anaBirKardes) paylar.push({ kim: `Ana bir kardeşler (${g.anaBirKardes} kişi, her biri)`, kesir: k }); if (g.tamKardes) tamPay.push(k); }
    }
    if (babTarafi) {
      if (g.baba) paylar.push({ kim: 'Baba', kesir: yari });
      else { const k = carp(yari, [1, g.tamKardes + g.babaBirKardes]); if (g.babaBirKardes) paylar.push({ kim: `Baba bir kardeşler (${g.babaBirKardes} kişi, her biri)`, kesir: k }); if (g.tamKardes) tamPay.push(k); }
    }
    if (tamPay.length) paylar.push({ kim: `Tam kardeşler (${g.tamKardes} kişi, her biri)`, kesir: tamPay.reduce(topla) });
  } else if (zumre === 3) {
    paylar.push({ kim: 'Büyük ana ve büyük babalar (3. zümre, toplam)', kesir: kalan });
  } else if (!g.es) {
    throw new Error('Yasal mirasçı belirtilmedi; mirasçı yoksa miras Devlete kalır (TMK m.501).');
  }
  return { zumre, paylar: paylar.map(p => ({ ...p, tutar: Math.round(g.tutar * p.kesir[0] / p.kesir[1] * 100) / 100 })) as Pay[] };
}
