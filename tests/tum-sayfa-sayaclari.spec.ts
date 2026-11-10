import {test,expect} from '@playwright/test';
import tools from '../src/data/araclar.json' with {type:'json'};
const paths=[...new Set(['/', '/araclar/', '/yazilar/', '/hukuk-sozlugu/', '/kelime/tuzuk-ne-demek/', '/cikmis-mulakat-sorulari/', '/unvan-maaslari/', '/adlicevre/', '/iletisim/', '/oneri/', '/bolum/tarifeler/', '/yargi-haritasi/', '/yeni-kurulan-140-mahkeme-tam-listesi/', '/200%E2%82%BA-uzerinde-kimin-resmi-bulunmaktadir/',...tools.araclar.filter(a=>a.tasindi&&a.path).map(a=>a.path!)])];
for(const path of paths)test(`${path}: tek sayfa sayacı ve tek görüntüleme isteği`,async({page})=>{
 const seen:string[]=[];
 await page.route('**/api/okunma',async r=>{const data=r.request().postDataJSON();seen.push(data.path);await r.fulfill({json:{sayi:9,bugun:3,baslangic:'2026-11-06T00:00:00+03:00'}});});
 await page.goto(path);
 const counter=page.locator('[data-sayfa-okunma] [data-okunma-path]');
 await expect(counter).toHaveCount(1);
 await expect(counter).toHaveAttribute('data-okunma-path',path);
 await expect(counter.locator('[data-okunma-bugun]')).toHaveText('Bugün: 3');
 const base=Number(await counter.getAttribute('data-okunma-taban'));
 await expect(counter.locator('[data-okunma-toplam]')).toHaveText(`Toplam: ${(base+9).toLocaleString('tr-TR')} kez okundu`);
 expect(seen.filter(p=>p===path)).toHaveLength(1);
});

test('paylaşılan hesap ve sorgu seçimleri kalıcı sayfa sayacında birleşir',async({page})=>{
 const seen:string[]=[];
 await page.route('**/api/okunma',async r=>{seen.push(r.request().postDataJSON().path);await r.fulfill({json:{sayi:2,bugun:1,baslangic:'2026-11-06T00:00:00+03:00'}});});
 await page.goto('/memur-maas-hesaplama/?ornek=secim#sonuc');
 await expect(page.locator('[data-sayfa-okunma] [data-okunma-bugun]')).toHaveText('Bugün: 1');
 expect(seen).toEqual(['/memur-maas-hesaplama/']);
 await page.reload();
 await expect.poll(()=>seen.length).toBe(2);
 expect(seen).toEqual(['/memur-maas-hesaplama/','/memur-maas-hesaplama/']);
});
