import { z } from 'zod';
import { ayarlar, type Donem } from './settings';
import hamDereceler from '../data/dereceler.json' with { type: 'json' };
import hamSecenekler from '../data/memur-maas-secenekler.json' with { type: 'json' };
import type { DereceSatiri, MaasKatsayilari, MaasGirdi } from './memur-maas';
import {donemAylari} from './maas-donemi';
import {vergiTarifesi} from './vergi-veri';
import {ekUnvanVerisi,unvanKurallari} from './unvan-ek-veri';

const dereceAlanlari = ['gosterge','ek_gosterge_uni','ek_gosterge_digerleri','ek_gosterge_mudur',
 'ek_odeme_ayligi_mudur','ek_odeme_ayligi_mubasir','ek_odeme_ayligi_katip',
 'yan_odeme_mudur','yan_odeme_memur','yan_odeme_mubasir','yan_odeme_katip',
 'ozel_hizmet_tazminat_mudur','ozel_hizmet_tazminat_katip','ozel_hizmet_tazminat_mubasir',
 'ozel_hizmet_tazminat_memur','ozel_hizmet_tazminat_ikm','ozel_hizmet_guvenlik'];
export const dereceler = z.array(z.object({derece:z.string().regex(/^\d+\/\d+$/)}).catchall(z.number().nonnegative())).parse(hamDereceler) as unknown as DereceSatiri[];
for (const d of dereceler) for (const k of dereceAlanlari) if (!(k in d)) throw new Error(`Eksik derece alanı: ${k}`);
if (new Set(dereceler.map(d=>d.derece)).size !== dereceler.length) throw new Error('Yinelenen derece/kademe.');
const secenek = z.object({kod:z.number().int().nonnegative(),ad:z.string().min(1)});
export const secenekler = z.object({
  kaynak:z.string(), unvanlar:z.array(secenek), ogretmen_alt_gorev:z.array(secenek), ogretmen_alan:z.array(secenek),
  sablonlar:z.array(z.object({id:z.string(),ad:z.string(),unvan:z.number().int(),profil:z.enum(['en-dusuk-memur','en-dusuk-mudur','en-yuksek'])})),
}).parse(hamSecenekler);
// Eski sitede aynı kodu paylaşan adlar, doğrulandıkça bağımsız kurala ayrılır.
for(const u of ekUnvanVerisi.unvanlar){
 const mevcut=secenekler.unvanlar.find(s=>s.ad===u.ad);
 if(mevcut)mevcut.kod=u.kod;else secenekler.unvanlar.push({kod:u.kod,ad:u.ad});
}
export const parametreler = {...ayarlar.maas_parametreleri,seyyanen_zam_gosterge:ayarlar.sabitler.seyyanen_zam_gosterge,unvanKurallari};
export const donem = [...ayarlar.donemler].sort((a,b)=>b.baslangic.localeCompare(a.baslangic))[0];
export function maasKatsayilari(d:Donem, kip:MaasGirdi['kip']):MaasKatsayilari {
  const vergi=vergiTarifesi(Number(d.baslangic.slice(0,4)));
  if (kip==='fark14') {
    if (!d.fark14) throw new Error('Bu dönem için 14 günlük fark katsayıları girilmemiş.');
    return {aylik:d.fark14.aylik_katsayi,taban:d.fark14.taban_ayligi_katsayi,yanOdeme:d.fark14.yan_odeme_katsayi,gelirVergisiIstisna:d.fark14.gelir_vergisi_istisna,damgaVergisiIstisna:d.fark14.damga_vergisi_istisna,vergi};
  }
  return {aylik:d.memur_maas_aylik_katsayi,taban:d.taban_aylik_katsayi,yanOdeme:d.yan_odeme_katsayi,gelirVergisiIstisna:d.gelir_vergisi_istisna,damgaVergisiIstisna:d.damga_vergisi_istisna,vergi};
}
export const baslangicGirdi:MaasGirdi = {kip:'maas',ay:donemAylari(donem)[0].value,unvan:2,derece:'13/3',hizmetYili:1,mezuniyet:2,esCalismiyor:false,cocuk:{kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0},sendika:false,polsan:false,ilksan:false,tasinirYetkili:false,bes:true,gorevYeri:'diger',yabanciDil:'',kanun:5510,haciz:0,ogretmen:{kariyer:1,belletici:false,altGorev:0,alan:0}};
// Maaş formunun açılış değerleri: 3/1 yazı işleri müdürü, 16 yıl, lisans, çalışmayan eş ve 72 ay üstü bir çocuk.
// Ay, derleme günü dönem içindeyse o aydır; tarayıcı betiği açılışta bugünkü aya çeker.
// baslangicGirdi unvan yayınının ve testlerin temelidir; form varsayılanı onu değiştirmez.
export const buAy=(d:Donem,bugun=new Date())=>{const aylar=donemAylari(d).map(a=>a.value),ay=bugun.getMonth()+1;return bugun.getFullYear()===Number(d.baslangic.slice(0,4))&&aylar.includes(ay)?ay:aylar[0];};
export const formGirdisi:MaasGirdi={...baslangicGirdi,ay:buAy(donem),unvan:1,derece:'3/1',hizmetYili:16,mezuniyet:1,esCalismiyor:true,cocuk:{kucuk:0,buyuk:1,engelliKucuk:0,engelliBuyuk:0}};
