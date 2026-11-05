import { defineConfig } from 'astro/config';
import {archiveSalaryBuild} from './scripts/archive-unvan-build.mjs';
import {hataSayfalariniHazirla} from './scripts/hata-sayfalari.mjs';
import {paylasimPlugin, devMiddlewareKur} from './scripts/paylasim-yollari.mjs';
import {kirikBaglantilar} from './scripts/seo-denetim/kirik-baglanti.mjs';
import {ogGorselleriniUret} from './scripts/og-gorselleri.mjs';
import {fileURLToPath} from 'node:url';
export default defineConfig({
 site: 'https://657.com.tr',
 base: process.env.BASE_PATH || '/',
 output: 'static',
 trailingSlash: 'always',
 build: { format: 'directory', inlineStylesheets: 'auto' },
 devToolbar: { enabled: false },
 // Dosya araçlarının gecikmeli importları sonradan yeniden optimizasyon başlatmasın.
 // Böylece açık geliştirme sekmesinde XLSX/UDF/Word yüklemesi eski hash ile 504 almaz.
 vite: { optimizeDeps: { include: ['xlsx','fflate','docx','@mlc-ai/web-llm'] }, plugins: [paylasimPlugin()] },
 integrations: [{name:'657-maas-arsivi',hooks:{
  'astro:server:setup': ({server}) => devMiddlewareKur(server),
  'astro:build:done':async({dir})=>{await archiveSalaryBuild(dir);await hataSayfalariniHazirla(dir);
  // Sayfaya özel paylaşım görselleri (yol haritası P2-3); yalnız dist/og/ altında üretilir.
  await ogGorselleriniUret(fileURLToPath(dir));
  // Kırık iç bağlantı yayına çıkmasın (yol haritası P0-4).
  const kirik=kirikBaglantilar(fileURLToPath(dir));if(kirik.length)throw new Error(`${kirik.length} kırık iç bağlantı: `+kirik.slice(0,10).map(k=>`${k.hedef} ← ${k.kaynaklar[0]}`).join('; '));}}}],
});
