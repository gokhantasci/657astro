import { kidemIhbar, type Tavan } from '../lib/kidem-ihbar';
import type { VergiTarifesi } from '../lib/vergi';
import { tl, sayiOku } from '../lib/bicim';

const form = document.querySelector<HTMLFormElement>('#ki-form');
if (form) {
  const { tavanlar, vergiler } = JSON.parse(document.querySelector('#ki-veri')!.textContent!) as { tavanlar: Tavan[]; vergiler: Record<string, VergiTarifesi> };
  const alan = (ad: string) => form.elements.namedItem(ad) as HTMLInputElement;
  const out = (k: string) => document.querySelector<HTMLElement>(`[data-ki="${k}"]`)!;
  const hata = document.querySelector<HTMLElement>('[data-ki-hata]')!;
  const hesapla = () => {
    try {
      const cikis = alan('cikis').value;
      const vergi = vergiler[cikis.slice(0, 4)];
      if (!vergi) throw new Error('Çıkış yılının gelir vergisi tarifesi kayıtlı değil.');
      const r = kidemIhbar({ giris: alan('giris').value, cikis, ucret: sayiOku(alan('ucret').value), ihbar: alan('ihbar').value === '1', oncekiMatrah: sayiOku(alan('oncekiMatrah').value) }, tavanlar, vergi);
      hata.hidden = true;
      out('toplam').textContent = tl(r.toplamNet);
      out('sure').textContent = `${r.sure.yil} yıl ${r.sure.ay} ay ${r.sure.gun} gün${r.kidemHakki ? '' : ' · bir yıldan az: kıdem tazminatı yok'}${r.tavanUygulandi ? ' · tavan uygulandı' : ''}`;
      for (const k of ['brutKidem', 'damgaKidem', 'netKidem', 'brutIhbar', 'netIhbar', 'tavan'] as const) out(k).textContent = tl(r[k]);
      out('vergiIhbar').textContent = tl(r.gvIhbar + r.damgaIhbar);
      out('hafta').textContent = `${r.ihbarHafta} hafta`;
    } catch (e) {
      hata.textContent = (e as Error).message; hata.hidden = false;
      out('toplam').textContent = '—';
    }
  };
  form.addEventListener('input', hesapla);
  form.addEventListener('change', hesapla);
  form.addEventListener('submit', e => { e.preventDefault(); hesapla(); });
  document.querySelector('[data-ki-sifirla]')!.addEventListener('click', () => { form.reset(); hesapla(); });
}
