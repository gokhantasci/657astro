export {};
// Kelime ve Hukuk Bulmacaları: 5 Harfli Günlük Kelime (Wordle-TR), Hukuk Kelime Tahmini ve 8x8 Kelime Avı

// Temiz, gerçek 5 harfli Türkçe kelimeler
const WORDLE_LISTE = [
  'KANUN', 'KARAR', 'HUKUK', 'HAKİM', 'SAVCI', 'KATİP', 'DELİL', 'TANIK', 'İHBAR', 'MEMUR',
  'KADRO', 'GÖREV', 'YETKİ', 'SİCİL', 'DOSYA', 'NOTER', 'VEKİL', 'YARGI', 'NİZAM', 'KURAL',
  'RESMİ', 'BELGE', 'EVRAK', 'RAPOR', 'MÜHÜR', 'SONUÇ', 'SINAV', 'ATAMA', 'NAKİL', 'TAYİN',
  'TARİH', 'BÜTÇE', 'VERGİ', 'BORDR', 'SENET', 'KEFİL', 'İFLAS', 'HACİZ', 'TEBLİ', 'ŞİKAY',
  'USULÜ', 'MADDİ', 'CEZAİ', 'İDARİ', 'HUKUK', 'YASAL', 'FİİLİ', 'KUSUR', 'KASIT', 'SUÇLU',
].filter((w, i, arr) => w.length === 5 && arr.indexOf(w) === i && !['BORDR', 'TEBLİ', 'ŞİKAY'].includes(w));

interface HukukSoru {
  kelime: string;
  ipucu: string;
}

const root = document.querySelector<HTMLElement>('[data-bulmaca-app]');
if (root) {
  const tabBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-bm-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-bm-panel]')];
  tabBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      const target = btn.dataset.bmTab;
      tabBtns.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      panels.forEach((p) => (p.hidden = p.dataset.bmPanel !== target));
    })
  );

  // 1. 5 HARFLİ KELİME (WORDLE-TR)
  const elWGrid = root.querySelector<HTMLElement>('[data-bm-w-grid]')!;
  const elWIn = root.querySelector<HTMLInputElement>('[data-bm-w-in]')!;
  const elWBtn = root.querySelector<HTMLButtonElement>('[data-bm-w-btn]')!;
  const elWYeni = root.querySelector<HTMLButtonElement>('[data-bm-w-yeni]')!;
  const elWDurum = root.querySelector<HTMLElement>('[data-bm-w-durum]')!;

  let wHedef = '';
  let wDenemeler: string[] = [];
  let wBitti = false;

  function wCiz() {
    elWGrid.innerHTML = '';
    for (let r = 0; r < 6; r++) {
      const row = document.createElement('div');
      row.className = 'bm-w-row';
      const kelime = wDenemeler[r] || '';
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement('span');
        cell.className = 'bm-w-cell';
        const ch = kelime[c] || '';
        cell.textContent = ch;
        if (kelime) {
          if (ch === wHedef[c]) cell.classList.add('is-ok');
          else if (wHedef.includes(ch)) cell.classList.add('is-near');
          else cell.classList.add('is-no');
        }
        row.append(cell);
      }
      elWGrid.append(row);
    }
  }

  function wBaslat(rastgele = false) {
    const gunIdx = Math.floor(Date.now() / 86400000) % WORDLE_LISTE.length;
    wHedef = rastgele
      ? WORDLE_LISTE[Math.floor(Math.random() * WORDLE_LISTE.length)]
      : WORDLE_LISTE[gunIdx];
    wDenemeler = [];
    wBitti = false;
    elWIn.value = '';
    elWIn.disabled = false;
    elWDurum.textContent = '5 harfli hukuk/kamu kelimesini 6 denemede bulun (Yeşil: doğru yer, Sarı: kelime içinde).';
    wCiz();
  }

  function wTahminEt() {
    if (wBitti) return;
    const g = elWIn.value.trim().toLocaleUpperCase('tr-TR');
    if (g.length !== 5) {
      elWDurum.textContent = 'Lütfen tam 5 harfli bir kelime girin.';
      return;
    }
    wDenemeler.push(g);
    elWIn.value = '';
    wCiz();
    if (g === wHedef) {
      wBitti = true;
      elWIn.disabled = true;
      elWDurum.textContent = `Tebrikler! "${wHedef}" kelimesini ${wDenemeler.length}. denemede buldunuz.`;
    } else if (wDenemeler.length >= 6) {
      wBitti = true;
      elWIn.disabled = true;
      elWDurum.textContent = `Haklarınız doldu. Doğru kelime: "${wHedef}".`;
    } else {
      elWDurum.textContent = `Kalan hak: ${6 - wDenemeler.length}`;
    }
  }

  elWBtn.addEventListener('click', wTahminEt);
  elWIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') wTahminEt();
  });
  elWYeni.addEventListener('click', () => wBaslat(true));
  wBaslat(false);

  // 2. HUKUK KELİME TAHMİNİ (SOZLUK.JSON VERİSİYLE)
  const elHIpucu = root.querySelector<HTMLElement>('[data-bm-h-ipucu]')!;
  const elHKelime = root.querySelector<HTMLElement>('[data-bm-h-kelime]')!;
  const elHHarfler = root.querySelector<HTMLElement>('[data-bm-h-harfler]')!;
  const elHDurum = root.querySelector<HTMLElement>('[data-bm-h-durum]')!;
  const elHYeni = root.querySelector<HTMLButtonElement>('[data-bm-h-yeni]')!;

  const HUKUK_SORULARI: HukukSoru[] = JSON.parse(
    root.querySelector<HTMLScriptElement>('[data-bm-sozluk]')?.textContent || '[]'
  );
  const ALFABE = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

  let hAktif: HukukSoru = HUKUK_SORULARI[0] ?? { kelime: 'İSTİNAF', ipucu: 'İlk derece mahkemesi kararlarına karşı bölge adliye mahkemesine yapılan kanun yolu başvurusu.' };
  let hAcilan = new Set<string>();
  let hHak = 7;

  function hCiz() {
    elHIpucu.textContent = hAktif.ipucu;
    const gorunum = hAktif.kelime
      .split('')
      .map((ch) => (ch === ' ' ? '  ' : hAcilan.has(ch) ? ch : '_'))
      .join(' ');
    elHKelime.textContent = gorunum;
    const bittiMi = hAktif.kelime.split('').every((ch) => ch === ' ' || hAcilan.has(ch));
    if (bittiMi) {
      elHDurum.textContent = `Tebrikler! Doğru terim: ${hAktif.kelime}`;
    } else if (hHak <= 0) {
      elHKelime.textContent = hAktif.kelime;
      elHDurum.textContent = `Haklarınız tükendi. Doğru terim: ${hAktif.kelime}`;
    } else {
      elHDurum.textContent = `Kalan yanlış tahmin hakkı: ${hHak}`;
    }
  }

  function hBaslat() {
    if (HUKUK_SORULARI.length) {
      hAktif = HUKUK_SORULARI[Math.floor(Math.random() * HUKUK_SORULARI.length)];
    }
    hAcilan = new Set();
    hHak = 7;
    elHHarfler.innerHTML = '';
    for (const harf of ALFABE) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bm-harf';
      b.textContent = harf;
      b.addEventListener('click', () => {
        if (hHak <= 0) return;
        b.disabled = true;
        if (hAktif.kelime.includes(harf)) {
          hAcilan.add(harf);
          b.classList.add('is-ok');
        } else {
          hHak--;
          b.classList.add('is-no');
        }
        hCiz();
      });
      elHHarfler.append(b);
    }
    hCiz();
  }
  elHYeni.addEventListener('click', hBaslat);
  hBaslat();

  // 3. 8x8 KELİME AVI (HUKUK & KAMU)
  const elAGrid = root.querySelector<HTMLElement>('[data-bm-a-grid]')!;
  const elAListe = root.querySelector<HTMLElement>('[data-bm-a-liste]')!;
  const elAYeni = root.querySelector<HTMLButtonElement>('[data-bm-a-yeni]')!;
  const AVI_KELIMELER = ['ADALET', 'KANUN', 'HAKİM', 'SAVCI', 'KATİP', 'DELİL', 'KARAR', 'MEMUR', 'YARGI', 'NOTER', 'DAVA', 'HARÇ'];

  function aviOlustur() {
    const N = 8;
    const grid: string[][] = Array.from({ length: N }, () => Array(N).fill(''));
    const secilen = [...AVI_KELIMELER].sort(() => Math.random() - 0.5).slice(0, 6);
    const yerlestirilen: { kelime: string; hucreler: string[]; bulundu: boolean }[] = [];

    for (const k of secilen) {
      let ok = false;
      for (let tries = 0; tries < 40 && !ok; tries++) {
        const yatay = Math.random() > 0.5;
        const r = Math.floor(Math.random() * (yatay ? N : N - k.length + 1));
        const c = Math.floor(Math.random() * (yatay ? N - k.length + 1 : N));
        let uyar = true;
        for (let i = 0; i < k.length; i++) {
          const cur = grid[yatay ? r : r + i][yatay ? c + i : c];
          if (cur && cur !== k[i]) { uyar = false; break; }
        }
        if (uyar) {
          const hucreler: string[] = [];
          for (let i = 0; i < k.length; i++) {
            const rr = yatay ? r : r + i;
            const cc = yatay ? c + i : c;
            grid[rr][cc] = k[i];
            hucreler.push(`${rr}-${cc}`);
          }
          yerlestirilen.push({ kelime: k, hucreler, bulundu: false });
          ok = true;
        }
      }
    }
    const dolgu = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!grid[r][c]) grid[r][c] = dolgu[Math.floor(Math.random() * dolgu.length)];
      }
    }

    const secili = new Set<string>();
    const bulunanHucre = new Set<string>();

    function guncelleListe() {
      elAListe.innerHTML = yerlestirilen
        .map((y) => `<span class="bm-avi-chip${y.bulundu ? ' is-ok' : ''}">${y.kelime}</span>`)
        .join('');
    }

    elAGrid.innerHTML = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const key = `${r}-${c}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bm-avi-cell';
        btn.dataset.pos = key;
        btn.textContent = grid[r][c];
        btn.addEventListener('click', () => {
          if (secili.has(key)) { secili.delete(key); btn.classList.remove('is-sel'); }
          else { secili.add(key); btn.classList.add('is-sel'); }
          for (const y of yerlestirilen) {
            if (!y.bulundu && y.hucreler.every((h) => secili.has(h))) {
              y.bulundu = true;
              y.hucreler.forEach((h) => {
                bulunanHucre.add(h);
                secili.delete(h);
                const el = elAGrid.querySelector<HTMLElement>(`[data-pos="${h}"]`);
                el?.classList.remove('is-sel');
                el?.classList.add('is-found');
              });
              guncelleListe();
            }
          }
        });
        elAGrid.append(btn);
      }
    }
    guncelleListe();
  }
  elAYeni.addEventListener('click', aviOlustur);
  aviOlustur();
}
