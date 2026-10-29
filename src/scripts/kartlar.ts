// Çıkmış mülakat soruları: hatırlatma kartları. Veri /cikmis-mulakat-sorulari/kartlar.json'dan bir kez iner.
type Kart = [slug: string, soru: string, cevap: string, mulakat: 0 | 1, okunma: number];

const kok = document.querySelector<HTMLElement>('[data-kartlar]');
if (kok) {
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => kok.querySelector<T>(sel)!;
  const kart = $('[data-kart]');
  const on = $('[data-kart-on]');
  const arka = $('[data-kart-arka]');
  const soruEl = $('[data-kart-soru]');
  const cevapEl = $('[data-kart-cevap]');
  const duyuru = $('[data-kart-duyuru]');
  const geriBtn = $<HTMLButtonElement>('[data-kart-geri]');
  const cevirBtn = $<HTMLButtonElement>('[data-kart-cevir]');
  const ileriBtn = $<HTMLButtonElement>('[data-kart-ileri]');
  const otoCevir = $<HTMLInputElement>('[data-kart-otocevir]');
  const oynat = $<HTMLInputElement>('[data-kart-oynat]');
  const aralik = $<HTMLSelectElement>('[data-kart-aralik]');
  const ses = $<HTMLInputElement>('[data-kart-ses]');
  const boyutEl = $('[data-kart-boyut]');
  const okunanEl = $('[data-kart-okunan]');
  const sayfaLink = $<HTMLAnchorElement>('[data-kart-sayfa]');
  const okunmaEl = $('[data-kart-okunma]');
  const tamEkranBtn = $<HTMLButtonElement>('[data-kart-tamekran]');
  const filtreler = [...kok.querySelectorAll<HTMLInputElement>('[data-kart-filtre] input')];

  // Tercihler ve okunan kartlar yalnızca bu tarayıcıda tutulur.
  const oku = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
  const yaz = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* gizli pencere */ } };
  let okunan = new Set<string>();
  try { okunan = new Set(JSON.parse(oku('657:kart-okunan') ?? '[]')); } catch { okunan = new Set(); }
  let boyut = Number(oku('657:kart-yazi')) || 100;
  otoCevir.checked = oku('657:kart-otocevir') === '1';
  ses.checked = oku('657:kart-ses') === '1';
  aralik.value = oku('657:kart-aralik') ?? aralik.value;

  let hepsi: Kart[] = [];
  let deste: Kart[] = [];
  let sira = 0;
  let cevrik = false;
  let cevirZamani = 0;
  let oynatZamani = 0;
  const sayi = new Intl.NumberFormat('tr-TR');

  const karistir = <T,>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  let sesBaglam: AudioContext | null = null;
  const bip = () => {
    if (!ses.checked) return;
    try {
      sesBaglam ??= new AudioContext();
      const osc = sesBaglam.createOscillator();
      const kazanc = sesBaglam.createGain();
      osc.frequency.value = 660;
      kazanc.gain.value = 0.04;
      osc.connect(kazanc).connect(sesBaglam.destination);
      osc.start();
      osc.stop(sesBaglam.currentTime + 0.08);
    } catch { /* ses desteklenmiyor */ }
  };

  const boyutUygula = () => {
    kart.style.setProperty('--kart-olcek', String(boyut / 100));
    boyutEl.textContent = `${boyut}%`;
  };

  const zamanlayicilar = () => {
    clearTimeout(cevirZamani);
    clearTimeout(oynatZamani);
    if (!deste.length) return;
    if (otoCevir.checked && !cevrik) cevirZamani = window.setTimeout(() => cevir(true), 3000);
    if (oynat.checked) oynatZamani = window.setTimeout(() => git(1), Number(aralik.value) * 1000);
  };

  const ciz = () => {
    const k = deste[sira];
    if (!k) return;
    soruEl.textContent = k[1];
    cevapEl.textContent = k[2];
    cevrik = false;
    kart.classList.remove('is-cevrik');
    arka.setAttribute('aria-hidden', 'true');
    on.removeAttribute('aria-hidden');
    cevirBtn.setAttribute('aria-pressed', 'false');
    geriBtn.disabled = sira === 0;
    ileriBtn.disabled = sira >= deste.length - 1;
    sayfaLink.href = `/${k[0]}/`;
    if (okunmaEl) okunmaEl.textContent = k[4] ? `${k[4].toLocaleString('tr-TR')} kez okundu` : '';
    duyuru.textContent = `Kart ${sayi.format(sira + 1)} / ${sayi.format(deste.length)}: ${k[1]}`;
    const url = new URL(location.href);
    url.searchParams.set('kart', k[0]);
    history.replaceState(null, '', url);
    zamanlayicilar();
  };

  function cevir(otomatik = false) {
    const k = deste[sira];
    if (!k) return;
    cevrik = !cevrik;
    kart.classList.toggle('is-cevrik', cevrik);
    arka.toggleAttribute('aria-hidden', !cevrik);
    on.toggleAttribute('aria-hidden', cevrik);
    cevirBtn.setAttribute('aria-pressed', String(cevrik));
    if (cevrik) {
      duyuru.textContent = `Cevap: ${k[2]}`;
      if (!okunan.has(k[0])) {
        okunan.add(k[0]);
        yaz('657:kart-okunan', JSON.stringify([...okunan]));
        okunanEl.textContent = sayi.format(okunan.size);
      }
    }
    bip();
    if (!otomatik) zamanlayicilar();
  }

  function git(adim: number) {
    const yeni = sira + adim;
    if (yeni < 0) return;
    if (yeni >= deste.length) {
      // Deste bitince yeniden karıştırıp baştan başlar.
      deste = karistir([...deste]);
      sira = 0;
    } else sira = yeni;
    bip();
    ciz();
  }

  const desteKur = (baslangic?: string | null) => {
    const filtre = filtreler.find(f => f.checked)?.value ?? 'tum';
    deste = karistir(hepsi.filter(k => filtre === 'tum' || k[3] === 1));
    sira = 0;
    if (baslangic) {
      const i = deste.findIndex(k => k[0] === baslangic);
      if (i > 0) [deste[0], deste[i]] = [deste[i], deste[0]];
    }
    ciz();
  };

  kart.addEventListener('click', () => cevir());
  cevirBtn.addEventListener('click', () => cevir());
  geriBtn.addEventListener('click', () => git(-1));
  ileriBtn.addEventListener('click', () => git(1));
  filtreler.forEach(f => f.addEventListener('change', () => desteKur()));
  otoCevir.addEventListener('change', () => { yaz('657:kart-otocevir', otoCevir.checked ? '1' : '0'); zamanlayicilar(); });
  oynat.addEventListener('change', zamanlayicilar);
  aralik.addEventListener('change', () => { yaz('657:kart-aralik', aralik.value); zamanlayicilar(); });
  ses.addEventListener('change', () => yaz('657:kart-ses', ses.checked ? '1' : '0'));
  $('[data-kart-kucult]').addEventListener('click', () => { boyut = Math.max(70, boyut - 10); yaz('657:kart-yazi', String(boyut)); boyutUygula(); });
  $('[data-kart-buyut]').addEventListener('click', () => { boyut = Math.min(180, boyut + 10); yaz('657:kart-yazi', String(boyut)); boyutUygula(); });

  const tamEkranMi = () => document.fullscreenElement === kok;
  const tamEkran = () => (tamEkranMi() ? document.exitFullscreen() : kok.requestFullscreen()).catch(() => {});
  if (!document.fullscreenEnabled) tamEkranBtn.hidden = true;
  tamEkranBtn.addEventListener('click', tamEkran);
  document.addEventListener('fullscreenchange', () => { tamEkranBtn.textContent = tamEkranMi() ? 'Tam ekrandan çık' : 'Tam ekran'; });

  // Klavye: ← → gezinir, boşluk ya da Enter çevirir, F tam ekran. Yazı alanlarında devre dışı.
  document.addEventListener('keydown', e => {
    const t = e.target as HTMLElement;
    if (!deste.length || e.ctrlKey || e.metaKey || e.altKey || t.closest('input, select, textarea, a, [contenteditable]')) return;
    if (t.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); git(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); git(-1); }
    else if (e.key === ' ' && (kok.contains(t) || t === document.body)) { e.preventDefault(); cevir(); }
    else if (e.key.toLowerCase() === 'f') tamEkran();
  });

  // Görünmezken otomatik oynatma durur.
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(cevirZamani); clearTimeout(oynatZamani); } else zamanlayicilar(); });

  okunanEl.textContent = sayi.format(okunan.size);
  boyutUygula();
  fetch('/cikmis-mulakat-sorulari/kartlar.json')
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((d: Kart[]) => {
      hepsi = d;
      [geriBtn, cevirBtn, ileriBtn].forEach(b => { b.disabled = false; });
      desteKur(new URLSearchParams(location.search).get('kart'));
    })
    .catch(() => { soruEl.textContent = 'Kartlar yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin; aşağıdaki listeden de sorulara ulaşabilirsiniz.'; });
}
