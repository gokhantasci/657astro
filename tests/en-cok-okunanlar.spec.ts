import {test,expect} from '@playwright/test';

const gruplar=['hukuk','adli','mulakat','yazi'];
const katalog=gruplar.flatMap(grup=>Array.from({length:7},(_,i)=>({grup,baslik:`${grup} içerik ${i}`,yol:`/${grup}-${i}/`})));
const ozet=(donem='bugun')=>({donem,ilkGun:'2026-11-01',sonGun:'2026-11-07',baslangic:'2026-11-06T00:00:00Z',okunmalar:katalog.map((k,i)=>({path:k.yol,sayi:donem==='bugun'?i+1:30-i}))});

test('Dönemler gerçek sayılara göre dört beşli listeyi değiştirir; hata yeniden denenebilir',async({page})=>{
 await page.route('**/okunma-katalogu.json',r=>r.fulfill({json:katalog}));
 let hata=false;
 await page.route('**/_657-servis/api/okunma/siralama?*',async r=>{
  if(hata)return r.fulfill({status:503});
  const donem=new URL(r.request().url()).searchParams.get('donem')!;
  if(donem==='hafta')await new Promise(resolve=>setTimeout(resolve,300));
  await r.fulfill({json:ozet(donem)});
 });
 await page.goto('/');
 const alan=page.locator('[data-okunanlar]');
 await expect(alan).toHaveAttribute('data-durum','hazir');
 await expect(alan.locator('li')).toHaveCount(20);
 await expect(alan.locator('li a').first()).toHaveText('hukuk içerik 6');
 await expect(page.getByText('Dolar / TL',{exact:true})).toHaveCount(0);
 await alan.getByRole('button',{name:'Bu hafta',exact:true}).click();
 await alan.getByRole('button',{name:'Bu ay',exact:true}).click();
 await expect(alan.locator('li a').first()).toHaveText('hukuk içerik 0');
 await page.waitForTimeout(400);
 await expect(alan.getByRole('button',{name:'Bu ay',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(alan).toHaveAttribute('data-durum','hazir');
 hata=true;await alan.getByRole('button',{name:'Bu yıl',exact:true}).click();
 await expect(alan).toHaveAttribute('data-durum','hata');
 await expect(alan.locator('li')).toHaveCount(0);
 hata=false;await alan.getByRole('button',{name:'Yeniden dene'}).click();
 await expect(alan.locator('li')).toHaveCount(20);
});

for(const tema of ['light','dark'])for(const width of [320,375,414,768,1440])test(`${tema} ${width}: gerçek katalog ve taşmasız sıralamalar`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 await page.addInitScript(t=>localStorage.setItem('657:tema',t),tema);
 await page.route('**/_657-servis/api/okunma/siralama?*',r=>r.fulfill({json:{...ozet(),okunmalar:[]}}));
 await page.goto('/');
 const alan=page.locator('[data-okunanlar]');
 await expect(page.locator('html')).toHaveAttribute('data-theme',tema);
 await expect(alan).toHaveAttribute('data-durum','hazir');
 await expect(alan.locator('li')).toHaveCount(20);
 expect(await alan.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 if(width===1440||width===375)await alan.screenshot({path:test.info().outputPath(`okunanlar-${tema}-${width}.png`)});
 const links=await alan.locator('li a').evaluateAll(as=>as.map(a=>a.getAttribute('href')!));
 for(const link of links){const r=await page.request.get(link);expect(r.status(),link).toBe(200);}
});
