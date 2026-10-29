export const para=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
function sinir(n:number,max=1e12){if(!Number.isFinite(n)||n<0||n>max)throw new Error('Tutar ve oranları kontrol edin.');}
export interface SmmGirdi {tutar:number;yon:'brut'|'net'|'tahsilat'|'toplam';stopaj:number;kdv:number;tevkifat:number;}
export function smmHesap(g:SmmGirdi){
 sinir(g.tutar);sinir(g.stopaj,100);sinir(g.kdv,100);sinir(g.tevkifat,100);
 const s=g.stopaj/100,k=g.kdv/100,t=g.tevkifat/100;
 const carpan={brut:1,net:1-s,tahsilat:1-s+k*(1-t),toplam:1+k}[g.yon];
 if(carpan===undefined||carpan<=0)throw new Error('Bu oranlarla seçilen tutardan brüt ücret bulunamaz.');
 const brut=para(g.tutar/carpan),stopaj=para(brut*s),kdv=para(brut*k),tevkifat=para(kdv*t);
 const net=para(brut-stopaj),kalanKdv=para(kdv-tevkifat),tahsilat=para(net+kalanKdv),toplam=para(brut+kdv);
 return {brut,stopaj,net,kdv,tevkifat,kalanKdv,tahsilat,toplam,tersFark:para(({brut,net,tahsilat,toplam}[g.yon])-g.tutar)};
}
export interface FaizVeri {baslangic:string;veriSonu:string;yeniKanunBaslangici:string;reeskontCarpani:number;yariyilFarkEsigi:number;kanuniEski:{baslangic:string;oran:number}[];ttk:{baslangic:string;oran:number;giderim:number}[];tcmb:{baslangic:string;reeskont:number;avans:number}[];}
export interface FaizGirdi {anapara:number;baslangic:string;bitis:string;tur:'elle'|'kanuni'|'ticari'|'avans'|'ttk';oran:number;yilEsasi:360|365;}
const GUN=86400000;
function tarih(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new Error('Tarih biçimi geçersiz.');const t=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==s)throw new Error('Takvim tarihi geçersiz.');return t;}
const iso=(t:number)=>new Date(t).toISOString().slice(0,10);
function tcmb(t:string,v:FaizVeri){const d=[...v.tcmb].reverse().find(d=>d.baslangic<=t);if(!d)throw new Error('Bu yılın TCMB dayanak oranı eksik.');return d;}
export function faizOrani(t:string,tur:Exclude<FaizGirdi['tur'],'elle'>,v:FaizVeri):number{
 if(t<v.baslangic||t>v.veriSonu)throw new Error('Bu tarih için doğrulanmış otomatik faiz verisi yok; oranı elle girebilirsiniz.');
 if(tur==='avans')return tcmb(t,v).avans;
 if(tur==='ttk'){const d=[...v.ttk].reverse().find(d=>d.baslangic<=t);if(!d||d.baslangic.slice(0,4)!==t.slice(0,4))throw new Error('Bu yıl için TTK 1530 tarifesi eksik.');return d.oran;}
 if(tur==='kanuni'&&t<v.yeniKanunBaslangici){const d=[...v.kanuniEski].reverse().find(d=>d.baslangic<=t);if(!d)throw new Error('Kanuni faiz cetveli eksik.');return d.oran;}
 const yil=Number(t.slice(0,4)),alan=tur==='kanuni'?'reeskont':'avans';
 const aralik=tcmb(`${yil-1}-12-31`,v)[alan],haziran=tcmb(`${yil}-06-30`,v)[alan];
 // 3095/1 yeni metin: en az 5 puan değişiklik; 3095/2 ticari temerrüt: 5 puan veya daha çok fark.
 const oran=t>=`${yil}-07-01`&&Math.abs(haziran-aralik)>=v.yariyilFarkEsigi?haziran:aralik;
 const aday=tur==='kanuni'?para(oran*v.reeskontCarpani):oran;
 return tur==='ticari'?Math.max(aday,faizOrani(t,'kanuni',v)):aday;
}
/** Başlangıç dahil, bitiş hariç gerçek takvim günleri; bileşik faiz uygulanmaz. */
export function faizHesap(g:FaizGirdi,v:FaizVeri){
 sinir(g.anapara);sinir(g.oran,1000);if(![360,365].includes(g.yilEsasi)||!['elle','kanuni','ticari','avans','ttk'].includes(g.tur))throw new Error('Faiz türü ve yıl esasını kontrol edin.');
 const ilk=tarih(g.baslangic),son=tarih(g.bitis);if(son<ilk)throw new Error('Bitiş başlangıçtan önce olamaz.');if((son-ilk)/GUN>36525)throw new Error('En fazla 100 yıllık aralık hesaplanabilir.');
 if(g.tur!=='elle'&&(g.baslangic<v.baslangic||g.bitis>iso(tarih(v.veriSonu)+GUN)))throw new Error('Seçilen aralık için otomatik faiz verisi eksik; oranı elle girebilirsiniz.');
 const sinirlar=new Set([ilk,son]);
 if(g.tur!=='elle'){
  for(const d of [...v.kanuniEski.map(d=>d.baslangic),v.yeniKanunBaslangici,...(g.tur==='avans'?v.tcmb.map(d=>d.baslangic):[])]){const t=tarih(d);if(t>ilk&&t<son)sinirlar.add(t);}
  for(let y=Number(g.baslangic.slice(0,4));y<=Number(g.bitis.slice(0,4));y++)for(const d of [`${y}-01-01`,`${y}-07-01`]){const t=tarih(d);if(t>ilk&&t<son)sinirlar.add(t);}
 }
 const bolumler=[...sinirlar].sort((a,b)=>a-b),satirlar:{baslangic:string;bitis:string;gun:number;oran:number;faiz:number}[]=[];let ham=0;
 for(let i=0;i<bolumler.length-1;i++){
  const a=bolumler[i],b=bolumler[i+1],gun=(b-a)/GUN,oran=g.tur==='elle'?g.oran:faizOrani(iso(a),g.tur,v),faiz=g.anapara*oran*gun/(g.yilEsasi*100);ham+=faiz;
  const onceki=satirlar.at(-1);
  if(onceki&&onceki.oran===oran){onceki.bitis=iso(b);onceki.gun+=gun;onceki.faiz=para(g.anapara*oran*onceki.gun/(g.yilEsasi*100));}
  else satirlar.push({baslangic:iso(a),bitis:iso(b),gun,oran,faiz:para(faiz)});
 }
 const faiz=para(ham);return {gun:(son-ilk)/GUN,faiz,toplam:para(g.anapara+faiz),satirlar};
}
