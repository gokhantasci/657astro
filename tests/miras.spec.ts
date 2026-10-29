import { test, expect } from '@playwright/test';
import { miras, kesirMetni } from '../src/lib/miras';

const bos = { tutar: 1000000, es: false, cocuklar: 0, olmusCocuklarinTorunlari: [] as number[], anne: false, baba: false, tamKardes: 0, anaBirKardes: 0, babaBirKardes: 0, ucuncuZumre: false };
const ozet = (g: Partial<typeof bos>) => miras({ ...bos, ...g }).paylar.map(p => [p.kim, kesirMetni(p.kesir), p.tutar]);

test('1. zümre: eş 1/4, çocuklar eşit; ölmüş çocuğun yerini torunları alır', () => {
  expect(ozet({ es: true, cocuklar: 2 })).toEqual([['Sağ kalan eş', '1/4', 250000], ['Çocuklar (2 kişi, her biri)', '3/8', 375000]]);
  expect(ozet({ es: true, cocuklar: 1, olmusCocuklarinTorunlari: [2, 0] })).toEqual([
    ['Sağ kalan eş', '1/4', 250000], ['Çocuk', '3/8', 375000], ['1. ölmüş çocuğun altsoyu (2 kişi, her biri)', '3/16', 187500]]);
});

test('2. zümre: eş 1/2; ölmüş ebeveynin yerine kardeşler; bir taraf boşsa diğer tarafa geçer', () => {
  expect(ozet({ es: true, anne: true, baba: true })).toEqual([['Sağ kalan eş', '1/2', 500000], ['Anne', '1/4', 250000], ['Baba', '1/4', 250000]]);
  expect(ozet({ es: true, anne: true })).toEqual([['Sağ kalan eş', '1/2', 500000], ['Anne', '1/2', 500000]]);
  expect(ozet({ baba: true, tamKardes: 1, anaBirKardes: 1 })).toEqual([
    ['Ana bir kardeşler (1 kişi, her biri)', '1/4', 250000], ['Baba', '1/2', 500000], ['Tam kardeşler (1 kişi, her biri)', '1/4', 250000]]);
});

test('3. zümre, yalnız eş ve mirasçısız durum', () => {
  expect(ozet({ es: true, ucuncuZumre: true })[0]).toEqual(['Sağ kalan eş', '3/4', 750000]);
  expect(ozet({ es: true })).toEqual([['Sağ kalan eş', '1', 1000000]]);
  expect(() => miras({ ...bos })).toThrow('Devlete');
});

test('sayfa: eş ve iki çocuk örneği, torun girişi', async ({ page }) => {
  await page.goto('/miras-payi-hesaplama/');
  await expect(page.locator('[data-mp-satirlar]')).toContainText('375.000,00 TL');
  await page.locator('#torunlar').fill('2');
  await expect(page.locator('[data-mp-satirlar]')).toContainText('1/8');
});

test('ortak sayı okuyucu birden çok binlik ayracını okur', async () => {
  const { sayiOku } = await import('../src/lib/bicim');
  expect([sayiOku('1.000.000'), sayiOku('1.500'), sayiOku('1.5'), sayiOku('1.234.567,89'), sayiOku('12,5')]).toEqual([1000000, 1500, 1.5, 1234567.89, 12.5]);
});
