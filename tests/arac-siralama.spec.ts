import {test,expect} from '@playwright/test';
import registry from '../services/oneriler/arac-sayaclari.json' with {type:'json'};
import catalog from '../src/data/araclar.json' with {type:'json'};
const pages=['/bolum/maas/','/bolum/harc/','/bolum/teftis/','/araclar/'];
const summary={baslangic:'2026-11-05T00:00:00Z',toplam:0,sayaclar:Object.fromEntries(registry.map((r,i)=>[r.anahtar,{toplam:1000+i,bugun:0,buHafta:0,buYil:0}]))};
async function sorted(page:any){
 for(const group of await page.locator('[data-arac-sirasi-grup]').all()){
  const rows=await group.locator(':scope > [data-arac-sirasi-id]').evaluateAll((rs:HTMLElement[])=>rs.map(r=>({id:r.dataset.aracSirasiId!,title:r.dataset.baslik!,n:Number(r.dataset.kullanim)})));
  expect(rows).toEqual([...rows].sort((a,b)=>b.n-a.n||a.title.localeCompare(b.title,'tr')||a.id.localeCompare(b.id)));
 }
}
test('JavaScript kapalıyken de gerçek sayaç kaydıyla sıralı açılır',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL:test.info().project.use.baseURL});const page=await context.newPage();
 for(const path of pages){await page.goto(path);await sorted(page);}
 expect(await page.locator('[data-arac-sirasi-id]').count()).toBe(catalog.araclar.length);
 await context.close();
});

test('Bütün araçlar: canlı sıra grupları, filtreyi ve masaya sabitlemeyi korur',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);let posts=0;
 await page.route('**/_657-servis/api/hesaplama',async r=>{if(r.request().method()==='POST')posts++;await gate;await r.fulfill({json:summary});});
 await page.goto('/araclar/');
 const ids=await page.locator('[data-group]').evaluateAll(gs=>gs.map(g=>g.getAttribute('data-group')));
 const pin=page.locator('[data-pin="enflasyon-farki"]');await pin.click();await expect(pin).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-dir-input]').fill('enflasyon');
 release();
 await expect(page.locator('[data-arac-sirasi-id="enflasyon-farki"]')).toHaveAttribute('data-kullanim','1000');
 await sorted(page);
 await expect(pin).toHaveAttribute('aria-pressed','true');
 expect(await page.locator('[data-group]').evaluateAll(gs=>gs.map(g=>g.getAttribute('data-group')))).toEqual(ids);
 await expect(page.locator('[data-arac-sirasi-id="memur-maas"]')).toBeHidden();
 await page.locator('[data-dir-input]').fill('');await page.locator('label[for="alan-masa"]').click();
 await expect(page.locator('[data-row]:visible')).toHaveCount(1);
 expect(posts).toBe(0);
});

test('Bağlantı hatasında doğrulanmış sıra kalır, bölüm araması boş durumu gösterir',async({page})=>{
 await page.route('**/_657-servis/api/hesaplama',r=>r.fulfill({status:503}));
 await page.goto('/bolum/maas/');await expect(page.locator('[data-arac-sirasi-durum]')).toContainText('son doğrulanan sıra');
 await sorted(page);
 await page.locator('[data-bolum-ara]').fill('olmayan-bir-arac');await expect(page.locator('[data-bolum-bos]')).toBeVisible();
 await page.locator('[data-bolum-ara]').fill('maaş');await expect(page.locator('[data-bolum-bos]')).toBeHidden();
});

for(const theme of ['light','dark'])for(const width of [320,375,414,768,1440])test(`${theme} ${width}: üç bölüm ve bütün araçlar`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.addInitScript(t=>localStorage.setItem('657:tema',t),theme);
 await page.route('**/_657-servis/api/hesaplama',r=>r.fulfill({json:summary}));
 for(const path of pages){
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await expect(page.locator('[data-arac-sirasi-durum]')).toHaveText(/Toplam kullanıma göre sıralandı/);
  await sorted(page);
  expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth),JSON.stringify(await page.locator('main').evaluate(e=>[...e.querySelectorAll<HTMLElement>('*')].filter(n=>n.getBoundingClientRect().right>innerWidth).slice(0,8).map(n=>({tag:n.tagName,class:n.className,text:n.textContent?.slice(0,50),right:n.getBoundingClientRect().right}))))).toBe(true);
  for(const [name,href] of [['Maaş','/bolum/maas/'],['Harç','/bolum/harc/'],['Teftiş','/bolum/teftis/']]){
   await expect(page.getByRole('navigation',{name:'Ana menü',exact:true,includeHidden:true}).getByRole('link',{name,exact:true,includeHidden:true})).toHaveAttribute('href',href);
   await expect(page.getByRole('navigation',{name:'Mobil menü',exact:true,includeHidden:true}).getByRole('link',{name,exact:true,includeHidden:true})).toHaveAttribute('href',href);
  }
  if(path!=='/araclar/'){
   const name=path.includes('maas')?'Maaş':path.includes('harc')?'Harç':'Teftiş';
   await expect(page.getByRole('navigation',{name:'Ana menü',exact:true,includeHidden:true}).getByRole('link',{name,exact:true,includeHidden:true})).toHaveAttribute('aria-current','page');
   await expect(page.locator('.arac-satirlari')).toHaveCount(1);
  }else expect(await page.locator('[data-arac-sirasi-id]').count()).toBe(catalog.araclar.length);
 }
});
