import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const [name,folder,file]of [['anasayfa','B · Hizmet portalı · Anasayfa-html','B-Anasayfa.dc.html'],['maas','B · Hizmet portalı · Maaş aracı-html','B-Arac.dc.html']]){
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`http://127.0.0.1:4333/${encodeURIComponent(folder)}/${file}`);await page.waitForTimeout(800);
 await page.screenshot({path:`artifacts/ornek-${name}.png`,fullPage:true});await page.close();
}
await browser.close();
