import {test,expect} from '@playwright/test';
import * as XLSX from 'xlsx';
const ozet=(tur='',n=0)=>({baslangic:'2026-11-05T17:52:21Z',toplam:n,sayaclar:Object.fromEntries(['enflasyon','maas','kesinlesme','yargilama'].map(t=>[t,{bugun:t===tur?n:0,buHafta:t===tur?n:0,buYil:t===tur?n:0,toplam:t===tur?n:0}]))});

test('yargılama giderinde otomatik hesaplama sayılır; tekrar ve temizleme sayılmaz',async({page})=>{
 let posts=0;
 await page.route('**/_657-servis/api/hesaplama',r=>{
  if(r.request().method()==='POST'){posts++;expect(r.request().postDataJSON().tur).toBe('yargilama');}
  return r.fulfill({json:ozet('yargilama',posts)});
 });
 await page.clock.install();
 await page.goto('/yargilamagideri/');
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('0');
 const adet=page.locator('[data-yg-adet="posta:0"]');
 await adet.fill('1');await adet.fill('12');await adet.fill('123');
 await page.clock.fastForward(600);
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
 await page.clock.fastForward(2100);
 await page.locator('[data-yg-hesapla]').click();
 await adet.fill('123');await page.clock.fastForward(600);expect(posts).toBe(1);
 await adet.locator('..').locator('[data-yg-artir]').click();await page.clock.fastForward(600);
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('2');
 await page.clock.fastForward(2100);
 await page.locator('#kalem-bilirkisi').fill('1500');
 await page.locator('[data-yg-kalem="bilirkisi"] [data-yg-ekle]').click();await page.clock.fastForward(600);
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('3');
 await page.clock.fastForward(2100);
 await page.locator('[data-yg-kalem="bilirkisi"] [data-yg-liste] button').click();await page.clock.fastForward(600);
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('4');
 await page.clock.fastForward(2100);
 await adet.fill('2');await page.locator('[data-yg-temizle]').click();await page.clock.fastForward(600);
 expect(posts).toBe(4);
 await page.locator('[data-yg-hesapla]').click();await page.clock.fastForward(600);expect(posts).toBe(4);
 const wb=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{'Dosya No':'2026/77','Gönderi Tipi':'APS','Tebligat Oluşturma Tarihi':'05.10.2026'}]),'Sayfa1');
 await page.locator('[data-yg-dosya]').setInputFiles({name:'tebligat.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}))});
 await expect(page.locator('[data-yg-durum]')).toContainText('2026/77 esas sayılı dosyada 1 APS');
 await page.clock.fastForward(600);await expect(page.locator('[data-sayac-toplam]')).toHaveText('5');
});

test('ana sayfa ve dört araç sunucudan gelen sıfırları gösterir; açılış sayılmaz',async({page})=>{
 let posts=0;
 await page.route('**/_657-servis/api/hesaplama',r=>{if(r.request().method()==='POST')posts++;return r.fulfill({json:ozet()});});
 for(const path of ['/','/enflasyon-farki-hesaplama-robotu/','/memur-maas-hesaplama/','/kesinlesme/','/yargilamagideri/']){
  await page.goto(path);await expect(page.locator('[data-sayac-durum]').first()).toContainText('Ölçüm başlangıcı:');
  if(path==='/')await expect(page.locator('[data-home-toplam-hesaplama]')).toHaveText('0');
  else await expect(page.locator('[data-sayac-toplam]')).toHaveText('0');
 }
 expect(posts).toBe(0);
});

test('geçerli hesaplama yalnız sunucu onayından sonra artar; geçersiz giriş sayılmaz',async({page})=>{
 let posts=0;
 await page.route('**/_657-servis/api/hesaplama',async r=>{
  if(r.request().method()==='POST'){posts++;expect(r.request().postDataJSON()).toMatchObject({tur:'maas',istekId:expect.any(String)});}
  await r.fulfill({json:ozet('maas',posts)});
 });
 await page.goto('/memur-maas-hesaplama/');await expect(page.locator('[data-sayac-toplam]')).toHaveText('0');
 await page.locator('summary').filter({hasText:'Ek ödemeler'}).click();await page.locator('#bes').selectOption('1');
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');expect(posts).toBe(1);
 await page.locator('#besOran').fill('101');await expect(page.locator('[data-m-hata]')).toBeVisible();
 await page.waitForTimeout(650);expect(posts).toBe(1);
});

test('bağlantı yoksa sahte sıfır/toplam gösterilmez ve başarısız kayıt artırılmaz',async({page})=>{
 let oku=false,posts=0;
 await page.route('**/_657-servis/api/hesaplama',r=>{
  if(r.request().method()==='POST')posts++;
  return r.request().method()==='GET'&&oku?r.fulfill({json:ozet()}):r.fulfill({status:503,body:''});
 });
 await page.goto('/enflasyon-farki-hesaplama-robotu/');
 await expect(page.locator('[data-sayac-durum]')).toContainText('doğrulanamıyor');
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('—');
 oku=true;await page.reload();await expect(page.locator('[data-sayac-toplam]')).toHaveText('0');
 await page.locator('[data-e-ay]:not([readonly])').first().fill('1,2');
 await expect(page.locator('[data-sayac-durum]')).toContainText('son doğrulanan');
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('0');expect(posts).toBe(1);
});
