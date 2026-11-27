type MulakatKaydi = { id: string; s: string; c: string; m: number };

const STORE_KEY = '657:gys-mulakat-durum:v1';

function durumOku(): { bildim: string[]; tekrar: string[] } {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      bildim: Array.isArray(raw.bildim) ? raw.bildim : [],
      tekrar: Array.isArray(raw.tekrar) ? raw.tekrar : [],
    };
  } catch {
    return { bildim: [], tekrar: [] };
  }
}

function durumKaydet(d: { bildim: string[]; tekrar: string[] }) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(d));
  } catch { /* geç */ }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

export function mulakatPaneliniBagla(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>('[data-gys-panel="mulakat"]');
  if (!panel) return { yukle: () => {} };

  const elAra = panel.querySelector<HTMLInputElement>('[data-mul-ara]');
  const elListe = panel.querySelector<HTMLElement>('[data-mul-liste]');
  const elSayi = panel.querySelector<HTMLElement>('[data-mul-sayi]');
  const elDaha = panel.querySelector<HTMLButtonElement>('[data-mul-daha]');
  const elCekBtn = panel.querySelector<HTMLButtonElement>('[data-mul-cek]');
  const elKartAlan = panel.querySelector<HTMLElement>('[data-mul-kart-alan]');
  const elBildimSayi = panel.querySelector<HTMLElement>('[data-mul-bildim-sayi]');
  const elTekrarSayi = panel.querySelector<HTMLElement>('[data-mul-tekrar-sayi]');
  const filtreler = Array.from(panel.querySelectorAll<HTMLButtonElement>('[data-mul-filtre]'));

  let veriler: MulakatKaydi[] | null = null;
  let yukleniyor = false;
  let filtre: 'tumu' | 'mulakat' | 'tekrar' | 'bildim' = 'tumu';
  let limit = 25;
  const durum = durumOku();
  const bildimSet = new Set(durum.bildim);
  const tekrarSet = new Set(durum.tekrar);

  function kaydet() {
    durumKaydet({ bildim: [...bildimSet], tekrar: [...tekrarSet] });
    if (elBildimSayi) elBildimSayi.textContent = String(bildimSet.size);
    if (elTekrarSayi) elTekrarSayi.textContent = String(tekrarSet.size);
  }

  async function yukle() {
    if (veriler || yukleniyor) return;
    yukleniyor = true;
    if (elListe) elListe.innerHTML = '<p class="gys-ipucu">Mülakat soruları yükleniyor…</p>';
    try {
      const r = await fetch('/veri/gys-mulakat.json', { cache: 'force-cache', signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw Error();
      veriler = (await r.json()) as MulakatKaydi[];
      kaydet();
      ciz();
    } catch {
      if (elListe) elListe.innerHTML = '<p class="gys-ipucu">Mülakat soruları yüklenemedi. Sayfayı yenileyip tekrar deneyin.</p>';
    } finally {
      yukleniyor = false;
    }
  }

  function komisyonCek() {
    if (!veriler || !elKartAlan) return;
    const havuz = veriler.filter((x) => x.m === 1);
    const secim = (havuz.length >= 3 ? havuz : veriler)
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    elKartAlan.hidden = false;
    elKartAlan.innerHTML = `<div class="mul-komisyon">
      <div class="mul-komisyon__ust">
        <strong>🎲 3 Soruluk Sözlü Mülakat Komisyonu Simülasyonu</strong>
        <button type="button" class="btn btn--quiet btn--kucuk" data-mul-kapat>Kapat</button>
      </div>
      ${secim
        .map(
          (q, i) => `<article class="mul-kart" data-mul-id="${esc(q.id)}">
            <div class="mul-kart__no">Soru ${i + 1} / 3</div>
            <h3>${esc(q.s)}</h3>
            <details class="mul-kart__cevap">
              <summary class="btn btn--quiet btn--kucuk">Cevabı Göster</summary>
              <p>${esc(q.c)}</p>
              <div class="mul-kart__eylem">
                <button type="button" class="btn btn--kucuk" data-mul-isaret="bildim" data-id="${esc(q.id)}">✓ Bildim</button>
                <button type="button" class="btn btn--quiet btn--kucuk" data-mul-isaret="tekrar" data-id="${esc(q.id)}">↻ Tekrar Et</button>
              </div>
            </details>
          </article>`,
        )
        .join('')}
    </div>`;

    elKartAlan.querySelector('[data-mul-kapat]')?.addEventListener('click', () => {
      elKartAlan.hidden = true;
    });
    elKartAlan.querySelectorAll<HTMLButtonElement>('[data-mul-isaret]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id || '';
        if (btn.dataset.mulIsaret === 'bildim') {
          bildimSet.add(id);
          tekrarSet.delete(id);
          btn.textContent = '✓ Kaydedildi';
        } else {
          tekrarSet.add(id);
          bildimSet.delete(id);
          btn.textContent = '↻ Tekrar Listesinde';
        }
        kaydet();
      });
    });
  }

  function ciz() {
    if (!veriler || !elListe) return;
    const q = (elAra?.value || '').trim().toLocaleLowerCase('tr-TR');
    const eslesen = veriler.filter((x) => {
      if (filtre === 'mulakat' && x.m !== 1) return false;
      if (filtre === 'tekrar' && !tekrarSet.has(x.id)) return false;
      if (filtre === 'bildim' && !bildimSet.has(x.id)) return false;
      if (q && !(x.s + ' ' + x.c).toLocaleLowerCase('tr-TR').includes(q)) return false;
      return true;
    });
    if (elSayi) elSayi.textContent = `${eslesen.length.toLocaleString('tr-TR')} soru`;
    if (!eslesen.length) {
      elListe.innerHTML = '<p class="gys-ipucu">Seçili filtre veya aramaya uyan mülakat sorusu bulunamadı.</p>';
      if (elDaha) elDaha.hidden = true;
      return;
    }
    const parca = eslesen.slice(0, limit);
    elListe.innerHTML = parca
      .map((x) => {
        const b = bildimSet.has(x.id);
        const t = tekrarSet.has(x.id);
        return `<details class="mul-satir${b ? ' is-bildim' : t ? ' is-tekrar' : ''}">
          <summary>
            <span>${esc(x.s)}</span>
            ${x.m ? '<em class="mul-rozet">Mülakat</em>' : ''}
          </summary>
          <div class="mul-satir__ic">
            <p>${esc(x.c)}</p>
            <div class="mul-kart__eylem">
              <button type="button" class="btn btn--kucuk" data-mul-l-isaret="bildim" data-id="${esc(x.id)}">${b ? '✓ Bildim' : 'Bildim'}</button>
              <button type="button" class="btn btn--quiet btn--kucuk" data-mul-l-isaret="tekrar" data-id="${esc(x.id)}">${t ? '↻ Tekrar Listesinde' : 'Tekrar Et'}</button>
            </div>
          </div>
        </details>`;
      })
      .join('');

    elListe.querySelectorAll<HTMLButtonElement>('[data-mul-l-isaret]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id || '';
        if (btn.dataset.mulLIsaret === 'bildim') {
          bildimSet.add(id);
          tekrarSet.delete(id);
        } else {
          tekrarSet.add(id);
          bildimSet.delete(id);
        }
        kaydet();
        ciz();
      });
    });

    if (elDaha) {
      elDaha.hidden = eslesen.length <= limit;
      elDaha.textContent = `Daha fazla göster (${Math.min(limit, eslesen.length)} / ${eslesen.length})`;
    }
  }

  elAra?.addEventListener('input', () => {
    limit = 25;
    ciz();
  });
  elDaha?.addEventListener('click', () => {
    limit += 30;
    ciz();
  });
  elCekBtn?.addEventListener('click', async () => {
    await yukle();
    komisyonCek();
  });
  filtreler.forEach((b) => {
    b.addEventListener('click', () => {
      filtre = (b.dataset.mulFiltre as typeof filtre) || 'tumu';
      limit = 25;
      filtreler.forEach((x) => {
        const a = x === b;
        x.classList.toggle('btn--quiet', !a);
        x.setAttribute('aria-pressed', String(a));
      });
      ciz();
    });
  });

  kaydet();
  return { yukle };
}
