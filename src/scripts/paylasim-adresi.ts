// Paylaşılabilir hesap adresi: /<araç>/<seçim>/<seçim>/…
// Alanlar DOM sırasıyla okunur; varsayılandan farklı olanlar okunur bir yol parçasına çevrilir.
// Aynı adres açıldığında parçalar alanlara geri yazılır ve araç betiği kendi input/change dinleyicileriyle hesaplar.
// Araç betikleri alanlara isteğe bağlı ipuçları ekleyebilir:
//   data-paylas-anahtarsiz      → parça yalnız değerdir (ör. unvan: yazi-isleri-muduru, derece: 3-1)
//   data-paylas-kalip="{}-yil"  → parça kalıba göre yazılır (16-yil)
//   data-paylas-degerler='{"1":["sendika-uyesi"],"0":["sendikasiz"]}' → değer başına parça; ilk ad yazılır, diğerleri de okunur
//   data-paylas-her-zaman       → varsayılan değerde de adrese yazılır
//   data-paylas-disi            → alan (ya da kapsayıcısı) adrese katılmaz
// Sayfa başlığı: main[data-paylas-baslik] varsa o, yoksa aracın başlığı ve seçimler.

type Alan = HTMLInputElement | HTMLSelectElement;

const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
export const slug = (s: string) => s.toLocaleLowerCase('tr-TR').normalize('NFC').replace(/[çğıiöşüâîû]/g, c => TR[c] ?? c)
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9,.]+/g, '-').replace(/^-+|-+$/g, '');
const sade = (s: string) => slug(s).replace(/-/g, '');
const anahtar = (el: Alan) => el.dataset.paylasAd || (el.name || el.id).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const main = document.querySelector<HTMLElement>('main[data-paylas-kok]');
if (main) document.addEventListener('DOMContentLoaded', () => setTimeout(() => baslat(main)), { once: true });

function baslat(main: HTMLElement) {
  const kok = main.dataset.paylasKok!;
  const kap = main.querySelector<HTMLElement>('.arac') ?? main;
  const alanlar = (): Alan[] => [...kap.querySelectorAll<Alan>('input, select')].filter(el => {
    // Aramalı seçim kutusunun (scripts/secim.ts) metin girişi asıl select'in kopyasıdır.
    if (el.closest('[data-paylas-disi]') || el.disabled || el.classList.contains('secim__giris') || el.getAttribute('role') === 'combobox') return false;
    if (el instanceof HTMLInputElement && ['file', 'hidden', 'button', 'submit', 'reset', 'password', 'image'].includes(el.type)) return false;
    // Site araması gibi bağımsız arama kutuları adrese girmez; araç formundaki arama alanları (ör. posta kodu) girer.
    if (el instanceof HTMLInputElement && el.type === 'search' && el.closest('[role=search]')) return false;
    return Boolean(el.name || el.id);
  });
  if (!alanlar().length) return;
  const ilkBaslik = document.title;
  const h1 = main.querySelector('h1')?.textContent?.trim() ?? '';

  const etiket = (el: Alan) => el instanceof HTMLSelectElement ? (el.selectedOptions[0]?.textContent ?? '').trim() : el.value.trim();
  const degerler = (el: Alan): Record<string, string[]> => { try { return JSON.parse(el.dataset.paylasDegerler || '{}'); } catch { return {}; } };
  const deger = (el: Alan) => el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio') ? (el.checked ? '1' : '0') : el.value;

  /** Alanın şu anki değerinin yol parçası. */
  function parca(el: Alan): string | null {
    const v = deger(el), harita = degerler(el)[v];
    if (harita?.length) return harita[0];
    if (el instanceof HTMLInputElement && el.type === 'checkbox') return el.checked ? anahtar(el) : `${anahtar(el)}-yok`;
    const metin = el instanceof HTMLInputElement && el.type === 'radio' ? (el.labels?.[0]?.textContent ?? el.value) : etiket(el);
    const s = slug(metin);
    if (!s) return null;
    if (el.dataset.paylasKalip) return el.dataset.paylasKalip.replace('{}', s);
    if ('paylasAnahtarsiz' in el.dataset) return s;
    return `${anahtar(el)}-${s}`;
  }

  // Açılıştaki değerler varsayılan kabul edilir; yalnız değişenler adrese yazılır.
  const ilk = new Map<Alan, string>();
  const anlik = () => { for (const el of alanlar()) if (!ilk.has(el)) ilk.set(el, deger(el)); };
  anlik();

  // ── Adresteki seçimleri uygula ──
  const yol = decodeURIComponent(location.pathname);
  const parcalar = yol.startsWith(kok) ? yol.slice(kok.length).split('/').filter(Boolean).map(sade) : [];
  if (parcalar.length) {
    const kullanildi = new Set<number>();
    const ata = (el: Alan, v: string) => {
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) el.checked = v === '1';
      else el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const bul = (adaylar: { ad: string; v: string }[]): { i: number; v: string } | null => {
      for (let i = 0; i < parcalar.length; i++) {
        if (kullanildi.has(i)) continue;
        for (const a of adaylar) {
          const s = sade(a.ad);
          if (parcalar[i] === s) { kullanildi.add(i); return { i, v: a.v }; }
          // "3/1" gibi iki parçaya bölünmüş değerler: /3/1/
          if (i + 1 < parcalar.length && !kullanildi.has(i + 1) && parcalar[i] + parcalar[i + 1] === s) { kullanildi.add(i); kullanildi.add(i + 1); return { i, v: a.v }; }
        }
      }
      return null;
    };
    const islenen = new Set<Alan>();
    // Bağımlı alanlar (ör. unvana göre değişen koşul seçenekleri) için her atamadan sonra liste yeniden okunur.
    for (let tur = 0; tur < 200; tur++) {
      const el = alanlar().find(e => !islenen.has(e));
      if (!el) break;
      islenen.add(el);
      if (el instanceof HTMLInputElement && el.type === 'radio' && islenen.size && [...islenen].some(e => e !== el && e instanceof HTMLInputElement && e.type === 'radio' && e.name === el.name)) continue;
      const harita = degerler(el);
      const ekle = (v: string, ad: string) => [...(harita[v] ?? []).map(h => ({ ad: h, v })), { ad, v }];
      let adaylar: { ad: string; v: string }[] = [];
      if (el instanceof HTMLSelectElement) {
        adaylar = [...el.options].filter(o => !o.disabled && o.value !== '').flatMap(o => {
          const s = slug(o.textContent ?? '');
          const ad = el.dataset.paylasKalip ? el.dataset.paylasKalip.replace('{}', s) : 'paylasAnahtarsiz' in el.dataset ? s : `${anahtar(el)}-${s}`;
          return ekle(o.value, ad);
        });
      } else if (el.type === 'checkbox') adaylar = [...ekle('1', anahtar(el)), ...ekle('0', `${anahtar(el)}-yok`)];
      else if (el.type === 'radio') {
        adaylar = [...kap.querySelectorAll<HTMLInputElement>(`input[type=radio][name="${CSS.escape(el.name)}"]`)].flatMap(r => ekle(r.value, `${anahtar(r)}-${slug(r.labels?.[0]?.textContent ?? r.value)}`));
        const r = bul(adaylar);
        if (r) { const hedef = kap.querySelector<HTMLInputElement>(`input[type=radio][name="${CSS.escape(el.name)}"][value="${CSS.escape(r.v)}"]`); if (hedef) ata(hedef, '1'); }
        continue;
      } else {
        // Metin, sayı ve tarih: anahtar-değer ya da kalıp. Değer adresteki biçimiyle (virgül, nokta, tarih) yazılır.
        const kalip = el.dataset.paylasKalip ?? ('paylasAnahtarsiz' in el.dataset ? '{}' : `${anahtar(el)}-{}`);
        const [on, son = ''] = kalip.split('{}').map(slug);
        const ham = yol.slice(kok.length).split('/').filter(Boolean);
        for (let i = 0; i < ham.length; i++) {
          if (kullanildi.has(i)) continue;
          const p = slug(ham[i]);
          const bas = on ? on + '-' : '', bit = son ? '-' + son : '';
          if (!(on || son) || !p.startsWith(bas) || !p.endsWith(bit) || p.length <= bas.length + bit.length) continue;
          const v = p.slice(bas.length, p.length - bit.length);
          const sayi = /^-?\d+([.,]\d+)*$/.test(v), tarih = /^\d{4}-\d{2}-\d{2}$/.test(v);
          if (el.type === 'number' && !sayi) continue;
          if (el.type === 'date' && !tarih) continue;
          kullanildi.add(i);
          ata(el, el.type === 'number' ? v.replace(',', '.') : v);
          break;
        }
        continue;
      }
      const r = bul(adaylar);
      if (r) ata(el, r.v);
    }
  }

  // ── Seçimleri adrese ve başlığa yaz ──
  let zaman = 0, yazildi = false;
  function yaz() {
    yazildi = true;
    anlik();
    const gorulen = new Set<string>(), out: string[] = [];
    for (const el of alanlar()) {
      if (el instanceof HTMLInputElement && el.type === 'radio') { if (gorulen.has(el.name) || !el.checked) continue; gorulen.add(el.name); }
      const degisti = ilk.get(el) !== deger(el) || 'paylasHerZaman' in el.dataset;
      if (el instanceof HTMLInputElement && el.type === 'radio' && ![...kap.querySelectorAll<HTMLInputElement>(`input[type=radio][name="${CSS.escape(el.name)}"]`)].some(r => ilk.get(r) !== deger(r))) continue;
      if (!degisti) continue;
      const p = parca(el);
      if (p) out.push(p);
    }
    const yeni = kok + (out.length ? out.join('/') + '/' : '');
    const sorgu = new URLSearchParams(location.search);
    for (const el of alanlar()) for (const ad of [el.name, el.id]) if (ad) sorgu.delete(ad);
    sorgu.delete('donem'); sorgu.delete('unvan');
    const adres = yeni + (sorgu.size ? '?' + sorgu : '') + location.hash;
    if (adres !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', adres);
    const ozel = main.dataset.paylasBaslik?.trim();
    document.title = !out.length ? ilkBaslik : `${ozel || `${h1}: ${out.slice(0, 4).map(s => s.replace(/-/g, ' ')).join(', ')}`} | 657.com.tr`;
  }
  const planla = () => { clearTimeout(zaman); zaman = window.setTimeout(yaz, 250); };
  kap.addEventListener('input', planla);
  kap.addEventListener('change', planla);
  kap.addEventListener('reset', () => setTimeout(yaz, 50));
  // Araç betiği başlığı hesaplamadan sonra güncellerse adres ve başlık da güncellensin.
  new MutationObserver(() => { if (yazildi) planla(); }).observe(main, { attributes: true, attributeFilter: ['data-paylas-baslik'] });
  // Düz araç adresiyle açılışta adres çubuğu değişmez; ilk değişiklikte ya da paylaşılan adreste yazılır.
  if (parcalar.length) yaz();

  // ── Bağlantıyı kopyala ──
  // Düğme sonuç kartının altına ayrı satır olarak eklenir; sonuç kartı yoksa ilk kart başlığına.
  const sonuc = main.querySelector<HTMLElement>('.sonuc');
  let yer: Element | null = null;
  if (sonuc) { const satir = document.createElement('div'); satir.className = 'sonuc__paylas'; sonuc.append(satir); yer = satir; }
  else yer = main.querySelector('.panel__head');
  if (yer && navigator.clipboard) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn--quiet btn--kucuk paylas-dugme'; b.textContent = 'Bağlantıyı kopyala';
    const durum = document.createElement('span'); durum.className = 'visually-hidden'; durum.setAttribute('role', 'status');
    b.addEventListener('click', async () => {
      yaz();
      try { await navigator.clipboard.writeText(location.href); b.textContent = 'Kopyalandı'; durum.textContent = 'Bağlantı panoya kopyalandı.'; }
      catch { b.textContent = 'Kopyalanamadı'; durum.textContent = 'Bağlantı kopyalanamadı; adres çubuğundaki adresi kullanın.'; }
      setTimeout(() => { b.textContent = 'Bağlantıyı kopyala'; }, 2000);
    });
    yer.append(b, durum);
  }
}
