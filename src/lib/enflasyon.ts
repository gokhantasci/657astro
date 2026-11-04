// Enflasyon farkı hesabı. Saf fonksiyon: derlemede (betiksiz sonuç için) ve tarayıcıda aynı kod çalışır.
// Mantık canlı sitedeki assets/js/enflasyon-farki.js ile aynıdır; tek fark aşağıdaki "farkUygulanan" notudur.

export interface EnflasyonGirdi {
  bazEndeks: number;          // Dönemden önceki ayın endeksi (ör. Haziran 2026)
  topluSozlesmeZam: number;   // Dönem başında yapılan zam, %
  sonrakiZam: number;         // Bir sonraki dönem başında yapılacak zam, %
  aylar: { degisim: number; endeks?: number }[]; // Altı ay; resmî aylarda TÜİK endeksi de verilir
}
export interface KatsayiSeti {
  memur_maas_aylik_katsayi: number;
  taban_aylik_katsayi: number;
  yan_odeme_katsayi: number;
  asgari_ucret: number;
  damga_orani_binde?: number;
}
export interface Sabitler {
  bedelli_askerlik_gosterge: number;
  yeni_bedelli_askerlik_gosterge: number;
  sonraki_bedelli_askerlik_gosterge?: number;
  muhtar_gosterge: number;
  seyyanen_zam_gosterge: number;
}

// Kuruşa yukarı yuvarlama (canlıdaki rakamUp).
export const yukariYuvarla = (v: number, basamak: number) => Math.ceil(v * 10 ** basamak) / 10 ** basamak;

export function enflasyonFarki(g: EnflasyonGirdi, k: KatsayiSeti, s: Sabitler) {
  if (!(g.bazEndeks > 0)) throw new Error('Baz endeks bulunamadı.');
  let endeks = g.bazEndeks;
  let aylikToplam = 0;
  const aylikEndeksler: number[] = [];
  for (const ay of g.aylar) {
    if (!Number.isFinite(ay.degisim) || ay.degisim <= -100) throw new Error('Aylık TÜFE değişimi −%100’den büyük, geçerli bir sayı olmalı.');
    aylikToplam += ay.degisim;
    endeks = ay.endeks && ay.endeks > 0 ? ay.endeks : endeks * (1 + ay.degisim / 100);
    aylikEndeksler.push(endeks);
  }
  const endeksArtisi = (endeks / g.bazEndeks) * 100 - 100;
  const fark = Number(((((endeks / g.bazEndeks) * 100) / (100 + g.topluSozlesmeZam)) * 100 - 100).toFixed(2));
  // Canlı sürümde fark negatifken de kümülatif zam negatif farkla hesaplanıyordu; enflasyon farkı eksiye
  // düşmediği için katsayı projeksiyonunda yalnızca pozitif fark uygulanır.
  const farkUygulanan = Math.max(fark, 0);
  const kumulatifZam = 100 * (1 + farkUygulanan / 100) * (1 + g.sonrakiZam / 100) - 100;
  const gerekenEnflasyon = fark > 0 ? 0 : ((g.bazEndeks * (100 + g.topluSozlesmeZam)) / endeks) - 100;
  const carpan = 1 + yukariYuvarla(kumulatifZam, 2) / 100;
  const aylik = k.memur_maas_aylik_katsayi;
  const yeniAylik=Number((aylik*carpan).toFixed(6)),yeniTaban=Number((k.taban_aylik_katsayi*carpan).toFixed(6)),yeniYan=Number((k.yan_odeme_katsayi*carpan).toFixed(6));
  const muhtarNet=(a:number)=>{const brut=Math.round(s.muhtar_gosterge*a*100)/100;return brut-Math.round(brut*(k.damga_orani_binde??7.59)/1000*100)/100;};
  return {
    sonEndeks: endeks,
    aylikEndeksler,
    aylikToplam: yukariYuvarla(aylikToplam, 2),
    endeksArtisi,            // SGK ve Bağ-Kur emeklilerine beklenen zam
    fark,                    // Enflasyon farkı, %
    gerekenEnflasyon,        // Fark oluşması için gereken ek enflasyon, %
    kumulatifZam: yukariYuvarla(kumulatifZam, 2),
    yeni: {
      aylik: yeniAylik,
      taban: yeniTaban,
      yanOdeme: yeniYan,
      bedelli: (s.sonraki_bedelli_askerlik_gosterge??s.bedelli_askerlik_gosterge) * yeniAylik,
      yeniBedelli: s.yeni_bedelli_askerlik_gosterge * yeniAylik,
      muhtar: Math.max(muhtarNet(yeniAylik), k.asgari_ucret),
      muhtarAsgaride: muhtarNet(yeniAylik) < k.asgari_ucret,
      seyyanen: s.seyyanen_zam_gosterge * yeniAylik,
    },
    mevcut: {
      bedelli: s.bedelli_askerlik_gosterge * aylik,
      yeniBedelli: s.yeni_bedelli_askerlik_gosterge * aylik,
      muhtar: Math.max(muhtarNet(aylik), k.asgari_ucret),
      seyyanen: s.seyyanen_zam_gosterge * aylik,
    },
  };
}
export type EnflasyonSonuc = ReturnType<typeof enflasyonFarki>;
