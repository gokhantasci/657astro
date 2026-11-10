import {test,expect} from '@playwright/test';
import mods from '../src/data/teftis-modulleri.json' with {type:'json'};

for(const m of mods)test(`${m.slug}: sistem ve kaydedilmiş tema iç araçla eşleşir`,async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('/'+m.slug+'/');
 await page.locator('[data-teftis-modul]').scrollIntoViewIfNeeded();
 const root=page.frameLocator('[data-teftis-modul]').locator('html');
 await expect(root).toHaveAttribute('data-theme','dark');
 await expect(root).toHaveAttribute('data-bs-theme','dark');
 await expect(root).toHaveCSS('--color-paper-2','#141d2c');
 await page.emulateMedia({colorScheme:'light'});
 await expect(root).toHaveAttribute('data-theme','light');
 await page.locator('[data-tema]').click();
 await expect(root).toHaveAttribute('data-theme','dark');
 await page.reload();
 await page.locator('[data-teftis-modul]').scrollIntoViewIfNeeded();
 await expect(root).toHaveAttribute('data-theme','dark');
 await page.emulateMedia({colorScheme:'dark'});
 await page.locator('[data-tema]').click();
 await expect(root).toHaveAttribute('data-theme','light');
 await page.reload();
 await page.locator('[data-teftis-modul]').scrollIntoViewIfNeeded();
 await expect(root).toHaveAttribute('data-theme','light');
});

test('terfi cetveli: tema değişince sihirbazdaki bilgiler korunur',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('/terficetveli/');
 const f=page.frameLocator('[data-teftis-modul]');
 await f.locator('#unvanHakim').check();
 await f.getByRole('button',{name:'Devam',exact:true}).click();
 await f.locator('#leadName').fill('Tema denemesi');
 await page.locator('[data-tema]').click();
 await expect(f.locator('html')).toHaveAttribute('data-theme','light');
 await expect(f.locator('#leadName')).toHaveValue('Tema denemesi');
 await page.locator('[data-tema]').click();
 await expect(f.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(f.locator('#leadName')).toHaveValue('Tema denemesi');
});

test('maaş tahmini uyarısı sistemin koyu temasında okunur',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('/');
 const colors=await page.evaluate(()=>{
  const el=document.createElement('span');el.className='chip--tahmin';el.textContent='Tahmin';document.body.append(el);
  return {text:getComputedStyle(el).color,warning:getComputedStyle(document.documentElement).getPropertyValue('--color-warning').trim()};
 });
 expect(colors).toEqual({text:'rgb(243, 204, 121)',warning:'#f3cc79'});
});

test('ana sayfanın seçili slayt düğmesi koyu temada okunur',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('/');
 await expect(page.locator('[data-slide-index][aria-current]')).toHaveCSS('color','rgb(255, 255, 255)');
});
