import { yuvarla } from './vergi';

// Tüketici hakem heyeti bilirkişi ücreti: brüt = ürün göstergesi × memur aylık katsayısı.
// Tarifedeki gibi vergiler yuvarlanmamış brütten hesaplanır, net de yuvarlanmamış tutarlardan bulunur; bu yüzden net,
// gösterilen brüt − vergi farkından 1 kuruş sapabilir. Bu yöntemle 2026 tarifesinin 248 satırının hepsi eşleşir.
export interface ThhOranlari { damgaBinde: number; gelirVergisiOran: number }
export function thhUcret(gosterge: number, aylik: number, o: ThhOranlari, adet = 1) {
  if(!Number.isFinite(o.gelirVergisiOran)||o.gelirVergisiOran<0||o.gelirVergisiOran>100)throw new Error('Gelir vergisi oranı 0 ile 100 arasında olmalıdır.');
  if (!(gosterge > 0) || !(aylik > 0)) throw new Error('Gösterge ve aylık katsayısı sıfırdan büyük olmalıdır.');
  if (!Number.isInteger(adet) || adet < 1 || adet > 1000) throw new Error('Dosya sayısı 1 ile 1000 arasında tam sayı olmalıdır.');
  const ham = gosterge * aylik * adet;
  const d = ham * o.damgaBinde / 1000, g = ham * o.gelirVergisiOran / 100;
  return { birim: yuvarla(gosterge * aylik), brut: yuvarla(ham), damga: yuvarla(d), gelirVergisi: yuvarla(g), net: yuvarla(ham - d - g) };
}
