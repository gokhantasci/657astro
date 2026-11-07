import {normalize} from './normalize';
import {memurMaas,type MaasGirdi,type MaasKatsayilari,type MaasParametreleri,type DereceSatiri} from './memur-maas';
import {kesinlesme,iso,noktali,isoOku,type Tatil,type SureTuru} from './kesinlesme';
import {tl,gun} from './bicim';
export interface AsistanKaynak {baslik:string;yol:string;metin:string;tur:string}
export interface AsistanBaglami {girdi:MaasGirdi;k:MaasKatsayilari;p:MaasParametreleri;dereceler:DereceSatiri[];unvanlar:{ad:string;kod:number}[];tatiller:Tatil[];tatilIlk:number;tatilSon:number;baslangic:string;bitis:string;}
export interface AsistanYanit {metin:string;baglantilar:{ad:string;yol:string}[];takip?:string[];hesap?:boolean;}
export function siteAra(q:string,veri:AsistanKaynak[],limit=5){
 const tokens=normalize(q).split(/[^a-z0-9]+/).filter(x=>x.length>2&&!['bir','icin','ile','nasil','olan','nedir','bana','hangi','demek','zaman','nelerdir','hakkinda','merhaba','cumleyle','kendini','tanitir','misin','misiniz','neresidir','lutfen'].includes(x));
 if(!tokens.length)return [];
 const ranked=veri.map((v,i)=>{const title=new Set(normalize(v.baslik).split(/[^a-z0-9]+/)),body=new Set(normalize(v.metin).split(/[^a-z0-9]+/));const puan=tokens.reduce((a,t)=>a+(title.has(t)?8:0)+(body.has(t)?1:0),0);const eslesme=tokens.filter(t=>title.has(t)||body.has(t)).length;return {v,puan,i,eslesme};}).filter(v=>v.eslesme>=Math.min(2,tokens.length)).sort((a,b)=>b.puan-a.puan||a.i-b.i);
 const paths=new Set<string>();return ranked.filter(x=>{if(paths.has(x.v.yol))return false;paths.add(x.v.yol);return true;}).slice(0,limit).map(x=>x.v);
}
export function asistanHesapla(q:string,b:AsistanBaglami):AsistanYanit|null{
 const n=normalize(q);
 const bilgiSorusu=/nasil|nedir|ne demek|neye gore|neden/.test(n)&&!/\d/.test(n);
 if(bilgiSorusu)return null;
 if(/kesinles|teblig|kanun yolu/.test(n)){
  const date=q.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if(!date)return {metin:'Tebliğ tarihini, kararın ceza/hukuk türünü ve başvuru süresini yazın. Örnek: 28.01.2026 tebliğ, ceza, 2 hafta.',baglantilar:[{ad:'Kesinleşme hesabını aç',yol:'/kesinlesme/'}]};
  const dateIso=`${date[3]}-${date[2].padStart(2,'0')}-${date[1].padStart(2,'0')}`;
  if(iso(isoOku(dateIso))!==dateIso)return {metin:'Geçerli bir tebliğ tarihi yazın.',baglantilar:[]};
  const yil=Number(date[3]);
  if(yil<b.tatilIlk||yil>b.tatilSon)return {metin:`Tatil verisi ${b.tatilIlk}–${b.tatilSon} aralığında. Bu tarih için kesinleşme sonucu üretemiyorum.`,baglantilar:[{ad:'Kesinleşme hesabı',yol:'/kesinlesme/'}]};
  const m=n.match(/\b(\d{1,3})\s*(gun|hafta|ay)\b/);
  if(/hukuk|idari|vergi/.test(n)||!m)return {metin:'Kesinleşme için kararın türü ve geçerli kanun yolu süresi gerekir. Sitedeki araç CMK esaslı ceza hesabıdır. Ceza kararı için 2 haftalık süreyi mi kullanacağız? Başvuru yapılmış olması ve diğer taraflara tebliğ sonucu değiştirebilir.',baglantilar:[{ad:'Tarihi hesaplama sayfasında aç',yol:`/kesinlesme/?teblig=${dateIso}`}],takip:[`${gun(dateIso)} tebliğ, ceza, 2 hafta kesinleşme`]};
  const sayi=Number(m[1]),tur=m[2] as SureTuru;if(sayi<1||sayi>365)return {metin:'Süreyi 1–365 aralığında belirtin.',baglantilar:[]};
  const r=kesinlesme(dateIso,sayi,tur,b.tatiller);
  if(r.son.getUTCFullYear()>b.tatilSon)return {metin:'Süre sonu doğrulanmış tatil aralığının dışına çıkıyor.',baglantilar:[]};
  return {hesap:true,metin:`Sitedeki CMK esaslı ceza hesabına göre, ${noktali(r.teblig)} tebliğ ve ${sayi} ${tur} süre için son başvuru günü ${noktali(r.son)}, başvuru yapılmadığı varsayımıyla kesinleşme ${noktali(r.kesin)} olur.${r.notlar.length?' '+r.notlar.map(x=>x.metin).join(' '):''} Kararın kanun yolu süresi, tebliğin geçerliliği ve tüm taraflar yönünden kesinleşme ayrıca kontrol edilmelidir.`,baglantilar:[{ad:'Aynı hesabı ayrıntılarıyla aç',yol:`/kesinlesme/?teblig=${dateIso}&sure=${sayi}&tur=${tur}`}]};
 }
 if(/maas|bordro/.test(n)){
  const unvan=[...b.unvanlar].sort((a,c)=>c.ad.length-a.ad.length).find(u=>n.includes(normalize(u.ad)));
  if(!unvan)return {metin:'Unvanı ve derece/kademeyi yazın. Örnek: Yazı işleri müdürü evli 3/1 maaşı. Hizmet yılı, eşin çalışma durumu, çocuklar ve vergi matrahını da belirtebilirsiniz.',baglantilar:[{ad:'Memur maaş hesaplama',yol:'/memur-maas-hesaplama/'}]};
  const y=n.match(/\b(20\d{2})\b/);if(y&&y[1]!==b.baslangic.slice(0,4))return {metin:`Bu asistanın net maaş motoru ${b.baslangic.slice(0,4)} dönemine bağlı. ${y[1]} netini bugünkü ödeme oranlarıyla üretmiyorum. Geçmiş katsayıları ve yayımlanmış maaş arşivlerini inceleyebilirsiniz.`,baglantilar:[{ad:'Katsayı arşivi',yol:'/memur-maas-katsayilari/'},{ad:'Unvan maaş arşivleri',yol:'/unvan-maaslari/'}]};
  const d=n.match(/\b(\d{1,2})\s*\/\s*([1-9])\b/),h=n.match(/\b(\d{1,2})\s*yil(?:lik)?\s*(?:hizmet|kidem)?/),c=n.match(/\b(\d{1,2})\s*cocuk/);
  const g:MaasGirdi={...b.girdi,cocuk:{...b.girdi.cocuk},unvan:unvan.kod,unvanKosulu:undefined,oncekiMatrah:0,haciz:0};
  if(d)g.derece=d[1]+'/'+d[2];if(h)g.hizmetYili=Number(h[1]);if(c)g.cocuk={kucuk:0,buyuk:Number(c[1]),engelliKucuk:0,engelliBuyuk:0};
  if(/bekar|esim calisiyor|esi calisiyor/.test(n))g.esCalismiyor=false;else if(/evli|esim calismiyor|esi calismiyor/.test(n))g.esCalismiyor=true;
  if(/cocuksuz|cocuk yok/.test(n))g.cocuk={kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0};
  if(/sendika yok|sendikasiz/.test(n))g.sendika=false;if(/bes var/.test(n))g.bes=true;
  if(/\b5434\b/.test(n))g.kanun=5434;else if(/\b5510\b/.test(n))g.kanun=5510;
  const rule=b.p.unvanKurallari?.[unvan.kod];if(rule&&!rule.legacyDefault){const v=Object.entries(rule.varyantlar??{}).find(([,v])=>v.dereceler[g.derece.split('/')[0]]);if(v){g.unvanKosulu=v[0];g.mezuniyet=v[1].mezuniyet;}}
  if(!b.dereceler.some(d=>d.derece===g.derece)||g.hizmetYili>60)return {metin:'Derece/kademe veya hizmet yılı geçerli değil. Hesap formundan uygun birleşimi seçin.',baglantilar:[{ad:'Maaş hesabını aç',yol:'/memur-maas-hesaplama/'}]};
  const r=memurMaas(g,b.k,b.p,b.dereceler);
  if(r.eksik)return {metin:r.eksikNedeni,baglantilar:[{ad:'Unvanın öğrenim/kurum koşulunu seç',yol:'/memur-maas-hesaplama/'}]};
  const params=new URLSearchParams({unvan:String(g.unvan),derece:g.derece,hizmetYili:String(g.hizmetYili),mezuniyet:String(g.mezuniyet),kanun:String(g.kanun),esCalismiyor:g.esCalismiyor?'1':'0',kucuk:String(g.cocuk.kucuk),buyuk:String(g.cocuk.buyuk),sendika:g.sendika?'1':'0',bes:g.bes?'1':'0',ay:String(g.ay),donem:b.baslangic,...(g.unvanKosulu?{unvanKosulu:g.unvanKosulu}:{})});
  return {hesap:true,metin:`${unvan.ad} · ${g.derece} için yaklaşık net ${tl(r.net)}. Hesap varsayımları: ${g.hizmetYili} yıl, ${g.kanun}, ${g.mezuniyet===1?'önlisans/lisans':'lise ve diğerleri'}, ${g.esCalismiyor?'çalışmayan eş yardımı var':'eş yardımı yok'}, ${g.cocuk.kucuk} küçük ve ${g.cocuk.buyuk} büyük çocuk, sendika ${g.sendika?'var':'yok'}, BES ${g.bes?'var':'yok'}. Ay: ${g.ay}; önceki vergi matrahı ve nafaka/haciz sıfır. Belirtilmeyen bilgiler formun başlangıç değerlerinden alınmıştır. Kişisel bordro farkları için bağlantıdan bilgileri düzenleyin.`,baglantilar:[{ad:'Bu bilgilerle maaş hesabını aç',yol:'/memur-maas-hesaplama/?'+params.toString()},{ad:'Unvan maaş karşılaştırmaları',yol:'/unvan-maaslari/'}]};
 }
 return null;
}
