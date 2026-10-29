import { tatilGunleri } from './tatil-veri';
import { tebligat } from './tebligat-veri';
import { ayarlar } from './settings';

// Masaüstü uygulamaları (KesinlesmeApp, Müdürün Dolabı Mini, Dolap, Yargılama Gideri) ve eski sayfalar WordPress'teki
// JSON adreslerini okur. Bu uçlar aynı adreslerde, aynı biçimde, sitenin tek veri kaynaklarından üretilir.
// Biçim değişirse uygulamalar bozulur: alan adlarına ve tarih biçimine dokunmayın.
const json = (veri: unknown) => new Response(JSON.stringify(veri, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });

// {"data":[{"id":"1","tur":"1","tarih":"1.01.2024","aciklama":"Yılbaşı Tatili"}]}; tur "1" tam gün, "2" yarım gün.
// Aynı güne denk gelen iki tatil uygulamalar için tek satırdır (tatilGunleri).
export const tatillerYaniti = () => json({
  data: tatilGunleri.map((t, i) => {
    const [y, a, g] = t.tarih.split('-');
    return { id: String(i + 1), tur: t.yarim ? '2' : '1', tarih: `${Number(g)}.${a}.${y}`, aciklama: t.ad };
  }),
});

// {"version","currency","tables":{"posta":[{"amount","from","to"}]}}; eski YTL satırında "currency" bulunur.
export const tebligatlarYaniti = () => json({
  version: tebligat.surum,
  currency: 'TRY',
  tables: Object.fromEntries(Object.entries(tebligat.tablolar).map(([ad, satirlar]) => [ad,
    satirlar.map(s => ({ amount: s.tutar, from: s.baslangic, to: s.bitis, ...(s.para && s.para !== 'TRY' ? { currency: s.para } : {}) }))])),
});

// Eski yönetim panelinin katsayilar.json biçimi: "suan" en son dönem, "farkkatsayilar" 14 günlük fark.
export const katsayilarYaniti = () => {
  const d = [...ayarlar.donemler].sort((a, b) => b.baslangic.localeCompare(a.baslangic))[0];
  const bos = (durum: string, enflasyon: number | string = '0') => ({ durum, enflasyon });
  const k = { aylik_katsayi: d.memur_maas_aylik_katsayi, taban_ayligi_katsayi: d.taban_aylik_katsayi, yan_odeme_katsayi: d.yan_odeme_katsayi };
  const fark = d.fark14 ? { aylik_katsayi: d.fark14.aylik_katsayi, taban_ayligi_katsayi: d.fark14.taban_ayligi_katsayi, yan_odeme_katsayi: d.fark14.yan_odeme_katsayi } : k;
  return json([
    { durum: 'eski', enflasyon: 1, aylik_katsayi: 0, taban_ayligi_katsayi: 0, yan_odeme_katsayi: 0, gelir_vergisi_istisna: 0, damga_vergisi_istisna: 0, asgari_ucret: 0 },
    { durum: 'suan', enflasyon: 1, ...k, gelir_vergisi_istisna: d.gelir_vergisi_istisna, damga_vergisi_istisna: d.damga_vergisi_istisna, asgari_ucret: d.asgari_ucret },
    bos('fark'), bos('toplu_sozlesme_1'), bos('toplu_sozlesme_2'), bos('toplu_sozlesme_3'), bos('toplu_sozlesme_4'), bos('beklenti', '33'),
    { durum: 'farkkatsayilar', enflasyon: 1, ...fark, gelir_vergisi_istisna: 0, damga_vergisi_istisna: 0 },
    { durum: 'farkkatsayilarenf', enflasyon: 1, ...fark, gelir_vergisi_istisna: 0, damga_vergisi_istisna: 0 },
  ]);
};
