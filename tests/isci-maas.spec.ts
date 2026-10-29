import {test,expect} from '@playwright/test';
import {isciMaas,type IsciGirdi} from '../src/lib/isci-maas';
import rules from '../src/data/isci-kurallari.json' with {type:'json'};
import tax from '../src/data/vergi.json' with {type:'json'};
import {kamuAraclari} from '../src/lib/kamu-katalog';
const arac=kamuAraclari.find(a=>a.id==='isci-4d')!;
const g=Object.fromEntries(arac.fields.map(f=>[f.id,f.value])) as unknown as IsciGirdi;
test('Sağlık örneği: eski 158 TL kaynak sonucu ve güncel 300 TL kuralı ayrılır',()=>{
 // Kaynak: 29.10.2026, diğer/kıdemli işçi, kıdem 0, Ekim, 31 ücret/30 prim günü,
 // 21 yemek, servis, sendika aidatı 1 günlük çıplak ücret, BES yok, %15 GV.
 const old=isciMaas(g,tax,{...rules,yemekSgkGunlukIstisna:158,yemekVergiGunlukIstisna:158});
 expect(old.ucret).toBe(83020.48);expect(old.hizmet).toBe(13283.28);expect(old.yemek).toBe(6929.37);
 expect(old.sgk).toBe(14769.90);expect(old.issizlik).toBe(1054.99);expect(old.matrah).toBe(86996.29);
 expect(old.gv).toBe(7434.34);expect(old.dv).toBe(550.04);expect(old.net).toBe(82329.91);
 const current=isciMaas(g,tax,rules);
 expect(current.yemekSgkIstisna).toBe(6300);expect(current.yemekVergiIstisna).toBe(6300);
 expect(current.pek).toBe(102517.26);expect(current.sgk).toBe(14352.42);expect(current.issizlik).toBe(1025.17);
 expect(current.matrah).toBe(84461.59);expect(current.gv).toBe(7054.14);expect(current.dv).toBe(527.41);expect(current.net).toBe(83180.04);
});
test('tediye: önceki PEK tavanı, kullanılan istisna, BES kuruşu ve dilim geçişi',()=>{
 const r=isciMaas({...g,ucretGun:0,hizmetPrimiOran:0,sosyalYardim:0,yemekGun:0,sendikaAidati:0,tediyeGun:13,oncekiPek:290000,oncekiMatrah:186000,kullanilanGv:5615.1,kullanilanDv:33030*.00759,besOran:3},tax,rules);
 expect(r.tediye).toBe(34815.04);expect(r.pek).toBe(7270);expect(r.sgk).toBe(1017.80);expect(r.issizlik).toBe(72.70);expect(r.bes).toBe(218);
 expect(r.devredenPek).toBe(27545.04);expect(r.matrah).toBe(33724.54);
 expect(r.gv).toBe(6544.91);expect(r.dv).toBe(264.25);
 expect(()=>isciMaas({...g,primGun:31},tax,rules)).toThrow();expect(()=>isciMaas(g,{...tax,yil:2027},rules)).toThrow('yılı');
});
test('4/D formu Türkçe ondalık, sıfırlama, betiksiz başlangıç ve mobil temalar',async({page,browser})=>{
 await page.goto(arac.path);await expect(page.locator('[data-kamu-deger]')).toHaveText('83.180,04 TL');
 await page.locator('#gunlukUcret').fill('2800,50');await expect(page.locator('[data-kamu-hata]')).toBeHidden();
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('[data-kamu-deger]')).toHaveText('83.180,04 TL');
 await page.locator('#primGun').fill('31');await expect(page.locator('[data-kamu-hata]')).toBeVisible();
 const context=await browser.newContext({javaScriptEnabled:false}),plain=await context.newPage();await plain.goto('http://127.0.0.1:4321'+arac.path);
 await expect(plain.locator('[data-kamu-deger]')).toHaveText('83.180,04 TL');
 for(const theme of ['dark','light'])for(const width of [320,375,768,1440]){await plain.setViewportSize({width,height:900});await plain.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await plain.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await context.close();
});
