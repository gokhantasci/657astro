// Memur maaşı hesabı. Canlıdaki assets/js/memur-maas-2025.js → yenimaashesapla() fonksiyonunun DOM'dan
// arındırılmış ilk aktarımı temel alır. 2026 düzeltmeleri docs/maas-saglama.md'de kayıtlıdır.
// Bilinçli farklar:
//  - Oranı tanımlı olmayan unvanda (Cezaevi Müdürü özel +13, kod 11) sonuç NaN yerine `eksik` alanında bildirilir.
//  - Öğretmen alan/alt görev listeleri HTML'deki name alanından aktarılmıştır.
// Ayniyat Saymanı ile Veznedar kaynak veride aynı kodu (23) taşır.
// 2026 doğrulaması: katsayılar HMB genelgesinden, kümülatif vergi GİB tarifesinden alınır.

export interface DereceSatiri {
  derece: string; gosterge: number; ek_gosterge_uni: number; ek_gosterge_digerleri: number; ek_gosterge_mudur: number;
  ek_odeme_ayligi_mudur: number; ek_odeme_ayligi_mubasir: number; ek_odeme_ayligi_katip: number;
  yan_odeme_mudur: number; yan_odeme_memur: number; yan_odeme_mubasir: number; yan_odeme_katip: number;
  ozel_hizmet_tazminat_mudur: number; ozel_hizmet_tazminat_katip: number; ozel_hizmet_tazminat_mubasir: number;
  ozel_hizmet_tazminat_memur: number; ozel_hizmet_tazminat_ikm: number; ozel_hizmet_guvenlik: number;
}
export interface UnvanOdemeKurali {dereceler:Record<string,{ekGosterge:number;yanOdeme:number;ozelHizmet:number;ekOdeme:number;denetim?:number;ekTazminat?:number;netEkOdeme?:boolean;universite?:number;egitimOgretim?:number;yuksekogretim?:number;fazlaMesai?:number;tayin?:number;makamGorev?:number;temsil?:number;temsilNominal?:number;tazminatPrimGostergesi?:number}>;adalet:boolean;mezuniyet:1|2;aciklama?:string;}
export interface MaasParametreleri {
  unvanKurallari?:Record<number,UnvanOdemeKurali & {legacyDefault?:boolean;varyantlar?:Record<string,UnvanOdemeKurali & {ad:string}>}>;
  es_yardimi_gosterge: number; sendika_uye_gosterge: number; tasinir_yetkili_gosterge: number; taban_ayligi_gosterge: number;
  maas_hesaplama_gosterge: number; seyyanen_zam_gosterge: number; kidem_ayligi_gosterge: number;
  cocuk_0_6_gosterge: number; cocuk_6_ust_gosterge: number; engelli_cocuk_0_6_gosterge: number; engelli_cocuk_6_ust_gosterge: number;
  gorev_yeri_istanbul_oran: number; gorev_yeri_buyuksehir_oran: number; gorev_yeri_diger_oran: number;
  yabanci_dil_a_gosterge: number; yabanci_dil_b_gosterge: number; yabanci_dil_c_gosterge: number; yabanci_dil_d_gosterge: number;
  yabanci_dil_kurum_yararlandigi:{A1:number;A2:number;B:number;C:number};
  gelir_vergisi_oran: number; damga_vergisi_oran_binde: number; sendika_kesinti_oran: number; bes_oran: number; ilksan_oran: number;
  haciz_damga_oran: number; memur_sendika_ikramiye_gosterge: number; memur_tayin_bedeli_gosterge: number;
  memur_fazla_mesai_icra_muduru_oran: number; memur_fazla_mesai_icra_mudur_yardimcisi_oran: number;
  memur_emekli_kesenek_5510_oran: number; memur_gss_5510_oran: number; memur_emekli_kesenek_5434_oran: number;
  emekli_ozel_hizmet_dilimleri: {enAz:number;oran:number}[];
}
import { aylikVergi, birikimliVergi, vergiIstisnasi, yuvarla, type VergiTarifesi } from './vergi';
export interface MaasKatsayilari { aylik: number; taban: number; yanOdeme: number; gelirVergisiIstisna: number; damgaVergisiIstisna: number; vergi?:VergiTarifesi }
export interface MaasGirdi {
  kip: 'maas' | 'fark14';         // aylık maaş ya da 14 günlük maaş farkı
  unvan: number;
  unvanKosulu?:string;
  derece: string;                  // "13/3"
  hizmetYili: number;
  mezuniyet: 1 | 2;                // 1: önlisans/lisans, 2: lise ve diğer
  esCalismiyor: boolean;
  cocuk: { kucuk: number; buyuk: number; engelliKucuk: number; engelliBuyuk: number };
  sendika: boolean; polsan: boolean; ilksan: boolean; tasinirYetkili: boolean; bes: boolean;
  besOran?:number;
  gorevYeri: 'istanbul' | 'buyuksehir' | 'diger';
  yabanciDil: '' | 'A' | 'A1' | 'A2' | 'B' | 'C' | 'D';
  dilKurumYararlaniyor?:boolean;
  kanun: 5510 | 5434;
  haciz: number;
  /** Eski kayıtlar asıl tutardır; bordrodan doğrudan kesinti girişinde false. */
  hacizHarcEkle?:boolean;
  ay?:number; oncekiMatrah?:number; kullanilanGvIstisna?:number; kullanilanDvIstisna?:number; engellilikDerecesi?:number;
  gelirVergisiOrani?:number;
  ogretmen?: { kariyer: 1 | 2 | 3; belletici: boolean; altGorev?: number; alan?: number };
}
export interface Satir { ad: string; oran: string; tutar: number }

// toFixed ikili kayan nokta yüzünden ör. 1990,455'i aşağı yuvarlayabiliyordu.
const r2 = yuvarla;
export function netEkOdemeBrutu(nominal:number,matrah:number,onceki:number,damgaOrani:number,vergi?:VergiTarifesi,sabitOran?:number){
 const hedef=r2(nominal*(1-damgaOrani/1000));
 if(sabitOran!==undefined)return r2(hedef/(1-sabitOran/100-damgaOrani/1000));
 if(!vergi)throw new Error('Net korunan ek ödeme için vergi tarifesi gerekli.');
 const taban=birikimliVergi(onceki+Math.max(0,matrah),vergi);
 let alt=0,ust=hedef*3;
 for(let i=0;i<60;i++){const orta=(alt+ust)/2,net=orta-(birikimliVergi(onceki+Math.max(0,matrah)+orta,vergi)-taban)-orta*damgaOrani/1000;if(net<hedef)alt=orta;else ust=orta;}
 return r2((alt+ust)/2);
}
const dereceNo = (d: string) => Number(d.split('/')[0]);
const sayiYaz = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '')).replace('.', ',');

// Unvan ve kadro derecesine göre ek gösterge. Emekli hesabı da aynı kuralı kullanır (diger-maas.ts).
// Doğrulanmış unvan kuralında o derece ya da öğrenim yoksa null döner.
export function unvanEkGostergesi(g: Pick<MaasGirdi, 'unvan' | 'unvanKosulu' | 'derece' | 'mezuniyet'>, p: Pick<MaasParametreleri, 'unvanKurallari'>, dereceler: DereceSatiri[]): number | null {
  const d = dereceler.find(x => x.derece === g.derece);
  if (!d) throw new Error(`Derece/kademe bulunamadı: ${g.derece}`);
  const u = g.unvan, dn = dereceNo(g.derece), anaKural = p.unvanKurallari?.[u];
  if (g.unvanKosulu && !anaKural?.varyantlar?.[g.unvanKosulu]) return null;
  const ekUnvan = g.unvanKosulu ? anaKural!.varyantlar![g.unvanKosulu] : anaKural?.legacyDefault?undefined:anaKural, ekKural = ekUnvan?.dereceler[String(dn)];
  if (ekUnvan && (!ekKural || g.mezuniyet !== ekUnvan.mezuniyet)) return null;
  if (ekKural) return ekKural.ekGosterge;
  if ([1, 4, 5, 10, 11, 12, 17, 39, 40, 47, 48].includes(u)) return d.ek_gosterge_mudur;
  if ([19, 24, 26, 27, 42].includes(u)) return dn <= 4 ? 600 : 0;
  if (u === 32 || u === 34) return g.mezuniyet === 1 ? d.ek_gosterge_mudur : d.ek_gosterge_digerleri;
  if (u === 50) return ({ 1: 3600, 2: 3000, 3: 2200, 4: 2100, 5: 1800, 6: 1700, 7: 1500, 8: 1400 } as Record<number, number>)[dn] ?? 0;
  return g.mezuniyet === 1 ? d.ek_gosterge_uni : d.ek_gosterge_digerleri;
}
// 5434 ek 70, 7417/2 ile 15.01.2023'ten itibaren geçerli yedi basamak.
// Eski üçlü kural 2201–2799 aralığını ve 5400 üzerini yanlış sınıflandırıyordu.
export function emekliOzelHizmetOrani(ekGosterge:number,p:Pick<MaasParametreleri,'emekli_ozel_hizmet_dilimleri'>){
 if(!Number.isFinite(ekGosterge)||ekGosterge<0)throw new Error('Ek gösterge geçersiz.');
 const dilim=p.emekli_ozel_hizmet_dilimleri.find(d=>ekGosterge>=d.enAz);
 if(!dilim)throw new Error('Emeklilik özel hizmet cetveli eksik.');
 return dilim.oran;
}

export function memurMaas(g: MaasGirdi, kat: MaasKatsayilari, p: MaasParametreleri, dereceler: DereceSatiri[]) {
  if(g.gelirVergisiOrani!==undefined&&![15,20,27,35,40].includes(g.gelirVergisiOrani))throw new Error('Gelir vergisi oranı geçersiz.');
  const besOran=g.besOran??p.bes_oran;
  if(!Number.isFinite(besOran)||besOran<0||besOran>100)throw new Error('BES oranını 0–100 arasında girin.');
  const oran14 = g.kip === 'fark14' ? 14 / 30 : 1;
  const aylik = (g.kip === 'fark14' ? kat.aylik / 30 * 14 : kat.aylik), tabanK = (g.kip === 'fark14' ? kat.taban / 30 * 14 : kat.taban), yanK = (g.kip === 'fark14' ? kat.yanOdeme / 30 * 14 : kat.yanOdeme);
  const istisna=g.kip==='fark14'?{gelir:0,damga:0}:kat.vergi?vergiIstisnasi(g.ay??7,kat.vergi):{gelir:kat.gelirVergisiIstisna,damga:kat.damgaVergisiIstisna};
  // DV istisnası önce kuruşa yuvarlanmaz: (vergiye tabi tutar - asgari brüt) × binde 7,59.
  const dvHamIstisna=kat.vergi && g.kip==='maas'?kat.vergi.asgariBrut*p.damga_vergisi_oran_binde/1000:istisna.damga;
  const dvIstisna = Math.max(0,dvHamIstisna-(g.kullanilanDvIstisna??0)) * oran14;
  const d = dereceler.find(x => x.derece === g.derece);
  if (!d) throw new Error(`Derece/kademe bulunamadı: ${g.derece}`);
  const u = g.unvan, dn = dereceNo(g.derece);
  const anaKural=p.unvanKurallari?.[u];
  if(g.unvanKosulu&&!anaKural?.varyantlar?.[g.unvanKosulu])return {eksik:true as const,eksikNedeni:'Seçilen unvan koşulu için doğrulanmış ödeme oranı yok.'};
  const ekUnvan=g.unvanKosulu?anaKural!.varyantlar![g.unvanKosulu]:anaKural?.legacyDefault?undefined:anaKural,ekKural=ekUnvan?.dereceler[String(dn)];
  if(ekUnvan&&(!ekKural||g.mezuniyet!==ekUnvan.mezuniyet)){
    const dereceler=Object.keys(ekUnvan.dereceler).map(Number);
    return {eksik:true as const,eksikNedeni:`Bu unvanın doğrulanan hesabı ${ekUnvan.mezuniyet===1?'önlisans/lisans':'lise ve diğer'} öğrenimi ve ${Math.min(...dereceler)}–${Math.max(...dereceler)}. dereceler içindir. Derece ve öğrenim seçimini kontrol edin.`};
  }
  const es = g.esCalismiyor ? p.es_yardimi_gosterge : 0;
  const sendikaUye = g.sendika ? p.sendika_uye_gosterge : 0;
  const tasinir = g.tasinirYetkili ? p.tasinir_yetkili_gosterge : 0;
  const gorevOran = { istanbul: p.gorev_yeri_istanbul_oran, buyuksehir: p.gorev_yeri_buyuksehir_oran, diger: p.gorev_yeri_diger_oran }[g.gorevYeri];
  // A/D eski iç kodlarıdır; yeni form A1/A2/B/C puan aralıklarını açıkça gösterir.
  const dilDuzeyi=g.yabanciDil==='A'?'A1':g.yabanciDil==='D'?'C':g.yabanciDil;
  const dil = dilDuzeyi===''?0:g.dilKurumYararlaniyor?p.yabanci_dil_kurum_yararlandigi[dilDuzeyi]:{A1:p.yabanci_dil_a_gosterge,A2:p.yabanci_dil_b_gosterge,B:p.yabanci_dil_c_gosterge,C:p.yabanci_dil_d_gosterge}[dilDuzeyi];
  const MH = p.maas_hesaplama_gosterge;

  // ── Gelirler ──
  const gostergeTutar = r2(aylik * d.gosterge);
  const hacizMiktar = g.haciz > 0 ? r2(g.haciz * (g.hacizHarcEkle===false?1:1+p.haciz_damga_oran/100)) : 0;
  const ekGosterge = unvanEkGostergesi(g, p, dereceler)!;
  const ekGostergeTutar = r2(ekGosterge * aylik);
  const tabanTutar = r2(p.taban_ayligi_gosterge * tabanK);
  const hizmet = Math.min(g.hizmetYili, 25);
  const kidemTutar = r2(p.kidem_ayligi_gosterge * hizmet * aylik);

  let oh: number | undefined, eo: number | undefined, yo: number | undefined, ekTazminat = 0;
  if ([1, 4, 5, 12, 17].includes(u)) {
    oh = d.ozel_hizmet_tazminat_mudur; eo = d.ek_odeme_ayligi_mudur; yo = d.yan_odeme_mudur;
    // Yazı işleri müdürü 3. derece: genel müdür tablosundan ayrılır.
    // Kaynak kurum bordrosu: yan ödeme 1600; ÖHT tabanı 135 + görev yeri ilavesi.
    if(u===1&&dn===3){oh=135;yo=1600;}
    if (u === 5) { eo -= 5; if (oh > 125) oh -= 5; }
    if (u === 17) { yo = 1550; if (dn > 4) { oh = 130; eo = 130; } else if (dn > 2) { oh = 135; eo = 140; } else { oh = 135; eo = 150; } }
  } else if (u === 50) {
    yo = 750; eo = 65; oh = dn >= 5 ? 105.56 : dn >= 3 ? 115.56 : 120.56;
    const kariyer = g.ogretmen?.kariyer ?? 1;
    if (kariyer === 2) ekTazminat = dn >= 3 ? 50 : 60;
    if (kariyer === 3) ekTazminat = dn >= 3 ? 100 : 120;
    if (g.ogretmen?.belletici) yo += 100;
    const alt = g.ogretmen?.altGorev ?? 0, alan = g.ogretmen?.alan ?? 0;
    const altGruplar: [number[], number][] = [
      [[2],200], [[18],225], [[3,4],350], [[19,20,21,22,23,24,25],400],
      [[26,27,35,36,37,38,39,40,41],425], [[42,43],475], [[5,6,7,8,9,10,11,12,13,14,15,16,17],500],
      [[28,29],650], [[44,45],675], [[30,31,32,33,34],900], [[46,47,48,49,50],925],
    ];
    const alanGruplar: [number[], number][] = [
      [[1,2,7,8,10,14,20,28,38,40,41,53,55],6], [[4,11,17,18,19,22,46],9], [[3,16,23,24,30,45],10],
      [[21,25,27,29,32,35,36,39,47,48,51],12], [[5,6,9,12,13,15,26,31,33,34,37,42,43,44,49,50,52,54],15],
      [[56,57,62,63,65,69,75,83,93,95,96,108,110],4], [[59,66,72,73,74,77,101,58,71,78,79,85,100],5],
      [[76,80,82,84,87,90,91,94,102,103,106],8], [[60,61,64,67,68,70,81,86,88,89,92,97,98,99,104,105,107,109],10],
    ];
    yo += altGruplar.find(([ids]) => ids.includes(alt))?.[1] ?? 0;
    eo += alanGruplar.find(([ids]) => ids.includes(alan))?.[1] ?? 0;
  } else if (u === 2) { oh = d.ozel_hizmet_tazminat_katip; eo = d.ek_odeme_ayligi_katip; yo = d.yan_odeme_katip; }
  else if (u === 21 || u === 22) { yo = 2250; eo = d.ek_odeme_ayligi_katip; oh = dn > 7 ? 48 : dn > 4 ? 49 : 55; }
  else if (u === 45) { yo = 1075; eo = d.ek_odeme_ayligi_katip; oh = dn > 7 ? 48 : dn > 4 ? 49 : 55; }
  else if (u === 46) { yo = 2025; eo = 130; oh = 130; if (dn >= 5) { oh = 122; eo = 110; } else if (dn >= 3) eo = 120; }
  else if (u === 47) { yo = 500; eo = 70; oh = 145; }
  else if (u === 48) { yo = 500; eo = 70; oh = dn >= 3 ? 115 : 120; }
  else if (u === 23) { yo = 1900; eo = d.ek_odeme_ayligi_katip; oh = g.gorevYeri === 'diger' ? 61 : g.gorevYeri === 'buyuksehir' ? 66 : 70; }
  else if (u === 24 || u === 26 || u === 27) { yo = u === 24 ? 675 : 500; oh = dn > 7 ? 44 : 45; eo = dn > 7 ? 70 : dn > 4 ? 80 : 90; }
  else if (u === 25 || u === 28) { yo = 500; eo = d.ek_odeme_ayligi_katip; oh = dn > 7 ? 48 : 49; }
  else if (u === 29) { yo = 875; eo = d.ek_odeme_ayligi_katip; oh = dn > 7 ? 58 : dn > 4 ? 59 : 65; }
  else if (u === 30 || u === 31) { yo = u === 30 ? 2250 : 700; if (dn > 4) { oh = 60; eo = 95; } else if (dn > 2) { oh = 70; eo = 105; } else { oh = 70; eo = 115; } }
  else if (u === 32) { eo = 75; yo = 1200; oh = dn >= 8 ? 128 : dn >= 5 ? 139 : 148; }
  else if (u === 34) { eo = 66; yo = 1025; oh = dn >= 9 ? 89 : 90; }
  else if (u === 33) { yo = 1050; if (dn > 7) { oh = 60; eo = 92; } else if (dn >= 5) { oh = 61; eo = 97; } else if (dn >= 3) { oh = 61; eo = 107; } else { oh = 61; eo = 117; } }
  else if (u === 18 || u === 20 || u === 43 || u === 41) { oh = d.ozel_hizmet_tazminat_memur; eo = d.ek_odeme_ayligi_katip; yo = d.yan_odeme_memur; }
  else if (u === 19 || u === 44 || u === 42) {
    oh = dn > 7 ? 44 : 45;
    // Canlıdaki `8 > x > 4` her zaman yanlıştır; 5 ve üstü derecelerde 70 uygulanır.
    eo = dn <= 4 ? 90 : 70;
    yo = u === 42 ? 1000 : 500;
  }
  else if (u === 35) { yo = 500; if (dn >= 8) { eo = 85; oh = 48; } else if (dn >= 5) { eo = 90; oh = 49; } else if (dn >= 3) { eo = 100; oh = 55; } else { eo = 110; oh = 55; } }
  else if (u === 36) { yo = 500; if (dn >= 5) { eo = 100; oh = 50; } else if (dn >= 3) { eo = 110; oh = 68; } else { eo = 115; oh = 68; } }
  else if (u === 37) { yo = 800; if (dn >= 8) { eo = 44; oh = 70; } else if (dn >= 5) { eo = 45; oh = 80; } else { eo = 45; oh = 90; } }
  else if (u === 38) { eo = d.ek_odeme_ayligi_katip; yo = 1150; oh = dn >= 9 ? 54 : dn >= 5 ? 55 : 58; }
  else if (u === 39) { yo = 1300; eo = 170; oh = dn >= 3 ? 100 : dn >= 2 ? 120 : 155; }
  else if (u === 40) { yo = 1300; eo = 170; oh = dn >= 2 ? 100 : 165; }
  // Canlıda bu blok ayrı bir "if" ile başlar; adliye unvanları burada belirlenir.
  if ([13, 14, 15, 16].includes(u)) {
    oh = d.ozel_hizmet_tazminat_ikm + 10; eo = d.ek_odeme_ayligi_katip; yo = d.yan_odeme_katip + 400;
    if (u === 14 || u === 16) oh += 3;
    if (u === 15 || u === 16) yo += 200;
  } else if ([3, 6, 7].includes(u)) {
    oh = d.ozel_hizmet_tazminat_mubasir; eo = d.ek_odeme_ayligi_mubasir; yo = d.yan_odeme_mubasir;
    if (u === 7) { yo += 400; oh -= 7; }
  } else if (u === 8 || u === 9) {
    oh = d.ozel_hizmet_guvenlik; eo = d.ek_odeme_ayligi_mubasir + 23 + (u === 9 ? 5 : 0); yo = d.yan_odeme_mubasir - 25;
  }
  if(ekKural){oh=ekKural.ozelHizmet;eo=ekKural.ekOdeme;yo=ekKural.yanOdeme;}
  if (oh === undefined || eo === undefined || yo === undefined) return { eksik: true as const,eksikNedeni:'Bu unvanın ödeme oranları kaynak veride eksik. Maaş hesaplanamıyor.' };
  if (tasinir > 0) yo += tasinir;

  const yanOdemeTutar = r2(yo * yanK);
  const esTutar = r2(es * aylik);
  const cocukTutar = r2((g.cocuk.kucuk * p.cocuk_0_6_gosterge + g.cocuk.buyuk * p.cocuk_6_ust_gosterge
    + g.cocuk.engelliKucuk * p.engelli_cocuk_0_6_gosterge + g.cocuk.engelliBuyuk * p.engelli_cocuk_6_ust_gosterge) * aylik);
  const ozelHizmetTutar = r2(MH * aylik * oh / 100);
  let ekOdemeTutar = r2(MH * aylik * eo / 100);
  const denetimTutar = r2(MH * aylik * (ekKural?.denetim??0) / 100);
  const universiteTutar=r2(MH*aylik*(ekKural?.universite??0)/100),egitimOgretimTutar=r2(MH*aylik*(ekKural?.egitimOgretim??0)/100),yuksekogretimTutar=r2(MH*aylik*(ekKural?.yuksekogretim??0)/100);
  const akademikToplam=universiteTutar+egitimOgretimTutar+yuksekogretimTutar;
  const makamGorevTutar=r2(aylik*(ekKural?.makamGorev??0)),temsilTutar=ekKural?.temsilNominal?r2(r2(aylik*ekKural.temsilNominal)*.8):r2(aylik*(ekKural?.temsil??0)),tazminatToplam=makamGorevTutar+temsilTutar;
  const tazPrimGosterge=ekKural?.tazminatPrimGostergesi??0,makamPrim=Math.min(tazPrimGosterge,ekKural?.makamGorev??0);
  const tazminatPrim=r2(aylik*makamPrim)+r2(aylik*(tazPrimGosterge-makamPrim));
  let tayin = 0, fazlaMesai = 0;
  if (u === 32 || u === 34) {
    tayin = r2(aylik * p.memur_tayin_bedeli_gosterge);
    fazlaMesai = r2(MH * aylik * (u === 32 ? p.memur_fazla_mesai_icra_muduru_oran : p.memur_fazla_mesai_icra_mudur_yardimcisi_oran) / 100);
  }
  if(ekKural){fazlaMesai=r2(MH*aylik*(ekKural.fazlaMesai??0)/100);tayin=r2(aylik*(ekKural.tayin??0));}
  const ekTazminatTutar = r2(MH * aylik * (u===50?ekTazminat:(ekKural?.ekTazminat??0)) / 100);
  const ilAdaletTutar = (ekUnvan?ekUnvan.adalet:(u < 17 || [18, 19, 20, 38].includes(u))) ? r2(MH * aylik * gorevOran / 100) : 0;
  let sendikaIkramiye = g.sendika ? r2(aylik * p.memur_sendika_ikramiye_gosterge * sendikaUye) : 0;
  if (g.kip === 'fark14') sendikaIkramiye = 0;
  const dilTutar = r2(aylik * dil);
  const seyyanen = r2(p.seyyanen_zam_gosterge * aylik);
  if(ekKural?.netEkOdeme){
    // Sağlık sabit ek ödemesinde net korunan tutar GV + DV ile brütleştirilir.
    // Ödeme SGK primine eklenmez; brüt ek ödeme GV matrahına eklenir.
    const primMatrah=g.kanun===5510?gostergeTutar+ekGostergeTutar+tabanTutar+kidemTutar+ozelHizmetTutar+ilAdaletTutar+denetimTutar+universiteTutar+tazminatPrim:gostergeTutar+ekGostergeTutar+tabanTutar+kidemTutar+r2(MH*aylik*emekliOzelHizmetOrani(ekGosterge,p)/100);
    const prim=r2(primMatrah*(g.kanun===5510?p.memur_emekli_kesenek_5510_oran:p.memur_emekli_kesenek_5434_oran)/100)+(g.kanun===5510?r2(primMatrah*p.memur_gss_5510_oran/100):0);
    const matrah=gostergeTutar+ekGostergeTutar+tabanTutar+kidemTutar+yanOdemeTutar-prim-(kat.vergi?.engellilikIndirimleri[g.engellilikDerecesi??0]??0);
    ekOdemeTutar=netEkOdemeBrutu(ekOdemeTutar,matrah,g.oncekiMatrah??0,p.damga_vergisi_oran_binde,kat.vergi,g.gelirVergisiOrani);
  }
  const gelir = fazlaMesai + tayin + dilTutar + sendikaIkramiye + ilAdaletTutar + ekOdemeTutar + ozelHizmetTutar + cocukTutar + esTutar
    + yanOdemeTutar + kidemTutar + tabanTutar + ekGostergeTutar + gostergeTutar + seyyanen + ekTazminatTutar + denetimTutar + akademikToplam + tazminatToplam;

  // ── Kesintiler ──
  const sendikaKesinti = g.sendika ? (gostergeTutar + ekGostergeTutar + tabanTutar + kidemTutar + yanOdemeTutar + ozelHizmetTutar
    + sendikaIkramiye + ekOdemeTutar + ilAdaletTutar + fazlaMesai + tayin + seyyanen + dilTutar + denetimTutar + akademikToplam + ekTazminatTutar + tazminatToplam) * (p.sendika_kesinti_oran / 100) : 0;
  // Eski 657 hesabındaki koşulsuz gelir vergisi sıfırlaması kaldırıldı.
  // Gelir vergisi emekli/GSS kesintilerinden sonra aşağıda hesaplanır; artık sıfırlanmaz.
  const damgaHam = r2(dvIstisna - (gostergeTutar + ekGostergeTutar + tabanTutar + kidemTutar + yanOdemeTutar + ozelHizmetTutar + ekOdemeTutar
    + ilAdaletTutar + sendikaIkramiye + seyyanen + fazlaMesai + tayin + ekTazminatTutar + dilTutar + denetimTutar + akademikToplam + tazminatToplam) * (p.damga_vergisi_oran_binde / 1000));
  const damga = damgaHam > 0 ? 0 : -damgaHam;
  const ohEmekli = emekliOzelHizmetOrani(ekGosterge, p) / 100;
  let emKes = 0, gss = 0, bes = 0, ilksan = 0;
  if (g.kanun === 5510) {
    const m = gostergeTutar + ekGostergeTutar + tabanTutar + kidemTutar + ozelHizmetTutar + ilAdaletTutar + denetimTutar + universiteTutar + tazminatPrim;
    emKes = r2(m * (p.memur_emekli_kesenek_5510_oran / 100));
    ilksan = r2(m * (p.ilksan_oran / 100));
    gss = r2(m * (p.memur_gss_5510_oran / 100));
    if (g.bes) bes = Math.floor(m * (besOran / 100)); // OKS katkı payında kuruşlar dikkate alınmaz.
  } else {
    const m = gostergeTutar + ekGostergeTutar + tabanTutar + kidemTutar + r2(MH * aylik * ohEmekli);
    emKes = r2(m * (p.memur_emekli_kesenek_5434_oran / 100));
    ilksan = r2(m * (p.ilksan_oran / 100));
    if (g.bes) bes = Math.floor(m * (besOran / 100));
  }
  const polsan = g.polsan ? emKes : 0;
  if (!g.ilksan) ilksan = 0;
  const vergiMatrahi=Math.max(0,gostergeTutar+ekGostergeTutar+tabanTutar+kidemTutar+yanOdemeTutar+(ekKural?.netEkOdeme?ekOdemeTutar:0)-emKes-gss-sendikaKesinti-(kat.vergi?.engellilikIndirimleri[g.engellilikDerecesi??0]??0));
  const gvHam=g.gelirVergisiOrani!==undefined?r2(vergiMatrahi*g.gelirVergisiOrani/100):kat.vergi?aylikVergi(vergiMatrahi,g.oncekiMatrah??0,kat.vergi):r2(vergiMatrahi*p.gelir_vergisi_oran/100);
  const gvKullanilanIstisna=r2(Math.min(gvHam,Math.max(0,istisna.gelir-(g.kullanilanGvIstisna??0))*oran14));
  const gelirVergisi=Math.max(0,r2(gvHam-gvKullanilanIstisna));
  const kesinti = r2(sendikaKesinti + gelirVergisi + damga + emKes + gss + hacizMiktar + bes + polsan + ilksan);
  const net = gelir - kesinti;

  const yuzde = (v: number) => `%${sayiYaz(v)}`;
  const gelirler: Satir[] = [
    { ad: 'Gösterge aylığı', oran: sayiYaz(d.gosterge), tutar: gostergeTutar },
    { ad: 'Ek gösterge aylığı', oran: sayiYaz(ekGosterge), tutar: ekGostergeTutar },
    { ad: 'Taban aylığı', oran: sayiYaz(p.taban_ayligi_gosterge), tutar: tabanTutar },
    { ad: 'Kıdem aylığı', oran: `${hizmet} yıl`, tutar: kidemTutar },
    { ad: 'Yan ödeme aylığı', oran: sayiYaz(yo), tutar: yanOdemeTutar },
    { ad: 'Aile yardımı (eş)', oran: es ? sayiYaz(es) : '', tutar: esTutar },
    { ad: 'Aile yardımı (çocuk)', oran: '', tutar: cocukTutar },
    { ad: 'Özel hizmet tazminatı', oran: yuzde(oh), tutar: ozelHizmetTutar },
    { ad: ekKural?.netEkOdeme?'Sabit ek ödeme (net korumalı brüt)':'Ek ödeme', oran: yuzde(eo), tutar: ekOdemeTutar },
    { ad: 'Denetim tazminatı', oran: yuzde(ekKural?.denetim??0), tutar: denetimTutar },
    { ad: 'Üniversite ödeneği', oran: yuzde(ekKural?.universite??0), tutar: universiteTutar },
    { ad: 'Eğitim öğretim ödeneği', oran: yuzde(ekKural?.egitimOgretim??0), tutar: egitimOgretimTutar },
    { ad: 'Yükseköğretim tazminatı', oran: yuzde(ekKural?.yuksekogretim??0), tutar: yuksekogretimTutar },
    { ad: 'Makam / görev tazminatı', oran: sayiYaz(ekKural?.makamGorev??0), tutar: makamGorevTutar },
    { ad: 'Temsil tazminatı', oran: sayiYaz(ekKural?.temsil??0), tutar: temsilTutar },
    { ad: 'Fazla mesai', oran: '', tutar: fazlaMesai },
    { ad: 'Tayin bedeli', oran: '', tutar: tayin },
    { ad: 'Ek tazminat', oran: '', tutar: ekTazminatTutar },
    { ad: 'İl adalet hizmetleri tazminatı', oran: yuzde(gorevOran), tutar: ilAdaletTutar },
    { ad: 'Toplu sözleşme ikramiyesi', oran: sayiYaz(p.memur_sendika_ikramiye_gosterge * sendikaUye), tutar: sendikaIkramiye },
    { ad: 'Dil tazminatı', oran: dil ? sayiYaz(dil) : '', tutar: dilTutar },
    { ad: '375 SK ek madde 40 (seyyanen)', oran: sayiYaz(p.seyyanen_zam_gosterge), tutar: seyyanen },
  ].filter(s => s.tutar !== 0);
  const kesintiler: Satir[] = [
    { ad: 'Gelir vergisi', oran: g.gelirVergisiOrani!==undefined?yuzde(g.gelirVergisiOrani):'Kümülatif tarife', tutar: gelirVergisi },
    { ad: 'Damga vergisi', oran: `binde ${sayiYaz(p.damga_vergisi_oran_binde)}`, tutar: damga },
    { ad: 'Emekli keseneği', oran: yuzde(g.kanun === 5510 ? p.memur_emekli_kesenek_5510_oran : p.memur_emekli_kesenek_5434_oran), tutar: emKes },
    { ad: 'GSS primi', oran: g.kanun === 5510 ? yuzde(p.memur_gss_5510_oran) : '', tutar: gss },
    { ad: 'Sendika kesintisi', oran: yuzde(p.sendika_kesinti_oran), tutar: r2(sendikaKesinti) },
    { ad: 'BES kesintisi', oran: yuzde(besOran), tutar: bes },
    { ad: 'Haciz / nafaka', oran: g.hacizHarcEkle===false?'Bordrodaki kesinti':`Asıl tutar + ${yuzde(p.haciz_damga_oran)} harç`, tutar: hacizMiktar },
    { ad: 'POLSAN kesintisi', oran: yuzde(g.kanun === 5510 ? p.memur_emekli_kesenek_5510_oran : p.memur_emekli_kesenek_5434_oran), tutar: polsan },
    { ad: 'İLKSAN kesintisi', oran: yuzde(p.ilksan_oran), tutar: ilksan },
  ].filter(s => s.tutar !== 0);
  return { eksik: false as const, gelirler, kesintiler, gelir, kesinti, net,vergiMatrahi,gelirVergisi,damga,gvKullanilanIstisna,gvIstisna:istisna.gelir,dvIstisna:istisna.damga };
}
