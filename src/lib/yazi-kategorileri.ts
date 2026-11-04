import {getCollection} from 'astro:content';
import {maasYazilari,guncelYayin} from './maas-yazilari';
import {araclar} from './tools';
import {normalize} from './normalize';
import {getImage} from 'astro:assets';
export const yaziKategorileri=[{id:'maaslar',ad:'Maaşlar'},{id:'programlar',ad:'Programlar'},{id:'tarifeler',ad:'Tarifeler'},{id:'ekonomi',ad:'Ekonomi'},{id:'tayinler',ad:'Tayinler'},{id:'gys-uds',ad:'GYS / ÜDS'},{id:'faydali',ad:'Faydalı'}];
export interface YaziListeKaydi {baslik:string;aciklama:string;yol:string;kategoriler:string[];tur:'Haber'|'Maaş'|'Araç';gorsel?:string;tarih?:string;}
export function kategoriYolu(k:string){const n=normalize(k);const id=/sinav|gys|uds|yukselme/.test(n)?'gys-uds':/maas|bordro|emekli/.test(n)?'maaslar':/enflasyon|ekonomi|tufe/.test(n)?'ekonomi':/tarife|harc|ucret/.test(n)?'tarifeler':/program|arac|uygulama/.test(n)?'programlar':'faydali';return `/yazilar/kategori/${id}/`;}
let promise:Promise<YaziListeKaydi[]>|undefined;
export function yaziListesi(){return promise??=(async()=>{
 const yazilar=await getCollection('yazilar',y=>!y.data.taslak);
 const kategori=(s:string)=>{const n=normalize(s);return [['maaslar',/maas|bordro|emekli/],['programlar',/program|arac|uygulama/],['tarifeler',/tarife|harc|ucret/],['ekonomi',/enflasyon|ekonomi|tufe/],['kararname',/kararname/],['tayinler',/tayin|atama|nakil/],['gys-uds',/gys|uds|gorevde yukselme/]].filter(([,r])=>(r as RegExp).test(n)).map(([id])=>id as string);};
 const aylar=['ocak','subat','mart','nisan','mayis','haziran','temmuz','agustos','eylul','ekim','kasim','aralik'];
 const donem=(id:string)=>{const m=id.match(/^(\d{4})-([a-z]+)-ayi-enflasyon-verileri$/);return m?Number(m[1])*12+aylar.indexOf(m[2])+1:0;};
 const news:YaziListeKaydi[]=await Promise.all(yazilar.sort((a,b)=>+b.data.date-+a.data.date||donem(b.id)-donem(a.id)).map(async y=>{const cats=kategori(y.data.title+' '+y.data.kategori.join(' '));return {baslik:y.data.title,aciklama:y.data.description,yol:`/${y.id}/`,kategoriler:cats.length?cats:['faydali'],tur:'Haber' as const,tarih:y.data.date.toISOString(),...(y.data.gorsel?{gorsel:(await getImage({src:y.data.gorsel,width:600,format:'webp'})).src}:{})};}));
 const salary:YaziListeKaydi[]=maasYazilari.filter(m=>m.yil===guncelYayin.yil).map(m=>({baslik:m.baslik,aciklama:'Standart düşük/yüksek net maaş örnekleri, geçmiş dönem kıyasları ve yıllık grafik.',yol:`/${m.slug}/`,kategoriler:['maaslar'],tur:'Maaş'}));
 const tools:YaziListeKaydi[]=araclar.filter(a=>a.tasindi&&a.path).map(a=>({baslik:a.title,aciklama:a.description,yol:a.path!,kategoriler:['programlar'],tur:'Araç'}));
 const paths=new Set<string>();return [...news,...salary,...tools].filter(r=>{if(paths.has(r.yol))return false;paths.add(r.yol);return true;});
})();}
