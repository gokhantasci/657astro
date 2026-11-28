// Mobil uyum denetimi: her sayfa şablonundan ve bütün araçlardan örnek adresleri dar ekranda açar,
// yatay taşmayı, kutusundan taşan/kırpılan metni ve çok küçük dokunma hedeflerini raporlar.
// Kullanım: node scripts/mobil-denetim.mjs [taban=http://127.0.0.1:4321] [genislik=360] [cikti.json]
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const TABAN = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const GENISLIK = Number(process.argv[3] || 360);
const CIKTI = process.argv[4] || '';
const GRUP_ORNEK = 4;

async function adresler() {
  const yollar = new Set(['/', '/araclar/', '/yazilar/', '/hesaplamalar/', '/iletisim/', '/olmayan-sayfa-denetim/']);
  const araclar = JSON.parse(readFileSync(new URL('../src/data/araclar.json', import.meta.url), 'utf8')).araclar;
  for (const t of araclar) if (t.tasindi && t.path) yollar.add(t.path);
  const dizin = await (await fetch(`${TABAN}/sitemap.xml`)).text();
  for (const harita of [...dizin.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])) {
    const yol = new URL(harita).pathname;
    const xml = await (await fetch(`${TABAN}${yol}`)).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    // Grubun başından, ortasından ve sonundan örnek: farklı şablon varyantları yakalansın.
    const secim = [0, 1, Math.floor(locs.length / 2), locs.length - 1].slice(0, GRUP_ORNEK).map((i) => locs[i]).filter(Boolean);
    secim.forEach((y) => yollar.add(y));
  }
  for (const y of ['/gys-app/', '/gys-app/sinavlar/', '/gys-app/konular/', '/gys-app/sorular/', '/gys-app/soru/t7201-01/', '/gys-app/konu/657-dmk/', '/gys-app/sinav/yazi-isleri-muduru/', '/gys-app/mulakat/', '/gys-app/canli-sinav/', '/gys-app/ilanlar/', '/gys-app/performans/', '/gys-app/studyo/', '/on-parmak-app/']) yollar.add(y);
  return [...yollar];
}

function olc() {
  const vw = window.innerWidth;
  const tanim = (el) => {
    const s = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + [...el.classList].slice(0, 3).map((c) => `.${c}`).join('');
    const ust = el.parentElement;
    return ust && ust !== document.body ? `${ust.tagName.toLowerCase()}${[...ust.classList].slice(0, 2).map((c) => `.${c}`).join('')} > ${s}` : s;
  };
  const gorunur = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const kaydirici = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };
  const gizliAtamasi = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.position === 'fixed' && (cs.transform !== 'none' || p.hidden)) return true;
      if (p.closest && p.closest('[hidden],[aria-hidden="true"],.skip,.sr-only,.visually-hidden,dialog:not([open])')) return true;
    }
    return false;
  };
  const tasan = new Map();
  const kirpik = new Map();
  const kucuk = new Map();
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'svg', 'path'].includes(el.tagName) || el.closest('svg')) continue;
    if (!gorunur(el) || gizliAtamasi(el)) continue;
    const r = el.getBoundingClientRect();
    const icinde = kaydirici(el);
    if (!icinde && (r.right > vw + 1 || r.left < -1) && r.width < vw * 3) {
      const k = tanim(el);
      if (!tasan.has(k)) tasan.set(k, Math.round(r.right - vw));
    }
    const cs = getComputedStyle(el);
    const metin = (el.textContent || '').trim();
    if (metin && !icinde && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && !['auto', 'scroll'].includes(cs.overflowX)) {
      const kesik = cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis';
      // İçerik kutudan taşıyorsa (görünür taşma) ya da kesiliyorsa
      const k = tanim(el);
      if (!kirpik.has(k)) kirpik.set(k, `${kesik ? 'kesik' : 'taşan'} ${el.scrollWidth}/${el.clientWidth} "${metin.slice(0, 40).replace(/\s+/g, ' ')}"`);
    }
    if (['A', 'BUTTON', 'INPUT', 'SELECT', 'SUMMARY', 'LABEL'].includes(el.tagName) && !(el.tagName === 'INPUT' && ['hidden', 'checkbox', 'radio'].includes(el.type))) {
      if ((r.height < 24 || r.width < 24) && !(el.tagName === 'A' && el.closest('p,li,td,dd'))) {
        const k = tanim(el);
        if (!kucuk.has(k)) kucuk.set(k, `${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
  }
  return {
    sayfaTasma: document.documentElement.scrollWidth - vw,
    tasan: [...tasan].slice(0, 12),
    kirpik: [...kirpik].slice(0, 15),
    kucuk: [...kucuk].slice(0, 10),
  };
}

const liste = await adresler();
const tarayici = await chromium.launch({ channel: 'msedge' });
const baglam = await tarayici.newContext({ viewport: { width: GENISLIK, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const sonuc = {};
let sira = 0;
async function isci() {
  const sayfa = await baglam.newPage();
  while (sira < liste.length) {
    const yol = liste[sira++];
    try {
      await sayfa.goto(TABAN + yol, { waitUntil: 'load', timeout: 90000 });
      await sayfa.waitForTimeout(600);
      sonuc[yol] = await sayfa.evaluate(olc);
    } catch (e) {
      sonuc[yol] = { hata: String(e).slice(0, 160) };
    }
  }
  await sayfa.close();
}
await Promise.all([isci(), isci(), isci()]);
await tarayici.close();

const sorunlu = Object.entries(sonuc).filter(([, v]) => v.hata || v.sayfaTasma > 1 || v.tasan?.length || v.kirpik?.length || v.kucuk?.length);
if (CIKTI) writeFileSync(CIKTI, JSON.stringify(sonuc, null, 1));
console.log(`${liste.length} adres, ${GENISLIK}px · sorunlu: ${sorunlu.length} · sayfa taşması: ${sorunlu.filter(([, v]) => v.sayfaTasma > 1).length}`);
for (const [yol, v] of sorunlu) {
  if (v.hata) { console.log(`\n${yol}  HATA ${v.hata}`); continue; }
  console.log(`\n${yol}  taşma=${v.sayfaTasma}`);
  for (const [k, d] of v.tasan) console.log(`  ⇥ ${k} (+${d}px)`);
  for (const [k, d] of v.kirpik) console.log(`  ✂ ${k} ${d}`);
  for (const [k, d] of v.kucuk) console.log(`  · ${k} ${d}`);
}
