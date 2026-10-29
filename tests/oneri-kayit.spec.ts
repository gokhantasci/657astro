import {test,expect} from '@playwright/test';
import {onayliOneriSchema} from '../src/lib/onayli-oneriler';
test('onaylı içerik şeması gönderen ve gizli alanları reddeder',()=>{
 const r={id:'bdf340c9-3cb8-4c91-adbb-99805617eac0',tur:'mulakat',slug:'ornek-soru-oneri-bdf340c9',baslik:'Örnek soru?',aciklama:'Örnek cevap.',kaynak:'2026 sınavı',tarih:'2026-10-30'};
 expect(onayliOneriSchema.safeParse(r).success).toBe(true);
 expect(onayliOneriSchema.safeParse({...r,ad:'Özel kişi'}).success).toBe(false);
});
test('öneri kaydı, ağ hatasında koruma ve aynı gönderim numarasıyla yeniden deneme',async({page})=>{
 const requests:Record<string,string>[]=[];
 let fail=true;
 await page.route('http://127.0.0.1:4326/api/oneriler',async route=>{
  requests.push(route.request().postDataJSON());
  if(fail)return route.abort('failed');
  return route.fulfill({status:201,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4321'},body:JSON.stringify({id:'bdf340c9-3cb8-4c91-adbb-99805617eac0',durum:'kaydedildi'})});
 });
 await page.goto('/oneri/?tur=mulakat');
 await expect(page.getByRole('button',{name:'Öneriyi gönder'})).toBeEnabled();
 await page.locator('#oneri-baslik').fill('Bir yeni soru?');await page.locator('#oneri-aciklama').fill('Doğrulanacak cevap.');
 await page.getByRole('button',{name:'Öneriyi gönder'}).click();await expect(page.locator('[data-oneri-hata]')).toContainText('ulaşılamadı');
 await expect(page.locator('#oneri-aciklama')).toHaveValue('Doğrulanacak cevap.');
 fail=false;
 await page.getByRole('button',{name:'Öneriyi gönder'}).click();await expect(page.locator('[data-oneri-durum]')).toContainText('Kayıt numarası');
 expect(requests[0].requestKey).toBe(requests[1].requestKey);
 expect(requests[1].tur).toBe('mulakat');
 await page.locator('#oneri-baslik').fill('Farklı soru?');await page.getByRole('button',{name:'Öneriyi gönder'}).click();
 await expect.poll(()=>requests.length).toBe(3);expect(requests[2].requestKey).not.toBe(requests[1].requestKey);
 for(const theme of ['light','dark']){await page.setViewportSize({width:320,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);}
});
