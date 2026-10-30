import { yuvarla } from './vergi';

// Tapu harcı (satış) ve TKGM döner sermaye ücreti. Saf hesap; tarife yıl kaydı dışarıdan verilir.
export interface TapuTarifesi { yil: number; harc_binde: number; en_az_harc: number; doner_gosterge: number; ilave_gosterge: number; katsayi_min: number; katsayi_max: number }
export interface TapuGirdi { bedel: number; emlakDegeri: number; katsayi: number; ekTasinmaz?: number; bagimsizBolum?: boolean; yetkiDisi?: boolean; donerAlici?: boolean }

export function tapuHarci(g: TapuGirdi, t: TapuTarifesi) {
  if (![g.bedel, g.emlakDegeri].every(n => Number.isFinite(n) && n >= 0 && n <= 1e12) || g.bedel + g.emlakDegeri <= 0) throw new Error('Geçerli satış bedeli ya da emlak vergi değeri girin (en çok 1 trilyon TL).');
  if (!(g.katsayi >= t.katsayi_min && g.katsayi <= t.katsayi_max)) throw new Error(`Yöresel katsayı ${t.katsayi_min} ile ${t.katsayi_max} arasında olmalıdır.`);
  const ek = g.ekTasinmaz ?? 0;
  if (!Number.isInteger(ek) || ek < 0 || ek > 500) throw new Error('Ek taşınmaz sayısı 0–500 arasında tam sayı olmalıdır.');
  // 492 m.63: 10 TL altındaki matrah kesri dikkate alınmaz. (4) sayılı tarifenin en az tutarı saklıdır.
  const esas = Math.floor(Math.max(g.bedel, g.emlakDegeri) / 10) * 10;
  const harc = yuvarla(Math.max(t.en_az_harc, yuvarla(esas * t.harc_binde / 1000)) * (ek + 1));
  // TKGM 1.1.1.1: bağımsız bölüm başına tam ücret; 1.1.2.2: diğer taşınmazlarda ilave gösterge.
  const ekGosterge = g.bagimsizBolum ? t.doner_gosterge : t.ilave_gosterge;
  const doner = yuvarla((t.doner_gosterge + ekGosterge * ek) * g.katsayi * (g.yetkiDisi ? 2 : 1));
  const alici = yuvarla(harc + (g.donerAlici === false ? 0 : doner));
  return { esas, emlakEsas: g.emlakDegeri > g.bedel, aliciHarc: harc, saticiHarc: harc, toplamHarc: yuvarla(harc * 2), doner, aliciToplam: alici, genelToplam: yuvarla(harc * 2 + doner) };
}
