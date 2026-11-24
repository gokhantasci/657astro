import type { GysSoru } from '../lib/gys-motor';

export interface GysKonu {
  no: string;
  id: string;
  grup: 'ortak' | 'alan';
  ad: string;
  kisa: string;
  kanun: string;
  bolumler: string[];
  mevzuatUrl: string;
}

const KONU_KEY = '657:gys-konu-tamam:v1';
const KAYIT_KEY = '657:gys-kayitli:v1';
const BUGUN_KEY = '657:gys-bugun:v1';
const OTO_KEY = '657:gys-otomatik:v1';

function bugunTarih(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function tamamlananKonularOku(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KONU_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function tamamlananKonularKaydet(set: Set<string>): void {
  try {
    localStorage.setItem(KONU_KEY, JSON.stringify([...set]));
  } catch { /* geç */ }
}

export function kayitliSorularOku(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KAYIT_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function kayitliSorularKaydet(set: Set<string>): void {
  try {
    localStorage.setItem(KAYIT_KEY, JSON.stringify([...set]));
  } catch { /* geç */ }
}

export function bugunCozulenOku(): number {
  try {
    const raw = JSON.parse(localStorage.getItem(BUGUN_KEY) || '{}') as { tarih?: string; adet?: number };
    return raw.tarih === bugunTarih() && typeof raw.adet === 'number' ? raw.adet : 0;
  } catch {
    return 0;
  }
}

export function bugunCozulenArtir(): number {
  const yeni = bugunCozulenOku() + 1;
  try {
    localStorage.setItem(BUGUN_KEY, JSON.stringify({ tarih: bugunTarih(), adet: yeni }));
  } catch { /* geç */ }
  return yeni;
}

export function otomatikGecisOku(): boolean {
  try {
    return localStorage.getItem(OTO_KEY) === '1';
  } catch {
    return false;
  }
}

export function otomatikGecisKaydet(v: boolean): void {
  try {
    localStorage.setItem(OTO_KEY, v ? '1' : '0');
  } catch { /* geç */ }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

export function konularPaneliniBagla(
  root: HTMLElement,
  konular: GysKonu[],
  tumSorular: GysSoru[],
  onKonuCoz: (konu: GysKonu, havuz: GysSoru[]) => void,
) {
  const elListe = root.querySelector<HTMLElement>('[data-gys-konu-liste]');
  const elAra = root.querySelector<HTMLInputElement>('[data-gys-konu-ara]');
  const elOzet = root.querySelector<HTMLElement>('[data-gys-konu-ozet]');
  const elBar = root.querySelector<HTMLElement>('[data-gys-konu-bar]');
  const elTamamSayi = root.querySelector<HTMLElement>('[data-gys-konu-tamam-sayi]');
  const elKalanSayi = root.querySelector<HTMLElement>('[data-gys-konu-kalan-sayi]');
  const elUstKonu = root.querySelector<HTMLElement>('[data-gys-ust-konu]');
  const filtreButonlar = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-gys-konu-filtre]'));

  let filtre: 'tumu' | 'ortak' | 'alan' | 'kalan' | 'tamam' = 'tumu';
  let arama = '';
  const tamam = tamamlananKonularOku();

  function konuHavuzu(k: GysKonu): GysSoru[] {
    const bolumSet = new Set(k.bolumler);
    const tam = tumSorular.filter((s) => bolumSet.has(s.bolum));
    if (tam.length >= 5) return tam;
    const kanunlu = tumSorular.filter((s) => s.kanun === k.kanun);
    return kanunlu.length ? kanunlu : tumSorular;
  }

  function ustOzetGuncelle() {
    const toplam = konular.length;
    const biten = konular.filter((k) => tamam.has(k.id)).length;
    const kalan = toplam - biten;
    const yuzde = toplam ? Math.round((biten / toplam) * 100) : 0;
    if (elOzet) elOzet.textContent = `${toplam} konudan ${biten} tanesini tamamladın (%${yuzde})`;
    if (elBar) elBar.style.width = `${yuzde}%`;
    if (elTamamSayi) elTamamSayi.textContent = String(biten);
    if (elKalanSayi) elKalanSayi.textContent = String(kalan);
    if (elUstKonu) elUstKonu.textContent = `${biten} / ${toplam}`;
  }

  function ciz() {
    ustOzetGuncelle();
    if (!elListe) return;
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    const gorunen = konular.filter((k) => {
      if (filtre === 'ortak' && k.grup !== 'ortak') return false;
      if (filtre === 'alan' && k.grup !== 'alan') return false;
      if (filtre === 'tamam' && !tamam.has(k.id)) return false;
      if (filtre === 'kalan' && tamam.has(k.id)) return false;
      if (q && !`${k.no} ${k.ad} ${k.kisa}`.toLocaleLowerCase('tr-TR').includes(q)) return false;
      return true;
    });

    if (!gorunen.length) {
      elListe.innerHTML = '<p class="gys-ipucu">Aramanıza veya seçili filtreye uyan konu bulunamadı.</p>';
      return;
    }

    elListe.innerHTML = gorunen
      .map((k) => {
        const bitti = tamam.has(k.id);
        const havuzSayi = konuHavuzu(k).length;
        return `<article class="gys-konu-kart${bitti ? ' is-tamam' : ''}" data-konu-id="${esc(k.id)}">
          <div class="gys-konu-kart__ust">
            <span class="gys-konu-no num">${esc(k.no)}</span>
            <span class="gys-konu-grup gys-konu-grup--${k.grup}">${k.grup === 'ortak' ? 'Ortak' : 'Alan'}</span>
            <span class="gys-konu-sayi num">${havuzSayi} soru</span>
            <label class="gys-konu-cek" title="Konuyu tamamladım olarak işaretle">
              <input type="checkbox" data-konu-toggle="${esc(k.id)}" ${bitti ? 'checked' : ''} />
              <span>${bitti ? 'Tamamlandı' : 'İşaretle'}</span>
            </label>
          </div>
          <h3>${esc(k.ad)}</h3>
          <div class="gys-konu-kart__alt">
            <button type="button" class="btn btn--kucuk" data-konu-coz="${esc(k.id)}">Bu Konudan Çöz →</button>
            <a href="${esc(k.mevzuatUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn--quiet btn--kucuk">Mevzuat.gov.tr ↗</a>
          </div>
        </article>`;
      })
      .join('');

    elListe.querySelectorAll<HTMLInputElement>('[data-konu-toggle]').forEach((chk) => {
      chk.addEventListener('change', () => {
        const id = chk.dataset.konuToggle || '';
        if (!id) return;
        if (chk.checked) tamam.add(id);
        else tamam.delete(id);
        tamamlananKonularKaydet(tamam);
        ciz();
      });
    });

    elListe.querySelectorAll<HTMLButtonElement>('[data-konu-coz]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.konuCoz || '';
        const konu = konular.find((x) => x.id === id);
        if (!konu) return;
        onKonuCoz(konu, konuHavuzu(konu));
      });
    });
  }

  elAra?.addEventListener('input', () => {
    arama = elAra.value;
    ciz();
  });

  filtreButonlar.forEach((b) => {
    b.addEventListener('click', () => {
      filtre = (b.dataset.gysKonuFiltre as typeof filtre) || 'tumu';
      filtreButonlar.forEach((x) => {
        const aktif = x === b;
        x.classList.toggle('btn--quiet', !aktif);
        x.setAttribute('aria-pressed', aktif ? 'true' : 'false');
      });
      ciz();
    });
  });

  ciz();
  return { yenile: ciz };
}
