import { birikimliVergi, yuvarla, type VergiTarifesi } from './vergi';

/** GVK 23/18: istisnanın kümülatif matrahı asgari ücret üzerinden ayrıca yürütülür. */
export function asgariIstisnaCetveli(t: VergiTarifesi, araZamAyi = 0, araBrut = t.asgariBrut) {
  if (!Number.isInteger(araZamAyi) || araZamAyi < 0 || araZamAyi > 12) throw new Error('Ara zam ayını seçin.');
  if (!Number.isFinite(araBrut) || araBrut <= 0 || araBrut > 1e9) throw new Error('Geçerli brüt asgari ücret girin.');
  let kumulatif = 0;
  return Array.from({ length: 12 }, (_, i) => {
    const ay = i + 1;
    const brut = araZamAyi && ay >= araZamAyi ? araBrut : t.asgariBrut;
    const prim = yuvarla(brut * t.isciPrimOrani / 100);
    const matrah = yuvarla(brut - prim);
    const onceki = kumulatif;
    kumulatif = yuvarla(kumulatif + matrah);
    const gelir = yuvarla(birikimliVergi(kumulatif, t) - birikimliVergi(onceki, t));
    const damga = yuvarla(brut * t.damgaOrani / 1000);
    return { ay, brut, prim, matrah, kumulatif, gelir, damga, net: matrah };
  });
}
