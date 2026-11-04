// Yerel sürümün masaüstü / mobil görsel kontrol çıktıları.
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
const base=process.argv[2]??'http://127.0.0.1:4322';
for(const [ad,path,width,theme]of [['anasayfa','/',1440,'light'],['yazilar','/yazilar/',1440,'dark'],['maas','/memur-maas-hesaplama/',1440,'light'],['anasayfa-mobil','/',390,'light'],['teftis-mobil','/byu-uygulanan-dosyalar/',320,'light']]){
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.addInitScript(t=>localStorage.setItem('657:tema',t),theme);
 await page.goto(base+path);await page.waitForTimeout(400);const ret=page.getByRole('button',{name:'Reddet',exact:true});if(await ret.isVisible())await ret.click();if(ad==='maas')await page.locator('.maas-bolum').first().evaluate(el=>el.open=true);await page.mouse.move(0,0);await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].map(img=>{img.loading='eager';return img.decode();}));});
 await page.screenshot({path:`artifacts/arayuz-${ad}.png`,fullPage:true});await page.close();
}
await browser.close();
