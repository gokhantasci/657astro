import {test,expect} from '@playwright/test';
import * as X from 'xlsx';
import {unzipSync,strFromU8} from 'fflate';
import mods from '../src/data/teftis-modulleri.json' with {type:'json'};
import {teftisSayfalama} from '../scripts/teftis-sayfalama.mjs';
const workbook=(rows:unknown[][],sheet='StyleSheet')=>{const wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(rows),sheet);return {name:'kurgu.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(X.write(wb,{type:'buffer',bookType:'xlsx'}))};};
test('ortak sayfa boyu: bildirim, nesne ve sonradan atama aynı ayarı kullanır',()=>{
 const source='const pageSize = 20; const PAGE_SIZE = 5; const MODAL_PAGE_SIZE = 10; const data={pageSize:20}; data.pageSize = 15;';
 const result=teftisSayfalama(source,50);expect(result.match(/50/g)).toHaveLength(5);expect(teftisSayfalama(source,25).match(/25/g)).toHaveLength(5);
});
for(const m of mods)test(`${m.slug}: motor açılır, ağ ve üst sayfa erişimi kapalıdır`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const r=await page.goto('/'+m.slug+'/');expect(r?.status()).toBe(200);
 const frame=page.frameLocator('[data-teftis-modul]');await expect(frame.locator('body')).not.toBeEmpty();
 expect(await frame.locator('body').evaluate(()=>Boolean((window as any).XLSX))).toBe(true);
 expect(await frame.locator('body').evaluate(()=>{try{return parent.document.title;}catch{return 'izole';}})).toBe('izole');
 expect(await frame.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')).toContain("connect-src 'none'");
 expect(errors).toEqual([]);
 for(const width of [320,768]){await page.setViewportSize({width,height:850});expect(await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('aktarılmış ekranlarda dosya hücresinden HTML/betik çalıştırılamaz ve tarihler ortak biçimdedir',async({page})=>{
 await page.goto('/karar/');const f=page.frameLocator('[data-teftis-modul]');
 const state=await f.locator('body').evaluate(async()=>{
  const div=document.createElement('div');div.innerHTML='<img src=x onerror="window.__teftisInjected=true"><svg onload="window.__teftisInjected=true"></svg><script>window.__teftisInjected=true</script><p>2026-11-03</p>';document.body.append(div);
  await new Promise(r=>setTimeout(r,180));return {code:(window as any).__teftisInjected,unsafe:div.querySelectorAll('script,img,svg,[onerror],[onload]').length,date:div.textContent};
 });expect(state.code).toBeUndefined();expect(state.unsafe).toBe(0);expect(state.date).toBe('03/11/2026');
});
test('BYU: farklı süreler hesaplanır, sıralanır ve Word şablonuna yazılır',async({page})=>{
 await page.goto('/byu/');const f=page.frameLocator('[data-teftis-modul]');
 const data:unknown[][]=Array.from({length:11},()=>[]);data[2][3]='BASİT YARGILAMA USULÜ ZAMAN KONTROLÜ';data[4][5]='Kurgu birim';
 for(const [id,end]of [[1,'11/10/2026'],[2,'31/10/2026']] as const){const row:unknown[]=[];row[2]='2026/'+id;row[5]='01/09/2026';row[6]='01/10/2026';row[8]=end;row[10]='Kurgu açıklama';row[11]='Kurgu hâkim';data.push(row);}
 await f.locator('#udfInput').setInputFiles(workbook(data));
 await expect(f.locator('#combinedTableWrap')).toContainText('2026/2');
 const text=await f.locator('#combinedTableWrap').innerText();expect(text.indexOf('2026/2')).toBeLessThan(text.indexOf('2026/1'));expect(text).toContain('30');
 const wait=page.waitForEvent('download');await f.locator('#exportDocxBtn').click();const download=await wait;expect(download.suggestedFilename()).toContain('BASİT');
 const stream=await download.createReadStream(),chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(chunk);
 const xml=strFromU8(unzipSync(Buffer.concat(chunks))['word/document.xml']);expect(xml).toContain('2026/2');expect(xml).toContain('Kurgu açıklama');expect(xml).not.toContain('${ESAS_NO}');
});
test('BYU faaliyet: yinelenen dosyalar tek dosya, ayrı suç kayıtları olarak sayılır',async({page})=>{
 await page.goto('/byu-uygulanan-dosyalar/');const f=page.frameLocator('[data-teftis-modul]');const data:unknown[][]=Array.from({length:9},()=>[]);data[2][8]='Karar Tarihine Göre Karara Çıkan BYU Dosyaları';
 for(const id of [1,1,2]){const r:unknown[]=[];r[2]='2026/'+id;r[3]='10/10/2026';r[10]='Kurgu suç';r[11]='Kurgu karar';data.push(r);}
 await f.locator('#byuInput').setInputFiles(workbook(data));await expect(f.locator('#byuCards')).toContainText('2');await expect(f.locator('#byuCards')).toContainText('3');await expect(f.locator('#byuKLTable')).toContainText('Kurgu suç');
});
test('BYU süre listesi ortak ayarla 50 kayıt gösterir; kalanlar sonraki sayfada',async({page})=>{
 await page.goto('/byu/');const f=page.frameLocator('[data-teftis-modul]'),data:unknown[][]=Array.from({length:11},()=>[]);data[2][3]='BASİT YARGILAMA USULÜ ZAMAN KONTROLÜ';
 for(let i=1;i<=55;i++){const r:unknown[]=[];r[2]='2026/'+i;r[5]='01/09/2026';r[6]='01/10/2026';r[8]='11/10/2026';r[10]='Kurgu';r[11]='Kurgu hâkim';data.push(r);}
 await f.locator('#udfInput').setInputFiles(workbook(data));await expect(f.locator('#combinedTableWrap tbody tr')).toHaveCount(50);
});
test('karar defteri: dosya ve hâkim sayıları gerçek Excel girdisinden gelir',async({page})=>{
 await page.goto('/karar/');const f=page.frameLocator('[data-teftis-modul]');const data:unknown[][]=[['','Esas No','Karar No','','Karar Tarihi']];
 for(let i=1;i<=3;i++){const r:unknown[]=[];r[1]='2026/'+i;r[2]='2026/'+i;r[4]='01/10/2026';r[8]=i===3?'Kurgu B':'Kurgu A';r[9]='Kurgu B';r[11]='Kurgu Savcı';data.push(r);}
 await f.locator('#excelInput').setInputFiles(workbook(data));await f.locator('#run').click();await expect(f.locator('#kpiTotal')).toHaveText('3');await expect(f.locator('#kpiHakim')).toHaveText('2');
});
test('istinaf: gönderilmeyen, incelemedeki ve kesin karardan reddedilen dosyalar ayrılır',async({page})=>{
 await page.goto('/istinaf/');const f=page.frameLocator('[data-teftis-modul]'),rows:unknown[][]=[[]];
 for(let i=1;i<=3;i++){const r:unknown[]=[];r[3]='2026/'+i;r[4]='01/10/2026';r[5]='2026/'+i;r[9]='10/10/2026';r[14]=i===1?'Kabul':i===2?"Kabul - Sakarya Bölge Adliye Mahkemesi 1. Ceza Dairesi'ne Gönderilmiştir.":'Red - Kesin Kararın İstinafının Reddi';r[16]='Kurgu A';rows.push(r);}
 await f.locator('#excelInput').setInputFiles(workbook(rows,'czmIstinafDefteriRaporu'));
 await expect(f.locator('#kpiCards')).toContainText('İstinaf Edilen');
 await expect(f.locator('body')).toContainText('1 dosya işlendi. 3 satır okundu');await expect(f.locator('body')).toContainText('Kesin Kararın İstinafının Reddi');await expect(f.locator('body')).toContainText('2026/1');
});
test('kesinleştirme: üç ayrı UYAP cetveli birleştirilir',async({page})=>{
 await page.goto('/kesinlestirme/');const f=page.frameLocator('[data-teftis-modul]');
 const karar:unknown[][]=Array.from({length:11},()=>[]);karar[2][1]='KARAR DEFTERİ';karar.push(['','2026/1','2026/5','','01/10/2026']);
 await f.locator('#kararInput').setInputFiles(workbook(karar));await expect(f.locator('#kararStatus')).toContainText('1');
 const kontrol:unknown[][]=Array.from({length:11},()=>[]);kontrol[2][3]='KESİNLEŞTİRME VE İNFAZA VERME KONTROLÜ';const r:unknown[]=[];r[2]='2026/1';r[5]='2026/5';r[7]='01/10/2026';r[9]='Hapis';r[11]='15/10/2026';r[12]='20/10/2026';r[13]='5';r[14]='25/10/2026';r[16]='5';r[17]='Kurgu açıklama';kontrol.push(r);
 await expect(f.locator('#kararDefteriPanel .card-header')).toContainText('2. Adım');
 await f.locator('#kararInput').setInputFiles(workbook(kontrol));
 await expect(f.locator('body')).toContainText('2026/1');
 expect(await f.locator('body').evaluate(()=>((window as any).__kesinlestirmeData.kesinlestirmeKontrol[0].kesinlestirmeGecikme))).toBe('5');
 await expect(f.locator('#kararDefteriPanel .card-header')).toContainText('3. Adım');
 const infaz:unknown[][]=Array.from({length:11},()=>[]);infaz[2][3]='İNFAZA GEÇ VERİLENLERİN KONTROLÜ';const i:unknown[]=[];i[2]='Kurgu hâkim';i[5]='2026/1';i[7]='2026/9';i[10]='1 yıl hapis';i[11]='20/10/2026';i[12]='15/10/2026';i[14]='25/10/2026';i[15]='5';infaz.push(i);
 await f.locator('#kararInput').setInputFiles(workbook(infaz));
 await expect.poll(()=>f.locator('body').evaluate(()=>((window as any).__kesinlestirmeData.step3Complete))).toBe(true);
});
for(const slug of ['harctahsilkontrol','kesinlesmek'])test(`${slug}: UDF ve Excel dosya numarasıyla eşleşir`,async({page})=>{
 await page.goto('/'+slug+'/');const f=page.frameLocator('[data-teftis-modul]');
 let content='',offset=0;const table=[['Esas No','Karar No','Statü'],['2026/1','2026/5','Kapalı']].map(row=>'<row>'+row.map(value=>{const node=`<cell><content startOffset="${offset}" length="${value.length}"/></cell>`;content+=value+'\n';offset+=value.length+1;return node;}).join('')+'</row>').join('');
 const udf='<udf><content><![CDATA['+content+']]></content><elements><table>'+table+'</table></elements></udf>';
 await f.locator('#udfInput').setInputFiles({name:'kurgu.udf',mimeType:'application/octet-stream',buffer:Buffer.from(udf)});
 await expect(f.locator('#excelInput')).toBeAttached();
 await f.locator('#excelInput').setInputFiles(workbook([['Sıra No','Esas No','Karar No','Durum'],[1,'2026/1','2026/5','Kapalı']]));
 await expect(f.locator('#combinedTableWrap')).toContainText('2026/1');await expect(f.locator('#combinedTableWrap')).toContainText('2026/5');
});
test('JSON robotu: hâkim kayıtlarını gruplar',async({page})=>{
 await page.goto('/jrobot/');const f=page.frameLocator('[data-teftis-modul]');
 const rows=[{dosyaNo:'2026/1',hukumHakimBaskanPId:'Kurgu A'},{dosyaNo:'2026/2',hukumHakimBaskanPId:'Kurgu A'},{dosyaNo:'2026/3',hukumHakimBaskanPId:'Kurgu B'}];
 await f.locator('#udfInput').setInputFiles({name:'kurgu.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(rows))});
 await expect(f.locator('#hakimCard')).toBeVisible();await expect(f.locator('#hakimBody')).toContainText('Kurgu A');await expect(f.locator('#hakimBody')).toContainText('2');
});
test('terfi: başkan ve hâkim verileri Excel şablonuna yerelde yazılır',async({page})=>{
 await page.goto('/terficetveli/');const f=page.frameLocator('[data-teftis-modul]');
 const result=await f.locator('body').evaluate(async()=>{
  const r=await fetch('/api/generate-cetvel.php',{method:'POST',body:JSON.stringify({unvanType:'baskan',step2:{leadSicil:'KURGU'},step3:{judgeName:'Kurgu Hâkim'},step4:{devreden:12,gelenSum:10,toplamBakilan:22,cikanSum:11},izahat:'<bold>Kurgu izahat</bold>'})});const j=await r.json();
  const bytes=Uint8Array.from(atob(j.base64),c=>c.charCodeAt(0)),x=(window as any).XLSX,w=x.read(bytes,{type:'array'}),s=w.Sheets[w.SheetNames[0]];
  return {name:s.C10.v,total:s.I10.v,percent:s.K10.v,note:s.B14.v,lead:s.B16.v};
 });
 expect(result).toMatchObject({name:'Kurgu Hâkim',total:22,percent:'%50.00 (Siliniz)',note:'Kurgu izahat',lead:'Başkan - KURGU'});
});
test('kalem denetimi: şablon satırları çoğaltılır, kişisel değerler XML olarak kaçışlanır',async({page})=>{
 await page.goto('/kalem-denetimi/');const f=page.frameLocator('[data-teftis-modul]');
 const bytes=await f.locator('body').evaluate(async()=>{const r=await fetch('/api/yimdenetim_writer.php',{method:'POST',body:JSON.stringify({birimAdi:'Kurgu birim',rows:[{yil:'2025',denetimYapildiMi:'Yapıldı',raporDuzenlendiMi:'Düzenlendi',raporTarih:'03/11/2026',hakim:'Kurgu <A>',sicil:'TEST'},{yil:'2026',denetimYapildiMi:'Yapılmadı',hakim:'Kurgu B'}]})});return Array.from(new Uint8Array(await r.arrayBuffer()));});
 const xml=strFromU8(unzipSync(new Uint8Array(bytes))['word/document.xml']);expect(xml).toContain('Kurgu &lt;A&gt;');expect(xml).toContain('Kurgu B');expect(xml).not.toContain('${YIL}');
});
for(const slug of ['durusmakacagi','kanunyolu'])test(`${slug}: açıklama ve yerel Word şablonu`,async({page,request})=>{
 await page.goto('/'+slug+'/');const a=page.getByRole('link',{name:'Denetim şablonunu indir (Word)'});const r=await request.get((await a.getAttribute('href'))!);expect(r.ok()).toBe(true);expect((await r.body()).subarray(0,2).toString()).toBe('PK');
});
