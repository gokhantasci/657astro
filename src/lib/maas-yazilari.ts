import {z} from 'zod';
import {readdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import profilRaw from '../data/unvan-profilleri.json' with {type:'json'};
import {baslangicGirdi,parametreler,dereceler,donem,maasKatsayilari} from './maas-veri';
import {ayarlar} from './settings';
import {guncelYayinUret,yayinlariBirlestir,yayinSayfalari,maasHref,type UnvanProfili,type MaasYayini} from './unvan-yayin';
export {maasHref};
export const unvanlar=z.array(z.object({id:z.string().regex(/^[a-z0-9-]+$/),ad:z.string().min(1),kod:z.number().int(),dusuk:z.object({derece:z.string().regex(/^\d+\/\d+$/),hizmetYili:z.number().int().min(0),mezuniyet:z.union([z.literal(1),z.literal(2)])}),uyari:z.string().optional()})).parse(profilRaw) as UnvanProfili[];
if(new Set(unvanlar.map(u=>u.id)).size!==unvanlar.length)throw new Error('Yinelenen unvan adresi.');
const kayitSchema=z.object({unvanId:z.string(),dusuk:z.number().nonnegative().nullable(),yuksek:z.number().nonnegative().nullable(),kaynak:z.string().min(1),varsayimlar:z.array(z.string()),uyari:z.string().nullable(),girdiler:z.unknown().optional()});
export const yayinSchema=z.object({surum:z.literal(1),donemId:z.string().regex(/^[a-z0-9-]+$/),yil:z.number().int().min(2000).max(2100),etiket:z.string().min(1),baslangic:z.iso.date().nullable(),bitis:z.iso.date().nullable(),tur:z.enum(['hesap','aktarim']),aciklama:z.string().optional(),kayitlar:z.array(kayitSchema),hesapBaglami:z.unknown().optional()}).superRefine((a,ctx)=>{
 if((a.baslangic===null)!==(a.bitis===null)||a.baslangic&&a.bitis&&(a.baslangic>a.bitis||Number(a.baslangic.slice(0,4))!==a.yil||Number(a.bitis.slice(0,4))!==a.yil))ctx.addIssue({code:'custom',message:'Arşiv dönemi/yılı tutarsız.'});
 if(new Set(a.kayitlar.map(k=>k.unvanId)).size!==a.kayitlar.length)ctx.addIssue({code:'custom',message:'Arşivde yinelenen unvan.'});
 if(a.kayitlar.some(k=>!unvanlar.some(u=>u.id===k.unvanId)))ctx.addIssue({code:'custom',message:'Arşivde tanımsız unvan.'});
});
const arsivDizini=resolve('src/data/maas-arsivleri');
const arsiv=readdirSync(arsivDizini).filter(f=>f.endsWith('.json')).map(f=>yayinSchema.parse(JSON.parse(readFileSync(join(arsivDizini,f),'utf8'))) as MaasYayini);
// İlk hesap yayını öncesindeki katsayılar yıllık matrah için de tutulur. Aktarılmış
// eski maaş arşivleri sonradan bugünkü motorla yeniden hesaplanmış sayılmaz.
const ilkHesapDonemi=arsiv.filter(a=>a.tur==='hesap'&&a.baslangic).map(a=>a.baslangic!).sort()[0]??donem.baslangic;
for(const d of ayarlar.donemler.filter(d=>d.baslangic>=ilkHesapDonemi&&d.baslangic<donem.baslangic)){
 if(!arsiv.some(a=>a.tur==='hesap'&&a.baslangic===d.baslangic))throw new Error(`${d.baslangic} döneminin yayımlanmış maaş arşivi eksik. Yeni döneme geçmeden önce önceki derlemenin arşiv JSON dosyasını depoya ekleyin.`);
}
export const guncelYayin=guncelYayinUret(unvanlar,donem,maasKatsayilari(donem,'maas'),parametreler,dereceler,baslangicGirdi);
export const maasYayinlari=yayinlariBirlestir(guncelYayin,arsiv);
export const maasYillari=[...new Set(maasYayinlari.map(a=>a.yil))].sort((a,b)=>b-a);
export const maasYazilari=yayinSayfalari(unvanlar,maasYayinlari);
export type MaasYazisi=typeof maasYazilari[number];
export function unvanDonemleri(unvanId:string,yil?:number){return maasYayinlari.filter(a=>yil===undefined||a.yil===yil).flatMap(a=>{const k=a.kayitlar.find(k=>k.unvanId===unvanId);return k?[{yayin:a,kayit:k}]:[];});}
export function yilKayitlari(yil:number){return unvanlar.flatMap(u=>{const h=unvanDonemleri(u.id,yil);return h.length?[{unvan:u,...h[0]}]:[];});}
