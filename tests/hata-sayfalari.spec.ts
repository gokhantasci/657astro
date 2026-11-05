import {test,expect} from '@playwright/test';
import {hataDurumlari} from '../src/lib/hata-durumlari';
import {preview} from 'vite';
import {hataSayfalariPlugin} from '../scripts/hata-sayfalari.mjs';

test('bilinmeyen derin adres 404 döner; arama ve kurtarma bağlantıları çalışır',async({page})=>{
 const response=await page.goto('/boyle-bir-adres-yok/alt-sayfa/?q=%3Cscript%3E');
 expect(response?.status()).toBe(404);
 await expect(page.locator('h1')).toHaveText('Aradığınız sayfa bulunamadı');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, follow');
 await expect(page.getByRole('link',{name:'Bütün araçlar',exact:true})).toHaveAttribute('href','/araclar/');
 await page.getByLabel('Yazılarda ve araçlarda ara').fill('kesinleşme');
 await page.getByRole('button',{name:'Ara',exact:true}).click();
 await expect(page).toHaveURL(/\/yazilar\/\?q=/);await expect(page.locator('#yazi-ara')).toHaveValue('kesinleşme');
});

test('503 gerçek durum kodu ve yeniden deneme başlıklarıyla açılır',async({page})=>{
 const response=await page.goto('/503/');expect(response?.status()).toBe(503);
 expect(response?.headers()['retry-after']).toBe('60');expect(response?.headers()['cache-control']).toBe('no-store');
 await expect(page.locator('h1')).toHaveText('Şu anda hizmet veremiyoruz');
 await expect(page.getByRole('link',{name:'Yeniden dene'})).toHaveAttribute('href','');
 const ok=await page.goto('/');expect(ok?.status()).toBe(200);
});
test('önizleme HTML hata belgesinde HEAD de 503 durumunu korur',async({request,baseURL})=>{
 test.skip(!baseURL?.endsWith(':4322'),'Derlenmiş hata belgesi üretim önizlemesinde sınanır.');
 for(const path of ['/503.html','/503/index.html']){
  const r=await request.head(path);expect(r.status()).toBe(503);expect(r.headers()['retry-after']).toBe('60');expect((await r.body()).length).toBe(0);
 }
});
test('eğik çizgisiz ve dosya uzantılı bulunamayan adresler de aynı 404 sayfasıdır',async({page})=>{
 for(const path of ['/olmayan-adres','/olmayan-belge.html']){
  const r=await page.goto(path);expect(r?.status()).toBe(404);await expect(page.locator('h1')).toHaveText('Aradığınız sayfa bulunamadı');
 }
});

test('/feed ve /feed/ istekleri feed.xml içeriğine yönlendirir ve RSS getirir',async({request,page})=>{
 for(const yol of ['/feed','/feed/']){
  const r=await request.get(yol,{maxRedirects:0});
  expect(r.status()).toBe(301);
  expect(r.headers()['location']).toBe('/feed.xml');
 }
 const res=await page.goto('/feed');
 expect(res?.status()).toBe(200);
 const text=await res?.text();
 expect(text?.trim().startsWith('<?xml')).toBe(true);
 expect(text?.includes('<rss')).toBe(true);
});

test('hata sayfaları betiksiz, haricî dosyasız ve mobilde iki temada okunur',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL});const page=await context.newPage();
 const resources:string[]=[];page.on('request',r=>{if(r.resourceType()!=='document')resources.push(r.url());});
 for(const path of ['/olmayan-sayfa/','/503/']){
  await page.goto(path);await expect(page.locator('h1')).toBeVisible();
  for(const colorScheme of ['light','dark'] as const){await page.emulateMedia({colorScheme});for(const width of [320,375,414,768]){
   await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' '+colorScheme+' '+width).toBe(true);
  }}
 }
 expect(resources).toEqual([]);await context.close();
});

test('48 tanımlı HTTP ve Cloudflare hata sayfası doğru kod ve açıklamayla açılır',async({request})=>{
 for(const h of hataDurumlari){
  const r=await request.get(`/${h.kod}/`);expect(r.status(),String(h.kod)).toBe(h.kod);
  expect(await r.text(),String(h.kod)).toContain(h.baslik);expect(await r.text()).toContain('noindex, follow');
  if([429,503].includes(h.kod))expect(r.headers()['retry-after']).toBe('60');
 }
});
test('tasarım önizlemesi ağ doğrulama hatalarında da tarayıcıda açılır',async({page})=>{
 const r=await page.goto('/hatalar/407/');expect(r?.status()).toBe(200);await expect(page.locator('h1')).toHaveText('Ağ geçidinde oturum gerekiyor');await expect(page.getByText('Tasarım önizlemesi',{exact:false})).toBeVisible();
});
test('önizlemede geçersiz yöntem ve tanımsız sunucu kodu da karşılanır',async({request,baseURL})=>{
 test.skip(!baseURL?.endsWith(':4322'),'Üretim önizlemesinin HTTP katmanı.');
 const method=await request.post('/yazilar/',{data:'yerel test'});expect(method.status()).toBe(405);expect(method.headers().allow).toBe('GET, HEAD');
 const other=await request.get('/599/');expect(other.status()).toBe(599);expect(await other.text()).toContain('Sunucu isteği tamamlayamadı');
 expect((await request.get('/')).status()).toBe(200);
});
test('JSON hata yanıtları HTML hata belgesine çevrilmez',async({baseURL})=>{
 test.skip(!baseURL?.endsWith(':4322'),'Derlenmiş belgelerle sunucu entegrasyonu.');
 const server=await preview({configFile:false,root:process.cwd(),appType:'mpa',build:{outDir:'dist'},preview:{host:'127.0.0.1',port:0,strictPort:true},plugins:[hataSayfalariPlugin(),{name:'test-api',configurePreviewServer(s){return ()=>s.middlewares.use((req,res,next)=>{if(req.url!=='/api/yerel-test')return next();res.statusCode=422;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Alanı kontrol edin.'}));});}}]});
 try{
  const address=server.httpServer.address();if(!address||typeof address==='string')throw Error('Test portu bulunamadı.');
  const r=await fetch(`http://127.0.0.1:${address.port}/api/yerel-test`);expect(r.status).toBe(422);expect(r.headers.get('content-type')).toBe('application/json');expect(await r.json()).toEqual({error:'Alanı kontrol edin.'});
 }finally{await server.close();}
});
