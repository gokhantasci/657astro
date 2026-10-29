// Ceza kararlarında kesinleşme tarihi (CMK 39/4, CMK 331/4). Kurallar canlıdaki assets/js/kesinlesme.js ile aynıdır;
// bilinçli iki düzeltme var:
//  1. Canlıda tatil ve hafta sonu kaydırması en fazla 3 tur dönüyordu; dört günlük bayram ve ardından gelen hafta
//     sonunda son gün tatilde kalabiliyordu. Burada iş gününe ulaşana kadar kaydırılır.
//  2. Ay ile verilen sürede karşılık gün yoksa (31 Ocak + 1 ay) süre ayın son günü biter; canlıda 3 Mart oluyordu.
// Adli tatil (20 Temmuz - 31 Ağustos) her tarihin kendi yılına göre denetlenir.

export interface Tatil { tarih: string; yarim: boolean; ad: string }
export type SureTuru = 'gun' | 'hafta' | 'ay';
export interface Not { metin: string; baglanti?: { href: string; metin: string } }

export const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const iki = (n: number) => String(n).padStart(2, '0');
// Tarihler UTC gece yarısı olarak tutulur; yaz saati ve saat dilimi farkı hesabı bozmaz.
export const isoOku = (s: string) => { const [y, a, g] = s.split('-').map(Number); return new Date(Date.UTC(y, a - 1, g)); };
export const iso = (d: Date) => `${d.getUTCFullYear()}-${iki(d.getUTCMonth() + 1)}-${iki(d.getUTCDate())}`;
export const noktali = (d: Date) => `${iki(d.getUTCDate())}.${iki(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
export const gunEkle = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
export const gunAdi = (d: Date) => GUNLER[d.getUTCDay()];
function ayEkle(d: Date, n: number) {
  const y = d.getUTCFullYear(), a = d.getUTCMonth() + n;
  const sonGun = new Date(Date.UTC(y, a + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, a, Math.min(d.getUTCDate(), sonGun)));
}
const adliTatilde = (d: Date) => {
  const y = d.getUTCFullYear();
  return d >= new Date(Date.UTC(y, 6, 20)) && d <= new Date(Date.UTC(y, 7, 31));
};
const YARGITAY = { href: '/tebligin-son-gunu-yarim-gun-tatile-denk-gelirse-surenin-uzayacagi-karari/', metin: 'Yargıtay kararı' };

export function kesinlesme(tebligIso: string, sayi: number, tur: SureTuru, tatiller: Tatil[]) {
  const notlar: Not[] = [];
  const tatil = new Map(tatiller.map(t => [t.tarih, t]));
  let teblig = isoOku(tebligIso);
  if (adliTatilde(teblig)) {
    const y = teblig.getUTCFullYear();
    notlar.push({ metin: `${noktali(teblig)} günü adli tatil içerisine denk geldiğinden, tebliğ tarihini adli tatilin bitiş tarihi olan 01.09.${y} olarak esas almak gerekmiştir.` });
    teblig = new Date(Date.UTC(y, 8, 1));
  }
  let son = tur === 'ay' ? ayEkle(teblig, sayi) : gunEkle(teblig, tur === 'hafta' ? 7 * sayi : sayi);
  for (let tur2 = 0; tur2 < 60; tur2++) {
    const once = son.getTime();
    if (adliTatilde(son)) {
      notlar.push({ metin: `${noktali(son)} günü adli tatil içerisine denk geldiğinden, CMK 331/4 maddesi uyarınca adli tatile rastlayan süreler işlemez; bu süreler adli tatilin bittiği günden itibaren üç gün uzatılmış sayılır.` });
      son = new Date(Date.UTC(son.getUTCFullYear(), 8, 3));
    }
    const gun = son.getUTCDay();
    if (gun === 6 || gun === 0) {
      notlar.push({ metin: `${noktali(son)} günü ${gunAdi(son)} olduğundan, CMK 39/4 uyarınca son gün bir tatile rastlarsa süre, tatilin ertesi günü biter.` });
      son = gunEkle(son, gun === 6 ? 2 : 1);
    }
    const t = tatil.get(iso(son));
    if (t) {
      notlar.push(t.yarim
        ? { metin: `${noktali(son)} tarihi ${t.ad} yarım gün resmî tatil olsa da Yargıtay Ceza Genel Kurulunun 22.06.2022 tarihli, 2020/255 E., 2022/365 K. sayılı kararına göre süre tatilin bitimine uzar.`, baglanti: YARGITAY }
        : { metin: `${noktali(son)} günü ${t.ad} olduğundan, CMK 39/4 uyarınca son gün bir tatile rastlarsa süre, tatilin ertesi günü biter.` });
      son = gunEkle(son, 1);
    }
    if (son.getTime() === once) break;
  }
  const kesin = gunEkle(son, 1);
  return { teblig, son, kesin, notlar };
}

// Kesinleşme tarihi ile bugün arasındaki gün farkı (pozitif: gelecekte).
export const gunFarki = (kesin: Date, bugun: Date) =>
  Math.round((kesin.getTime() - Date.UTC(bugun.getFullYear(), bugun.getMonth(), bugun.getDate())) / 86400000);
