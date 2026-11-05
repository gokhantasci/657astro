import { enflasyonFarki, type EnflasyonGirdi, type KatsayiSeti, type Sabitler } from '../lib/enflasyon';
import { yuzde, tl, katsayi, ondalik, sayiOku } from '../lib/bicim';
import {enflasyonAnlatimi} from '../lib/enflasyon-anlatimi';
import { hesaplamaArtir } from './hesaplama-sayaci';

const kok = document.querySelector<HTMLElement>('[data-enflasyon]');
const veriEl = document.getElementById('enflasyon-veri');
if (kok && veriEl) {
  const veri: { donem: string;sonrakiAy:string;tamam:boolean; girdi: EnflasyonGirdi; katsayi: KatsayiSeti; sabitler: Sabitler } = JSON.parse(veriEl.textContent!);
  const girisler = [...kok.querySelectorAll<HTMLInputElement>('[data-e-ay]')];
  const hata = kok.querySelector<HTMLElement>('[data-e-hata]')!;
  const yaz = (anahtar: string, metin: string) => { const el = kok.querySelector(`[data-e="${anahtar}"]`); if (el) el.textContent = metin; };
  const KAYIT = `657:enflasyon-tahmin:${veri.donem}`;

  const hesapla = () => {
    const aylar = girisler.map((inp, i) => ({ degisim: inp.value.trim()===''?veri.girdi.aylar[i].degisim:sayiOku(inp.value), endeks: veri.girdi.aylar[i].endeks }));
    const gecersiz = girisler.filter((_, i) => !Number.isFinite(aylar[i].degisim) || aylar[i].degisim <= -100);
    girisler.forEach(inp => inp.toggleAttribute('aria-invalid', gecersiz.includes(inp)));
    if (gecersiz.length) {
      hata.hidden = false;
      hata.textContent = 'Aylık TÜFE değişimi −%100’den büyük olmalı; düşüş için eksi, ondalık için virgül kullanabilirsiniz (ör. −1,25).';
      return;
    }
    hata.hidden = true;
    const r = enflasyonFarki({ ...veri.girdi, aylar }, veri.katsayi, veri.sabitler);
    kok.querySelector('[data-e-anlatim]')!.replaceChildren(...enflasyonAnlatimi({...veri.girdi,aylar},r,veri.sonrakiAy,veri.tamam).map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
    const farkVar = r.fark > 0;
    kok.querySelector('[data-e-baslik]')!.textContent = farkVar ? 'Beklenen enflasyon farkı' : 'Enflasyon farkı oluşmuyor';
    kok.querySelector('[data-e-deger]')!.textContent = farkVar ? yuzde(r.fark) : `${yuzde(r.gerekenEnflasyon)} daha`;
    kok.querySelector('[data-e-aciklama]')!.textContent = farkVar
      ? `Dönem sonunda maaşlara ${yuzde(r.fark)} enflasyon farkı eklenir.`
      : 'Enflasyon farkı için bu kadar daha aylık enflasyon gerekiyor.';
    yaz('kumulatif', yuzde(r.kumulatifZam));
    yaz('toplam', yuzde(r.aylikToplam));
    yaz('endeks', yuzde(r.endeksArtisi));
    yaz('sonEndeks', ondalik(r.sonEndeks));
    yaz('aylik', katsayi(r.yeni.aylik));
    yaz('taban', katsayi(r.yeni.taban));
    yaz('yan', katsayi(r.yeni.yanOdeme));
    yaz('bedelli', tl(r.yeni.bedelli));
    yaz('yeniBedelli', tl(r.yeni.yeniBedelli));
    yaz('muhtar', tl(r.yeni.muhtar));
    yaz('seyyanen', tl(r.yeni.seyyanen));
    kok.querySelector<HTMLElement>('[data-e-muhtar-not]')!.hidden = !r.yeni.muhtarAsgaride;
    kok.querySelectorAll<HTMLElement>('[data-e-endeks]').forEach(el => { el.textContent = ondalik(r.aylikEndeksler[Number(el.dataset.eEndeks)]); });
  };

  // Tahminler bu tarayıcıda hatırlanır; resmî aylar her zaman veri dosyasından gelir.
  const tahminler = () => girisler.filter(i => !i.readOnly);
  try {
    const kayit = JSON.parse(localStorage.getItem(KAYIT) ?? '{}');
    tahminler().forEach(i => { if (typeof kayit[i.id] === 'string'&&kayit[i.id].trim()!=='') i.value = kayit[i.id]; });
  } catch { /* kayıt okunamadı */ }
  const kaydet = () => {
    try { localStorage.setItem(KAYIT, JSON.stringify(Object.fromEntries(tahminler().map(i => [i.id, i.value])))); } catch { /* gizli pencere */ }
  };

  girisler.forEach(i => i.addEventListener('input', () => { hesapla(); kaydet(); hesaplamaArtir('enflasyon'); }));
  kok.querySelector('[data-e-sifirla]')!.addEventListener('click', () => {
    tahminler().forEach(i => { i.value = ''; });
    kaydet();
    hesapla();
    tahminler()[0]?.focus();
  });
  hesapla();
}
