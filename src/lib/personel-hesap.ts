export interface IzinKurali {birYil:number;besYilUstu:number;onBesYil:number;gencYas:number;ileriYas:number;yasAsgari:number;yerAltiEk:number;}
export interface IzinGirdi {giris:string;tarih:string;yas:number;yerAlti:boolean;kullanilan:number;devreden:number;}
function tarih(s:string){const d=new Date(s+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new Error('Geçerli takvim tarihi girin.');return d;}
function yilDonumu(giris:string,yil:number){const ay=Number(giris.slice(5,7)),gun=Number(giris.slice(8,10)),son=new Date(Date.UTC(yil,ay,0)).getUTCDate();return `${yil}-${String(ay).padStart(2,'0')}-${String(Math.min(gun,son)).padStart(2,'0')}`;}
export function yillikIzin(g:IzinGirdi,k:IzinKurali){
 tarih(g.giris);tarih(g.tarih);if(g.giris>g.tarih)throw new Error('İşe giriş hesap tarihinden sonra olamaz.');
 if(!Number.isInteger(g.yas)||g.yas<1||g.yas>120||[g.kullanilan,g.devreden].some(n=>!Number.isFinite(n)||n<0||n>10000))throw new Error('Yaş ve gün tutarlarını kontrol edin.');
 let yil=Number(g.tarih.slice(0,4))-Number(g.giris.slice(0,4));if(g.tarih<yilDonumu(g.giris,Number(g.tarih.slice(0,4))))yil--;
 let hak=yil<1?0:yil<=5?k.birYil:yil<15?k.besYilUstu:k.onBesYil;
 if(yil>=1){if(g.yas<=k.gencYas||g.yas>=k.ileriYas)hak=Math.max(hak,k.yasAsgari);if(g.yerAlti)hak+=k.yerAltiEk;}
 const bakiye=Math.round((hak+g.devreden-g.kullanilan)*100)/100;
 return {yil,hak,kalan:Math.max(0,bakiye),asilan:Math.max(0,-bakiye),sonraki:yilDonumu(g.giris,Number(g.giris.slice(0,4))+yil+1)};
}
export interface IkmKurali {erkekMin:number;kadinMin:number;eksik:number;fazla:number;}
export function ikmBoyKilo(g:{cinsiyet:'erkek'|'kadin';boy:number;kilo:number},k:IkmKurali){
 if(!['erkek','kadin'].includes(g.cinsiyet)||!Number.isInteger(g.boy)||g.boy<100||g.boy>=200||!Number.isFinite(g.kilo)||g.kilo<=0||g.kilo>300)throw new Error('Boyu 100–199 cm arasında tam sayı, kiloyu 0–300 kg arasında girin.');
 const asgari=g.cinsiyet==='erkek'?k.erkekMin:k.kadinMin,alt=g.boy-100-k.eksik,ust=g.boy-100+k.fazla;
 return {asgari,alt,ust,boyUygun:g.boy>=asgari,kiloUygun:g.kilo>=alt&&g.kilo<=ust,uygun:g.boy>=asgari&&g.kilo>=alt&&g.kilo<=ust};
}
