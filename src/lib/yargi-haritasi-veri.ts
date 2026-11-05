import geo from '../data/yargi-haritasi.json' with {type:'json'};
import {adliKayitlar,adliSlug} from './adlicevre';
import degisiklikler from '../data/adli-teskilat-degisiklikleri.json' with {type:'json'};
// Geometri bir kez hazırlanır; teşkilat bilgisi adli çevre sayfalarıyla aynı,
// tarihli HSK düzeltmelerini uygulayan kayıtlardan her derlemede yenilenir.
export function yargiHaritasiVerisi(){
 const data=structuredClone(geo) as Omit<typeof geo,'bamlar'> & {bamlar:Record<string,{ad:string;renk:string;iller:{plaka:string;ad:string}[]}>};
 const rows=adliKayitlar.flatMap(k=>k.kaynak?[{...k.kaynak,slug:k.slug}]:[]);
 for(const il of Object.values(data.iller)){
  const kayitlar=rows.filter(k=>adliSlug(k.il)===adliSlug(il.ad));
  const faal=kayitlar.filter(k=>k.durum==='Faal');
  il.adliyeler=faal.map(k=>({mahal:k.mahal,teskilat:k.teskilat,bagli_acm:k.bagli_acm,cbs_var:k.cbs_var==='1'}));
  il.adliye_sayisi=faal.length;
  il.acmler=faal.filter(k=>k.teskilat==='ACM').map(k=>k.mahal);il.acm_sayisi=il.acmler.length;
  il.cbsler=faal.filter(k=>k.cbs_var==='1').map(k=>k.mahal);il.cbs_sayisi=il.cbsler.length;
  const merkez=kayitlar.find(k=>adliSlug(k.mahal)===adliSlug(il.ad))??faal[0];
  if(merkez)il.bam=merkez.bagli_bam.replace(/\s*BAM$/,'')+' BAM';
  // Merkez ilçeler, geometri aktarımında eşlenen adliye üzerinden çözülür.
  for(const d of il.ilceler){
   const row=kayitlar.find(k=>adliSlug(k.mahal)===adliSlug(d.ad))??kayitlar.find(k=>k.mahal===d.bagli_adliye);
   if(!row)continue;
   const active=row.durum==='Faal';d.has_adliye=active;d.teskilat=active?row.teskilat:null;
   d.bagli_acm=row.bagli_acm;d.bagli_adliye=active?row.mahal:row.bagli_adliye;d.cbs_var=row.cbs_var==='1';
  }
 }
 data.bamlar={};
 const palette=['var(--color-banner-rule)','var(--color-muted)','var(--color-ink-2)','var(--color-banner-2)','var(--color-lead)','var(--color-green)'];
 for(const il of Object.values(data.iller)){
  let b=data.bamlar[il.bam as keyof typeof data.bamlar];
  if(!b){b={ad:il.bam,renk:palette[Object.keys(data.bamlar).length%palette.length],iller:[]};Object.assign(data.bamlar,{[il.bam]:b});}
  b.iller.push({plaka:il.plaka,ad:il.ad});il.bamColor=b.renk;
 }
 Object.values(data.bimler).forEach((b,i)=>{b.renk=palette[i%palette.length];for(const p of b.iller)data.iller[p.plaka as keyof typeof data.iller].bimColor=b.renk;});
 return {...data,kaynaklar:[...new Set(degisiklikler.map(d=>d.kaynak))]};
}
