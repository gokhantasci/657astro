// Türkçe sayı biçimleri. Sayfa (derleme) ve tarayıcı betikleri aynı çıktıyı üretsin diye tek yerde.
const sayi = (basamak: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: basamak, maximumFractionDigits: basamak });
const iki = sayi(2);
const alti = sayi(6);

export const yuzde = (v: number) => `%${iki.format(v)}`;
export const tl = (v: number) => `${iki.format(v)} TL`;
export const katsayi = (v: number) => alti.format(v);
export const ondalik = (v: number) => iki.format(v);
// Canlıdaki parseNum kuralı: "1.500,50" → 1500.5, "1,5" → 1.5, "1.500" → 1500, "1.000.000" → 1000000, "1.5" → 1.5. Boş alan 0 sayılır.
export const sayiOku = (s: string) => {
  let t = s.trim().replace(/\s/g, '').replace(/₺|TL$/i, '');
  if (t === '') return 0;
  if (t.includes('.') && t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (t.includes(',')) t = t.replace(',', '.');
  // Yalnızca binlik ayracı noktalar: "1.500", "1.000.000". ("1.5" ondalık kalır.)
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  return Number(t);
};
// "2026-07-01" → "01/07/2026". Sitede görünen bütün takvim tarihleri bu biçimdedir; ISO yalnızca datetime ve veri içindir.
export const gun = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
export const donemAraligi = (d: { baslangic: string; bitis: string }) => `${gun(d.baslangic)} – ${gun(d.bitis)}`;
/** Tamamı büyük harfle girilmiş başlıkları her kelimenin ilk harfi büyük olacak biçimde yazar ("TURİST ÖMERİ" → "Turist Ömeri").
 *  Cümle düzeni özel adları bozacağı için seçilmedi; karışık yazımlı metin olduğu gibi kalır. */
export const buyukHarfDuzelt = (s: string) => {
  const t = s.trim();
  if (!/\p{L}/u.test(t) || t !== t.toLocaleUpperCase('tr-TR') || t.replace(/[^\p{L}]/gu, '').length < 4) return t;
  return t.toLocaleLowerCase('tr-TR').replace(/(^|[\s(\-"“'‘/.])(\p{L})/gu, (_, on: string, h: string) => on + h.toLocaleUpperCase('tr-TR'));
};
