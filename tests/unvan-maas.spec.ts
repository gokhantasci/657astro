import { tumSiteHaritasi } from './site-haritasi';
import {test,expect} from '@playwright/test';
import {guncelYayin,maasYayinlari,maasYazilari,unvanlar,yayinSchema} from '../src/lib/maas-yazilari';
import {guncelYayinUret,yayinlariBirlestir,yayinSayfalari,type MaasYayini} from '../src/lib/unvan-yayin';
import {donem,maasKatsayilari,parametreler,dereceler,baslangicGirdi} from '../src/lib/maas-veri';
import {tl} from '../src/lib/bicim';
import {archiveSalaryBuild} from '../scripts/archive-unvan-build.mjs';
import {mkdtemp,mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
test('katsayı değişince güncel sayfa değişir, 2024/2025 ve Ocak 2026 arşivi korunur',()=>{
 const archive=maasYayinlari.filter(a=>a.donemId!==guncelYayin.donemId),before=JSON.stringify(archive);
 const k=maasKatsayilari(donem,'maas');
 const changed=guncelYayinUret(unvanlar,donem,{...k,aylik:k.aylik*1.1},parametreler,dereceler,baslangicGirdi);
 const merged=yayinlariBirlestir(changed,archive);
 expect(changed.kayitlar.find(k=>k.unvanId==='zabit-katibi')!.dusuk).toBeGreaterThan(guncelYayin.kayitlar.find(k=>k.unvanId==='zabit-katibi')!.dusuk!);
 expect(JSON.stringify(archive)).toBe(before);
 expect(merged.find(a=>a.donemId==='2024-01-arsiv')!.kayitlar.find(k=>k.unvanId==='arsiv-memuru')!.dusuk).toBe(31422.18);
 expect(merged.find(a=>a.donemId==='2025-arsiv')!.kayitlar.find(k=>k.unvanId==='ambar-memuru')!.dusuk).toBe(48502.60);
});
test('yeni yılda sayfalar otomatik eklenir; önceki yılın bütün adresleri kalır',()=>{
 // Sentetik 2027 yayını; gerçek dönem/ücret verisi olarak kaydedilmez.
 const next:MaasYayini={...guncelYayin,donemId:'2027-01-01',yil:2027,baslangic:'2027-01-01',bitis:'2027-06-30',etiket:'Test dönemi'};
 const merged=yayinlariBirlestir(next,maasYayinlari);
 const pages=yayinSayfalari(unvanlar,merged);
 expect(pages.filter(p=>p.yil===2027)).toHaveLength(unvanlar.length);
 expect(pages).toEqual(expect.arrayContaining(maasYazilari));
 expect(()=>yayinlariBirlestir(guncelYayin,[next])).toThrow('eski bir dönem');
});
test('arşiv şeması bozuk yıl, yinelenen kayıt, NaN ve tanımsız unvanı reddeder',()=>{
 for(const patch of [{yil:2025},{kayitlar:[guncelYayin.kayitlar[0],guncelYayin.kayitlar[0]]},{kayitlar:[{...guncelYayin.kayitlar[0],dusuk:NaN}]},{kayitlar:[{...guncelYayin.kayitlar[0],unvanId:'bilinmeyen'}]}])expect(yayinSchema.safeParse({...guncelYayin,...patch}).success).toBe(false);
 expect(guncelYayin.kayitlar.find(k=>k.unvanId==='cezaevi-muduru')!.dusuk).toBeGreaterThan(0);
});
test('başarılı derleme yayını arşivlenir; sonraki dönem eski dosyayı değiştirmez',async()=>{
 const folder=await mkdtemp(resolve('artifacts/unvan-arsiv-test-'));
 const root=pathToFileURL(folder+'/'),dist=new URL('dist/',root);
 await mkdir(new URL('unvan-maaslari/',dist),{recursive:true});
 const endpoint=new URL('unvan-maaslari/yayin.json',dist);
 await writeFile(endpoint,JSON.stringify(guncelYayin));await archiveSalaryBuild(dist,root);
 const original=new URL(`src/data/maas-arsivleri/${guncelYayin.donemId}.json`,root),before=await readFile(original,'utf8');
 const tax=new URL('src/data/vergi-arsivleri/2026.json',root);
 await unlink(tax);await archiveSalaryBuild(dist,root);
 expect(JSON.parse(await readFile(tax,'utf8')).yil).toBe(2026);
 const context=guncelYayin.hesapBaglami as {katsayilar:{vergi:{yil:number}}};
 const next={...guncelYayin,donemId:'2027-01-01',baslangic:'2027-01-01',yil:2027,hesapBaglami:{...context,katsayilar:{...context.katsayilar,vergi:{...context.katsayilar.vergi,yil:2027}}}};
 await writeFile(endpoint,JSON.stringify(next));await archiveSalaryBuild(dist,root);
 expect(await readFile(original,'utf8')).toBe(before);
 expect(JSON.parse(await readFile(new URL('src/data/maas-arsivleri/2027-01-01.json',root),'utf8')).yil).toBe(2027);
});
test('unvan dizini, eski yıllar, aynı yılın dönemleri ve sitemap',async({page,request})=>{
 await page.goto('/unvan-maaslari/');await expect(page.locator('[data-unvan-satir]')).toHaveCount(unvanlar.length);
 await page.getByRole('navigation',{name:'Maaş yılı'}).getByRole('link',{name:'2024',exact:true}).click();
 await expect(page.locator('[data-unvan-satir]')).toHaveCount(35);
 await page.getByRole('link',{name:'Arşiv Memuru',exact:true}).click();
 await expect(page.locator('h1')).toHaveText('Arşiv Memuru Maaşı 2024');
 await expect(page.locator('[data-unvan-dusuk="ana"]')).toHaveText('31.422,18 TL');
 await page.getByRole('navigation',{name:'Maaş yılı'}).getByRole('link',{name:'2025',exact:true}).click();
 await expect(page.locator('[data-unvan-donem]')).toContainText('ay/dönem belirtilmemiştir');
 await page.goto('/zabit-katibi-maasi-2026/');
 await expect(page.locator('[data-unvan-donem]')).toHaveCount(2);
 await expect(page.locator('[data-unvan-dusuk="ana"]')).toHaveText(tl(guncelYayin.kayitlar.find(k=>k.unvanId==='zabit-katibi')!.dusuk!));
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://657.com.tr/zabit-katibi-maasi-2026/');
 const xml=await tumSiteHaritasi(request);
 for(const path of ['/unvan-maaslari/2024/','/unvan-maaslari/2025/','/arsiv-memuru-maasi-2024/','/zabit-katibi-maasi-2025/'])expect(xml).toContain('https://657.com.tr'+path+'</loc>');
});
test('betiksiz tablolar; mobil ve iki temada taşma yok',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false}),page=await context.newPage();
 for(const path of ['/unvan-maaslari/','/unvan-maaslari/2024/','/arsiv-memuru-maasi-2024/','/ogretmen-maasi-2026/']){
  await page.goto('http://127.0.0.1:4321'+path);
  for(const theme of ['light','dark'])for(const width of [320,375,768,1440]){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} ${theme} ${width}`).toBe(true);
  }
 }
 await page.screenshot({path:'artifacts/unvan-dark.png',fullPage:true});
 await page.setViewportSize({width:375,height:812});await page.evaluate(()=>document.documentElement.dataset.theme='light');
 await page.screenshot({path:'artifacts/unvan-mobile.png',fullPage:true});await context.close();
});
