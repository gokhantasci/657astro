import {test,expect} from '@playwright/test';
import {sozlesmeliYazilari,emekliYazilari,sozlesmeliOrnekleri,emekliOrnekleri,statuBaglantilari,statuYili} from '../src/lib/maas-statu-yayin';
import raw from '../src/data/sozlesmeli-unvanlar.json' with {type:'json'};
import {unvanlar} from '../src/lib/maas-yazilari';

test('bütün cetvel unvanları üretilir; kaynakta olmayan sözleşmeli tutar doldurulmaz',()=>{
 expect(sozlesmeliYazilari).toHaveLength(raw.unvanlar.length);expect(emekliYazilari).toHaveLength(unvanlar.length);
 for(const u of raw.unvanlar){const r=sozlesmeliOrnekleri(u.id);expect(r).toHaveLength(u.varyantlar.length);for(const [i,v]of r.entries())for(const o of v.ornekler){expect(Boolean(o.sonuc)).toBe(Boolean(u.varyantlar[i].yillar[o.hizmetYili]));if(o.sonuc)expect(Number.isFinite(o.sonuc.net)).toBe(true);}}
 for(const u of unvanlar)for(const o of emekliOrnekleri(u.id)){expect(o.girdi.unvan).toBe(u.kod);expect(o.sonuc.net).toBeGreaterThan(0);}
 expect(statuBaglantilari('Zabıt Katibi').map(x=>x.ad)).toEqual(['Kadrolu','Sözleşmeli','Emekli']);
});

for(const tur of ['sozlesmeli','emekli'] as const)test(`${tur} zabıt katibi sayfası doğru unvan ve koşulla hesaba geçer`,async({page,request})=>{
 const url=`/${tur}-zabit-katibi-maasi-${statuYili}/`;
 await page.goto(url);await expect(page.locator('h1')).toContainText('Zabıt Katibi');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://657.com.tr${url}`);
 await expect(page.locator('.article table tbody tr').first()).toBeVisible();
 const net=await page.locator('.article table tbody tr').first().locator('td').nth(tur==='sozlesmeli'?1:0).textContent();
 if(tur==='sozlesmeli')await page.getByRole('link',{name:'Bu koşulla hesapla'}).first().click();else await page.getByRole('link',{name:'Kendi bilgilerinle hesapla'}).click();
 await expect(page.locator('#unvan option:checked')).toContainText('Zabıt');await expect(page.locator('[data-d-hata]')).toBeHidden();
 await expect(page.locator('[data-d-net]')).toHaveText(net!);
 const map=await(await request.get('/sitemap-maas.xml')).text();expect(map).toContain(url);
});

test('unvan dizini üç türü arar, boş arama ve temizleme çalışır',async({page})=>{
 await page.goto('/unvan-maaslari/');const input=page.getByLabel('Unvan veya maaş türü ara');
 await input.fill('zabit katibi');await expect(page.locator('[data-maas-arama]:visible')).toHaveCount(3);
 await input.fill('emekli zabit katibi');await expect(page.locator('[data-maas-arama]:visible')).toHaveCount(1);
 await input.fill('xyzolmayan');await expect(page.locator('[data-unvan-durum]')).toHaveText('0 unvan sayfası');
 await input.fill('');await expect(page.locator('[data-maas-arama]:visible')).toHaveCount(unvanlar.length+sozlesmeliYazilari.length+emekliYazilari.length);
});

for(const theme of ['light','dark'])test(`${theme}: arşiv aramaları geniş ve maaş sayfaları bütün ekranlara sığar`,async({page})=>{
 await page.addInitScript(t=>localStorage.setItem('657:tema',t),theme);
 for(const width of [320,375,414,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/bolum/tarifeler/','/bolum/maas/','/bolum/teftis/','/unvan-maaslari/',`/sozlesmeli-zabit-katibi-maasi-${statuYili}/`,`/emekli-zabit-katibi-maasi-${statuYili}/`]){
   await page.goto(path);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await expect(page.locator('h1')).toBeVisible();
   for(const input of await page.locator('.liste-arama input').all()){
    const sizes=await input.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,parent:el.parentElement!.getBoundingClientRect().width}));
    expect(sizes.height).toBeGreaterThanOrEqual(48);expect(sizes.width).toBeGreaterThanOrEqual(sizes.parent-1);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
});
