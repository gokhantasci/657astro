import {test,expect} from '@playwright/test';
import {postaEslesir,konsoloslukAra} from '../src/lib/konsolosluk';
test('posta kodu: sıfırlı, harfli, çok aralıklı ve örtüşen kayıtlar',()=>{
 expect(postaEslesir('01067','01000-01936')).toBe(true);expect(postaEslesir('01937','01000-01936')).toBe(false);
 expect(postaEslesir('AZ 1000','AZ1000')).toBe(true);expect(postaEslesir('AZ1001','AZ1000')).toBe(false);
 expect(postaEslesir('2700','2000-2599,2619-2999')).toBe(true);expect(postaEslesir('2600','2000-2599,2619-2999')).toBe(false);
 const rows=['10000-20000','15000-25000'].map(posta=>({ulke:'kurgu',posta,temsilcilik:'Kurgu',bolge:'',sehir:''}));expect(konsoloslukAra(rows,'kurgu','16000')).toHaveLength(2);expect(konsoloslukAra(rows,'','16000')).toHaveLength(0);
});
test('konsolosluk: 122 ülke ve ülkesiz arşiv kayıtları, posta kodu ve 50 kayıt sayfalama',async({page})=>{
 await page.goto('/konsolosluk-sorgulama-2/');await expect(page.locator('#kon-ulke option')).toHaveCount(124);
 await page.locator('#kon-ulke').selectOption('almanya');await expect(page.locator('[data-kon-satirlar] tr')).toHaveCount(50);
 const first=await page.locator('[data-kon-satirlar] tr').first().textContent();await page.locator('[data-kon-sonraki]').click();expect(await page.locator('[data-kon-satirlar] tr').first().textContent()).not.toBe(first);
 await page.locator('#kon-ulke').selectOption('azerbaycan');await page.locator('#kon-posta').fill('AZ1000');await expect(page.locator('[data-kon-satirlar]')).toContainText('Bakü');await expect(page.locator('[data-kon-satirlar] tr')).toHaveCount(1);
 await page.locator('#kon-posta').fill('AZ999999');await expect(page.locator('[data-kon-durum]')).toContainText('bulunamadı');await expect(page.locator('[data-kon-satirlar] tr')).toHaveCount(0);
 await page.locator('#kon-posta').fill('');await page.locator('#kon-ulke').selectOption('__BOS__');await expect(page.locator('[data-kon-satirlar] tr')).toHaveCount(8);
});
test('HMK: aynı ekranda tam/kısmi kabul, nafaka ve feragat',async({page})=>{
 await page.goto('/hmk-yargilama/');await page.locator('#tarih').fill('2026-11-03');
 const fee=page.locator('[data-h-ozet] > div').filter({hasText:'Davacı lehine vekâlet ücreti'}).locator('dd');await expect(fee).toHaveText('62.000,00 TL');
 await page.locator('#tur').selectOption('kismen-kabul');await page.locator('#kabul').fill('60000');await expect(fee).toHaveText('60.000,00 TL');
 await page.locator('#tur').selectOption('nafaka-tam');await page.locator('#dava').fill('500');await expect(page.locator('label[for=dava]')).toHaveText('Talep edilen aylık nafaka (TL)');await expect(fee).toHaveText('6.000,00 TL');await expect(page.locator('#mahkeme')).toHaveValue('aile');
 await page.locator('#tur').selectOption('feragat');await page.locator('#dava').fill('100000');await page.locator('#onIncelemeOnce').selectOption('1');await page.locator('#ilkCelse').selectOption('1');await expect(page.locator('[data-h-ana]')).toHaveText('2.277,00 TL');await expect(page.locator('[data-h-ozet]')).toContainText('31.000,00 TL');
});
test('nüfus analizi: kurgu HTML kaydından eş ve çocuk özeti, dış istek yok',async({page})=>{
 const requests:string[]=[];page.on('request',r=>{if(r.method()==='POST')requests.push(r.url());});
 await page.goto('/nufus-analiz-sistemi-bosanma-karari-hazirla/');const f=page.frameLocator('[data-teftis-modul]');
 const person=(s:string,yakinlik:string,name:string,event='')=>[s,'1','E',yakinlik,'TEST-KISI-'+s,'Kurgu',name,'Kurgu baba','Kurgu ana','01/01/2000','Evli','01/01/2020',event];
 const data=[person('1','Kendisi','A','Evlenme: 01/01/2020'),person('2','Eşi','B'),person('3','Oğlu','C')];
 const html='<table>'+['Başlık 1','Başlık 2','Başlık 3'].map(s=>'<tr><th>'+s+'</th></tr>').join('')+data.map(r=>'<tr>'+r.map(s=>'<td>'+s+'</td>').join('')+'</tr>').join('')+'</table>';
 await f.locator('#htmlInput').setInputFiles({name:'kurgu.html',mimeType:'text/html',buffer:Buffer.from(html)});await f.locator('#processBtn').click();
 await expect(f.locator('#kpiDavaci')).toHaveText('Kurgu A');await expect(f.locator('#kpiDavali')).toHaveText('Kurgu B');await expect(f.locator('#kpiOglu')).toHaveText('1');expect(requests).toEqual([]);
 await f.locator('#resetBtn').click();await expect(f.locator('#tableBody')).not.toContainText('TEST-KISI');await expect(f.locator('#processBtn')).toBeDisabled();
});
