import { thhUcret, type ThhOranlari } from '../lib/thh-bilirkisi';
import { tl, katsayi, sayiOku } from '../lib/bicim';

const form = document.querySelector<HTMLFormElement>('#thh-form');
if (form) {
  const veri = JSON.parse(document.querySelector('#thh-veri')!.textContent!) as {
    urunler: { ad: string; gosterge: number }[]; oranlar: ThhOranlari; donemler: { baslangic: string; aylik: number }[];
  };
  const alan = (ad: string) => form.elements.namedItem(ad) as HTMLInputElement | HTMLSelectElement;
  const out = (k: string) => document.querySelector<HTMLElement>(`[data-thh="${k}"]`)!;
  const hata = document.querySelector<HTMLElement>('[data-thh-hata]')!;
  const sayi = (n: number) => n.toLocaleString('tr-TR');
  const hesapla = () => {
    try {
      const u = veri.urunler[Number(alan('urun').value)];
      const d = veri.donemler.find(x => x.baslangic === alan('donem').value)!;
      const adet = Number(alan('adet').value);
      const gvOran=alan('gvOran').value.trim()===''?NaN:sayiOku(alan('gvOran').value);
      const r = thhUcret(u.gosterge, d.aylik, {...veri.oranlar,gelirVergisiOran:gvOran}, adet);
      hata.hidden = true;
      out('net').textContent = tl(r.net);
      out('aciklama').textContent = `${u.ad} · ${sayi(u.gosterge)} gösterge${adet > 1 ? ` · ${adet} dosya` : ''}`;
      out('formul').textContent = `${sayi(u.gosterge)} × ${katsayi(d.aylik)}${adet > 1 ? ` × ${adet}` : ''}`;
      out('brut').textContent = tl(r.brut);
      out('damga').textContent = tl(r.damga);
      out('gv').textContent = tl(r.gelirVergisi);
      out('gv-etiket').textContent=`Gelir vergisi (%${sayi(gvOran)})`;
    } catch (e) {
      hata.textContent = (e as Error).message; hata.hidden = false;
      for (const k of ['net', 'brut', 'damga', 'gv']) out(k).textContent = '—';
    }
  };
  form.addEventListener('input', hesapla);
  form.addEventListener('change', hesapla);
  form.addEventListener('submit', e => { e.preventDefault(); hesapla(); });
  document.querySelector('[data-thh-sifirla]')!.addEventListener('click', () => { form.reset(); form.dispatchEvent(new Event('change')); });
}
