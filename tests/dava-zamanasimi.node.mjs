import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hesaplaDavaZamanasimi,
  diffDays,
  diffYmd,
} from '../src/lib/dava-zamanasimi.ts';

test('Anonim referans senaryosu: 8 yıl olağan + 559 gün HAGB durma + 0 gün seri muhakeme', () => {
  const sonuc = hesaplaDavaZamanasimi({
    sucTarihi: '2016-09-05',
    incelemeTarihi: '2026-07-14',
    cezaKademesi: '5-yil-alti',
    yasGrubu: 'yetiskin',
    kesmeler: [
      { tur: 'iddianame', tarih: '2016-10-16', aciklama: 'İddianame düzenlenmesi' },
      { tur: 'sorgu', tarih: '2017-01-26', aciklama: 'Sanığın sorgusu' },
      { tur: 'mahkumiyet', tarih: '2025-04-21', aciklama: 'Hükmün açıklanması / Mahkûmiyet' },
      { tur: 'mahkumiyet', tarih: '2026-02-19', aciklama: 'Yeniden mahkûmiyet' },
    ],
    durmalar: [
      { tur: 'hagb', baslangic: '2017-02-15', bitis: '2018-08-28', aciklama: 'HAGB denetim süresi' },
    ],
    etkisizler: [
      { tur: 'yeni-esas', tarih: '2025-01-10' },
      { tur: 'seri-muhakeme', tarih: '2025-07-11', bitis: '2025-11-17' },
      { tur: 'hatali-kesinlesme', tarih: '2026-06-09' },
    ],
  });

  // HAGB durma süresi
  assert.equal(sonuc.toplamDurmaGun, 559);
  assert.deepEqual(sonuc.toplamDurmaYmd, { yil: 1, ay: 6, gun: 13 });

  // Seri muhakeme 129 gün tespit edilir ancak durmaya (mahsup) eklenmez
  assert.equal(sonuc.seriMuhakemeGun, 129);

  // İhtiyatlı mod (26.01.2017 sorgu esaslı)
  assert.equal(sonuc.ihtiyatli.esasBaslangic, '2017-01-26');
  assert.equal(sonuc.ihtiyatli.olaganDurmaHaric, '2025-01-26');
  assert.equal(sonuc.ihtiyatli.olaganToplamGun, 2922);
  assert.equal(sonuc.ihtiyatli.olaganDurmaDahil, '2026-08-08');
  assert.equal(sonuc.ihtiyatli.uzamisDurmaHaric, '2028-09-05');
  assert.equal(sonuc.ihtiyatli.uzamisDurmaDahil, '2030-03-18');
  assert.equal(sonuc.ihtiyatli.incelemeTakvimGun, 3456);
  assert.equal(sonuc.ihtiyatli.incelemeIsleyenGun, 2897);
  assert.equal(sonuc.ihtiyatli.kalanGun, 25);
  assert.equal(sonuc.ihtiyatli.gerceklesti, false);

  // Suç tarihinden toplam gün ve mahsup sonrası
  assert.equal(sonuc.suctanToplamTakvimGun, 3599);
  assert.equal(sonuc.suctanMahsupSonrasiGun, 3040);

  // Karşılaştırma senaryoları
  const hicKesilme = sonuc.senaryolar.find((s) => s.baslangic === '2016-09-05');
  const yalnizIddianame = sonuc.senaryolar.find((s) => s.baslangic === '2016-10-16');
  assert.equal(hicKesilme?.durmaDahilTarih, '2026-03-18');
  assert.equal(hicKesilme?.gerceklesti, true);
  assert.equal(yalnizIddianame?.durmaDahilTarih, '2026-04-28');
  assert.equal(diffDays('2026-03-18', '2026-08-08'), 143);
});

test('TCK 66/2 yaş küçüklüğü indirimi (15-18 yaş 2/3 ve 12-15 yaş 1/2)', () => {
  const genc = hesaplaDavaZamanasimi({
    sucTarihi: '2020-01-01',
    incelemeTarihi: '2025-06-01',
    cezaKademesi: '5-yil-alti',
    yasGrubu: '15-18',
    kesmeler: [],
    durmalar: [],
  });
  assert.equal(genc.olaganAy, 64); // 5 yıl 4 ay
  assert.equal(genc.uzamisAy, 96); // 8 yıl
  assert.equal(genc.ihtiyatli.olaganDurmaHaric, '2025-05-01');
  assert.equal(genc.ihtiyatli.gerceklesti, true);

  const cocuk = hesaplaDavaZamanasimi({
    sucTarihi: '2020-01-01',
    incelemeTarihi: '2023-12-31',
    cezaKademesi: '5-yil-alti',
    yasGrubu: '12-15',
    kesmeler: [],
    durmalar: [],
  });
  assert.equal(cocuk.olaganAy, 48); // 4 yıl
  assert.equal(cocuk.uzamisAy, 72); // 6 yıl
  assert.equal(cocuk.ihtiyatli.olaganDurmaHaric, '2024-01-01');
  assert.equal(cocuk.ihtiyatli.gerceklesti, false);
});

test('Dolmuş zamanaşımı sonraki kesilme işlemiyle canlanmaz', () => {
  const sonuc = hesaplaDavaZamanasimi({
    sucTarihi: '2015-01-01',
    incelemeTarihi: '2024-06-01',
    cezaKademesi: '5-yil-alti',
    yasGrubu: 'yetiskin',
    kesmeler: [
      { tur: 'sorgu', tarih: '2023-02-01', aciklama: 'Süre dolduktan sonra sorgu' },
    ],
    durmalar: [],
  });
  assert.equal(sonuc.ihtiyatli.esasBaslangic, '2015-01-01');
  assert.equal(sonuc.ihtiyatli.gerceklesti, true);
  assert.equal(sonuc.ihtiyatli.gecersizKesmeler.length, 1);
});

test('Çakışan durma dönemleri mükerrer sayılmaz', () => {
  const sonuc = hesaplaDavaZamanasimi({
    sucTarihi: '2020-01-01',
    incelemeTarihi: '2025-01-01',
    cezaKademesi: '5-yil-alti',
    yasGrubu: 'yetiskin',
    kesmeler: [],
    durmalar: [
      { tur: 'hagb', baslangic: '2021-01-01', bitis: '2021-06-01' },
      { tur: 'izin', baslangic: '2021-04-01', bitis: '2021-08-01' },
    ],
  });
  assert.equal(sonuc.toplamDurmaGun, diffDays('2021-01-01', '2021-08-01'));
  assert.deepEqual(diffYmd('2017-02-15', '2018-08-28'), { yil: 1, ay: 6, gun: 13 });
});
