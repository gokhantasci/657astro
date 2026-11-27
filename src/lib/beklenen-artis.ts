import { ayarlar, getKatsayilar } from './settings';
import { enflasyon, ayAdi, donemBaslangici } from './enflasyon-veri';
import { aylikBeklenti, beklentiler } from './enflasyon-beklentileri';
import { enflasyonFarki } from './enflasyon';

const k = {
  ...getKatsayilar(donemBaslangici()),
  damga_orani_binde: ayarlar.maas_parametreleri.damga_vergisi_oran_binde,
};

const girdi = {
  bazEndeks: enflasyon.baz_endeks.deger,
  topluSozlesmeZam: enflasyon.toplu_sozlesme.zam,
  sonrakiZam: enflasyon.sonraki_zam.zam,
  aylar: enflasyon.aylar.map((a) => ({
    degisim: a.degisim ?? aylikBeklenti(a.yil, a.ay) ?? 0,
    endeks: a.endeks,
  })),
};

const sonuc = enflasyonFarki(girdi, k, ayarlar.sabitler);
const resmiAy = enflasyon.aylar.filter((a) => a.endeks !== undefined).length;
const sonrakiAy = ayAdi(enflasyon.sonraki_zam);

export const beklenenArtis = {
  sonrakiAy,
  resmiAy,
  toplamAy: enflasyon.aylar.length,
  fark: sonuc.fark,
  topluSozlesmeZam: enflasyon.sonraki_zam.zam,
  kumulatifZam: sonuc.kumulatifZam,
  carpan: 1 + sonuc.kumulatifZam / 100,
  mevcutAylikKatsayi: k.memur_maas_aylik_katsayi,
  beklenenAylikKatsayi: sonuc.yeni.aylik,
  beklenenTabanKatsayi: sonuc.yeni.taban,
  beklenenYanOdemeKatsayi: sonuc.yeni.yanOdeme,
  beklentiTarihi: beklentiler.tarih,
};
