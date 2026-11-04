import dini from '../data/dini-gunler.json' with {type:'json'};
import mesajlar from '../data/ozel-gun-mesajlari.json' with {type:'json'};
export interface OzelGun {tarih:string;ad:string;mesaj:string;kaynak?:string}
const iso=(y:number,m:number,d:number)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
function pazar(y:number,m:number,sira:number){const ilk=new Date(Date.UTC(y,m-1,1)).getUTCDay();return 1+(7-ilk)%7+7*(sira-1);}
export function ozelGunler(yil:number):OzelGun[]{
 const kayitlar:OzelGun[]=mesajlar.sabit.map(g=>({tarih:iso(yil,g.ay,g.gun),ad:g.ad,mesaj:g.mesaj}));
 kayitlar.push({tarih:iso(yil,5,pazar(yil,5,2)),ad:'Anneler Günü',mesaj:mesajlar.anneler},{tarih:iso(yil,6,pazar(yil,6,3)),ad:'Babalar Günü',mesaj:mesajlar.babalar});
 for(const d of dini.filter(d=>d.tarih.startsWith(yil+'-'))){const ad=d.ad.toLocaleLowerCase('tr-TR').replace(/(^|\s)(\p{L})/gu,(_,a,b)=>a+b.toLocaleUpperCase('tr-TR'));const s=/RAMAZAN BAYRAMI/.test(d.ad)?mesajlar.ramazan:/KURBAN BAYRAMI/.test(d.ad)?mesajlar.kurban:/KANDİL|KADİR/.test(d.ad)?mesajlar.kandil:mesajlar.diger;kayitlar.push({...d,ad,mesaj:s.replace('{ad}',ad)});}
 return kayitlar.sort((a,b)=>a.tarih.localeCompare(b.tarih));
}
export function gunHatirlatmalari(tarih:string){const dt=new Date(tarih+'T12:00:00Z'),yarin=new Date(+dt+86400000).toISOString().slice(0,10);return [...ozelGunler(dt.getUTCFullYear()),...ozelGunler(dt.getUTCFullYear()+1)].filter(g=>g.tarih===tarih||g.tarih===yarin).map(g=>({...g,metin:g.tarih===tarih?g.mesaj:mesajlar.onceki.replace('{ad}',g.ad).replace('{mesaj}',g.mesaj)}));}
