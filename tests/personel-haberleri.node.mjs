import {test} from 'node:test';
import assert from 'node:assert/strict';
import {personelBasligi,kurumlariAyristir,arsiviAyristir,kurumArsiviniTara,personelHaberleriniTara,personelGetir} from '../scripts/personel-haberleri.mjs';
const kurum={ad:'Gebze Adliyesi',tur:'acm',url:'https://gebze.adalet.gov.tr'};
const row=(title='Sözlü sınav sonuçları',path='/sonuc',date='07.11.2026')=>`<a href=${path}><span>${date}</span><div class=baslik>${title}</div></a>`;
const archive=(body=row(),cursor='-1')=>`<div class=arsivlist>${body}</div><input type=hidden id=sonid value=${cursor}><input id=sayfakonum value=tumu><input id=listeseciliyil value=0>`;
test('Türkçe büyük harf, ekler ve sözcük sınırları',()=>{
 for(const s of ['SINAV SONUÇLARI','MÜLAKATA GİRECEKLER','SÖZLÜ sınava çağrı','Adayların listesi','Sonuçları açıklanmıştır','Sınavı kazananlar'])assert.equal(personelBasligi(s),true,s);
 for(const s of ['Bayramlaşma töreni','Ziyaret','Anadayı tanıtımı','Uluslararası iş birliği'])assert.equal(personelBasligi(s),false,s);
});
test('bozuk dizin HTML’sinde kurum adı komşu kurumlardan ve altbilgiden ayrılır',()=>{
 const rows=kurumlariAyristir('<a class=ab-announcement href=https://gebze.adalet.gov.tr><h6>GEBZE <span>ADLİYESİ</span></h6><a class=ab-announcement href=https://sakaryabam.adalet.gov.tr><h6>SAKARYA BAM</h6></a><footer>başka metin</footer>',{tur:'acm',url:'https://adalet.gov.tr/Birimler/ACM'});
 assert.deepEqual(rows.map(r=>r.ad),['GEBZE ADLİYESİ','SAKARYA BAM']);
});
test('arşiv menüleri alınmaz; tarih, HTML varlıkları ve güvenilir adres korunur',()=>{
 const r=arsiviAyristir('<nav>'+row('Sınav','https://bad.example/sonuc')+'</nav>'+archive(row('S&#246;zl&#252; sınav adayları')+row('Aday','https://bad.example')+row('Mülakat','javascript:alert(1)')+row('Sınav','/hata','31.02.2026')),kurum);
 assert.equal(r.haberler.length,1);assert.equal(r.haberler[0].title,'Sözlü sınav adayları');assert.equal(r.haberler[0].date,'2026-11-07');assert.equal(r.haberler[0].institution,'Gebze Adliyesi');
});
test('ilk 50 kayıtla sınırlı kalmaz; devam isteği imleci ve tarih sınırını izler',async()=>{
 const requests=[];const fetcher=async(url,options)=>{requests.push([url,options]);return new Response(requests.length===1?archive(row('Tören'), '30'):requests.length===2?JSON.stringify([row('Mülakat sonucu','/mulakat'), '20']):JSON.stringify([row('Eski aday','/eski','01.01.2020'),'10']));};
 const r=await kurumArsiviniTara(kurum,{sinirTarih:'2025-11-07',fetcher});assert.equal(r.sayfa,3);assert.equal(r.haberler.length,1);assert.equal(r.tamamlandi,true);assert.equal(requests[1][1].method,'POST');assert.equal(requests[1][1].body.get('sonid'),'30');assert.equal(requests[1][1].body.get('tur'),'tumu');
});
test('devam sunucusu bozulduğunda yeni ilk sayfa ve eski kayıtlar kaybolmaz',async()=>{
 const old={source:'Personel',institution:kurum.ad,date:'2026-10-10',title:'Eski aday duyurusu',url:kurum.url+'/eski'};
 const fetcher=async url=>url.endsWith('/Arsiv/tumu')?new Response(archive(row('Yeni sınav'), '30')):new Response('',{status:503});
 const result=await personelHaberleriniTara({onceki:[old],katalog:{kurumlar:[kurum]},sinirTarih:'2025-11-07',fetcher,log:()=>{}});
 assert.equal(result.haberler.length,2);assert.equal(result.durumlar.find(d=>d.kaynak==='Personel').basarili,false);assert.match(result.durumlar.find(d=>d.kaynak==='Personel').hata,/503/);
});
test('dönen imleç ve sayfa sınırı eksik taramayı başarılı göstermez',async()=>{
 const fetcher=async url=>new Response(url.endsWith('/Arsiv/tumu')?archive(row(),'30'):JSON.stringify([row('Adaylar','/aday'),'30']));
 const result=await kurumArsiviniTara(kurum,{fetcher});assert.equal(result.tamamlandi,false);assert.match(result.hata,/ilerlemiyor/);
 const limited=await kurumArsiviniTara(kurum,{fetcher,maxSayfa:1});assert.equal(limited.tamamlandi,false);assert.match(limited.hata,/sınır/);
});
test('kaynak hata yönlendirmesi ve resmî alan dışına yönlendirme izlenmez',async()=>{
 for(const location of ['/hata?aspxerrorpath=/Arsiv/tumu','https://bad.example/archive']){
  let count=0;await assert.rejects(personelGetir(kurum.url,{},async()=>{count++;return new Response('',{status:302,headers:{location}});}),/hata sayfasına veya geçersiz/);assert.equal(count,1);
 }
});
