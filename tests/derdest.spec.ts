import {test,expect} from '@playwright/test';
import * as XLSX from 'xlsx';
import {readFile} from 'node:fs/promises';
import {derdestOku,derdestListe} from '../src/lib/derdest';
const sheet=()=>XLSX.utils.aoa_to_sheet([
 ['Derdest dosyalar'],['','Yıl','Dosyalar','','','TOPLAM'],
 ['',2020,30,2,'',3],['','',30],['','Yıl','Dosyalar','','','TOPLAM'],
 ['',2017,197,'','',1],['TOPLAM DOSYA',4],
]);
function workbook(){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,sheet(),'Mahkeme');return wb;}
const excel=()=>Buffer.from(XLSX.write(workbook(),{type:'buffer',bookType:'xlsx'}));
test('kaynak düzeni: B yılı devam eder, TOPLAM ve genel toplam listeye girmez',()=>{
 const r=derdestOku(workbook());expect(r.dosyalar).toEqual([{yil:2020,numara:30},{yil:2020,numara:2},{yil:2020,numara:30},{yil:2017,numara:197}]);
 expect(r.beklenen).toEqual({'2017':1,'2020':3});expect(r.genelToplam).toBe(4);
 expect(derdestListe(r.dosyalar,true,true)).toEqual(['2017/197','2020/2','2020/30']);
 expect(derdestListe(r.dosyalar,false,false)).toEqual(['2020/30','2020/2','2020/30','2017/197']);
});
test('çok sayfalı dosyada eksik toplam doğrulanmış sayılmaz; boş dev aralık taranmaz',()=>{
 const wb=workbook(),s=XLSX.utils.aoa_to_sheet([['',2020,7]]);s['!ref']='A1:XFD1048576';XLSX.utils.book_append_sheet(wb,s,'Devam');
 const r=derdestOku(wb);expect(r.dosyalar).toHaveLength(5);expect(r.genelToplam).toBeNull();expect(r.beklenen).toEqual({'2017':1});expect(r.sayfalar).toEqual(['Mahkeme','Devam']);
 expect(derdestOku({SheetNames:['Boş'],Sheets:{Boş:{}}}).dosyalar).toEqual([]);
});
test('Excel yükleme, toplam kontrolü, sıralama/tekrar ve TXT/CSV',async({page})=>{
 await page.goto('/derdest-dosya-listesi/');await expect(page.locator('[data-dr-txt]')).toBeDisabled();
 await page.locator('[data-dr-dosya]').setInputFiles({name:'derdest.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:excel()});
 await expect(page.locator('[data-dr-kontrol]')).toHaveText('Toplam tutuyor');await expect(page.locator('[data-dr-toplam]')).toHaveText('4');
 await expect(page.locator('[data-dr-cikti]')).toHaveValue('2017/197\n2020/2\n2020/30');await expect(page.locator('[data-dr-adet]')).toHaveText('3 dosya');
 await page.locator('[data-dr-tekil]').uncheck();await page.locator('[data-dr-sirala]').uncheck();
 await expect(page.locator('[data-dr-cikti]')).toHaveValue('2020/30\n2020/2\n2020/30\n2017/197');
 for(const ext of ['txt','csv']){
  const download=page.waitForEvent('download');await page.locator('[data-dr-'+ext+']').click();const file=await download;
  expect(file.suggestedFilename()).toBe('derdest_liste.'+ext);const content=await readFile((await file.path())!,'utf8');
  expect(content).toBe('\uFEFF'+(ext==='csv'?'2020/30\r\n2020/2\r\n2020/30\r\n2017/197':'2020/30\n2020/2\n2020/30\n2017/197'));
 }
 await page.locator('[data-dr-temizle]').click();await expect(page.locator('[data-dr-cikti]')).toHaveValue('');await expect(page.locator('[data-dr-txt]')).toBeDisabled();
});
test('hata sonrası eski sonuç ve indirmeler kalmaz; yanlış toplam uyarılır',async({page})=>{
 await page.goto('/derdest-dosya-listesi/');const wb=workbook();wb.Sheets.Mahkeme.B7={t:'n',v:9};
 await page.locator('[data-dr-dosya]').setInputFiles({name:'farkli.xls',mimeType:'application/vnd.ms-excel',buffer:Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'biff8'}))});
 await expect(page.locator('[data-dr-kontrol]')).toHaveText('Toplam tutmuyor');
 await page.locator('[data-dr-dosya]').setInputFiles({name:'bos.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('geçersiz')});
 await expect(page.locator('[data-dr-hata]')).toBeVisible();await expect(page.locator('[data-dr-cikti]')).toHaveValue('');await expect(page.locator('[data-dr-kopyala]')).toBeDisabled();
});
test('eski adres ve dizin, mobil ve iki tema',async({page})=>{
 await page.goto('/derdest.html');await expect(page).toHaveURL(/\/derdest-dosya-listesi\/$/);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://657.com.tr/derdest-dosya-listesi/');
 await page.getByRole('button',{name:'Reddet',exact:true}).click();
 await page.locator('[data-dr-dosya]').setInputFiles({name:'örnek.xlsx',mimeType:'application/octet-stream',buffer:excel()});await expect(page.locator('[data-dr-toplam]')).toHaveText('4');
 for(const theme of ['light','dark'])for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' '+width).toBe(true);expect(await page.locator('.derdest-tablo').evaluate(e=>e.parentElement!.scrollWidth<=e.parentElement!.clientWidth)).toBe(true);}
 await page.screenshot({path:'artifacts/derdest-dark.png',fullPage:true});
 await page.goto('/araclar/?q=derdest');await expect(page.locator('[data-row]:visible')).toHaveCount(1);await expect(page.locator('[data-row]:visible a').first()).toHaveAttribute('href','/derdest-dosya-listesi/');
});
