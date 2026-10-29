import { normalize } from '../lib/normalize';
import './tablo';
import './secim';
import './tarih';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const azHareket = matchMedia('(prefers-reduced-motion: reduce)');

// ── Masa: işaretlenen araçlar yalnızca bu tarayıcıda tutulur ──
const MASA_KEY = '657:masa';
let masa: string[] = [];
try { masa = JSON.parse(localStorage.getItem(MASA_KEY) ?? '[]'); } catch { masa = []; }
if (!Array.isArray(masa)) masa = [];

function masaKaydet() {
  try { localStorage.setItem(MASA_KEY, JSON.stringify(masa)); } catch { /* gizli pencere: oturum içinde çalışmaya devam eder */ }
}
function masaGuncelle() {
  $$<HTMLButtonElement>('[data-pin]').forEach(btn => {
    const on = masa.includes(btn.dataset.pin!);
    const ad = btn.getAttribute('aria-label')!.split(':')[0];
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', `${ad}: ${on ? 'masadan çıkar' : 'masaya ekle'}`);
    btn.title = on ? 'Masadan çıkar' : 'Masaya ekle';
  });
  $$('[data-masa-count]').forEach(el => { el.textContent = String(masa.length); });
  document.dispatchEvent(new CustomEvent('masa'));
}
document.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-pin]');
  if (!btn) return;
  const id = btn.dataset.pin!;
  masa = masa.includes(id) ? masa.filter(x => x !== id) : [id, ...masa];
  masaKaydet();
  masaGuncelle();
});

// ── Çerez tercihi: seçim yapılana kadar şerit görünür; analitik çerezler yalnızca "Kabul et" ile açılır ──
const cerez = $('[data-cerez]');
if (cerez) {
  let secim: string | null = null;
  try { secim = localStorage.getItem('657:cerez'); } catch { /* depolama kapalı: şerit her sayfada sorar */ }
  cerez.hidden = secim === 'kabul' || secim === 'ret';
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  $$<HTMLButtonElement>('[data-cerez-secim]', cerez).forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.cerezSecim!;
    try { localStorage.setItem('657:cerez', v); } catch { /* bu sayfada geçerli */ }
    g?.('consent', 'update', { analytics_storage: v === 'kabul' ? 'granted' : 'denied' });
    cerez.hidden = true;
  }));
  $('[data-cerez-ac]')?.addEventListener('click', () => { cerez.hidden = false; $('button', cerez)?.focus(); });
}

// ── Geri sayım şeridi: sayaçlar 10 saniyede bir sırayla gösterilir; kapatılırsa bu oturumda gizli kalır ──
const sayac = $('[data-sayac]');
if (sayac) {
  const liste: { baslik: string; an: number }[] = JSON.parse($('[data-sayac-veri]', sayac)!.textContent!);
  const baslik = $('[data-sayac-baslik]', sayac)!;
  const kalan = $('[data-sayac-kalan]', sayac)!;
  let kapali = false;
  try { kapali = sessionStorage.getItem('657:sayac') === '1'; } catch { /* depolama kapalı */ }
  let sira = 0;
  let zamanlayici = 0;
  const yaz = () => {
    const etkin = liste.filter(s => s.an > Date.now());
    if (kapali || !etkin.length) { sayac.hidden = true; clearInterval(zamanlayici); return; }
    const s = etkin[sira % etkin.length];
    const fark = Math.floor((s.an - Date.now()) / 1000);
    const g = Math.floor(fark / 86400), sa = Math.floor(fark % 86400 / 3600), dk = Math.floor(fark % 3600 / 60), sn = fark % 60;
    baslik.textContent = s.baslik;
    kalan.textContent = `${g} gün ${sa} saat ${dk} dakika ${sn} saniye kaldı`;
    sayac.hidden = false;
  };
  let tik = 0;
  zamanlayici = window.setInterval(() => { if (++tik % 10 === 0) sira++; yaz(); }, 1000);
  yaz();
  $('[data-sayac-kapat]', sayac)!.addEventListener('click', () => {
    kapali = true;
    try { sessionStorage.setItem('657:sayac', '1'); } catch { /* oturum içinde gizli kalır */ }
    yaz();
  });
}

// ── Arama sıralaması: başlık başı > başlık içi > anahtar kelime ──
function puan(row: HTMLElement, terimler: string[]) {
  const metin = row.dataset.search ?? '';
  if (!terimler.every(t => metin.includes(t))) return -1;
  const baslik = normalize(row.querySelector('a')?.textContent ?? '');
  const ilk = terimler[0];
  return baslik.startsWith(ilk) ? 3 : baslik.includes(ilk) ? 2 : 1;
}
const terimlereAyir = (v: string) => normalize(v.trim()).split(/\s+/).filter(Boolean);

// ── Anasayfa haberleri: kaynağa göre süz ──
const haber = $('[data-news]');
if (haber) {
  const radios = $$<HTMLInputElement>('[data-news-filter] input', haber);
  const items = $$('[data-kaynak]', haber);
  const more = $<HTMLButtonElement>('[data-news-more]', haber);
  let acik = false;
  const uygula = () => {
    const kaynak = radios.find(r => r.checked)?.value ?? '';
    // Kaynak seçiliyken o kaynağın bütün haberleri gösterilir.
    items.forEach(li => { li.hidden = kaynak ? li.dataset.kaynak !== kaynak : !acik && li.dataset.fazla !== undefined; });
    if (more) more.hidden = acik || Boolean(kaynak);
  };
  radios.forEach(r => r.addEventListener('change', uygula));
  more?.addEventListener('click', () => {
    acik = true;
    uygula();
    items.find(li => li.dataset.fazla !== undefined)?.querySelector('a')?.focus();
  });
  uygula();
}

// ── Araç dizini ──
const dir = $('[data-dir]');
if (dir) {
  const input = $<HTMLInputElement>('[data-dir-input]', dir)!;
  const radios = $$<HTMLInputElement>('[data-dir-filter] input', dir);
  const rows = $$('[data-row]', dir);
  const groups = $$('[data-group]', dir);
  const status = $('[data-dir-status]', dir)!;
  const empty = $('[data-dir-empty]', dir)!;
  const emptyText = $('[data-dir-empty-text]', dir)!;

  const params = new URLSearchParams(location.search);
  input.value = params.get('q') ?? '';
  const alanParam = params.get('alan') ?? '';
  radios.forEach(r => { r.checked = r.value === alanParam; });
  if (!radios.some(r => r.checked)) radios[0].checked = true;

  const uygula = () => {
    const terimler = terimlereAyir(input.value);
    const alan = radios.find(r => r.checked)?.value ?? '';
    let n = 0;
    rows.forEach(r => {
      const grup = r.closest<HTMLElement>('[data-group]')!.dataset.group!;
      const ok = (alan === '' || alan === grup || (alan === 'masa' && masa.includes(r.dataset.id!))) && puan(r, terimler) >= 0;
      r.hidden = !ok;
      if (ok) n++;
    });
    groups.forEach(g => { g.hidden = !$$('[data-row]', g).some(r => !r.hidden); });
    status.textContent = n === rows.length ? `${n} aracın tamamı listeleniyor.` : `${rows.length} araçtan ${n} tanesi listeleniyor.`;
    empty.hidden = n > 0;
    if (!n) emptyText.textContent = alan === 'masa' && !terimler.length
      ? 'Masanız boş. Bir aracın satırındaki iğneye basın; araç burada toplanır.'
      : 'Bu aramaya uyan araç yok. Daha kısa bir kelime deneyin ya da alan seçimini kaldırın.';
    const q = new URLSearchParams();
    if (input.value.trim()) q.set('q', input.value.trim());
    if (alan) q.set('alan', alan);
    history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}${location.hash}`);
  };
  input.addEventListener('input', uygula);
  radios.forEach(r => r.addEventListener('change', uygula));
  document.addEventListener('masa', uygula);
  $('[data-dir-form]', dir)!.addEventListener('submit', e => e.preventDefault());
  // Satırın herhangi bir yerine tıklamak aracı açar; iğne düğmesi, bağlantının kendisi ve metin seçimi hariç.
  dir.addEventListener('click', e => {
    const t = e.target as Element;
    if (t.closest('a, button, input, label')) return;
    if (getSelection()?.toString()) return;
    const a = t.closest('[data-row]')?.querySelector<HTMLAnchorElement>('th a');
    if (!a) return;
    if (e instanceof MouseEvent && (e.ctrlKey || e.metaKey)) open(a.href, '_blank');
    else a.click();
  });
  $('[data-dir-clear]', dir)!.addEventListener('click', () => { input.value = ''; radios[0].checked = true; uygula(); input.focus(); });
  uygula();
  if (location.hash === '#ara') input.focus();
}

// ── Hukuk sözlüğü araması: indeks ilk odaklanmada bir kez indirilir ──
const sozluk = $('[data-sozluk]');
if (sozluk) {
  const input = $<HTMLInputElement>('[data-sozluk-input]', sozluk)!;
  const liste = $('[data-sozluk-sonuc]', sozluk)!;
  const status = $('[data-sozluk-status]', sozluk)!;
  type Kayit = [string, string, string];
  let indeks: { k: Kayit; n: string }[] | null = null;
  let yukleniyor: Promise<void> | null = null;
  const yukle = () => yukleniyor ??= fetch('/hukuk-sozlugu/ara.json')
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((d: Kayit[]) => { indeks = d.map(k => ({ k, n: normalize(k[0]) })); })
    .catch(() => { yukleniyor = null; status.textContent = 'Sözlük yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.'; });

  const satir = ([terim, slug, anlam]: Kayit) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/kelime/${slug}/`;
    const s = document.createElement('strong'); s.textContent = terim;
    const p = document.createElement('span'); p.textContent = anlam;
    a.append(s, p); li.append(a);
    return li;
  };
  const ara = async () => {
    const q = input.value.trim();
    const url = new URL(location.href);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    if (!q) { liste.hidden = true; liste.replaceChildren(); status.textContent = ''; return; }
    if (!indeks) { status.textContent = 'Sözlük yükleniyor…'; await yukle(); }
    if (!indeks || input.value.trim() !== q) return;
    const n = normalize(q);
    const bas = indeks.filter(x => x.n.startsWith(n));
    const ic = indeks.filter(x => !x.n.startsWith(n) && x.n.includes(n));
    const sonuc = [...bas, ...ic].map(x => x.k);
    liste.replaceChildren(...sonuc.slice(0, 40).map(satir));
    liste.hidden = sonuc.length === 0;
    status.textContent = sonuc.length
      ? `${sonuc.length} terim bulundu${sonuc.length > 40 ? ', ilk 40 tanesi gösteriliyor' : ''}.`
      : `“${q}” için terim bulunamadı. Daha kısa yazmayı ya da harf dizinini deneyin.`;
  };
  input.addEventListener('focus', () => { void yukle(); }, { once: true });
  input.addEventListener('input', () => { void ara(); });
  $('[data-sozluk-form]', sozluk)!.addEventListener('submit', e => {
    e.preventDefault();
    const ilk = liste.querySelector('a');
    if (ilk && input.value.trim()) location.href = ilk.href;
  });
  const q = new URLSearchParams(location.search).get('q');
  if (q) { input.value = q; void ara(); }
}

masaGuncelle();

// ── Açık / koyu tema: seçim yoksa sistem tercihi geçerlidir ──
const temaBtn = $<HTMLButtonElement>('[data-tema]');
if (temaBtn) {
  const sistemKoyu = matchMedia('(prefers-color-scheme: dark)');
  const etkin = () => document.documentElement.dataset.theme ?? (sistemKoyu.matches ? 'dark' : 'light');
  const etiket = () => temaBtn.setAttribute('aria-label', etkin() === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç');
  temaBtn.addEventListener('click', () => {
    const yeni = etkin() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = yeni;
    try { localStorage.setItem('657:tema', yeni); } catch { /* seçim bu oturumda geçerli kalır */ }
    etiket();
  });
  sistemKoyu.addEventListener('change', etiket);
  etiket();
}

// ── "/" kısayolu ve menüdeki arama düğmesi ──
const aramaKutusu = () => $<HTMLInputElement>('[data-dir-input]');
function aramayaGit() {
  const kutu = aramaKutusu();
  if (!kutu) { location.href = '/araclar/#ara'; return; }
  kutu.scrollIntoView({ block: 'center', behavior: azHareket.matches ? 'auto' : 'smooth' });
  kutu.focus({ preventScroll: true });
}
$('[data-ara]')?.addEventListener('click', e => { if (aramaKutusu()) { e.preventDefault(); aramayaGit(); } });
document.addEventListener('keydown', e => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target as HTMLElement;
  if (t.closest('input, textarea, select, [contenteditable]')) return;
  e.preventDefault();
  aramayaGit();
});

// ── Aşağı kaydırınca gizlenen, yukarı kaydırınca dönen menü ──
const bar = $('[data-bar]');
if (bar) {
  let son = scrollY;
  let bekliyor = false;
  addEventListener('scroll', () => {
    if (bekliyor) return;
    bekliyor = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      const icinde = bar.contains(document.activeElement) || bar.querySelector('details[open]');
      bar.classList.toggle('is-hidden', y > son && y > 160 && !icinde);
      bar.classList.toggle('is-scrolled', y > 8);
      son = y;
      bekliyor = false;
    });
  }, { passive: true });
}

// ── Excel aktif hücresi: imleç boş zeminde gezerken hücreye oturur ──
const hucre = $('.cell-cursor');
if (hucre && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const css = getComputedStyle(document.documentElement);
  const w = parseFloat(css.getPropertyValue('--cell-w')) || 72;
  const h = parseFloat(css.getPropertyValue('--cell-h')) || 24;
  const DOLU = '[data-solid], a, button, input, label, summary, p, h1, h2, h3, li, table, kbd, nav, .bar, .footer, .btn';
  let zaman = 0;
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || (e.target as Element).closest(DOLU)) { hucre.classList.remove('is-on'); return; }
    const x = Math.floor(e.pageX / w) * w;
    const y = Math.floor(e.pageY / h) * h;
    hucre.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    hucre.classList.add('is-on');
    clearTimeout(zaman);
    zaman = window.setTimeout(() => hucre.classList.remove('is-on'), 900);
  }, { passive: true });
  document.addEventListener('pointerleave', () => hucre.classList.remove('is-on'));
}
