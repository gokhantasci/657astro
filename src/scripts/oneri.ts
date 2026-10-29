import { normalize } from '../lib/normalize';
import {yerelYol} from '../lib/site-yolu';

// Karşılaştırmada harf ve rakam dışındakiler (’ ' ? . boşluk) yok sayılır.
const anahtar = (s: string) => normalize(s).replace(/[^\p{L}\p{N}]+/gu, '');

// Sözlük ve mülakat önerisi: sunucu yoktur; öneri hazır bir e-posta olarak açılır ya da panoya kopyalanır.
const form = document.querySelector<HTMLFormElement>('[data-oneri]');
if (form) {
  const { eposta } = JSON.parse(document.querySelector('#oneri-veri')!.textContent!) as { eposta: string };
  const alan = (ad: string) => form.elements.namedItem(ad) as HTMLInputElement | HTMLTextAreaElement;
  const tur = () => (form.querySelector<HTMLInputElement>('[name="tur"]:checked')?.value ?? 'sozluk') as 'sozluk' | 'mulakat';
  const hata = form.querySelector<HTMLElement>('[data-oneri-hata]')!;
  const durum = form.querySelector<HTMLElement>('[data-oneri-durum]')!;
  const varMi = form.querySelector<HTMLElement>('[data-oneri-var]')!;
  const ETIKET = { sozluk: { baslik: 'Terim', aciklama: 'Anlamı', konu: 'Sözlük terimi önerisi' }, mulakat: { baslik: 'Soru', aciklama: 'Cevabı', konu: 'Mülakat sorusu önerisi' } };

  // Aynı terim ya da soru zaten varsa uyarılır; indeksler ilk yazışta bir kez indirilir.
  const indeks: Partial<Record<'sozluk' | 'mulakat', Promise<{ ad: string; href: string; n: string }[]>>> = {};
  const yukle = (t: 'sozluk' | 'mulakat') => indeks[t] ??= (t === 'sozluk'
    ? fetch(yerelYol('/hukuk-sozlugu/ara.json')).then(r => r.json()).then((d: [string, string, string][]) => d.map(([ad, slug]) => ({ ad, href: yerelYol(`/kelime/${slug}/`), n: anahtar(ad) })))
    : fetch(yerelYol('/cikmis-mulakat-sorulari/kartlar.json')).then(r => r.json()).then((d: [string, string][]) => d.map(([slug, ad]) => ({ ad, href: yerelYol(`/${slug}/`), n: anahtar(ad) })))
  ).catch(() => { delete indeks[t]; return []; });
  const kontrol = async () => {
    const t = tur(), q = anahtar(alan('baslik').value);
    varMi.replaceChildren();
    if (q.length < 3) return;
    const liste = await yukle(t);
    if (anahtar(alan('baslik').value) !== q || tur() !== t) return;
    const bulunan = liste.find(x => x.n === q);
    if (!bulunan) return;
    const a = document.createElement('a');
    a.href = bulunan.href; a.textContent = bulunan.ad;
    varMi.append(t === 'sozluk' ? 'Bu terim sözlükte var: ' : 'Bu soru kartlarda var: ', a, '. Yine de düzeltme önerebilirsiniz.');
  };

  const etiketle = () => {
    const e = ETIKET[tur()];
    form.querySelector('[data-oneri-etiket="baslik"]')!.textContent = e.baslik;
    form.querySelector('[data-oneri-etiket="aciklama"]')!.textContent = e.aciklama;
    void kontrol();
  };
  const metin = () => {
    const e = ETIKET[tur()];
    return [`${e.baslik}: ${alan('baslik').value.trim()}`, `${e.aciklama}: ${alan('aciklama').value.trim()}`,
      alan('kaynak').value.trim() && `Kaynak: ${alan('kaynak').value.trim()}`, alan('ad').value.trim() && `Gönderen: ${alan('ad').value.trim()}`,
      '', `657.com.tr öneri formundan gönderildi: ${location.href}`].filter(s => s !== '').join('\n');
  };
  const gecerli = () => {
    const ok = form.checkValidity();
    hata.hidden = ok;
    if (!ok) hata.textContent = `${ETIKET[tur()].baslik} ve ${ETIKET[tur()].aciklama.toLocaleLowerCase('tr-TR')} alanlarını doldurun.`;
    return ok;
  };

  const q = new URLSearchParams(location.search);
  if (q.get('tur') === 'mulakat') form.querySelector<HTMLInputElement>('#tur-mulakat')!.checked = true;
  if (q.get('baslik')) alan('baslik').value = q.get('baslik')!;
  etiketle();
  form.querySelectorAll('[name="tur"]').forEach(r => r.addEventListener('change', etiketle));
  let bekle = 0;
  alan('baslik').addEventListener('input', () => { clearTimeout(bekle); bekle = window.setTimeout(kontrol, 250); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!gecerli()) return;
    const konu = `${ETIKET[tur()].konu}: ${alan('baslik').value.trim()}`.slice(0, 150);
    location.href = `mailto:${eposta}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(metin())}`;
    durum.textContent = 'E-posta uygulamanız açılıyor. Açılmazsa “Metni kopyala” düğmesini kullanın.';
  });
  form.querySelector('[data-oneri-kopyala]')!.addEventListener('click', async () => {
    if (!gecerli()) return;
    try { await navigator.clipboard.writeText(metin()); durum.textContent = `Öneri kopyalandı. ${eposta} adresine yapıştırıp gönderebilirsiniz.`; }
    catch { durum.textContent = `Kopyalanamadı. Metni seçip ${eposta} adresine gönderin.`; }
  });
}
