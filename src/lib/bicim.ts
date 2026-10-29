// Türkçe sayı biçimleri. Sayfa (derleme) ve tarayıcı betikleri aynı çıktıyı üretsin diye tek yerde.
const sayi = (basamak: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: basamak, maximumFractionDigits: basamak });
const iki = sayi(2);
const alti = sayi(6);

export const yuzde = (v: number) => `%${iki.format(v)}`;
export const tl = (v: number) => `${iki.format(v)} TL`;
export const katsayi = (v: number) => alti.format(v);
export const ondalik = (v: number) => iki.format(v);
// Canlıdaki parseNum kuralı: "1.500,50" → 1500.5, "1,5" → 1.5, "1.500" → 1500, "1.5" → 1.5. Boş alan 0 sayılır.
export const sayiOku = (s: string) => {
  let t = s.trim().replace(/\s/g, '').replace(/₺|TL$/i, '');
  if (t === '') return 0;
  if (t.includes('.') && t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (t.includes(',')) t = t.replace(',', '.');
  else if (/^\d+\.\d{3}$/.test(t)) t = t.replace('.', '');
  return Number(t);
};
// "2026-07-01" → "01.07.2026". Sitede görünen bütün takvim tarihleri bu biçimdedir; ISO yalnızca datetime ve veri içindir.
export const gun = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');
export const donemAraligi = (d: { baslangic: string; bitis: string }) => `${gun(d.baslangic)} – ${gun(d.bitis)}`;
