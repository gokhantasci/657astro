// Dar ekran kuralı ezilmesi denetimi: @media (max-width) içindeki bir bildirim, aynı dosyada daha sonra
// aynı seçici ve aynı özellikle medya dışında yeniden yazılmışsa mobil kural hiç uygulanmaz.
// Kullanım: node scripts/mobil-css-sirasi.mjs  (bulgu varsa çıkış kodu 1)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

const kok = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const dosyalar = [];
(function gez(d) {
  for (const a of readdirSync(d)) {
    const y = join(d, a);
    if (statSync(y).isDirectory()) gez(y);
    else if (/\.(css|astro)$/.test(a)) dosyalar.push(y);
  }
})(kok);

const bulgular = [];
for (const dosya of dosyalar) {
  const ham = readFileSync(dosya, 'utf8');
  const bloklar = dosya.endsWith('.css') ? [ham] : [...ham.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  for (const css of bloklar) {
    let kok2;
    try { kok2 = postcss.parse(css); } catch { continue; }
    const mobil = new Map(); // "seçici|özellik" -> sıra
    let sira = 0;
    kok2.walkDecls((d) => {
      sira++;
      const kural = d.parent;
      if (!kural || kural.type !== 'rule') return;
      const medya = kural.parent?.type === 'atrule' && kural.parent.name === 'media' ? kural.parent.params : '';
      for (const secici of kural.selectors) {
        const anahtar = `${secici.trim()}|${d.prop}`;
        if (/max-width/.test(medya)) mobil.set(anahtar, { sira, medya });
        else if (!medya && mobil.has(anahtar)) {
          bulgular.push(`${dosya.replace(kok, 'src/')}: "${secici.trim()}" { ${d.prop} } → ${mobil.get(anahtar).medya} kuralını eziyor`);
          mobil.delete(anahtar);
        }
      }
    });
  }
}
for (const b of bulgular) console.log(b);
console.log(`${dosyalar.length} dosya tarandı, ${bulgular.length} ezilen mobil kural.`);
process.exitCode = bulgular.length ? 1 : 0;
