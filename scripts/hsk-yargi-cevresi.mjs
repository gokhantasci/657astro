// Yeni duyuruları izleme listesine alır. Kararlar yürürlük tarihiyle ayrıca işlenir.
import {readFile,writeFile} from 'node:fs/promises';
import {ayristir} from './haberler.mjs';
const yil=process.argv[2]??new Intl.DateTimeFormat('en',{timeZone:'Europe/Istanbul',year:'numeric'}).format(new Date());
if(!/^20\d{2}$/.test(yil))throw Error('Geçerli arşiv yılını girin.');
const url=`https://hsk.gov.tr/Arsiv/duyuru-${yil}`;
const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('HSK arşivi okunamadı.');
const rows=ayristir(await response.text(),{ad:'HSK',url,ayristirici:'hsk'},1000).filter(r=>/yarg[ıi].*çevre|yarg[ıi].*cevre/i.test(r.title));
if(!rows.length)throw Error('HSK yargı çevresi listesi bulunamadı; eski izleme kaydı korunuyor.');
const known=['malkara-gelibolu-ve-eceabat','yargi-cevresi-duzenlemelerine-iliskin-duyuru_4399','yeni-kurulan-agir-ceza-mahkemelerinin-yargi-cevrelerinin','yargi-cevresi-duzenlemelerine-iliskin-duyuru_4346','istanbul-asliye-ticaret-mahkemelerinin-yargi-cevresinin'];
const dosya=new URL('../src/data/hsk-yargi-cevresi-izleme.json',import.meta.url);
let previous=[];try{previous=JSON.parse(await readFile(dosya,'utf8')).duyurular;}catch{}
const unique=[...new Map([...previous,...rows.map(r=>({...r,durum:known.some(k=>r.url.includes(k))?'İşlendi':'Karar eki ve yürürlük tarihi kontrol edilecek'}))].map(r=>[r.url,r])).values()];
await writeFile(dosya,JSON.stringify({kaynak:url,duyurular:unique},null,1)+'\n');
console.log(`${unique.length} HSK yargı çevresi duyurusu izleniyor.`);
