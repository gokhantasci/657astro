import { miras, kesirMetni } from '../lib/miras';
import { tl, sayiOku } from '../lib/bicim';

const form = document.querySelector<HTMLFormElement>('#mp-form');
if (form) {
  const v = (ad: string) => (form.elements.namedItem(ad) as HTMLInputElement).value;
  const n = (ad: string) => Number(v(ad));
  const govde = document.querySelector<HTMLElement>('[data-mp-satirlar]')!;
  const hata = document.querySelector<HTMLElement>('[data-mp-hata]')!;
  const hesapla = () => {
    try {
      const torunlar = v('torunlar').split(/[,;\s]+/).filter(Boolean).map(Number);
      const r = miras({ tutar: sayiOku(v('tutar')), es: v('es') === '1', cocuklar: n('cocuklar'), olmusCocuklarinTorunlari: torunlar,
        anne: v('anne') === '1', baba: v('baba') === '1', tamKardes: n('tamKardes'), anaBirKardes: n('anaBirKardes'), babaBirKardes: n('babaBirKardes'), ucuncuZumre: v('ucuncuZumre') === '1' });
      hata.hidden = true;
      govde.replaceChildren(...r.paylar.map(p => {
        const tr = document.createElement('tr'), th = document.createElement('th'), a = document.createElement('td'), b = document.createElement('td');
        th.scope = 'row'; th.textContent = p.kim; a.className = b.className = 'num'; a.textContent = kesirMetni(p.kesir); b.textContent = tl(p.tutar);
        tr.append(th, a, b); return tr;
      }));
    } catch (e) { hata.textContent = (e as Error).message; hata.hidden = false; govde.replaceChildren(); }
  };
  form.addEventListener('input', hesapla); form.addEventListener('change', hesapla);
  form.addEventListener('submit', e => { e.preventDefault(); hesapla(); });
  document.querySelector('[data-mp-sifirla]')!.addEventListener('click', () => { form.reset(); hesapla(); });
}
