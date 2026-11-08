import harita from '../data/yargi-haritasi.json' with { type: 'json' };
import { adliSlug } from './adlicevre';

// İdari yargı bilgisi il bazındadır; kaynak, yargı haritasının il kayıtlarıdır (src/data/yargi-haritasi.json:
// `idare_mahkemesi` ilin bağlı olduğu idare mahkemesi, `bim` bölge idare mahkemesi).
// İlin kendi idare mahkemesi yoksa kayıtta komşu ilin mahkemesi yazılıdır; "var" bu yüzden mahkeme adının
// il adıyla başlayıp başlamadığına bakılarak çıkarılır.
export interface IdareBilgisi {
  il: string;
  /** İlin kendi idare mahkemesi bulunuyor mu? */
  var: boolean;
  /** İlin yargı çevresine girdiği idare mahkemesi (kayıttaki adıyla). */
  mahkeme: string;
  /** Bölge idare mahkemesi, örn. "Erzurum Bölge İdare Mahkemesi". */
  bolge: string;
  /** Mahkeme adı çoğul kayıtsa (İstanbul İdare Mahkemeleri 1-18). */
  cogul: boolean;
}
const iller = Object.values(harita.iller) as { ad: string; bim: string; idare_mahkemesi: string }[];
const anahtar = (s: string) => adliSlug(s);
export function idareBilgisi(il: string): IdareBilgisi | undefined {
  const k = iller.find(x => anahtar(x.ad) === anahtar(il));
  if (!k) return undefined;
  const mahkeme = k.idare_mahkemesi.trim();
  return {
    il: k.ad,
    var: anahtar(mahkeme).startsWith(`${anahtar(k.ad)}-idare`),
    mahkeme,
    bolge: k.bim.replace(/\s*B[İI]M$/u, '').trim() + ' Bölge İdare Mahkemesi',
    cogul: /Mahkemeleri/.test(mahkeme),
  };
}
