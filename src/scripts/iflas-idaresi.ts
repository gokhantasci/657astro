import { iflasIdareUcreti, iflasTarifesiSec, type IflasTarifesi } from '../lib/iflas-idaresi';
import { tl, sayiOku } from '../lib/bicim';

const form = document.querySelector<HTMLFormElement>('#iflas-form');
if (form) {
  const tarifeler = JSON.parse(document.querySelector('#iflas-veri')!.textContent!) as IflasTarifesi[];
  const alan = (ad: string) => form.elements.namedItem(ad) as HTMLInputElement | HTMLSelectElement;
  const out = (k: string) => document.querySelector<HTMLElement>(`[data-iflas="${k}"]`)!;
  const hata = document.querySelector<HTMLElement>('[data-iflas-hata]')!;
  const yuzde = (n: number) => `%${n.toLocaleString('tr-TR')}`;
  const oku = (ad: string) => { const v = alan(ad).value.trim(); return v === '' ? 0 : sayiOku(v); };
  const hesapla = () => {
    try {
      const adi = oku('adi');
      const r = iflasIdareUcreti(adi, iflasTarifesiSec(tarifeler, alan('tarih').value), oku('rehinli'));
      hata.hidden = true;
      out('ucret').textContent = tl(r.ucret);
      out('aciklama').textContent = `${tl(adi)} üzerinden · ortalama oran ${yuzde(r.efektifOran)}`;
      out('azami').textContent = tl(r.mahkemeAzami);
      out('rehinli').textContent = tl(r.rehinliEkAzami);
      out('dokum').replaceChildren(...r.dilimler.map(d => {
        const tr = document.createElement('tr');
        const th = document.createElement('th'); th.scope = 'row'; th.textContent = tl(d.matrah);
        const o = document.createElement('td'); o.className = 'num'; o.textContent = yuzde(d.oran);
        const u = document.createElement('td'); u.className = 'num'; u.textContent = tl(d.ucret);
        tr.append(th, o, u); return tr;
      }));
    } catch (e) {
      hata.textContent = (e as Error).message; hata.hidden = false;
      for (const k of ['ucret', 'azami', 'rehinli']) out(k).textContent = '—';
      out('dokum').replaceChildren();
    }
  };
  form.addEventListener('input', hesapla);
  form.addEventListener('change', hesapla);
  form.addEventListener('submit', e => { e.preventDefault(); hesapla(); });
  document.querySelector('[data-iflas-sifirla]')!.addEventListener('click', () => { form.reset(); form.dispatchEvent(new Event('change')); });
  form.dataset.hazir = '';
}
