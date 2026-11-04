import {test,expect} from '@playwright/test';
import {araclar} from '../src/lib/tools';
test('bütün araçlarda görünen seçim listeleri panellerin üzerinde açılır',async({page})=>{
 test.setTimeout(240000);let sayi=0;
 await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));
 for(const a of araclar.filter(a=>a.path)){
  await page.goto(a.path!);
  for(const input of await page.getByRole('combobox').all()){
   if(!await input.isVisible()||await input.isDisabled())continue;
   await input.scrollIntoViewIfNeeded();await input.click();
   const id=await input.getAttribute('aria-controls');if(!id)continue;
   const list=page.locator(`[id="${id}"]`);await expect(list,a.path).toBeVisible();
   expect(await list.evaluate(el=>{const r=el.getBoundingClientRect(),p=document.elementFromPoint(r.x+Math.min(25,r.width/2),r.y+Math.min(15,r.height/2));return p!==null&&(el===p||el.contains(p));}),`${a.path} ${id}`).toBe(true);
   await input.press('Escape');await expect(list).toBeHidden();sayi++;
  }
 }
 expect(sayi).toBeGreaterThan(150);
});
test('kanun yolu indirme düğmesi iki temada okunur; jrobot boş durumda iç yatay kaydırma üretmez',async({page})=>{
 for(const tema of ['light','dark']){
  await page.goto('/kanunyolu/');await page.evaluate(t=>document.documentElement.dataset.theme=t,tema);
  const a=page.getByRole('link',{name:'Denetim şablonunu indir (Word)'});
  const renk=await a.evaluate(el=>{const s=getComputedStyle(el);return {text:s.color,bg:s.backgroundColor};});expect(renk.text).not.toBe(renk.bg);
 }
 for(const width of [375,1440]){await page.setViewportSize({width,height:1000});await page.goto('/jrobot/');const f=page.frameLocator('[data-teftis-modul]');await expect(f.locator('main')).toBeVisible();expect(await f.locator('body').evaluate(()=>[...document.querySelectorAll<HTMLElement>('*')].filter(el=>el.clientWidth>0&&el.scrollWidth>el.clientWidth+2&&/auto|scroll/.test(getComputedStyle(el).overflowX)).map(el=>el.tagName+'.'+el.className))).toEqual([]);}
});
