export type CesitliAracTuru =
  | 'aile-cocuk'
  | 'tazminat-5510'
  | 'tazminat-primsiz'
  | 'tazminat-5434'
  | 'engellilik'
  | 'gelistirme'
  | 'emekli-yollugu'
  | 'alacak-faizi';

export interface DonemKatsayi {
  yil: number;
  donem: 1 | 2; // 1: Ocak-Haziran, 2: Temmuz-Aralık
  aylik: number;
  yanOdeme: number;
  taban: number;
}

export const DAMGA_ORANI = 0.00759;
export const MAAS_GOSTERGE = 9500;
export const AILE_GOSTERGE = 2273;
export const COCUK_KUCUK_GOSTERGE = 500;
export const COCUK_BUYUK_GOSTERGE = 250;
export const EMEKLI_YOLLUGU_GOSTERGE = 13558;

export function katsayiBul(liste: DonemKatsayi[], yil: number, ay: number): DonemKatsayi | undefined {
  const donem: 1 | 2 = ay <= 6 ? 1 : 2;
  return liste.find((k) => k.yil === yil && k.donem === donem) ?? liste[0];
}

export function hesaplaAileCocuk(g: {
  aylikKatsayi: number;
  aileYardimiVar: boolean;
  kucukCocuk: number;
  buyukCocuk: number;
  engelliKucuk?: number;
  engelliBuyuk?: number;
}) {
  const aile = g.aileYardimiVar ? g.aylikKatsayi * AILE_GOSTERGE : 0;
  const cocuk =
    g.aylikKatsayi *
    (g.kucukCocuk * COCUK_KUCUK_GOSTERGE +
      g.buyukCocuk * COCUK_BUYUK_GOSTERGE +
      (g.engelliKucuk ?? 0) * 800 +
      (g.engelliBuyuk ?? 0) * 400);
  return { aile, cocuk, net: aile + cocuk };
}

export function hesaplaTazminatFarki(
  kip: '5510' | 'primsiz' | '5434',
  g: {
    aylikKatsayi: number;
    yanOdemeKatsayi: number;
    gun: number;
    ekGostergePuani: number;
    ozelHizmetPuani: number;
    ekOdemePuani: number;
    yanOdemePuani: number;
    vergiOrani: number; // örn 0.15
  }
) {
  const oran = Math.max(0, g.gun) / 30;
  const ekGosterge = g.aylikKatsayi * g.ekGostergePuani * oran;
  const ozelHizmet = MAAS_GOSTERGE * g.aylikKatsayi * (g.ozelHizmetPuani / 100) * oran;
  const ekOdeme = MAAS_GOSTERGE * g.aylikKatsayi * (g.ekOdemePuani / 100) * oran;
  const yanOdeme = g.yanOdemeKatsayi * g.yanOdemePuani * oran;
  const brut = ekGosterge + ozelHizmet + ekOdeme + yanOdeme;
  const damga = brut * DAMGA_ORANI;

  if (kip === 'primsiz') {
    const gelirVergisi = ekGosterge * g.vergiOrani;
    const net = brut - damga - gelirVergisi;
    return {
      ekGosterge,
      ozelHizmet,
      ekOdeme,
      yanOdeme,
      brut,
      gssDevlet: 0,
      emekliDevlet: 0,
      gssKisi: 0,
      emekliKisi: 0,
      toplamPrim: 0,
      damga,
      gelirVergisi,
      net,
    };
  }

  if (kip === '5510') {
    const matrah = ekGosterge + ozelHizmet;
    const gssDevlet = matrah * 0.075;
    const emekliDevlet = matrah * 0.12;
    const gssKisi = matrah * 0.05;
    const emekliKisi = matrah * 0.09;
    const toplamPrim = gssDevlet + emekliDevlet + gssKisi + emekliKisi;
    const gelirVergisi = ekGosterge * g.vergiOrani;
    const net = brut - gssKisi - emekliKisi - damga - gelirVergisi;
    return {
      ekGosterge,
      ozelHizmet,
      ekOdeme,
      yanOdeme,
      brut,
      gssDevlet,
      emekliDevlet,
      gssKisi,
      emekliKisi,
      toplamPrim,
      damga,
      gelirVergisi,
      net,
    };
  }

  // 5434 öncesi
  const emekliDevlet = ekGosterge * 0.2;
  const gssDevlet = ekGosterge * 0.12;
  const emekliKisi = ekGosterge * 0.16;
  const toplamPrim = emekliDevlet + gssDevlet + emekliKisi;
  const gelirVergisi = 0;
  const net = brut - emekliKisi - damga - gelirVergisi;
  return {
    ekGosterge,
    ozelHizmet,
    ekOdeme,
    yanOdeme,
    brut,
    gssDevlet,
    emekliDevlet,
    gssKisi: 0,
    emekliKisi,
    toplamPrim,
    damga,
    gelirVergisi,
    net,
  };
}

export function hesaplaEngellilikIadesi(g: {
  indirimMatrahi: number;
  vergiOrani: number;
  kesilenGelirVergisi: number;
}) {
  const hakEdilen = Math.max(0, g.indirimMatrahi) * Math.max(0, g.vergiOrani);
  const odenecek = Math.min(hakEdilen, Math.max(0, g.kesilenGelirVergisi));
  return { hakEdilen, odenecek };
}

export function hesaplaGelistirmeOdenegi(g: {
  aylikKatsayi: number;
  ekGostergePuani: number;
  odemeAyligiGostergePuani: number;
  oranYuzde: number;
  odenenTutar: number;
}) {
  const odenmesiGereken = (g.ekGostergePuani + g.odemeAyligiGostergePuani) * g.aylikKatsayi * (g.oranYuzde / 100);
  const farkBrut = Math.max(0, odenmesiGereken - Math.max(0, g.odenenTutar));
  const damga = farkBrut * DAMGA_ORANI;
  const net = farkBrut - damga;
  return { odenmesiGereken, farkBrut, damga, net };
}

export function hesaplaEmekliYollugu(g: {
  aylikKatsayi: number;
  gosterge?: number;
}) {
  const gosterge = g.gosterge ?? EMEKLI_YOLLUGU_GOSTERGE;
  const brut = gosterge * g.aylikKatsayi;
  const damga = brut * DAMGA_ORANI;
  const net = brut - damga;
  return { gosterge, brut, damga, net };
}

export function hesaplaAlacakFaiziSatir(g: {
  baslangicIso: string;
  odemeIso: string;
  faizOraniYuzde: number;
  anapara: number;
}) {
  const a = Date.parse(g.baslangicIso + 'T00:00:00Z');
  const b = Date.parse(g.odemeIso + 'T00:00:00Z');
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a || g.faizOraniYuzde < 0 || g.anapara < 0) {
    return { gun: 0, faiz: 0, toplam: Math.max(0, g.anapara), hatali: true };
  }
  const gun = Math.round((b - a) / 86_400_000);
  const faiz = Math.round(((g.anapara * g.faizOraniYuzde * gun) / 36500) * 100) / 100;
  return { gun, faiz, toplam: Math.round((g.anapara + faiz) * 100) / 100, hatali: false };
}
