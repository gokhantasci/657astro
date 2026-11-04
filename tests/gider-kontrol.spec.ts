import {test,expect} from '@playwright/test';
import {giderKontrol,giderExcelOku} from '../src/lib/gider-kontrol';
import * as X from 'xlsx';
import {unzipSync,strFromU8} from 'fflate';
test('gider mutabakatı: kuruş, eksi bakiye, yanlış dosya ve eksik sütun',()=>{
 expect(giderKontrol({dosya:'2026 / 1',tahsilat:1000.5,gider:500.25,iade:100,bildirilen:400.25})).toMatchObject({dosya:'2026/1',hesaplanan:400.25,fark:0});
 expect(giderKontrol({dosya:'2026/2',tahsilat:100,gider:150,iade:0,bildirilen:-50})).toMatchObject({hesaplanan:-50,fark:0});
 expect(()=>giderKontrol({dosya:'hatalı',tahsilat:0,gider:0,iade:0,bildirilen:0})).toThrow('Dosya');
 expect(()=>giderKontrol({dosya:'2026/1',tahsilat:-1,gider:0,iade:0,bildirilen:0})).toThrow('küçük');
 expect(()=>giderExcelOku([['Dosya No','Tahsilat']])).toThrow('sütunları');
 expect(()=>giderExcelOku([['Dosya No','Tahsilat','Gider','İade','Bildirilen Bakiye'],['2026/1',100,'',0,100]])).toThrow('eksik');
});
test('Excel kontrolü: farklar birbirini götürse de iki uygunsuz kayıt görünür; Word filtreyi içerir',async({page})=>{
 await page.goto('/yargilama-gideri-kontrolu/');
 const data=[['Dosya No','Tahsilat','Gider','İade','Bildirilen Bakiye'],...Array.from({length:55},(_,i)=>['2026/'+(i+1),1000,500,100,i===0?450:i===1?350:400])];
 const wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(data),'Gider');
 await page.locator('#gk-excel').setInputFiles({name:'kurgu.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(X.write(wb,{type:'buffer',bookType:'xlsx'}))});
 await expect(page.locator('[data-gk-rows] tr')).toHaveCount(50);await expect(page.locator('[data-gk-ozet]')).toContainText('2 fark olan kayıt');await expect(page.locator('[data-gk-ozet]')).toContainText('Toplam fark: 0,00 TL');
 await page.locator('[data-gk-sonraki]').click();await expect(page.locator('[data-gk-rows] tr')).toHaveCount(5);
 await page.locator('#gk-ara').fill('2026/55');const wait=page.waitForEvent('download');await page.locator('[data-gk-word]').click();const download=await wait;const stream=await download.createReadStream(),chunks:Buffer[]=[];for await(const c of stream!)chunks.push(c);
 const xml=strFromU8(unzipSync(Buffer.concat(chunks))['word/document.xml']);expect(xml).toContain('2026/55');expect(xml).not.toContain('2026/54');
 await page.locator('[data-gk-temizle]').click();await expect(page.locator('[data-gk-rows] tr')).toHaveCount(0);await expect(page.locator('[data-gk-word]')).toBeDisabled();
});
