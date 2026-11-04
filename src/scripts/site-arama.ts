// Araç dizini araması; araç ve yazıların yanında adli çevre, sözlük, mülakat ve DPB görüşlerinde de arar.
// Dizin (/araclar/arama.json) yalnız ilk aramada yüklenir.
import { normalize } from '../lib/normalize';
import { yerelYol } from '../lib/site-yolu';

const kokBul = document.querySelector<HTMLElement>('[data-dir-icerik]');
if (kokBul) {
  const kok: HTMLElement = kokBul;
  type Satir = [string, string, string, string, string];
  const GOSTER = 8;
  const gruplar = kok.querySelector<HTMLElement>('[data-dir-icerik-gruplar]')!;
  const sayi = kok.querySelector<HTMLElement>('[data-dir-icerik-sayi]')!;
  const bolumAramasi: Record<string, (q: string) => string> = {
    'Sözlük': q => `/hukuk-sozlugu/?q=${encodeURIComponent(q)}`,
  };
  let dizin: { s: Satir; n: string }[] | null = null;
  let yukleniyor: Promise<void> | null = null;
  const yukle = () => yukleniyor ??= fetch(yerelYol('/araclar/arama.json'))
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Satir[]>; })
    .then(d => { dizin = d.map(s => ({ s, n: normalize(`${s[1]} ${s[3]} ${s[4]}`) })); })
    .catch(() => { yukleniyor = null; });

  let son = '';
  async function ara(q: string) {
    son = q;
    const terimler = normalize(q.trim()).split(/\s+/).filter(t => t.length > 1);
    if (!terimler.length) { kok.hidden = true; gruplar.replaceChildren(); return; }
    if (!dizin) { kok.hidden = false; sayi.textContent = 'Aranıyor…'; await yukle(); }
    if (son !== q) return;
    if (!dizin) { sayi.textContent = 'İçerik dizini yüklenemedi.'; return; }
    // Başlıkta geçenler önce gelir.
    const bulunan = dizin.filter(x => terimler.every(t => x.n.includes(t)))
      .sort((a, b) => Number(terimler.every(t => normalize(b.s[1]).includes(t))) - Number(terimler.every(t => normalize(a.s[1]).includes(t))));
    const tur = new Map<string, Satir[]>();
    for (const { s } of bulunan) tur.set(s[0], [...(tur.get(s[0]) ?? []), s]);
    gruplar.replaceChildren(...[...tur].map(([ad, liste]) => {
      const bolum = document.createElement('section');
      bolum.className = 'dir-icerik__grup';
      const h = document.createElement('h3');
      h.textContent = `${ad} · ${liste.length}`;
      const ul = document.createElement('ul');
      ul.className = 'terimler';
      ul.append(...liste.slice(0, GOSTER).map(([, baslik, yol, ozet]) => {
        const li = document.createElement('li'), a = document.createElement('a'), b = document.createElement('strong');
        a.href = yerelYol(yol); b.textContent = baslik; a.append(b);
        if (ozet) { const sp = document.createElement('span'); sp.textContent = ozet; a.append(sp); }
        li.append(a); return li;
      }));
      bolum.append(h, ul);
      if (liste.length > GOSTER) {
        const p = document.createElement('p'); p.className = 'dir-icerik__not';
        const ek = bolumAramasi[ad];
        if (ek) { const a = document.createElement('a'); a.href = yerelYol(ek(q.trim())); a.textContent = `${ad} içinde ${liste.length} sonucun tamamını görün`; p.append(a); }
        else p.textContent = `İlk ${GOSTER} sonuç gösteriliyor; aramayı daraltabilirsiniz.`;
        bolum.append(p);
      }
      return bolum;
    }));
    kok.hidden = bulunan.length === 0;
    sayi.textContent = `${bulunan.length} sonuç`;
  }
  document.addEventListener('dizin-arama', e => { void ara((e as CustomEvent<string>).detail); });
  const q = new URLSearchParams(location.search).get('q');
  if (q) void ara(q);
}
