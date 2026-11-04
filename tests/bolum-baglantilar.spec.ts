import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';
test('bölüm dizinleri gerçek araçlara bağlanır',async({page})=>{
 for(const [yol,baslik]of [['teftis','Teftiş araçları'],['hesaplamalar','Hesaplama araçları']]){await page.goto(`/bolum/${yol}/`);await expect(page.getByRole('heading',{level:1,name:baslik})).toBeVisible();expect(await page.locator('.arac-satirlari a').count()).toBeGreaterThan(10);}
});
test('yazı gövdelerinde eski etiket ve gizlenmiş e-posta bağlantısı kalmaz',()=>{
 for(const name of readdirSync('src/content/yazilar').filter(f=>f.endsWith('.md'))){const s=readFileSync('src/content/yazilar/'+name,'utf8');expect(s,name).not.toMatch(/href=["'](?:https?:\/\/(?:www\.)?657\.com\.tr)?\/tag\//);expect(s,name).not.toMatch(/href=["'][^"']*cdn-cgi\/l\/email-protection/);}
});
