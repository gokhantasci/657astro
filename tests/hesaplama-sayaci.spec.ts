import {test,expect} from '@playwright/test';
const ozet=(tur='',n=0)=>({baslangic:'2026-11-05T17:52:21Z',toplam:n,sayaclar:Object.fromEntries(['enflasyon','maas','kesinlesme','yargilama'].map(t=>[t,{bugun:t===tur?n:0,buHafta:t===tur?n:0,buYil:t===tur?n:0,toplam:t===tur?n:0}]))});

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
