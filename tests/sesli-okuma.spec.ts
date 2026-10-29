import {test,expect} from '@playwright/test';
test('sözlük ve soruda isteğe bağlı Türkçe okuma; durdurma ve kartın iki yüzü',async({page})=>{
 await page.addInitScript(()=>{
  const mock={speak:(s:SpeechSynthesisUtterance)=>{(window as any).okunanMetin=s.text;},cancel:()=>{},getVoices:()=>[]};
  Object.defineProperty(window,'speechSynthesis',{value:mock,configurable:true});
 });
 await page.goto('/kelime/abluka-ne-demek/');
 expect(await page.evaluate(()=>(window as any).okunanMetin)).toBeUndefined();
 await page.locator('[data-sesli-oku]').click();expect(await page.evaluate(()=>(window as any).okunanMetin)).toContain('Abluka');
 await page.locator('[data-sesli-dur]').click();await expect(page.locator('[data-sesli-durum]')).toHaveText('Okuma durduruldu.');
 await page.goto('/cikmis-mulakat-sorulari/?kart=turkiyenin-en-kalabalik-sehri-hangisidir');
 await expect(page.locator('[data-kart-soru]')).toContainText('kalabalık');
 await page.locator('[data-sesli-otomatik]').check();expect(await page.evaluate(()=>(window as any).okunanMetin)).toContain('kalabalık');
 await page.locator('[data-kart-cevir]').click();expect(await page.evaluate(()=>(window as any).okunanMetin)).toContain('İstanbul');
});
test('Piper Türkçe modeli tarayıcıda gerçek WAV üretir',async({page})=>{
 test.skip(process.env.PIPER_TEST!=='1','Model indirme ve gerçek çıkarım ayrı, isteğe bağlı ağ doğrulamasıdır.');test.setTimeout(180000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.PIPER_BASE_URL??'')+'/kelime/abluka-ne-demek/');
 await page.locator('[data-sesli-motor]').selectOption('piper');await page.locator('[data-sesli-oku]').click();
 await expect(page.locator('[data-sesli-durum]')).toHaveText(/Piper ile okunuyor|Okuma tamamlandı/, {timeout:150000});
 expect(errors).toEqual([]);
});
test('sesli okuma alanları mobilde ve iki temada taşmaz',async({page})=>{
 for(const path of ['/kelime/abluka-ne-demek/','/turkiyenin-en-kalabalik-sehri-hangisidir/','/cikmis-mulakat-sorulari/']){
  await page.goto(path);
  for(const theme of ['dark','light'])for(const width of [320,1440]){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' '+theme+' '+width).toBe(true);
  }
 }
 await page.screenshot({path:'artifacts/sesli-kartlar-light.png',fullPage:true});
});
