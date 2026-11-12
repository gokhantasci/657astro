// Memur maaş sonucunu kurum bordrosunun düzenine çevirir; hesap yapmaz, yalnız memurMaas çıktısını yeniden dizer.
// Bordroda devletin ödediği paylar (emekli keseneği karşılığı, GSS devlet payı) hem gelire hem kesintiye yazılır;
// net tutar değişmez. İl adalet tazminatı bordroda özel hizmet tazminatı satırının içinde gösterilir.
import { tl } from './bicim';
import type { MaasGirdi, MaasParametreleri, Satir } from './memur-maas';

export interface BordroSatiri { ad: string; oran: string; tutar: number }
export interface Bordro {
  personel: { ad: string; deger: string }[];
  gelirler: BordroSatiri[];
  kesintiler: BordroSatiri[];
  gelirToplami: number; kesintiToplami: number; net: number;
  vergi: { ad: string; deger: string }[];
}
interface Sonuc {
  gelirler: Satir[]; kesintiler: Satir[]; net: number; vergiMatrahi: number; gvKullanilanIstisna: number; dvKullanilanIstisna: number;
  primMatrahi: number; ekGosterge: number; dereceGosterge: number;
}
export interface BordroBaglami { unvanAd: string; yil: number; ayAd: string; farkMi?: boolean }

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function bordroOlustur(r: Sonuc, g: MaasGirdi, p: Pick<MaasParametreleri, 'memur_emekli_karsiligi_5510_oran' | 'memur_gss_devlet_5510_oran' | 'memur_emekli_karsiligi_5434_oran'>, b: BordroBaglami): Bordro {
  const kullanilan = new Set<string>();
  const al = (liste: Satir[], ...adlar: string[]) => {
    let tutar = 0, oran = '';
    for (const ad of adlar) for (const s of liste) if (s.ad === ad) { tutar += s.tutar; oran = oran || s.oran; kullanilan.add(`${liste === r.gelirler ? 'g' : 'k'}:${ad}`); }
    return { tutar: r2(tutar), oran };
  };
  const emekliOran = g.kanun === 5510 ? (p.memur_emekli_karsiligi_5510_oran ?? 12) : (p.memur_emekli_karsiligi_5434_oran ?? 20);
  const gssOran = g.kanun === 5510 ? (p.memur_gss_devlet_5510_oran ?? 7.5) : 0;
  const emekliKarsiligi = r2(r.primMatrahi * emekliOran / 100), gssDevlet = r2(r.primMatrahi * gssOran / 100);

  const ohl = al(r.gelirler, 'Özel hizmet tazminatı'), il = al(r.gelirler, 'İl adalet hizmetleri tazminatı');
  const ek = al(r.gelirler, 'Ek ödeme', 'Sabit ek ödeme (net korumalı brüt)');
  const makam = al(r.gelirler, 'Makam / görev tazminatı', 'Temsil tazminatı');
  const satir = (ad: string, x: { tutar: number; oran?: string }): BordroSatiri => ({ ad, oran: x.oran ?? '', tutar: x.tutar });
  const gelirler: BordroSatiri[] = [
    satir('Aylık tutar', al(r.gelirler, 'Gösterge aylığı')),
    satir('Ek gösterge', al(r.gelirler, 'Ek gösterge aylığı')),
    satir('Taban aylık', al(r.gelirler, 'Taban aylığı')),
    satir('Kıdem aylık', al(r.gelirler, 'Kıdem aylığı')),
    satir('Yan ödeme', al(r.gelirler, 'Yan ödeme aylığı')),
    { ad: 'Emekli keseneği karşılığı (devlet payı)', oran: `%${emekliOran}`, tutar: emekliKarsiligi },
    { ad: 'Genel sağlık sigortası primi (devlet payı)', oran: gssOran ? `%${String(gssOran).replace('.', ',')}` : '', tutar: gssDevlet },
    satir('Aile yardımı (eş)', al(r.gelirler, 'Aile yardımı (eş)')),
    satir('Çocuk yardımı', al(r.gelirler, 'Aile yardımı (çocuk)')),
    { ad: 'Özel hizmet tazminatı', oran: il.tutar ? `${ohl.oran} + ${il.oran} il adalet` : ohl.oran, tutar: r2(ohl.tutar + il.tutar) },
    satir('Dil tazminatı', al(r.gelirler, 'Dil tazminatı')),
    satir('Makam / görev tazminatı', makam),
    satir('Ek ödeme (666 KHK)', ek),
    satir('Toplu sözleşme ikramiyesi', al(r.gelirler, 'Toplu sözleşme ikramiyesi')),
    satir('İlave ödeme (375 KHK madde 40)', al(r.gelirler, '375 SK ek madde 40 (seyyanen)')),
  ];
  // Bordro şablonunda yeri olmayan kalemler (denetim, ek tazminat, fazla mesai vb.) varsa adıyla eklenir.
  for (const s of r.gelirler) if (!kullanilan.has(`g:${s.ad}`)) gelirler.push({ ad: s.ad, oran: s.oran, tutar: s.tutar });

  const kesintiler: BordroSatiri[] = [
    satir('Gelir vergisi', al(r.kesintiler, 'Gelir vergisi')),
    satir('Damga vergisi', al(r.kesintiler, 'Damga vergisi')),
    { ad: 'Emekli keseneği (devlet)', oran: `%${emekliOran}`, tutar: emekliKarsiligi },
    satir('Emekli keseneği (kişi)', al(r.kesintiler, 'Emekli keseneği')),
    { ad: 'Genel sağlık sigortası primi (devlet)', oran: gssOran ? `%${String(gssOran).replace('.', ',')}` : '', tutar: gssDevlet },
    satir('Genel sağlık sigortası primi (kişi)', al(r.kesintiler, 'GSS primi')),
    satir('Sendika aidatı', al(r.kesintiler, 'Sendika kesintisi')),
  ];
  for (const s of r.kesintiler) if (!kullanilan.has(`k:${s.ad}`)) kesintiler.push({ ad: s.ad, oran: s.oran, tutar: s.tutar });

  const toplam = (l: BordroSatiri[]) => r2(l.reduce((t, s) => t + s.tutar, 0));
  const cocuk = g.cocuk.kucuk + g.cocuk.buyuk + g.cocuk.engelliKucuk + g.cocuk.engelliBuyuk;
  return {
    personel: [
      { ad: 'Ünvan', deger: b.unvanAd },
      { ad: 'Derece / kademe', deger: g.derece },
      { ad: 'Kıdem (yıl)', deger: String(g.hizmetYili) },
      { ad: 'Eş durumu / çocuk sayısı', deger: `${g.esCalismiyor ? 'Eş çalışmıyor' : 'Eş çalışıyor ya da yok'} / ${cocuk}` },
      { ad: 'Gösterge', deger: String(r.dereceGosterge).replace('.', ',') },
      { ad: 'Ek gösterge', deger: String(r.ekGosterge) },
      { ad: 'Bütçe yılı / ay', deger: `${b.yil} / ${b.ayAd}` },
    ],
    gelirler, kesintiler,
    gelirToplami: toplam(gelirler), kesintiToplami: toplam(kesintiler), net: r.net,
    vergi: [
      { ad: 'Aylık vergi matrahı', deger: tl(r.vergiMatrahi) },
      { ad: 'Geçen aylar vergi matrahı toplamı', deger: tl(g.oncekiMatrah ?? 0) },
      { ad: 'Asgari geçim indirimi tutarı', deger: tl(0) },
      { ad: 'Gelir vergisi istisna tutarı', deger: tl(r.gvKullanilanIstisna) },
      { ad: 'Damga vergisi istisna tutarı', deger: tl(r.dvKullanilanIstisna) },
    ],
  };
}
