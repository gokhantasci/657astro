import {test,expect} from '@playwright/test';
import {gerekceliOku} from '../src/lib/gerekceli-karar';
import {metindenUdf} from '../src/lib/udf';
import {unzipSync,strFromU8} from 'fflate';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';

test('gerekçeli karar: başlık eşleme, takvim günü, yanlış tarih ve tekrar başlık',()=>{
 const r=gerekceliOku([
  ['Esas No','Karar Türü','Kısa Karar Tarihi','Gerekçeli Karar Tarihi','Gecikme Süresi','Hâkim'],
  ['2026/12','Mahkûmiyet','28/01/2026','11/02/2026',14,'Test A'],
  ['2026/13','Beraat','31/02/2026','01/03/2026',3,'Test B'],
  ['2026/14','Beraat','11/02/2026','28/01/2026',0,'Test C'],
  ['Esas No','Karar Türü','Kısa Karar Tarihi','Gerekçeli Karar Tarihi','Gecikme Süresi','Hâkim'],
 ]);
 expect(r.rows).toHaveLength(3);expect(r.rows[0].hesaplanan).toBe(14);expect(r.rows[1].kisa).toBe('');expect(r.rows[2].hesaplanan).toBe(-14);expect(r.uyarilar).toHaveLength(3);expect(r.atlanan).toBe(1);
 expect(()=>gerekceliOku([['alakasız sütun']])).toThrow();
});

test('gerekçeli karar: Excel, filtre, Word içeriği ve yerel işlem',async({page})=>{
 const rows=Array.from({length:55},(_,i)=>[`2026/${i+1}`,'Örnek karar','28/01/2026','11/02/2026',i%2?14:10,i===54?'<img src=x onerror=alert(1)>':'Kurgu Hâkim']);
 const ws=XLSX.utils.aoa_to_sheet([['Esas No','Karar Türü','Kısa Karar Tarihi','Gerekçeli Karar Tarihi','Gecikme Süresi','Hâkim'],...rows]),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'StyleSheet');
 await page.goto('/gerekcelikarar/');const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4321/')&&r.method()==='POST')external.push(r.url());});
 await page.locator('#g-dosya').setInputFiles({name:'kurgu.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}))});
 await expect(page.locator('[data-g-durum]')).toContainText('55 kayıt okundu');await expect(page.locator('[data-g-rows] tr')).toHaveCount(50);
 await page.locator('[data-g-sonraki]').click();await expect(page.locator('[data-g-rows] tr')).toHaveCount(5);await expect(page.locator('[data-g-rows] img')).toHaveCount(0);
 await page.locator('#g-enaz').fill('14');await expect(page.locator('[data-g-rows] tr')).toHaveCount(27);
 const downloaded=page.waitForEvent('download');await page.locator('[data-g-word]').click();const d=await downloaded,xml=strFromU8(unzipSync(new Uint8Array(await readFile((await d.path())!)))['word/document.xml']);
 expect(xml).toContain('2026/54');expect(xml).not.toContain('2026/55');expect(xml).toContain('Kurgu Hâkim');expect(external).toEqual([]);
 await page.locator('[data-g-temizle]').click();await expect(page.locator('[data-g-rows] tr')).toHaveCount(0);
});

test('yeni UDF: Türkçe, emoji, CDATA sonlandırıcısı ve UTF-16 aralıkları',()=>{
 const text='İstanbul 😀\n<etiket> & ]]> son';const xml=strFromU8(unzipSync(metindenUdf(text))['content.xml']);
 expect(xml).toContain('length="12"');expect(xml).toContain(']]]]><![CDATA[>');expect(()=>metindenUdf('yasak\u0000')).toThrow();
});

test('UDF: metin okuma, birleştirme, arama, güvenli önizleme ve yeniden açma',async({page})=>{
 const text='İstanbul 😀\n<svg onload=alert(1)>\n]]> son',udf=Buffer.from(metindenUdf(text));
 await page.goto('/udf-birlestirme/');await page.locator('#u-dosya').setInputFiles([{name:'bir.udf',mimeType:'application/octet-stream',buffer:udf},{name:'iki.txt',mimeType:'text/plain',buffer:Buffer.from('İkinci belge','utf8')}]);
 await expect(page.locator('#u-metin')).toHaveValue(text+'\n\nİkinci belge');await expect(page.locator('[data-u-onizleme] svg')).toHaveCount(0);
 await page.locator('#u-ara').fill('İstanbul');await expect(page.locator('[data-u-onizleme] mark')).toHaveCount(1);
 const downloaded=page.waitForEvent('download');await page.locator('[data-u-cikti="udf"]').click();const d=await downloaded;
 await page.goto('/udf-goruntuleyici/');
 await page.locator('#u-dosya').setInputFiles({name:'yeniden.udf',mimeType:'application/octet-stream',buffer:await readFile((await d.path())!)});
 await expect(page.locator('#u-metin')).toHaveValue(text+'\n\nİkinci belge');await expect(page.locator('[data-u-uyarilar]')).toContainText('yalın metnidir');
 for(const path of ['/udf-donusturucu/','/udf-editor/','/gerekcelikarar/']){await page.goto(path);await page.setViewportSize({width:375,height:850});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);}
});
