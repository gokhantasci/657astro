import {test,expect} from '@playwright/test';
import pages from '../src/data/dpb-sayfa-metinleri.json' with {type:'json'};
import {dpbGorusleri,dpbYol} from '../src/lib/dpb';
import {genelgeler,genelgeYol} from '../src/lib/genelgeler';
import {belgeSorulari} from '../src/lib/belge-sorulari';
const norm=(s:string)=>s.replace(/\s+/g,' ').trim();
test('Belge cevapları yalnız güvenilir kaynak metni veya resmî konu başlığıdır',()=>{
 const rows=[...dpbGorusleri.map(g=>({baslik:g.baslik,ps:pages[g.id as keyof typeof pages],tur:'dpb' as const})),...genelgeler.map(g=>({baslik:g.baslik,ps:g.sayfalar.filter(p=>p.yontem==='pdf'),tur:'genelge' as const}))];
 for(const r of rows){
  const qs=belgeSorulari(r.baslik,r.ps,r.tur);expect(qs.length,r.baslik).toBeGreaterThan(0);
  for(const q of qs){expect(q.soru.length,r.baslik).toBeLessThan(220);expect(r.ps.some(p=>p.no===q.sayfa&&norm(p.metin).includes(norm(q.cevap)))||q.cevap===r.baslik,`${r.baslik}: ${q.soru}`).toBe(true);}
 }
 expect(new Set(genelgeler.map(genelgeYol)).size).toBe(genelgeler.length);
 expect(genelgeler.flatMap(g=>g.sayfalar).filter(p=>p.yontem==='tarama').every(p=>p.metin==='')).toBe(true);
});

async function mocks(page:any){
 await page.route('**/_657-servis/api/okunma',r=>r.fulfill({json:{sayi:7,bugun:1,baslangic:'2026-11-05T00:00:00Z'}}));
 await page.route('**/_657-servis/api/okunma/siralama?donem=toplam',r=>r.fulfill({json:{okunmalar:[{path:'/kelime/ab-nak/',sayi:99999999}]}}));
 await page.route('**/_657-servis/api/istatistik',r=>r.fulfill({json:{goruntulenme:20,bugun:4,kullanim:10,okunmaBaslangic:'2026-11-05',kullanimBaslangic:'2026-11-05'}}));
}
test('DPB özgün metni değişmez, soru-cevap aşağıdadır ve görünür şemayla eşleşir',async({page})=>{
 await mocks(page);await page.goto('/dpb-gorusleri/1a/');
 expect(await page.locator('[data-ozgun-metin]').allTextContents()).toEqual(pages['1a'].map(p=>p.metin));
 expect(await page.locator('#ozgun-metin').evaluate(e=>e.compareDocumentPosition(document.getElementById('belge-sorulari')!)&Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
 const schema=await page.locator('script[type="application/ld+json"]').allTextContents();expect(schema.join('')).toContain('FAQPage');
 await expect(page.locator('#belge-sorulari')).toContainText('KPSS');
 await expect(page.locator('[data-sayfa-okunma]')).toHaveCount(1);
});
test('Duyuruların doğrudan bağlantısı hedefi görünür ve odaklı açar',async({page})=>{
 await mocks(page);await page.goto('/#duyurular');await expect(page.locator('#duyurular')).toBeFocused();
 const box=await page.locator('#duyurular').boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y).toBeLessThan(200);
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.locator('a[href="/#duyurular"]').last().click();await expect(page.locator('#duyurular')).toBeFocused();
});
for(const theme of ['light','dark'])for(const width of [320,375,414,768,1440])test(`${theme} ${width}: arşivler, okunma listeleri ve rakamlar`,async({page})=>{
 await mocks(page);await page.setViewportSize({width,height:900});await page.addInitScript(t=>{localStorage.setItem('657:tema',t);localStorage.setItem('657:cerez','ret')},theme);
 for(const url of ['/dpb-gorusleri/1a/',genelgeYol(genelgeler.find(g=>g.sayfalar.every(p=>p.yontem==='pdf'))!),'/adalet-bakanligi-genelgeleri/','/devlet-personel-baskanligi-mutalaalari/','/rakamlarla-657/','/hukuk-sozlugu/','/cikmis-mulakat-sorulari/']){
  await page.goto(url);await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth),url).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  if(url.includes('hukuk-sozlugu')||url.includes('cikmis-mulakat'))await expect(page.locator('[data-cok-okunan-liste] li')).toHaveCount(url.includes('hukuk-sozlugu')?24:12);
 }
});
