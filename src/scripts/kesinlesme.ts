import { kesinlesme, gunFarki, noktali, gunAdi, iso, isoOku, gunEkle, type Tatil, type SureTuru } from '../lib/kesinlesme';
import {yerelYol} from '../lib/site-yolu';

const kok = document.querySelector<HTMLElement>('[data-kesin]');
const veriEl = document.getElementById('kesin-veri');
if (kok && veriEl) {
  const { tatiller, aralik }: { tatiller: Tatil[]; aralik: { ilk: number; son: number } } = JSON.parse(veriEl.textContent!);
  const $ = <T extends Element = HTMLElement>(s: string) => kok.querySelector<T>(s)!;
  const teblig = $<HTMLInputElement>('[data-k-teblig]');
  const sayi = $<HTMLInputElement>('[data-k-sayi]');
  const tur = $<HTMLSelectElement>('[data-k-tur]');
  const uyari = $('[data-k-uyari]');
  const bugunIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  const hesapla = () => {
    const n = Math.floor(Number(sayi.value));
    if (!teblig.value || !(n >= 1)) {
      $('[data-k-tarih]').textContent = 'Tarih seçin';
      $('[data-k-gun]').textContent = '';
      $('[data-k-durum]').hidden = true;
      return;
    }
    const r = kesinlesme(teblig.value, n, tur.value as SureTuru, tatiller);
    const yil = r.son.getUTCFullYear();
    const tebligYil = isoOku(teblig.value).getUTCFullYear();
    uyari.hidden = yil >= aralik.ilk && yil <= aralik.son && tebligYil >= aralik.ilk;
    uyari.textContent = `Tatil verisi ${aralik.ilk} ile ${aralik.son} yıllarını kapsıyor; bu aralığın dışındaki resmî tatiller hesaba katılmadı.`;
    $('[data-k-tarih]').textContent = noktali(r.kesin);
    $('[data-k-gun]').textContent = gunAdi(r.kesin);
    const fark = gunFarki(r.kesin, new Date());
    const chip = $('[data-k-durum-chip]');
    chip.textContent = fark === 0 ? 'Bugün kesinleşiyor' : fark > 0 ? `${fark} gün sonra` : `${-fark} gün önce kesinleşti`;
    chip.className = `chip ${fark > 0 ? 'chip--cte' : fark === 0 ? 'chip--hsk' : 'chip--bakanlik'}`;
    $('[data-k-durum]').hidden = false;
    $('[data-k="teblig"]').textContent = noktali(r.teblig);
    $('[data-k="son"]').textContent = `${noktali(r.son)} ${gunAdi(r.son)}`;
    const liste = $('[data-k-notlar]');
    liste.replaceChildren(...r.notlar.map(n => {
      const li = document.createElement('li');
      li.textContent = n.metin;
      if (n.baglanti) {
        const a = document.createElement('a');
        a.href = yerelYol(n.baglanti.href); a.textContent = n.baglanti.metin; a.target = '_blank'; a.rel = 'noopener';
        li.append(' ', a);
      }
      return li;
    }));
    $('[data-k-notlar-bos]').hidden = r.notlar.length > 0;
  };

  kok.querySelectorAll<HTMLButtonElement>('[data-k-kaydir]').forEach(b => b.addEventListener('click', () => {
    const d = teblig.value ? isoOku(teblig.value) : isoOku(bugunIso());
    teblig.value = iso(gunEkle(d, Number(b.dataset.kKaydir)));
    hesapla();
  }));
  $('[data-k-bugun]').addEventListener('click', () => { teblig.value = bugunIso(); hesapla(); });
  $('[data-k-sifirla]').addEventListener('click', () => { teblig.value = bugunIso(); sayi.value = '2'; tur.value = 'hafta'; hesapla(); teblig.focus(); });
  [teblig, sayi, tur].forEach(el => el.addEventListener('input', hesapla));
  // ?teblig=2026-10-01&sure=2&tur=hafta ile doğrudan hesap bağlantısı verilebilir.
  const q = new URLSearchParams(location.search);
  teblig.value = /^\d{4}-\d{2}-\d{2}$/.test(q.get('teblig') ?? '') ? q.get('teblig')! : bugunIso();
  if (q.get('sure')) sayi.value = q.get('sure')!;
  if (['gun', 'hafta', 'ay'].includes(q.get('tur') ?? '')) tur.value = q.get('tur')!;
  hesapla();
}
