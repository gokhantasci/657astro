import {test,expect} from '@playwright/test';
import terimler from '../src/data/sozluk.json' with {type:'json'};
import sorular from '../src/data/mulakat.json' with {type:'json'};
import kaynaklar from '../src/data/sozluk-kaynaklari.json' with {type:'json'};
import {sozlukKaynagi} from '../src/lib/sozluk-kaynaklari';

const terim=terimler.find(t=>t.slug==='aciz-ne-demek')!;
const eksik=terimler.find(t=>!Object.hasOwn(kaynaklar,t.slug))!;

test('tanım değişirse eski resmî kaynak eşleştirmesi kullanılmaz',()=>{
 expect(sozlukKaynagi(terim.slug,terim.anlam)?.url).toMatch(/^https:\/\/sozluk\.adalet\.gov\.tr\//);
 expect(sozlukKaynagi(terim.slug,terim.anlam+' Değişen bir iddia.')).toBeUndefined();
 expect(sozlukKaynagi('olmayan-terim','Tanım')).toBeUndefined();
});

test('sözlükte arşiv tarihi ve gerçek kaynak görünür; uzman/yazar uydurulmaz',async({page})=>{
 await page.setViewportSize({width:375,height:900});
 await page.goto(`/kelime/${terim.slug}/`);
 const bilgi=page.locator('[data-kayit-bilgisi]');
 await expect(bilgi.locator('time').first()).toHaveAttribute('datetime',terim.tarih);
 await expect(bilgi.getByRole('link',{name:/Adalet Bakanlığı Hukuk Sözlüğü/})).toHaveAttribute('href',sozlukKaynagi(terim.slug,terim.anlam)!.url);
 const ld=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.flatMap(n=>JSON.parse(n.textContent||'{}')));
 const web=ld.find(x=>x['@type']==='WebPage');
 expect(web.datePublished).toBe(terim.tarih);
 expect(web.dateModified).toBeUndefined();
 expect(web.author).toBeUndefined();
 expect(web.citation).toEqual([sozlukKaynagi(terim.slug,terim.anlam)!.url]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('eşleşmeyen sözlük kaydına resmî kaynak eklenmez',async({page})=>{
 await page.goto(`/kelime/${eksik.slug}/`);
 await expect(page.locator('[data-kayit-bilgisi]')).not.toContainText('Karşılaştırma kaynağı:');
 const ld=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.flatMap(n=>JSON.parse(n.textContent||'{}')));
 expect(ld.find(x=>x['@type']==='WebPage').citation).toBeUndefined();
});

test('mülakat tarihi arşivden gelir; doğrulanmamış kaynak eklenmez',async({page})=>{
 const soru=sorular[0];await page.goto(`/${soru.slug}/`);
 await expect(page.locator('[data-kayit-bilgisi] time')).toHaveAttribute('datetime',soru.tarih);
 const ld=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.flatMap(n=>JSON.parse(n.textContent||'{}')));
 const web=ld.find(x=>x['@type']==='WebPage');
 expect(web.datePublished).toBe(soru.tarih);expect(web.author).toBeUndefined();expect(web.citation).toBeUndefined();
});

test('kaynak ilkeleri yayıncı, arşiv ve kaynak karşılaştırmasını açıklar',async({page})=>{
 expect((await page.goto('/icerik-kaynaklari/'))?.status()).toBe(200);
 await expect(page.getByRole('heading',{level:1})).toHaveText('İçerik kaynakları ve düzeltme ilkeleri');
 await expect(page.locator('main')).toContainText('uzman incelemesi değildir');
});
