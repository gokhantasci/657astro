import { normalize } from '../lib/normalize';

// Yazılardaki uzun tablolar: satır araması ve sayfalama. Sayfa boyu ayarlar.json → site.tablo_sayfa_boyu (<html data-tablo-boyu>).
// Betik yoksa tablo olduğu gibi, bütün satırlarıyla görünür.
const ARAMA_ESIGI = 15;
const boyut = Number(document.documentElement.dataset.tabloBoyu) || 50;
let sayac = 0;

function basliklar(tablo: HTMLTableElement) {
  if (tablo.tHead) return new Set<HTMLTableRowElement>();
  // thead yoksa yalnızca th hücrelerinden oluşan ilk satırlar başlıktır ve her sayfada görünür.
  const s = new Set<HTMLTableRowElement>();
  for (const tr of tablo.tBodies[0]?.rows ?? []) {
    if ([...tr.cells].every(c => c.tagName === 'TH')) s.add(tr); else break;
  }
  return s;
}

function kur(tablo: HTMLTableElement) {
  const sabit = basliklar(tablo);
  const satirlar = [...tablo.tBodies].flatMap(b => [...b.rows]).filter(r => !sabit.has(r));
  if (satirlar.length < ARAMA_ESIGI) return;
  const id = `tablo-${++sayac}`;
  tablo.id ||= id;
  const metin = satirlar.map(r => normalize(r.textContent ?? ''));

  const arac = document.createElement('div');
  arac.className = 'tablo-arac';
  arac.innerHTML = `<label class="visually-hidden" for="${id}-ara">Tabloda ara</label>
   <input id="${id}-ara" type="search" placeholder="Tabloda ara" autocomplete="off" spellcheck="false" aria-controls="${tablo.id}"/>
   <p class="tablo-arac__durum" role="status"></p>`;
  const input = arac.querySelector('input')!;
  const durum = arac.querySelector('p')!;
  const sayfaNav = document.createElement('nav');
  sayfaNav.className = 'tablo-sayfa';
  sayfaNav.setAttribute('aria-label', 'Tablo sayfaları');
  tablo.before(arac);
  tablo.after(sayfaNav);

  let sayfa = 1;
  const goster = () => {
    const terimler = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    const uyan = satirlar.filter((_, i) => terimler.every(t => metin[i].includes(t)));
    const toplamSayfa = Math.max(1, Math.ceil(uyan.length / boyut));
    sayfa = Math.min(sayfa, toplamSayfa);
    const gorunen = new Set(uyan.slice((sayfa - 1) * boyut, sayfa * boyut));
    satirlar.forEach(r => { r.hidden = !gorunen.has(r); });
    const ilk = uyan.length ? (sayfa - 1) * boyut + 1 : 0;
    durum.textContent = uyan.length === 0
      ? `“${input.value.trim()}” için satır bulunamadı.`
      : `${satirlar.length} satırdan ${uyan.length === satirlar.length ? '' : `${uyan.length} uyan, `}${ilk}–${ilk + gorunen.size - 1} arası gösteriliyor.`;
    sayfaNav.replaceChildren();
    sayfaNav.hidden = toplamSayfa < 2;
    if (toplamSayfa < 2) return;
    const dugme = (etiket: string, hedef: number, aktif = false, pasif = false) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = etiket; b.disabled = pasif;
      if (aktif) b.setAttribute('aria-current', 'page');
      b.setAttribute('aria-label', etiket === '‹' ? 'Önceki sayfa' : etiket === '›' ? 'Sonraki sayfa' : `${hedef}. sayfa`);
      b.addEventListener('click', () => { sayfa = hedef; goster(); tablo.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      return b;
    };
    sayfaNav.append(dugme('‹', sayfa - 1, false, sayfa === 1));
    // Uzun listede ilk, son ve geçerli sayfanın çevresi gösterilir.
    let onceki = 0;
    for (let n = 1; n <= toplamSayfa; n++) {
      if (n !== 1 && n !== toplamSayfa && Math.abs(n - sayfa) > 2) continue;
      if (n - onceki > 1) { const s = document.createElement('span'); s.textContent = '…'; s.setAttribute('aria-hidden', 'true'); sayfaNav.append(s); }
      sayfaNav.append(dugme(String(n), n, n === sayfa));
      onceki = n;
    }
    sayfaNav.append(dugme('›', sayfa + 1, false, sayfa === toplamSayfa));
  };
  let bekle = 0;
  input.addEventListener('input', () => { clearTimeout(bekle); bekle = window.setTimeout(() => { sayfa = 1; goster(); }, 120); });
  goster();
}

document.querySelectorAll<HTMLTableElement>('.prose table, table[data-tablo]').forEach(kur);
