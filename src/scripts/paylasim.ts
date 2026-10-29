import { hukumMetni } from '../lib/paylasim';
import { sayiOku } from '../lib/bicim';

const kok = document.querySelector<HTMLElement>('[data-paylasim]');
if (kok) {
  const $ = <T extends Element = HTMLElement>(s: string) => kok.querySelector<T>(s)!;
  const liste = $('[data-p-taraflar]');
  const hukum = $('[data-p-hukum]');
  const kopyala = $<HTMLButtonElement>('[data-p-kopyala]');
  const BOS = hukum.textContent!;
  const oranBicim = new Intl.NumberFormat('tr-TR', { style: 'percent', maximumFractionDigits: 2 });

  const taraflar = () => [...liste.querySelectorAll<HTMLElement>('[data-p-taraf]')].map((li, i) => ({
    li,
    ad: li.querySelector<HTMLInputElement>('[data-p-ad]')!.value.trim() || `Şirket ${i + 1}`,
    miktar: Math.max(0, sayiOku(li.querySelector<HTMLInputElement>('[data-p-miktar]')!.value) || 0),
  }));
  const guncelle = () => {
    const t = taraflar();
    const k = { yargilama: 0, vekalet: 0, harc: 0 } as Record<'yargilama' | 'vekalet' | 'harc', number>;
    kok.querySelectorAll<HTMLInputElement>('[data-p-kalem]').forEach(i => { k[i.dataset.pKalem as keyof typeof k] = Math.max(0, sayiOku(i.value) || 0); });
    const taban = t.reduce((a, x) => a + x.miktar, 0);
    t.forEach(x => { x.li.querySelector('[data-p-oran]')!.textContent = taban > 0 && x.miktar > 0 ? oranBicim.format(x.miktar / taban) : ''; });
    const metin = hukumMetni(k, t);
    hukum.textContent = metin || BOS;
    kopyala.disabled = !metin;
  };

  let sayac = liste.children.length;
  $('[data-p-ekle]').addEventListener('click', () => {
    sayac++;
    const ilk = liste.querySelector('[data-p-taraf]')!;
    const yeni = ilk.cloneNode(true) as HTMLElement;
    yeni.querySelector('.taraf__no')!.textContent = String(sayac);
    yeni.querySelectorAll('label').forEach((l, i) => {
      const id = i === 0 ? `taraf-ad-${sayac}` : `taraf-miktar-${sayac}`;
      l.htmlFor = id;
      l.textContent = `${sayac}. taraf ${i === 0 ? 'adı' : 'miktarı'}`;
    });
    const [ad, miktar] = yeni.querySelectorAll('input');
    ad.id = `taraf-ad-${sayac}`; ad.value = ''; ad.placeholder = `Şirket ${sayac}`;
    miktar.id = `taraf-miktar-${sayac}`; miktar.value = '';
    yeni.querySelector('[data-p-oran]')!.textContent = '';
    liste.append(yeni);
    ad.focus();
  });
  kok.addEventListener('input', guncelle);
  $('[data-p-temizle]').addEventListener('click', () => {
    kok.querySelectorAll('input').forEach(i => { i.value = ''; });
    guncelle();
  });
  kopyala.addEventListener('click', async () => {
    const durum = $('[data-p-kopyalandi]');
    try { await navigator.clipboard.writeText(hukum.textContent ?? ''); durum.textContent = 'Kopyalandı'; }
    catch { durum.textContent = 'Kopyalanamadı; metni seçip kopyalayın.'; }
    setTimeout(() => { durum.textContent = ''; }, 2500);
  });
  guncelle();
}
