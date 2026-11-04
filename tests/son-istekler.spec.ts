import {test,expect} from '@playwright/test';
import {gorunenTarihler} from '../src/lib/gorunen-tarihler';
import {teftisSureOku} from '../src/lib/teftis-sure';
import {dpbGorusleri} from '../src/lib/dpb';
import {siteAra} from '../src/lib/asistan';
import * as XLSX from 'xlsx';

test('görünen tarih dönüşümü veri, bağlantı ve kodu korur',()=>{
 const html='<p>2026-07-01 – 31.12.2026, 1/9/2026; 31.02.2026</p><a href="/2026-07-01/">01-07-2026</a><time datetime="2026-07-01">2026-07-01</time><script>{"date":"2026-07-01"}</script><pre>2026-07-01</pre>';
 const r=gorunenTarihler(html);
 expect(r).toContain('<p>01/07/2026 – 31/12/2026, 01/09/2026; 31.02.2026</p>');
 expect(r).toContain('href="/2026-07-01/"');expect(r).toContain('datetime="2026-07-01"');
 expect(r).toContain('<script>{"date":"2026-07-01"}</script>');expect(r).toContain('<pre>2026-07-01</pre>');
 expect(gorunenTarihler('<input placeholder="Örn. 15.03.2024" value="2026-07-01"/>')).toBe('<input placeholder="Örn. 15/03/2024" value="2026-07-01"/>');
});
test('teftiş süreleri: gerçek kaynak sütunları, eşik ve ters tarih denetimi',()=>{
 for(const tur of ['tensip','iddianame'] as const){
  const data:unknown[][]=Array.from({length:11},()=>[]);data[2][3]=tur==='tensip'?'TENSİP ZAMAN KONTROLÜ':'İDDİANAME DEĞERLENDİRİLME ZAMAN KONTROLÜ';data[4][tur==='tensip'?6:5]='Kurgu birim';
  const row:unknown[]=[];row[2]='2026/123';row[5]=tur==='tensip'?'01/10/2026':'2026/321';row[tur==='tensip'?7:6]=tur==='tensip'?'11/10/2026':'01/10/2026';if(tur==='iddianame'){row[8]='11/10/2026';row[9]='Kabul';}row[10]='7';row[11]='Kurgu hâkim';data.push(row);
  const r=teftisSureOku(data,tur);expect(r.rows).toHaveLength(1);expect(r.rows[0].takvim).toBe(10);expect(r.rows[0].bildirilen).toBe(7);expect(r.uyarilar[0]).toContain('takvim farkı 10');expect(r.birim).toBe('Kurgu birim');
  row[tur==='tensip'?7:8]='30/09/2026';expect(teftisSureOku(data,tur).uyarilar.join(' ')).toContain('başlangıçtan önce');
 }
});
test('DPB görüşlerinin tam metni ve yerel kaynak bağlantıları var',()=>{
 expect(dpbGorusleri).toHaveLength(576);expect(dpbGorusleri.every(g=>g.metin.length>0&&g.dosya.startsWith('/dosyalar/dpb/'))).toBe(true);
 const rows=dpbGorusleri.filter(g=>g.id!=='dpb_mutalaa_ozel').map(g=>({baslik:g.baslik,yol:'/dpb-gorusleri/'+g.id+'/',metin:g.metin,tur:'DPB görüşü'}));
 expect(siteAra('aday memur KPSS muvafakat',rows).some(g=>g.yol==='/dpb-gorusleri/1a/')).toBe(true);
});
test('hedef süre: C/G/J/K/M rapor alanları korunur, kanuni süre üretilmez',()=>{
 const data:unknown[][]=Array.from({length:11},()=>[]);data[2][3]='HEDEF SÜRE KONTROLÜ';data[4][5]='Kurgu birim';
 const row:unknown[]=[];row[2]='2026/5';row[6]='Kurgu suç';row[9]=180;row[10]=45;row[12]='Rapor aşım açıklaması';data.push(row);
 const r=teftisSureOku(data,'hedef-sure-kontrolu');expect(r.rows[0].hucreler).toEqual(['2026/5','Kurgu suç','180','45','Rapor aşım açıklaması']);expect(r.rows[0].bildirilen).toBe(45);expect(r.rows[0].takvim).toBeNull();expect(r.uyarilar).toEqual([]);
});
for(const tur of ['iddianame','tensip'] as const)test(`${tur}: Excel yükleme, süre filtresi ve yerel Word çıktısı`,async({page})=>{
 const data:unknown[][]=Array.from({length:11},()=>[]);data[2][3]=tur==='tensip'?'TENSİP ZAMAN KONTROLÜ':'İDDİANAME DEĞERLENDİRİLME ZAMAN KONTROLÜ';
 for(let i=1;i<=55;i++){const r:unknown[]=[];r[2]='2026/'+i;r[5]=tur==='tensip'?'01/10/2026':'2026/'+i;r[tur==='tensip'?7:6]=tur==='tensip'?'11/10/2026':'01/10/2026';if(tur==='iddianame'){r[8]='11/10/2026';r[9]='Kabul';}r[10]=i;r[11]='Kurgu hâkim';data.push(r);}
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(data),'StyleSheet');
 await page.goto('/'+tur+'/');await page.locator('#g-dosya').setInputFiles({name:'kurgu.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}))});
 await expect(page.locator('[data-g-sayi]')).toContainText('55 / 55');await expect(page.locator('[data-g-rows] tr')).toHaveCount(50);
 await page.locator('#g-enaz').fill('50');await expect(page.locator('[data-g-rows] tr')).toHaveCount(6);
 const wait=page.waitForEvent('download');await page.locator('[data-g-word]').click();const download=await wait;expect(download.suggestedFilename()).toBe(tur+'-zaman-kontrolu.docx');
});
