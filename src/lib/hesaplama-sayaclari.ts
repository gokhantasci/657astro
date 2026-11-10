import hesaplamaVeri from '../data/hesaplama-sayaclari.json';
import aracSayaclari from '../../services/oneriler/arac-sayaclari.json';
export const ARAC_SAYACLARI=aracSayaclari;
export type SayacTuru=string;

export interface HesapSayaci {
  anahtar: SayacTuru;
  baslik: string;
  kisa: string;
  ikon: string;
  yol: string;
  toplam: number;
  buYil: number;
  buHafta: number;
  bugun: number;
}

export const HESAPLAMA_SAYACLARI = hesaplamaVeri.sayaclar as Record<string, HesapSayaci>;
// Yalnız doğrulanmış veri ve çalışan sayaç servisi olduğunda gösterilir.
export const HESAPLAMA_SAYACLARI_AKTIF = hesaplamaVeri.aktif;

export const TOPLAM_HESAPLAMA = Object.values(HESAPLAMA_SAYACLARI).reduce((acc, s) => acc + s.toplam, 0);

export function sayiBicimlendir(sayi: number): string {
  return sayi.toLocaleString('tr-TR');
}

