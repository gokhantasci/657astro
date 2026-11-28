import { normalize } from '../lib/normalize';
import { yerelYol } from '../lib/site-yolu';

type AracKaydi = { t: string; h: string; k: string; d: string; kw: string };
type IcerikSatir = [string, string, string, string, string];
type Oneri = { tur: string; baslik: string; yol: string; ozet: string; dis?: boolean; nBaslik: string; nTam: string; oncelik: number };

const form = document.querySelector<HTMLFormElement>('[data-home-arama-form]');
const input = document.querySelector<HTMLInputElement>('#portal-ara');
const liste = document.querySelector<HTMLElement>('[data-home-arama-liste]');
if (form && input && liste) {
  // Araç önerileri ilk HTML'i büyütmesin diye ayrı uçtan ilk odakta yüklenir (pages/araclar/oneri.json.ts).
  let aracOnerileri: Oneri[] = [];
  let aracYukleniyor: Promise<void> | null = null;
  const araclariYukle = () =>
    (aracYukleniyor ??= fetch(yerelYol('/araclar/oneri.json'))
      .then((r) => (r.ok ? (r.json() as Promise<AracKaydi[]>) : []))
      .then((ham) => {
        aracOnerileri = ham.map((a) => ({
          tur: a.k || 'Araç',
          baslik: a.t,
          yol: a.h,
          ozet: a.d,
          dis: /^https?:\/\//.test(a.h),
          nBaslik: normalize(a.t),
          nTam: normalize(`${a.t} ${a.k} ${a.d} ${a.kw}`),
          oncelik: 2,
        }));
      })
      .catch(() => {
        aracYukleniyor = null;
      }));

  let icerikOnerileri: Oneri[] | null = null;
  let yukleniyor: Promise<void> | null = null;
  const diziniYukle = () =>
    (yukleniyor ??= fetch(yerelYol('/araclar/arama.json'))
      .then((r) => (r.ok ? (r.json() as Promise<IcerikSatir[]>) : []))
      .then((rows) => {
        icerikOnerileri = rows.map((s) => ({
          tur: s[0],
          baslik: s[1],
          yol: yerelYol(s[2]),
          ozet: s[3] || '',
          nBaslik: normalize(s[1]),
          nTam: normalize(`${s[1]} ${s[3]} ${s[4]}`),
          oncelik: s[0] === 'Yazılar' ? 1 : 0,
        }));
      })
      .catch(() => {
        yukleniyor = null;
      }));

  let aktifIdx = -1;
  let sonSorgu = '';

  function kapat() {
    liste!.hidden = true;
    input!.setAttribute('aria-expanded', 'false');
    aktifIdx = -1;
  }

  function skorla(o: Oneri, terimler: string[], tam: string): number {
    if (!terimler.every((t) => o.nTam.includes(t))) return -1;
    let s = o.oncelik * 10;
    if (o.nBaslik.startsWith(tam)) s += 40;
    else if (terimler.every((t) => o.nBaslik.includes(t))) s += 25;
    else if (terimler.some((t) => o.nBaslik.includes(t))) s += 10;
    return s;
  }

  function ciz(q: string) {
    const temiz = q.trim();
    const tam = normalize(temiz);
    const terimler = tam.split(/\s+/).filter((t) => t.length > 0);
    if (!terimler.length) {
      kapat();
      return;
    }

    const aracEslesen = aracOnerileri
      .map((o) => ({ o, s: skorla(o, terimler, tam) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map((x) => x.o);

    const gorulenYollar = new Set(aracEslesen.map((x) => x.yol));
    const icerikEslesen =
      temiz.length >= 2 && icerikOnerileri
        ? icerikOnerileri
            .map((o) => ({ o, s: skorla(o, terimler, tam) }))
            .filter((x) => x.s >= 0 && !gorulenYollar.has(x.o.yol))
            .sort((a, b) => b.s - a.s)
            .slice(0, 5)
            .map((x) => x.o)
        : [];

    const birlesik = [...aracEslesen, ...icerikEslesen].slice(0, 8);
    liste!.replaceChildren();
    aktifIdx = -1;

    if (!birlesik.length) {
      const bos = document.createElement('div');
      bos.className = 'portal-oneri__bos';
      bos.textContent = icerikOnerileri ? 'Eşleşen öneri bulunamadı — tüm dizinde aramak için Enter’a basın.' : 'İçerik dizini aranıyor…';
      liste!.append(bos);
    } else {
      for (const item of birlesik) {
        const a = document.createElement('a');
        a.className = 'portal-oneri__oge';
        a.href = item.yol;
        a.setAttribute('role', 'option');
        if (item.dis) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        const rozet = document.createElement('span');
        rozet.className = 'portal-oneri__tur';
        rozet.textContent = item.tur;

        const ic = document.createElement('span');
        ic.className = 'portal-oneri__ic';
        const baslik = document.createElement('strong');
        baslik.textContent = item.baslik + (item.dis ? ' ↗' : '');
        ic.append(baslik);
        if (item.ozet) {
          const oz = document.createElement('small');
          oz.textContent = item.ozet.length > 95 ? item.ozet.slice(0, 94) + '…' : item.ozet;
          ic.append(oz);
        }
        a.append(rozet, ic);
        liste!.append(a);
      }
    }

    const tumu = document.createElement('a');
    tumu.className = 'portal-oneri__tumu';
    tumu.href = `/araclar/?q=${encodeURIComponent(temiz)}`;
    tumu.setAttribute('role', 'option');
    tumu.textContent = `“${temiz}” için tüm sonuçları gör →`;
    liste!.append(tumu);

    liste!.hidden = false;
    input!.setAttribute('aria-expanded', 'true');
  }

  async function guncelle() {
    const q = input!.value;
    sonSorgu = q;
    if (!aracOnerileri.length) {
      await araclariYukle();
      if (sonSorgu !== q) return;
    }
    ciz(q);
    if (q.trim().length >= 2 && !icerikOnerileri) {
      await diziniYukle();
      if (sonSorgu === q && document.activeElement === input) ciz(q);
    }
  }

  function odakla(yeniIdx: number) {
    const ogeler = [...liste!.querySelectorAll<HTMLAnchorElement>('[role="option"]')];
    if (!ogeler.length) return;
    aktifIdx = ((yeniIdx % ogeler.length) + ogeler.length) % ogeler.length;
    ogeler.forEach((el, i) => {
      const secili = i === aktifIdx;
      el.classList.toggle('is-aktif', secili);
      el.setAttribute('aria-selected', String(secili));
      if (secili) el.scrollIntoView({ block: 'nearest' });
    });
  }

  input.addEventListener('focus', () => {
    void diziniYukle();
    void araclariYukle().then(() => {
      if (input.value.trim() && document.activeElement === input) ciz(input.value);
    });
  });
  input.addEventListener('input', () => {
    void guncelle();
  });
  input.addEventListener('keydown', (e) => {
    if (liste.hidden) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      odakla(aktifIdx + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      odakla(aktifIdx <= 0 ? -1 : aktifIdx - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      kapat();
    } else if (e.key === 'Enter' && aktifIdx >= 0) {
      const secili = liste.querySelectorAll<HTMLAnchorElement>('[role="option"]')[aktifIdx];
      if (secili) {
        e.preventDefault();
        if (secili.target === '_blank') window.open(secili.href, '_blank', 'noopener');
        else location.href = secili.href;
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!form.contains(e.target as Node)) kapat();
  });
}
