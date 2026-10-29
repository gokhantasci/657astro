import {test,expect} from '@playwright/test';
import {almanyaPostaBul} from '../src/lib/almanya-posta';
import data from '../src/data/almanya-posta-bolgeleri.json' with {type:'json'};
test('Almanya: kaynak örnekleri, baştaki sıfır ve örtüşen bölgeler',()=>{
 expect(almanyaPostaBul('10115',data.bolgeler).temsilcilikler).toEqual(['BERLİN']);
 expect(almanyaPostaBul('80331',data.bolgeler).temsilcilikler).toEqual(['MÜNİH']);
 expect(almanyaPostaBul('01067',data.bolgeler).kod).toBe('01067');
 expect(new Set(almanyaPostaBul('23913',data.bolgeler).temsilcilikler)).toEqual(new Set(['BERLİN','HAMBURG']));
 expect(()=>almanyaPostaBul('1067',data.bolgeler)).toThrow('beş rakam');
});
test('sorgu, çakışma uyarısı ve uzun cetvel araması',async({page})=>{
 await page.goto('/almanya-posta-kodu-konsolosluk/');
 await page.locator('#postaKodu').fill('80331');await expect(page.locator('[data-posta-sonuc]')).toHaveText('MÜNİH');
 await page.locator('#postaKodu').fill('23913');await expect(page.locator('[data-posta-not]')).toContainText('birden fazla');
 await page.locator('#postaKodu').fill('12');await expect(page.locator('[data-posta-sonuc]')).toHaveText('—');
 await expect(page.locator('.tablo-arac input')).toBeVisible();await page.locator('.tablo-arac input').fill('MÜNİH');
 expect(await page.locator('.prose table tbody tr:visible').count()).toBeGreaterThan(0);
 for(const theme of ['light','dark']){await page.setViewportSize({width:320,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);}
});
