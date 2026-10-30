import { tapuHarci, type TapuTarifesi } from '../lib/tapu-harci';
import { tl, sayiOku } from '../lib/bicim';

const form = document.querySelector<HTMLFormElement>('#th-form');
if (form) {
  const t = JSON.parse(document.querySelector('#th-veri')!.textContent!) as TapuTarifesi;
  const v = (ad: string) => (form.elements.namedItem(ad) as HTMLInputElement).value;
  const out = (k: string) => document.querySelector<HTMLElement>(`[data-th="${k}"]`)!;
  const hata = document.querySelector<HTMLElement>('[data-th-hata]')!;
  const hesapla = () => {
    try {
      const r = tapuHarci({ bedel: sayiOku(v('bedel')), emlakDegeri: sayiOku(v('emlakDegeri')), katsayi: sayiOku(v('katsayi')), ekTasinmaz: Number(v('ekTasinmaz')), bagimsizBolum: v('tur') === 'bolum', yetkiDisi: v('yetki') === 'disi' }, t);
      hata.hidden = true;
      for (const k of ['aliciToplam', 'aliciHarc', 'saticiHarc', 'doner', 'genelToplam'] as const) out(k).textContent = tl(r[k]);
      out('aciklama').textContent = `Harca esas değer ${tl(r.esas)}${r.emlakEsas ? ' (emlak vergi değeri)' : ''}`;
    } catch (e) { hata.textContent = (e as Error).message; hata.hidden = false; for (const k of ['aliciToplam', 'aliciHarc', 'saticiHarc', 'doner', 'genelToplam', 'aciklama']) out(k).textContent = '—'; }
  };
  form.addEventListener('input', hesapla); form.addEventListener('change', hesapla);
  form.addEventListener('submit', e => { e.preventDefault(); hesapla(); });
  document.querySelector('[data-th-sifirla]')!.addEventListener('click', () => { form.reset(); hesapla(); });
}
