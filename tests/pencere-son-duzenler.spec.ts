import {test,expect} from '@playwright/test';
import {hataMetni} from '../src/lib/hata-metni';
import tuik from '../src/data/tuik-endeks.json' with {type:'json'};
import {enflasyon} from '../src/lib/enflasyon-veri';
import {yayinDisi} from '../src/lib/yayin-filtresi';
test('resmî TÜİK tablosu ve Error dışındaki GPU hataları',()=>{
 expect(tuik.aylar.find(a=>a.yil===2026&&a.ay===10)?.endeks).toBe(140.77);
 expect(enflasyon.aylar[3].endeks).toBe(140.77);expect(enflasyon.aylar[3].endeksHesaplandi).not.toBe(true);
 for(const v of [undefined,null,{},false,{error:undefined}])expect(hataMetni(v)).not.toContain('undefined');
 expect(hataMetni({error:{message:'GPU belleği yetersiz'}})).toBe('GPU belleği yetersiz');
 expect(yayinDisi('2026 Yılı Adli Yargı Kararnamesi')).toBe(true);expect(yayinDisi('2026 harç tarifesi')).toBe(false);
});
test('kesinleşme listesi diğer panelin üstünde seçilir',async({page})=>{
 await page.goto('/kesinlesme/');const combo=page.getByRole('combobox',{name:'Birim',exact:true});await combo.click();
 const list=page.getByRole('listbox',{name:'Birim',exact:true});await expect(list).toBeVisible();
 expect(await list.evaluate(el=>el.parentElement===document.body)).toBe(true);
 const opt=list.getByRole('option',{name:'Gün',exact:true});const b=await opt.boundingBox();expect(b).not.toBeNull();
 expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('[role="option"]')!==null,{x:b!.x+b!.width/2,y:b!.y+b!.height/2})).toBe(true);await opt.click();await expect(combo).toHaveValue('Gün');
});
test('yeni anasayfa sliderı, duyurular ve mobil taşma',async({page})=>{
 for(const width of [320,375,414,768,1440]){await page.setViewportSize({width,height:1000});await page.goto('/');await expect(page.locator('.home-duyuru')).toHaveCount(4);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('[data-slide-next]').click();await expect(page.locator('[data-slide]').nth(1)).toBeVisible();await expect(page.locator('[data-slide]').first()).toBeHidden();await expect(page.locator('#uyg-title')).toHaveCount(0);
});
test('maaş kartı sırası, gelir/kesinti rengi ve upload alanı',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');expect(await page.locator('[data-maas-tahmini]').evaluate(el=>el.previousElementSibling?.querySelector('#maas-sonuc-title')?.textContent)).toBe('Maaş özeti');
 await expect(page.locator('[data-m-satirlar] .maas-gelir').first()).toBeVisible();await expect(page.locator('[data-m-satirlar] .maas-kesinti').first()).toBeVisible();
 const colors=await page.locator('[data-m-satirlar]').evaluate(el=>[...el.querySelectorAll('.maas-gelir,.maas-kesinti')].map(r=>getComputedStyle(r).color));expect(new Set(colors).size).toBe(2);
 for(const tur of ['gelir','kesinti'])expect(await page.locator(`[data-m-satirlar] .maas-${tur}`).first().evaluate(el=>getComputedStyle(el).color===getComputedStyle(el.querySelector('td.num:last-child')!).color)).toBe(true);
 await page.goto('/gerekcelikarar/');await expect(page.locator('.dosya-birak')).toBeVisible();
});
test('yazı kategorisi bağlantısı ve RSS',async({page,request})=>{
 await page.goto('/adalet-bakanligi-gys-ve-uds-sonuclari-yayimlandi/');await expect(page.locator('.article__head a.chip').first()).toHaveAttribute('href',/\/yazilar\/kategori\//);
 const r=await request.get('/feed.xml');expect(r.ok()).toBe(true);expect(await r.text()).toContain('<rss');
});
