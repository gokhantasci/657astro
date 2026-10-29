import { kiraArtisi } from '../lib/kira-artisi';
import { tl, yuzde, sayiOku } from '../lib/bicim';

const form = document.querySelector<HTMLFormElement>('#ka-form');
if (form) {
  const aylar = JSON.parse(document.querySelector('#ka-veri')!.textContent!) as Record<string, number>;
  const alan = (ad: string) => form.elements.namedItem(ad) as HTMLInputElement;
  const out = (k: string) => document.querySelector<HTMLElement>(`[data-ka="${k}"]`)!;
  const hata = document.querySelector<HTMLElement>('[data-ka-hata]')!;
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const hesapla = () => {
    try {
      const so = alan('sozlesmeOrani').value.trim();
      const r = kiraArtisi({ kira: sayiOku(alan('kira').value), yenileme: alan('yenileme').value, sozlesmeOrani: so === '' ? null : sayiOku(so) }, aylar);
      hata.hidden = true;
      out('yeniKira').textContent = tl(r.yeniKira);
      out('aciklama').textContent = `${AY[Number(r.donem.slice(5)) - 1]} ${r.donem.slice(0, 4)} TÜFE on iki aylık ortalaması${r.sinirlandi ? ' · sözleşme oranı yasal sınıra indirildi' : ''}`;
      out('oran').textContent = yuzde(r.oran); out('artis').textContent = tl(r.artis); out('tufe').textContent = yuzde(r.tufe);
    } catch (e) { hata.textContent = (e as Error).message; hata.hidden = false; out('yeniKira').textContent = '—'; }
  };
  form.addEventListener('input', hesapla); form.addEventListener('change', hesapla);
  form.addEventListener('submit', e => { e.preventDefault(); hesapla(); });
  document.querySelector('[data-ka-sifirla]')!.addEventListener('click', () => { form.reset(); hesapla(); });
}
