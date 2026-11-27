import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hesaplaAileCocuk,
  hesaplaTazminatFarki,
  hesaplaEngellilikIadesi,
  hesaplaGelistirmeOdenegi,
  hesaplaEmekliYollugu,
  hesaplaAlacakFaiziSatir,
} from '../src/lib/cesitli-odemeler.ts';

const yakin = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} !== ${b}`);

test('1. Aile ve Çocuk Yardımı formülü', () => {
  const r = hesaplaAileCocuk({ aylikKatsayi: 1.387871, aileYardimiVar: false, kucukCocuk: 1, buyukCocuk: 2 });
  yakin(r.aile, 0);
  yakin(r.cocuk, 1387.871);
  yakin(r.net, 1387.871);
});

test('2. Tazminat-Ek Gösterge 5510 sonrası formülü', () => {
  const r = hesaplaTazminatFarki('5510', {
    aylikKatsayi: 1.387871,
    yanOdemeKatsayi: 0.440141,
    gun: 2,
    ekGostergePuani: 800,
    ozelHizmetPuani: 20,
    ekOdemePuani: 10,
    yanOdemePuani: 575,
    vergiOrani: 0.15,
  });
  yakin(r.ekGosterge, 74.02);
  yakin(r.ozelHizmet, 175.8);
  yakin(r.ekOdeme, 87.9);
  yakin(r.yanOdeme, 16.87);
  yakin(r.toplamPrim, 83.69);
  yakin(r.damga, 2.69);
  yakin(r.gelirVergisi, 11.1);
  yakin(r.net, 305.82);
});

test('3. Tazminat-Ek Gösterge primsiz formülü', () => {
  const r = hesaplaTazminatFarki('primsiz', {
    aylikKatsayi: 1.387871,
    yanOdemeKatsayi: 0.440141,
    gun: 3,
    ekGostergePuani: 200,
    ozelHizmetPuani: 15,
    ekOdemePuani: 0,
    yanOdemePuani: 0,
    vergiOrani: 0.15,
  });
  yakin(r.ekGosterge, 27.76);
  yakin(r.ozelHizmet, 197.77);
  yakin(r.damga, 1.71);
  yakin(r.gelirVergisi, 4.16);
  yakin(r.net, 219.65);
});

test('4. Tazminat-Ek Gösterge 5434 öncesi formülü', () => {
  const r = hesaplaTazminatFarki('5434', {
    aylikKatsayi: 1.387871,
    yanOdemeKatsayi: 0.440141,
    gun: 30,
    ekGostergePuani: 600,
    ozelHizmetPuani: 0,
    ekOdemePuani: 0,
    yanOdemePuani: 300,
    vergiOrani: 0.15,
  });
  yakin(r.ekGosterge, 832.72);
  yakin(r.yanOdeme, 132.04);
  yakin(r.toplamPrim, 399.71);
  yakin(r.damga, 7.32);
  yakin(r.net, 824.21);
});

test('5. Engellilik İndirimi Vergi İadesi formülü', () => {
  const r = hesaplaEngellilikIadesi({ indirimMatrahi: 7000, vergiOrani: 0.15, kesilenGelirVergisi: 1000 });
  yakin(r.hakEdilen, 1050);
  yakin(r.odenecek, 1000);
});

test('6. Geliştirme Ödeneği formülü', () => {
  const r = hesaplaGelistirmeOdenegi({
    aylikKatsayi: 1.387871,
    ekGostergePuani: 600,
    odemeAyligiGostergePuani: 1500,
    oranYuzde: 120,
    odenenTutar: 0,
  });
  yakin(r.odenmesiGereken, 3497.43);
  yakin(r.damga, 26.55);
  yakin(r.net, 3470.89);
});

test('7. Emekli Yolluğu (Tazminatı) formülü', () => {
  const r = hesaplaEmekliYollugu({ aylikKatsayi: 1.387871 });
  yakin(r.brut, 18816.76);
  yakin(r.damga, 142.82);
  yakin(r.net, 18673.94);
});

test('8. Geriye Dönük Alacak Faizi formülü', () => {
  const r = hesaplaAlacakFaiziSatir({
    baslangicIso: '2016-09-15',
    odemeIso: '2023-03-20',
    faizOraniYuzde: 9,
    anapara: 1000,
  });
  assert.equal(r.gun, 2377);
  assert.equal(r.faiz, 586.11);
  assert.equal(r.toplam, 1586.11);
});
