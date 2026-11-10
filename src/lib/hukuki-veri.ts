import vergi from '../data/vergi.json';
import isci from '../data/isci-kurallari.json';
import kidem from '../data/kidem-tavanlari.json';
import arsiv from '../data/tarife-arsivi.json';
import icra from '../data/icra-kurallari.json';
import {hukukTarifeleri} from './hukuk-veri';
import {maliKurallar} from './mali-veri';
import type {HukukiKurallar} from './hukuki-hesap';
const a=arsiv.find(t=>t.slug==='arabuluculuk')!.kayitlar.find(t=>t.baslangic==='2026-01-01')!;
const tutar=(ad:string)=>{const k=a.kalemler.find(k=>k.ad===ad);if(!k)throw new Error(`Arabuluculuk tarifesinde eksik kalem: ${ad}`);return k.tutar;};
const gruplar=['2 taraf, taraf başına','3–5 taraf toplam','6–10 taraf toplam','11+ taraf toplam'];
export const hukukiKurallar:HukukiKurallar={vergi,tavanlar:kidem.tavanlar,prim:{sgk:isci.sgkCalisan,issizlik:isci.issizlikCalisan,tavanKat:isci.pekTavanKat},vekalet:hukukTarifeleri.vekalet,faiz:maliKurallar.faiz,icra,
 arabulucu:{baslangic:a.baslangic,bitis:'2026-12-31',asgari:tutar('Anlaşma hâlinde asgari ücret'),ticariAsgari:tutar('Ticari / ortaklığın giderilmesi asgari ücret'),seri:6000,seriTicari:7500,
  saatler:Object.fromEntries(Object.entries({aile:'Aile',ticari:'Ticari',isci:'İşçi–işveren',tuketici:'Tüketici',kira:'Kira / komşuluk / kat mülkiyeti',ortaklik:'Ortaklığın giderilmesi',diger:'Diğer'}).map(([id,ad])=>[id,gruplar.map(g=>tutar(`${ad} · ${g} · saatlik`))])),
  dilimler:[600000,960000,1560000,3120000,9360000,12480000,24960000,null].map((miktar,i)=>({miktar,tek:tutar(`Nispi dilim ${i+1} · bir arabulucu`),cok:tutar(`Nispi dilim ${i+1} · birden fazla arabulucu`)}))
 }
};
export const hukukiKaynaklar={
 iscilik:[{ad:'4857 sayılı İş Kanunu',url:'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf'},{ad:'ÇSGB çalışma hayatı soruları',url:'https://www.csgb.gov.tr/sikca-sorulan-sorular/calisma-genel-mudurlugu/%C4%B1s-kanunu'},{ad:'Güncel kıdem tavanı: HMB genelgesi',url:kidem.tavanlar.at(-1)!.kaynak}],
 'brut-net':[{ad:'GİB ücret gelirleri tarifesi',url:vergi.kaynak[1]},{ad:'SGK prime esas kazanç ve istisnalar',url:isci.kaynaklar[3]}],
 arabuluculuk:[{ad:'2026 Arabuluculuk Asgari Ücret Tarifesi',url:a.kaynak},{ad:'6325 sayılı Kanun',url:'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6325.pdf'}],
 icra:[{ad:'2026 harç tarifesi: GİB',url:icra.kaynaklar[0]},{ad:'Cezaevi harcı: 2548 sayılı Kanun',url:icra.kaynaklar[1]},{ad:'TBB Avukatlık Asgari Ücret Tarifesi',url:hukukTarifeleri.vekalet.at(-1)!.kaynak}],
 infaz:[{ad:'5275 sayılı Kanun: m.105/A, 107, 108 ve geçici hükümler',url:'https://mevzuat.adalet.gov.tr/mevzuat/102944?query=5275'},{ad:'5275 sayılı Kanun: PDF',url:'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5275.pdf'}],
 garameten:[{ad:'İcra ve İflâs Kanunu: sıra cetveli ve garameten dağıtım',url:'https://iidb.adalet.gov.tr/Resimler/SayfaDokuman/2112020101941icra_kanun.pdf'}],
 aidat:[{ad:'634 sayılı Kat Mülkiyeti Kanunu m.20',url:'https://mevzuat.adalet.gov.tr/mevzuat/103807?query=Madde+20'}]
};
