// Saffet Çelik kıdem/ihbar hesabını aynı girdilerle tarayıcıda çalıştırıp yerel hesapla karşılaştırır.
// Kullanım: node scripts/kaynak/saffet-kidem.mjs  → artifacts/kaynak-onbellek/saffet-kidem.json
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

const ornekler = [
  { giris: '2016-07-01', cikis: '2026-06-30', ucret: 60000 },
  { giris: '2022-07-01', cikis: '2026-10-30', ucret: 100000 },
  { giris: '2019-02-14', cikis: '2026-11-20', ucret: 45750.5 },
  { giris: '2025-03-10', cikis: '2026-08-05', ucret: 33030 },
  { giris: '2010-01-01', cikis: '2025-12-31', ucret: 52000 },
  { giris: '2024-02-29', cikis: '2026-02-28', ucret: 70000 },
];
const tr = s => Number(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
const tarayici = await chromium.launch({ channel: 'msedge' });
const sayfa = await tarayici.newPage();
const sonuc = [];
for (const o of ornekler) {
  await sayfa.goto('https://saffetcelik.com.tr/uygulamalar/kidem-ihbar-tazminati', { waitUntil: 'networkidle' });
  const tarihler = sayfa.locator('input[type="date"]');
  await tarihler.nth(0).fill(o.giris);
  await tarihler.nth(1).fill(o.cikis);
  await sayfa.locator('input:not([type="date"]):not([type="checkbox"]):visible').first().fill(String(o.ucret).replace('.', ','));
  const kutu = sayfa.locator('button[role="checkbox"], input[type="checkbox"]').first();
  if (await kutu.count()) await kutu.click();
  await sayfa.getByRole('button', { name: /Hesapla/ }).first().click();
  await sayfa.waitForTimeout(800);
  const metin = await sayfa.locator('main').innerText();
  const al = re => { const m = metin.match(re); return m ? tr(m[1]) : null; };
  sonuc.push({ ...o, kaynak: {
    netKidem: al(/Kıdem Tazminatı:\s*([\d.,]+)/), netIhbar: al(/Tahmini Net İhbar:\s*([\d.,]+)/),
    toplamGun: al(/\((\d+) gün\)/), sure: (metin.match(/(\d+)\s*Yıl,\s*(\d+)\s*Ay,\s*(\d+)\s*Gün/) || []).slice(1).map(Number) } });
}
await tarayici.close();
mkdirSync('artifacts/kaynak-onbellek', { recursive: true });
writeFileSync('artifacts/kaynak-onbellek/saffet-kidem.json', JSON.stringify(sonuc, null, 1));
console.log(JSON.stringify(sonuc, null, 1));
