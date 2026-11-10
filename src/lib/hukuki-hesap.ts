import {aylikVergi,vergiIstisnasi,yuvarla as para,type VergiTarifesi} from './vergi';
import {kidemIhbar,type Tavan} from './kidem-ihbar';
import {vekalet,type VekaletTarifesi} from './hukuk-hesap';
import {faizHesap,type FaizVeri} from './mali-hesap';
export type HukukiTur='iscilik'|'brut-net'|'arabuluculuk'|'icra'|'infaz'|'garameten'|'aidat';
export type Girdiler=Record<string,string|number>;
export interface HukukiKurallar {
 vergi:VergiTarifesi;tavanlar:Tavan[];prim:{sgk:number;issizlik:number;tavanKat:number};
 vekalet:(VekaletTarifesi&{baslangic:string;bitis:string|null})[];faiz:FaizVeri;
 arabulucu:{baslangic:string;bitis:string;asgari:number;ticariAsgari:number;seri:number;seriTicari:number;saatler:Record<string,number[]>;dilimler:{miktar:number|null;tek:number;cok:number}[]};
 icra:{baslangic:string;bitis:string;basvuru:number;suret:number;pul:number;pesinYuzde:number;cezaeviYuzde:number;oranlar:Record<string,number>};
}
export interface HesapSatiri {ad:string;deger:number|string;birim?:'TL'|'gün'|'saat'|'%'}
export interface HukukiSonuc {etiket:string;ana:number;birim:'TL'|'gün';satirlar:HesapSatiri[];notlar:string[]}
const satir=(ad:string,deger:number|string,birim:HesapSatiri['birim']='TL'):HesapSatiri=>({ad,deger:typeof deger==='number'?para(deger):deger,birim});
export function tarihOku(s:string){const d=new Date(s+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new Error('Geçerli bir takvim tarihi girin.');return d;}
function aralik(t:string,bas:string,son:string){tarihOku(t);if(t<bas||t>son)throw new Error(`Bu hesap için doğrulanmış tarih aralığı ${bas} – ${son}.`);}
function sayi(g:Girdiler,id:string,max=1e12,min=0,tam=false){const n=Number(g[id]);if(g[id]===undefined||String(g[id]).trim()===''||!Number.isFinite(n)||n<min||n>max||(tam&&!Number.isInteger(n)))throw new Error('Tutar, süre ve oranları belirtilen sınırlar içinde girin.');return n;}
function sec(g:Girdiler,id:string,izin:string[]){const s=String(g[id]);if(!izin.includes(s))throw new Error('Geçerli bir hesap türü seçin.');return s;}
export interface NetGirdi {brut:number;profil:string;oncekiMatrah:number;oncekiPek:number;gun:number;ay:number;gvIst:number;dvIst:number}
/** Aynı aya ait bir ödeme için kalan PEK tavanı ve kalan vergi istisnası kullanılır. */
export function brutNet(g:NetGirdi,k:HukukiKurallar){
 if(!['ucret','ihbar','kidem'].includes(g.profil)||Object.values(g).some(v=>typeof v==='number'&&(!Number.isFinite(v)||v<0)))throw new Error('Ödeme bilgilerini kontrol edin.');
 const t=k.vergi,primli=g.profil==='ucret',gelirVergili=g.profil!=='kidem';
 const tavan=t.asgariBrut/30*k.prim.tavanKat*g.gun,pek=primli?para(Math.min(g.brut,Math.max(0,tavan-g.oncekiPek))):0;
 const sgk=para(pek*k.prim.sgk/100),issizlik=para(pek*k.prim.issizlik/100),matrah=para(Math.max(0,g.brut-sgk-issizlik));
 const gv=gelirVergili?para(Math.max(0,aylikVergi(matrah,g.oncekiMatrah,t)-g.gvIst)):0;
 const dv=para(Math.max(0,g.brut*t.damgaOrani/1000-(g.profil==='kidem'?0:g.dvIst)));
 return {brut:para(g.brut),pek,sgk,issizlik,matrah,gv,dv,net:para(g.brut-sgk-issizlik-gv-dv)};
}
export function hukukiHesap(tur:HukukiTur,g:Girdiler,k:HukukiKurallar):HukukiSonuc{
 const n=(id:string,max=1e12,min=0,tam=false)=>sayi(g,id,max,min,tam),s=(id:string)=>String(g[id]);
 let etiket='Toplam',ana=0,birim:'TL'|'gün'='TL',satirlar:HesapSatiri[]=[],notlar:string[]=[];
 if(tur==='garameten'){
  const available=n('dagitilacak'),claims=[1,2,3,4,5].map(i=>n(`alacak${i}`));
  const sum=para(claims.reduce((a,b)=>a+b,0));if(!sum)throw new Error('En az bir alacak tutarı girin.');
  const paid=Math.min(available,sum),cents=Math.round(paid*100);
  const shares=claims.map(c=>cents*c/sum),rounded=shares.map(Math.floor);
  const order=shares.map((x,i)=>({i,fraction:x-rounded[i]})).sort((a,b)=>b.fraction-a.fraction||a.i-b.i);
  for(let i=0,left=cents-rounded.reduce((a,b)=>a+b,0);i<left;i++)rounded[order[i].i]++;
  ana=paid;etiket='Alacaklılara dağıtılan toplam';
  satirlar=[satir('Aynı sıradaki alacakların toplamı',sum),...claims.map((claim,i)=>satir(`${i+1}. alacaklı · ${claim.toLocaleString('tr-TR')} TL alacak`,rounded[i]/100)),satir('Dağıtımdan artan tutar',available-paid)];
  notlar=['Yalnız aynı derece ve aynı sıra içinde garameten paylaştırma yapar. Öncelikli alacak, rehin, hacze iştirak, sıra cetveli ve satış masrafı sırasını kendiliğinden belirlemez. Dağıtılabilir tutarı bu kalemler düşüldükten sonra girin.','Kuruş farkı en büyük kalan yöntemine göre paylaştırılır; dağıtılan kuruşların toplamı sonuç tutarına eşittir.'];
 }else if(tur==='aidat'){
  const anapara=n('anapara'),oran=n('oran',100),bas=tarihOku(s('baslangic')),bit=tarihOku(s('bitis'));
  if(bit<bas)throw new Error('Ödeme tarihi vade tarihinden önce olamaz.');
  const days=Math.round((bit.getTime()-bas.getTime())/86400000),months=days/30,comp=para(anapara*oran/100*months);
  ana=para(anapara+comp);etiket='Aidat ve gecikme tazminatı toplamı';
  satirlar=[satir('Ödenmeyen gider / avans payı',anapara),satir('Gecikme süresi',days,'gün'),satir('Aylık tazminat oranı',oran,'%'),satir('Gecikme tazminatı',comp),satir('Toplam',ana)];
  notlar=['Kat Mülkiyeti Kanunu m.20 uyarınca gider ve avans payı gecikmesinde aylık %5 başlangıç oranıdır. Günlük oran için 30 günlük ay esası kullanılır; basit hesap yapılır, bileşik faiz uygulanmaz.','Vade günü hariç, ödeme günü dahil gün farkı alınır. Kısmi ödemeler ve farklı vadeli birden çok aidat için her dönemi ayrı hesaplayın. Yönetim planı, kat malikleri kararı ve somut dosya koşullarını ayrıca kontrol edin.'];
 }else if(tur==='brut-net'){
  aralik(s('tarih'),`${k.vergi.yil}-01-01`,`${k.vergi.yil}-12-31`);
  const profil=sec(g,'profil',['ucret','ihbar','kidem']),yon=sec(g,'yon',['brut','net']),tutar=n('tutar');
  const ay=Number(s('tarih').slice(5,7)),ist=vergiIstisnasi(ay,k.vergi),uygula=sec(g,'istisna',['0','1'])==='1';
  const gir:NetGirdi={brut:tutar,profil,oncekiMatrah:n('oncekiMatrah'),oncekiPek:n('oncekiPek'),gun:n('primGun',30,1,true),ay,gvIst:uygula?Math.max(0,ist.gelir-n('kullanilanGv')):0,dvIst:uygula?Math.max(0,ist.damga-n('kullanilanDv')):0};
  if(yon==='net'){let lo=0,hi=Math.max(1,tutar*3+1000);if(brutNet({...gir,brut:hi},k).net<tutar)throw new Error('Net tutar için brüt üst sınır bulunamadı.');for(let i=0;i<65;i++){const mid=(lo+hi)/2;if(brutNet({...gir,brut:mid},k).net<tutar)lo=mid;else hi=mid;}gir.brut=para(hi);}
  const r=brutNet(gir,k);ana=yon==='net'?r.brut:r.net;etiket=yon==='net'?'Gerekli brüt tutar':'Net ödeme';
  satirlar=[satir('Brüt tutar',r.brut),satir('Prime esas kazanç',r.pek),satir('SGK işçi payı',r.sgk),satir('İşsizlik sigortası işçi payı',r.issizlik),satir('Gelir vergisi matrahı',profil==='kidem'?0:r.matrah),satir('Gelir vergisi',r.gv),satir('Damga vergisi',r.dv),satir('Net ödeme',r.net)];
  notlar=['Normal 4/a çalışanı içindir. Emekli SGDP, teşvik, BES, sendika, engellilik ve ayni/nakdi yardım istisnaları bu hesaba dahil değildir.','İhbar için SGK ve işsizlik primi alınmaz. Kıdem profili yalnız yasal sınırlar içindeki kıdem tutarı içindir; tavanı aşan ödemeleri bu profille hesaplamayın.','Geçmiş dönem işçilik alacağında primlerin ait olduğu aya dağıtılması gerekebilir. Tek ay dönüşümü, çok dönemli mahkeme alacağı için kesin bordro sayılmaz.'];
 }else if(tur==='iscilik'){
  const cikis=s('cikis');aralik(cikis,`${k.vergi.yil}-01-01`,`${k.vergi.yil}-12-31`);tarihOku(s('giris'));
  if(s('giris')>=cikis)throw new Error('Çıkış tarihi giriş tarihinden sonra olmalıdır.');
  const ucret=n('ucret',1e9,0.01),giydirilmis=n('giydirilmis',1e9,ucret);
  const r=kidemIhbar({giris:s('giris'),cikis,ucret:giydirilmis,ihbar:n('ihbar',1,0,true)===1,oncekiMatrah:0},k.tavanlar,k.vergi);
  const normal=n('normalSaat',45,1),fiili=n('fiiliSaat',168),hafta=n('hafta',5200,0,true),saatlik=ucret/(normal*5);
  const mesai=(Math.max(0,Math.min(45,fiili)-normal)*1.25+Math.max(0,fiili-45)*1.5)*hafta*saatlik;
  const indirim=1-n('indirim',100)/100;
  const kalemler=[{ad:'Kıdem tazminatı',brut:n('kidem',1,0,true)?r.brutKidem:0,profil:'kidem'},
   {ad:'İhbar tazminatı',brut:r.brutIhbar,profil:'ihbar'},
   {ad:'Fazla çalışma / fazla sürelerle çalışma',brut:para(mesai*indirim),profil:'ucret'},
   {ad:'UBGT çalışması (ek ücret)',brut:para(ucret/30*n('tatilGun',10000)*indirim),profil:'ucret'},
   {ad:'Hafta tatili çalışması (ek ücret)',brut:para(ucret/30*1.5*n('haftaTatil',10000)*indirim),profil:'ucret'},
   {ad:'Kullanılmayan yıllık izin',brut:para(ucret/30*n('izinGun',10000)),profil:'ucret'}];
  ana=para(kalemler.reduce((a,x)=>a+x.brut,0));etiket='Toplam brüt alacak';
  satirlar=kalemler.map(x=>satir(x.ad,x.brut));satirlar.push(satir('Fesih tarihindeki yıllık kıdem tavanı',r.tavan),satir('İhbar süresi',r.ihbarHafta*7,'gün'));
  notlar=[`Hizmet: ${r.sure.yil} yıl, ${r.sure.ay} ay, ${r.sure.gun} gün; çıkış günü dahil. Kıdem ve ihbar hak kazanma koşullarının sağlandığı seçiminiz esas alınır.`,
   'İlk sonuç brüt alacaktır. Birden fazla döneme ait ücretleri tek ayın SGK tavanı veya vergi dilimiyle netleştirmemek için kesintiler bu toplama uygulanmaz. Her ödeme için brütten nete aracını kullanabilirsiniz.',
   'Mesai ve tatil kalemlerinde girilen aynı brüt ücretin bütün dönem boyunca geçerli olduğu varsayılır. Haftalık saatler ara dinlenmeleri içermez. Denkleştirme, özel iş kolları ve sözleşme artırımları ayrıca değerlendirilir.',
   'UBGT için aylık ücretin dışında 1 günlük, hafta tatilinde 1,5 günlük ek ücret hesaplanır. Aynı çalışmayı mesai ve tatil alanlarına iki kez girmeyin. Hakkaniyet indirimi yalnız mesai ve tatil kalemlerine uygulanır.'];
 }else if(tur==='arabuluculuk'){
  const t=k.arabulucu;aralik(s('tarih'),t.baslangic,t.bitis);
  const konu=sec(g,'konu',Object.keys(t.saatler)),sonuc=sec(g,'sonuc',['anlasma','anlasmama','parasiz','ucretsiz']),zorunlu=sec(g,'surec',['zorunlu','ihtiyari'])==='zorunlu';
  const taraf=n('taraf',10000,2,true),adet=n('arabulucu',100,1,true),saat=n('saat',10000),seri=n('seri',100000,0,true);
  let matrah=0,butce=0,toplam=0;
  if(sonuc==='ucretsiz'){if(!zorunlu)throw new Error('Ücretsiz sehven/mükerrer/elverişsizlik seçeneği dava şartı süreç içindir.');}
  else if(sonuc==='anlasma'){
   const ozel=sec(g,'matrahTuru',['bedel','tahliye','kira-tespit','ise-iade']);
   matrah=ozel==='tahliye'?n('aylikKira')*6:ozel==='kira-tespit'?Math.max(0,n('yeniKira')-n('aylikKira'))*12:ozel==='ise-iade'?n('iseBaslatmama')+n('bostaGecen')+n('digerHak'):n('bedel');
   if(ozel==='kira-tespit'&&n('yeniKira')<n('aylikKira'))throw new Error('Yeni kira mevcut kiradan az olamaz.');
   if(seri>0){if(seri<10)throw new Error('Seri uyuşmazlık için aynı tarafla bir ayda en az 10 uyuşmazlık gerekir.');toplam=seri*(konu==='ticari'?t.seriTicari:t.seri);satirlar.push(satir('Her bir seri uyuşmazlık ücreti',toplam/seri));}
   else {let kalan=matrah;for(const [i,d]of t.dilimler.entries()){const parca=Math.min(kalan,d.miktar??Infinity);if(parca<=0)break;const oran=adet===1?d.tek:d.cok,ucret=parca*oran/100;toplam+=ucret;satirlar.push(satir(`Dilim ${i+1}: ${para(parca).toLocaleString('tr-TR')} TL × %${oran}`,ucret));kalan-=parca;}
    toplam=Math.max(toplam,['ticari','ortaklik'].includes(konu)?t.ticariAsgari:t.asgari);
   }
   satirlar.unshift(satir('Nispi hesap matrahı',matrah));
  }else{
   if(seri)throw new Error('Seri uyuşmazlık ücreti yalnız anlaşma halinde uygulanır.');
   const grup=taraf===2?0:taraf<=5?1:taraf<=10?2:3,birimSaat=t.saatler[konu][grup]*(taraf===2?2:1)*adet;
   toplam=birimSaat*(zorunlu&&sonuc==='anlasmama'?Math.max(2,saat):saat);
   butce=zorunlu&&sonuc==='anlasmama'?birimSaat*2:0;
   if(sonuc==='parasiz')toplam=Math.max(toplam,['ticari','ortaklik'].includes(konu)?t.ticariAsgari:t.asgari);
   satirlar.push(satir('Toplam saatlik ücret (tüm arabulucular)',birimSaat));
  }
  ana=para(toplam);etiket='Toplam arabuluculuk ücreti';const taraflar=para(ana-butce);
  satirlar.push(satir('Bakanlık bütçesinden karşılanacak',butce),satir('Tarafların ödeyeceği toplam',taraflar),satir('Taraf başına eşit pay (yuvarlanmış)',taraflar/taraf),satir('Arabulucu başına ücret',ana/adet));
  notlar=['Faaliyetin sona erdiği tarihteki tarife uygulanır. Anlaşma halinde genel ve özel alt sınırlar korunur. Dava şartı anlaşmamada ilk iki saat Bakanlık bütçesinden, aşan süre taraflardan karşılanır.','Birinci Kısımda her arabulucuya ayrı ücret; İkinci Kısımda birden fazla arabulucu için belirlenen toplam ücret eşit paylaştırılır. Ödeme paylaşımı aksi kararlaştırılmadıkça eşittir. Kuruş yuvarlamasında son payda düzeltme gerekebilir.','Tüketici uyuşmazlığında tüketicinin Bakanlıkça karşılanan payı gibi özel ödeme muafiyetleri bu genel eşit paylaşımda uygulanmaz; ücret ile kimin ödeyeceğini ayrı değerlendirin.'];
 }else if(tur==='icra'){
  const t=k.icra;aralik(s('tarih'),t.baslangic,t.bitis);tarihOku(s('aautTarih'));
  const v=[...k.vekalet].reverse().find(v=>v.baslangic<=s('aautTarih')&&(!v.bitis||v.bitis>=s('aautTarih')));if(!v)throw new Error('İşlem tarihine ait AAÜT bulunamadı.');
  const asil=n('anapara'),islemis=n('islemisFaiz'),faizTuru=sec(g,'faizTuru',['yok','elle','kanuni','ticari','avans','ttk']);
  const faiz=faizTuru==='yok'?0:faizHesap({anapara:asil,baslangic:s('faizBaslangic'),bitis:s('tarih'),tur:faizTuru as 'elle'|'kanuni'|'ticari'|'avans'|'ttk',oran:n('oran',1000),yilEsasi:n('yilEsasi') as 360|365},k.faiz).faiz;
  const ilamli=sec(g,'takip',['ilamsiz','ilamli'])==='ilamli',avukat=sec(g,'avukat',['0','1'])==='1';
  const pesin=ilamli?0:para(n('takipMatrah')*t.pesinYuzde/100),posta=n('posta'),pul=avukat?t.pul:0,suret=avukat?t.suret:0,ek=n('ekMasraf');
  const acilis=para(t.basvuru+pesin+posta+pul+suret),vek=avukat?para((sec(g,'vekaletTuru',['tarife','elle'])==='elle'?n('vekalet'):vekalet(n('kesinlesen'),'icra-takip',v))*(sec(g,'sureIcinde',['0','1'])==='1'?0.75:1)):0;
  const asama=sec(g,'asama',Object.keys(t.oranlar)),tahsil=para(n('tahsilMatrah')*t.oranlar[asama]/100),mahsup=Math.min(pesin,tahsil),bakiye=para(tahsil-mahsup);
  const cezaevi=para(n('cezaeviMatrah')*t.cezaeviYuzde/100),borclu=para(asil+islemis+faiz+acilis+ek+vek+bakiye),alacakli=para(asil+islemis+faiz-cezaevi);
  const amac=sec(g,'amac',['kapak','acilis','tahsilat']);ana=amac==='acilis'?acilis:amac==='tahsilat'?alacakli:borclu;etiket=amac==='acilis'?'Takip açılış avansı':amac==='tahsilat'?'Alacaklıya kalan asıl alacak ve faiz':'Borçlu kapak toplamı';
  satirlar=[satir('Asıl alacak',asil),satir('Takip öncesi işlemiş faiz',islemis),satir('Takip sonrası hesaplanan faiz',faiz),satir('İcra başvurma harcı',t.basvuru),satir('Peşin harç',pesin),satir('Tebligat / posta (girilen)',posta),satir('Vekâlet suret harcı',suret),satir('Baro pulu',pul),satir('Açılış masrafları toplamı',acilis),satir('İcra vekâlet ücreti',vek),satir('Ek masraflar',ek),satir('Tahsil harcı',tahsil),satir('Peşin harç mahsubu',mahsup),satir('Kalan tahsil harcı',bakiye),satir('Borçlu toplamı',borclu),satir('Cezaevi yapı harcı (alacaklı kesintisi)',cezaevi),satir('Alacaklıya kalan asıl alacak ve faiz',alacakli)];
  notlar=['Genel ilamlı/ilamsız para takibi ve tek seferde tam ödeme varsayılır. Tahliye, MTS, kambiyo, ipotek/rehin, haricen tahsil, vazgeçme, muafiyet ve kısmi ödeme özel kuralları kapsam dışıdır.','Takip, kesinleşen miktar, tahsil harcı ve cezaevi harcı matrahları dosyadan ayrı girilir. Faiz ve vekâlet ücreti kendiliğinden bütün matrahlara eklenmez. Peşin harç tahsil harcından mahsup edilir.','Cezaevi yapı harcı borçluya eklenmez. Alacaklı netinde masraf iadeleri ve avukata ait vekâlet ücreti dahil değildir. Posta bedelini gönderim tarihindeki fiili tutarla girin.','AAÜT tarihi faiz/ödeme tarihinden bağımsızdır. Elle ücret seçeneğinde süre içinde ödeme indirimi de seçiminize göre uygulanır. Kesin kapak hesabı icra müdürlüğü kayıtlarıyla belirlenir.'];
 }else if(tur==='infaz'){
  const suc=tarihOku(s('sucTarihi')),bas=tarihOku(s('baslangic'));if(suc>bas)throw new Error('Suç tarihi infaza başlama tarihinden sonra olamaz.');
  const yil=n('yil',1000,0,true),ay=n('ay',11,0,true),gun=n('gun',29,0,true),toplam=yil*365+ay*30+gun;
  if(!toplam)throw new Error('Hapis cezası sıfırdan büyük olmalıdır.');
  const oran=sec(g,'oran',['1/2','2/3','3/4','1']),[pay,payda]=oran==='1'?[1,1]:oran.split('/').map(Number),kosullu=Math.floor(toplam*pay/payda),mahsup=n('mahsup',toplam,0,true);
  const ds=n('denetim',3650,0,true),yeni=s('sucTarihi')>='2025-06-04',asgari=yeni?Math.min(kosullu,Math.max(5,Math.ceil(kosullu/10))):0;
  const kalan=Math.max(0,kosullu-mahsup),fiili=Math.max(0,kalan-ds,asgari-mahsup),kalanTam=Math.max(0,toplam-mahsup);
  const tarihEkle=(gun:number)=>{const d=new Date(bas);d.setUTCDate(d.getUTCDate()+gun);return d.toISOString().slice(0,10).split('-').reverse().join('.');};
  ana=fiili;etiket='Tahmini kalan kurum süresi';birim='gün';
  satirlar=[satir('Hükmedilen toplam ceza',toplam,'gün'),satir('Koşullu salıverilme için toplam süre',kosullu,'gün'),satir('Mahsup',mahsup,'gün'),satir('Seçilen denetimli serbestlik süresi',ds,'gün'),satir('Yeni suçlar için asgari kurum süresi',asgari,'gün'),satir('Tahmini denetimli serbestliğe ayrılma',tarihEkle(fiili)),satir('Koşullu salıverilme tarihi',tarihEkle(kalan)),satir('Hak ederek tahliye tarihi',tarihEkle(kalanTam))];
  notlar=['Süreli hapis için yıl 365, ay 30 gün kabul edilen yaklaşık süre hesabıdır. Başlangıç, önceki mahsup dışındaki kalan infazın başladığı gündür. Gün kesirleri aşağı yuvarlanır. Resmî müddetname yerine geçmez.',
   'Oranı suçun adından otomatik belirlemez. Genel yetişkin süreli hapis için 1/2 başlangıç seçeneğidir; suçun madde/fıkrası, tekerrür ve özel kanuna göre geçerli oranı karardan doğrulayın. Müebbet, çocuk, toplama cezaları ve koşullu salıverilmenin geri alınması kapsam dışıdır.',
   'Denetimli serbestlik süresini dosyanızdaki uygulanabilir karara göre girin; genel başlangıç değeri 365 gündür. İyi hâl, açık kuruma ayrılma, talep ve infaz hâkimi kararı varsayılır. Süreyi 0 girerek denetimsiz hesabı görebilirsiniz.',
   '30.03.2020 ve 31.07.2023 bağlantılı geçici hükümler, özel suç istisnaları ve erken açık kuruma ayrılma otomatik uygulanmaz. Bu hallerde genel hesap farklı çıkabilir; seçilen oran/süre hak kazanıldığı anlamına gelmez.',
   yeni?'04.06.2025 ve sonrasında işlenen suçlarda 105/A uyarınca en az beş gün ve koşullu süreye kadar gereken sürenin onda biri kontrol edilir. Önceki mahsup bu kurum süresinden düşülür.':'04.06.2025 öncesi suçta Geçici m.11 gereğince yeni onda bir kurumda kalma şartı uygulanmadı.'];
 }else throw new Error('Hesap türü bulunamadı.');
 return {etiket,ana:para(ana),birim,satirlar,notlar};
}
