import { tumSiteHaritasi } from './site-haritasi';
import { test, expect } from '@playwright/test';
import { terimler,terimHref } from '../src/lib/sozluk';
import { sorular,soruHref } from '../src/lib/mulakat';
test('eski sözlük ve mülakat yolları doğru hedefe yönlenir',async({page,request})=>{
 const t=terimler[0],s=sorular[0];
 const res=await request.get(`/kelimeler/${t.slug}/`);
 expect(await res.text()).toContain('noindex,follow');
 await page.goto(`/kelimeler/${t.slug}/`);await expect(page).toHaveURL(new RegExp(terimHref(t)+'$'));
 await page.goto(`/sozlukyeni/${s.slug}/`);await expect(page).toHaveURL(new RegExp(soruHref(s)+'$'));
});
test('taşınan hesaplayıcılar, adli çevre ve unvan yazıları site haritasında',async({request})=>{
 const xml=await tumSiteHaritasi(request);
 for(const p of ['/memur-maas-hesaplama/','/emekli-memur-maas-hesaplama/','/sozlesmeli-memur-maas-hesaplama/','/enflasyon-farki-hesaplama-robotu/','/kesinlesme/','/adlicevre/adana-adliyesi-yargi-cevresi/','/orman-muhafaza-memuru-maasi-2026/'])expect(xml).toContain(`https://657.com.tr${p}</loc>`);
 expect(xml).not.toContain('<loc>https://657.com.tr/kelimeler/');
});
test('aktarılmış yazıda gerçek görsel ve indirme dosyası bulunur',async({page,request})=>{
 await page.goto('/gys-tercih-robotu-simulasyonu/');
 const img=page.locator('article .prose img').first();await expect(img).toHaveAttribute('src',/\/wp-content\/uploads\//);
 const src=await img.getAttribute('src');expect((await request.get(src!)).ok()).toBe(true);
 expect((await request.get('/TercihRobotu.rar')).ok()).toBe(true);
 for(const width of [320,375,414,768]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(0);}
});
