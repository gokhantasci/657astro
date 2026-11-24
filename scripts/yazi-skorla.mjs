// Tüm haber/rehber yazılarını SEO, AEO/GEO ve editoryal kalite açısından 100 üzerinden skorlar.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/content/yazilar';
const files = readdirSync(dir).filter((f) => f.endsWith('.md')).sort();

const sonuclar = files.map((file) => {
  const txt = readFileSync(join(dir, file), 'utf8');
  const fmMatch = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? txt.slice(fmMatch[0].length) : txt;

  const words = (body.replace(/<[^>]+>/g, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
  const h2 = (body.match(/^##\s+/gm) || []).length + (body.match(/<h2\b/gi) || []).length;
  const icLink = (body.match(/\]\(\/[^)]+\)/g) || []).length + (body.match(/href="https:\/\/657\.com\.tr/gi) || []).length;
  const desc = fm.match(/^description:\s*"([^"]*)"/m)?.[1] ?? '';
  const hasImg = /^gorsel:\s*"/m.test(fm);
  const hasKaynak = /^kaynak:\s*"/m.test(fm);
  const hasWp = /wp-block-paragraph|<p class="wp-/.test(body);
  const robotik = /ortak yönetim kaydından otomatik hazırlanmıştır|max\(0;/i.test(body);

  let skor = 0;
  if (words >= 300) skor += 25;
  else if (words >= 160) skor += 16;
  else if (words >= 80) skor += 8;
  if (h2 >= 2) skor += 20;
  else if (h2 === 1) skor += 10;
  if (icLink >= 2) skor += 15;
  else if (icLink === 1) skor += 8;
  if (desc.length >= 60 && desc.length <= 165) skor += 15;
  else if (desc.length >= 30) skor += 8;
  if (hasKaynak) skor += 10;
  if (hasImg) skor += 5;
  if (!hasWp && !robotik) skor += 10;

  return { file, skor, words, h2, icLink, hasImg, hasWp, robotik };
});

const ort = Math.round(sonuclar.reduce((a, b) => a + b.skor, 0) / sonuclar.length);
const mukemmel = sonuclar.filter((s) => s.skor >= 80).length;
const gelistirilmeli = sonuclar.filter((s) => s.skor < 60).length;

console.log(`Toplam yazı: ${sonuclar.length} | Ortalama skor: ${ort}/100 | 80+ skor: ${mukemmel} | <60 skor: ${gelistirilmeli}`);
console.log('En düşük 10 yazı:');
for (const s of [...sonuclar].sort((a, b) => a.skor - b.skor).slice(0, 10)) {
  console.log(`  ${String(s.skor).padStart(3)}/100  (${String(s.words).padStart(4)} kelime, H2:${s.h2}, link:${s.icLink})  ${s.file}`);
}
