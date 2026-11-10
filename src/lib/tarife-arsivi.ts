import {z} from 'zod';
import raw from '../data/tarife-arsivi.json' with {type:'json'};
import {hukukTarifeleri} from './hukuk-veri';
import cmk from '../data/cmk-tarifeleri.json' with {type:'json'};
import iflas from '../data/iflas-idaresi.json' with {type:'json'};
import thh from '../data/thh-bilirkisi.json' with {type:'json'};
import gecmis from '../data/katsayi-gecmisi.json' with {type:'json'};
import {ayarlar} from './settings';
const kalem=z.object({ad:z.string().min(1),tutar:z.number().nonnegative(),birim:z.string()});
const kayit=z.object({baslangic:z.iso.date(),bitis:z.iso.date().nullable(),kaynak:z.url(),kalemler:z.array(kalem),notu:z.string()});
export const tarifeler=z.array(z.object({slug:z.string(),ad:z.string(),periyot:z.string(),aciklama:z.string(),kayitlar:z.array(kayit).min(1),arac:z.string().nullable()})).parse(raw);
// Hesap motorlarının ortak verileri arşive de doğrudan yansır.
tarifeler.find(t=>t.slug==='avukatlik-asgari-ucret')!.kayitlar=hukukTarifeleri.vekalet.map(v=>({baslangic:v.baslangic,bitis:v.bitis,kaynak:v.kaynak,notu:'Nispi dilimler kademeli uygulanır. Son dilim kalan tutarın tamamıdır. Hesaplama için vekâlet ücreti aracını açın.',kalemler:[...v.mahkemeler.map(m=>({ad:m.ad,tutar:m.maktu,birim:'TL'})),...v.basamaklar.flatMap((b,i)=>[...(b.miktar===null?[]:[{ad:`Nispi dilim ${i+1} · genişlik`,tutar:b.miktar,birim:'TL'}]),{ad:`Nispi dilim ${i+1} · oran`,tutar:b.oran,birim:'%'}])]}));
const cmkAdlar=tarifeler.find(t=>t.slug==='cmk-mudafi')!.kayitlar[0].kalemler.map(k=>k.ad);
tarifeler.find(t=>t.slug==='cmk-mudafi')!.kayitlar=cmk.map(c=>({baslangic:`${c.yil}-01-01`,bitis:`${c.yil}-12-31`,kaynak:c.kaynak,notu:'Brüt görevlendirme ücretleri; net ödeme değildir.',kalemler:c.tutarlar.map((tutar,i)=>({ad:cmkAdlar[i],tutar,birim:'TL'}))}));
const katsayilar=[...gecmis.filter(d=>d.baslangic>='2024-01-01'&&!ayarlar.donemler.some(x=>x.baslangic===d.baslangic)),...ayarlar.donemler.map(d=>({...d,aylik:d.memur_maas_aylik_katsayi}))].sort((a,b)=>a.baslangic.localeCompare(b.baslangic));
tarifeler.find(t=>t.slug==='tuketici-hakem-heyeti-bilirkisi')!.kayitlar=katsayilar.map(d=>({baslangic:d.baslangic,bitis:d.bitis,kaynak:thh.kaynak,notu:`Aylık katsayı: ${d.aylik}. Katsayı kaynağı: ${d.kaynak}`,kalemler:thh.urunler.map(u=>({ad:u.ad,tutar:Math.round(u.gosterge*d.aylik*100)/100,birim:'TL'}))}));
tarifeler.find(t=>t.slug==='iflas-idaresi')!.kayitlar=iflas.tarifeler.map((r,i)=>({baslangic:r.baslangic,bitis:iflas.tarifeler[i+1]?new Date(Date.parse(iflas.tarifeler[i+1].baslangic+'T00:00:00Z')-86400000).toISOString().slice(0,10):null,kaynak:r.kaynak,notu:'Dilim genişlikleri sırasıyla '+r.dilimler.map(d=>d.miktar??'kalan kısım').join(', ')+' TL. Masraf avansı tahmini yazı ve normal tebligat masrafının üç katıdır. Rehinli alacak ek ücreti ve mahkeme takdiri için resmî metni inceleyin.',kalemler:r.dilimler.map((d,i)=>({ad:`Dilim ${i+1}`,tutar:d.oran,birim:'%'}))}));
export type Tarife=typeof tarifeler[number];
export const tarifeYol=(slug:string)=>`/tarifeler/${slug}/`;
export const tarifeYillari=Array.from({length:Number(new Intl.DateTimeFormat('en',{timeZone:'Europe/Istanbul',year:'numeric'}).format(new Date()))-2024+1},(_,i)=>2024+i);
export function yilinKayitlari(t:Tarife,y:number){return t.kayitlar.filter(r=>r.baslangic<=`${y}-12-31`&&(!r.bitis||r.bitis>=`${y}-01-01`));}
