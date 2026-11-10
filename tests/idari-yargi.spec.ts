import {test,expect} from '@playwright/test';
import {idariIller,idariIlBilgisi,idariYargiKaynagi} from '../src/lib/idari-yargi';
import {adliKayitlar} from '../src/lib/adlicevre';
import {yargiHaritasiVerisi} from '../src/lib/yargi-haritasi-veri';
import {createHash} from 'node:crypto';
import rehber from '../src/data/idari-yargi-rehberi.json' with {type:'json'};
import {idareBilgisi} from '../src/lib/idare-yargi';

test('Bilecik: kurulu mahkeme faal değildir; 1746 sayılı karar Eskişehir bağlantısını açıklar',()=>{
 const r=idareBilgisi('Bilecik')!;
 expect(r.faal).toBe(false);
 expect(r.durumMetni).toContain('faal değil (FD)');
 expect(r.mahkeme).toBe('Eskişehir İdare Mahkemesi');
 expect(r.bolge).toBe('Bursa Bölge İdare Mahkemesi');
 expect(r.cevreKarari?.karar).toBe('1746');
 expect(r.cevreKarari?.uygulamaTarihi).toBe('2024-11-11');
 expect(r.cevreKarari?.kaynak).toBe('https://www.hsk.gov.tr/Eklentiler/08112024133906112024-1746pdf.pdf');
 for(const il of idariIller)expect(idareBilgisi(il.il)?.faal).toBe(il.durum==='faal');
});

test('81 il ve bütün kaynaklı adliyeler eşleşir; faal olmayan mahkeme hizmet veren mahkeme olamaz',()=>{
 expect(idariIller).toHaveLength(81);expect(new Set(idariIller.map(x=>x.plaka)).size).toBe(81);
 for(const k of adliKayitlar)if(k.kaynak)expect(idariIlBilgisi(k.kaynak.il),k.kaynak.il).toBeDefined();
 for(const il of idariIller){const name=il.idareMahkemesi.replace(' İdare Mahkemesi','');expect(rehber.mahkemeler.some(m=>m.tur==='idare'&&m.faal&&m.merkez===name)).toBe(true);}
 const map=yargiHaritasiVerisi();for(const il of idariIller){const row=map.iller[il.plaka as keyof typeof map.iller];expect(row.idare_mahkemesi).toBe(il.idareMahkemesi);expect(row.bim).toBe(il.bimKisa);expect(map.bimler[il.bimKisa].iller.some(k=>k.plaka===il.plaka)).toBe(true);}
 expect(idariIlBilgisi('Bingöl')?.bim).toBe('Diyarbakır Bölge İdare Mahkemesi');
 expect(idariIlBilgisi('bilinmeyen il')).toBeUndefined();
});

for(const [il,durum,idare,bim] of [
 ['Ağrı','faal','Ağrı İdare Mahkemesi','Erzurum'],
 ['Iğdır','faal-degil','Ağrı İdare Mahkemesi','Erzurum'],
 ['Bilecik','faal-degil','Eskişehir İdare Mahkemesi','Bursa'],
 ['Ardahan','yok','Kars İdare Mahkemesi','Erzurum'],
 ['Bayburt','yok','Erzurum İdare Mahkemesi','Erzurum'],
 ['Burdur','faal-degil','Isparta İdare Mahkemesi','Antalya'],
])test(`${il}: kurulu/FD/hizmet veren mahkeme ayrımı`,()=>{const r=idariIlBilgisi(il)!;expect(r.durum).toBe(durum);expect(r.idareMahkemesi).toBe(idare);expect(r.bim).toBe(`${bim} Bölge İdare Mahkemesi`);});

test('resmî PDF kaynak özeti kaydedilmiş dosyanın karmasıyla eşleşir',async({request})=>{
 const response=await request.get(idariYargiKaynagi.url);expect(response.ok()).toBe(true);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(rehber.sha256);
});

test('ilçe sayfası il bilgisini alır; kaynak ve hizmet ayrımı betiksiz görünür',async({browser})=>{
 const c=await browser.newContext({javaScriptEnabled:false});const p=await c.newPage();try{for(const path of ['/adlicevre/agri-adliyesi-yargi-cevresi/','/adlicevre/dogubayazit-adliyesi-yargi-cevresi/']){await p.goto(path);await expect(p.locator('.adli-olgular')).toContainText('Ağrı İdare Mahkemesi');await expect(p.locator('.adli-olgular')).toContainText('Erzurum Bölge İdare Mahkemesi');await expect(p.getByRole('link',{name:'HSK İdari Yargı Rehberi',exact:true})).toHaveAttribute('href',idariYargiKaynagi.url);}
 await p.goto('/adlicevre/igdir-adliyesi-yargi-cevresi/');await expect(p.locator('.adli-olgular')).toContainText('faal değil (FD)');await expect(p.locator('.adli-olgular')).toContainText('Ağrı İdare Mahkemesi');}finally{await c.close();}
});

for(const theme of ['light','dark'])test(`${theme}: idari yargı bilgileri mobil ve masaüstüne sığar`,async({page})=>{
 await page.addInitScript(t=>{localStorage.setItem('657:tema',t);localStorage.setItem('657:cerez','ret');},theme);
 for(const width of [320,375,414,768,1440]){await page.setViewportSize({width,height:950});await page.goto('/adlicevre/agri-adliyesi-yargi-cevresi/');await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await expect(page.getByRole('heading',{name:'İdari yargı bilgileri'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
