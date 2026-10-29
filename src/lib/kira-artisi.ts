import { yuvarla } from './vergi';

// Kira artışı (TBK m.344): yenilenen kira yılındaki artış, bir önceki kira yılının TÜFE on iki aylık ortalama
// değişimini geçemez. Yenileme ayından önceki ayın oranı kullanılır. Sözleşmede daha düşük oran varsa o uygulanır.
// Konutta 11.06.2022–01.07.2024 arasındaki %25 sınırı sona erdiği için veri 2025 ve sonraki yenilemeleri kapsar.
export const oncekiAy = (yenileme: string) => {
  const [y, a] = yenileme.split('-').map(Number);
  return a === 1 ? `${y - 1}-12` : `${y}-${String(a - 1).padStart(2, '0')}`;
};
export function kiraArtisi(g: { kira: number; yenileme: string; sozlesmeOrani?: number | null }, aylar: Record<string, number>) {
  if (!(g.kira > 0)) throw new Error('Mevcut aylık kirayı girin.');
  if (!/^\d{4}-\d{2}$/.test(g.yenileme)) throw new Error('Yenileme ayını seçin.');
  const donem = oncekiAy(g.yenileme), tufe = aylar[donem];
  if (tufe === undefined) throw new Error(`${donem} ayının TÜFE on iki aylık ortalaması henüz açıklanmadı ya da kayıtlı değil.`);
  if (g.sozlesmeOrani != null && !(g.sozlesmeOrani >= 0)) throw new Error('Sözleşmedeki oran sıfır ya da pozitif olmalıdır.');
  const oran = g.sozlesmeOrani != null ? Math.min(g.sozlesmeOrani, tufe) : tufe;
  const artis = yuvarla(g.kira * oran / 100);
  return { donem, tufe, oran, sinirlandi: g.sozlesmeOrani != null && g.sozlesmeOrani > tufe, artis, yeniKira: yuvarla(g.kira + artis) };
}
