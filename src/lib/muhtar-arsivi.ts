import { z } from 'zod';
import raw from '../data/muhtar-arsivi.json' with { type: 'json' };
import kurallar from '../data/kamu-kurallari.json' with { type: 'json' };
import { ayarlar } from './settings';
import { kamuHesapla } from './kamu-hesaplari';
import { vergiTarifesi } from './vergi-veri';

// Muhtar ödeneğinin dönem tablosu: Memurlar.net'ten alınan geçmiş dönemler + ayarlar.json'daki her katsayı dönemi.
// Yeni dönem ayarlar.json'a girildiğinde satırı derlemede kendiliğinden eklenir; aynı dönemin arşiv satırının yerine geçer.
const satir = z.object({ yil: z.number().int(), ay: z.union([z.literal(1), z.literal(7)]), tutar: z.number().positive(),
  aylik_katsayi: z.number().positive().optional(), net_asgari: z.number().positive().optional(), not: z.string().optional() });
const arsiv = z.object({ kaynak: z.url(), aktarim: z.iso.date(), aciklama: z.string(), donemler: z.array(satir) }).parse(raw);

export interface MuhtarDonemi { yil: number; ay: 1 | 7; brut?: number; net: number; kaynak: 'hesap' | 'arsiv'; not?: string }
const hesap = (aylik: number, asgariNet: number, yil: number) => {
  const r = kamuHesapla('muhtar', {}, { aylik, asgariNet, muhtarGosterge: ayarlar.sabitler.muhtar_gosterge, vergi: vergiTarifesi(yil), kurallar });
  return { brut: r.satirlar[0].deger, net: r.deger };
};
const anahtar = (yil: number, ay: number) => `${yil}-${ay}`;
const donemler = new Map<string, MuhtarDonemi>();
for (const a of arsiv.donemler) {
  // Katsayısı arşivde bulunan dönem kendi motorumuzla hesaplanır (bkz. kayıttaki not).
  const h = a.aylik_katsayi && a.net_asgari ? hesap(a.aylik_katsayi, a.net_asgari, a.yil) : undefined;
  donemler.set(anahtar(a.yil, a.ay), { yil: a.yil, ay: a.ay, brut: h?.brut, net: h?.net ?? a.tutar, kaynak: h ? 'hesap' : 'arsiv', not: a.not });
}
for (const d of ayarlar.donemler) {
  const yil = Number(d.baslangic.slice(0, 4)), ay = Number(d.baslangic.slice(5, 7)) < 7 ? 1 : 7;
  donemler.set(anahtar(yil, ay), { yil, ay, ...hesap(d.memur_maas_aylik_katsayi, d.asgari_ucret, yil), kaynak: 'hesap' });
}
export const muhtarDonemleri = [...donemler.values()].sort((a, b) => b.yil - a.yil || b.ay - a.ay);
export const muhtarArsivKaynagi = arsiv.kaynak;
