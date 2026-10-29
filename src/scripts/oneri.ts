import { normalize } from '../lib/normalize';
import {yerelYol} from '../lib/site-yolu';

// Karşılaştırmada harf ve rakam dışındakiler (’ ' ? . boşluk) yok sayılır.
const anahtar = (s: string) => normalize(s).replace(/[^\p{L}\p{N}]+/gu, '');

// Öneriler özel servise gider; GitHub'a yalnızca yönetici onayından sonra aktarılır.
const form = document.querySelector<HTMLFormElement>('[data-oneri]');
if (form) {
  const { api } = JSON.parse(document.querySelector('#oneri-veri')!.textContent!) as { api: string };
  const endpoint=api || (['127.0.0.1','localhost'].includes(location.hostname)?'http://127.0.0.1:4326/api/oneriler':'');
  const alan = (ad: string) => form.elements.namedItem(ad) as HTMLInputElement | HTMLTextAreaElement;
  const tur = () => (form.querySelector<HTMLInputElement>('[name="tur"]:checked')?.value ?? 'sozluk') as 'sozluk' | 'mulakat';
  const hata = form.querySelector<HTMLElement>('[data-oneri-hata]')!;
  const durum = form.querySelector<HTMLElement>('[data-oneri-durum]')!;
  const varMi = form.querySelector<HTMLElement>('[data-oneri-var]')!;
  const gonder=form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  gonder.disabled=!endpoint;
  if(!endpoint)durum.textContent='Öneri kayıt servisi henüz bağlanmadı. Gönderim şu anda kapalı; yazdığınız metnin kopyasını alabilirsiniz.';
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

  let busy=false,sonMetin='',requestKey='';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy||!endpoint||!gecerli()) return;
    const payload={tur:tur(),baslik:alan('baslik').value.trim(),aciklama:alan('aciklama').value.trim(),kaynak:alan('kaynak').value.trim(),ad:alan('ad').value.trim(),website:alan('website').value};
    const json=JSON.stringify(payload);
    if(json!==sonMetin){sonMetin=json;requestKey=crypto.randomUUID();}
    busy=true;gonder.disabled=true;durum.textContent='Öneriniz kaydediliyor…';hata.hidden=true;
    const controller=new AbortController(),zaman=window.setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestKey}),credentials:'omit',signal:controller.signal});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Kayıt tamamlanamadı. Yeniden deneyin.');
      if(typeof result.id!=='string'||result.durum!=='kaydedildi')throw new Error('Kayıt yanıtı doğrulanamadı. Yeniden deneyin.');
      durum.textContent=`Öneriniz kaydedildi. Kayıt numarası: ${result.id}. Yönetici incelemesinden sonra yayımlanabilir.`;
      // Yazılanları koru; yanıt sonrası tekrar gönderim aynı kayıt numarasını getirir.
    }catch(error){hata.textContent=error instanceof Error&&error.name!=='TypeError'&&error.name!=='AbortError'?error.message:'Kayıt servisine ulaşılamadı. Yazdıklarınız korunuyor; yeniden deneyebilirsiniz.';hata.hidden=false;durum.textContent='';}
    finally{clearTimeout(zaman);busy=false;gonder.disabled=false;}
  });
  form.querySelector('[data-oneri-kopyala]')!.addEventListener('click', async () => {
    if (!gecerli()) return;
    try { await navigator.clipboard.writeText(metin()); durum.textContent = 'Önerinizin metni kopyalandı.'; }
    catch { durum.textContent = 'Kopyalanamadı. Alanlardaki metni seçerek kopyalayabilirsiniz.'; }
  });
}
