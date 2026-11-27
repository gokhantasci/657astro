import {
  katsayiBul,
  hesaplaAileCocuk,
  hesaplaTazminatFarki,
  hesaplaEngellilikIadesi,
  hesaplaGelistirmeOdenegi,
  hesaplaEmekliYollugu,
  hesaplaAlacakFaiziSatir,
  type CesitliAracTuru,
  type DonemKatsayi,
} from '../lib/cesitli-odemeler';

const root = document.querySelector<HTMLElement>('[data-co-app]');
if (root) {
  const tur = root.dataset.coTur as CesitliAracTuru;
  const veriEl = document.getElementById('co-veri');
  const veri = JSON.parse(veriEl?.textContent || '{}') as {
    katsayilar: DonemKatsayi[];
    engellilik: number[];
    varsayilanYil: number;
    varsayilanAy: number;
  };

  const listeEl = root.querySelector<HTMLElement>('[data-co-liste]')!;
  const ozetEl = root.querySelector<HTMLElement>('[data-co-ozet]')!;
  const tabloEl = root.querySelector<HTMLElement>('[data-co-tablo]')!;
  const kopyalaBtn = root.querySelector<HTMLButtonElement>('[data-co-kopyala]')!;

  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const yillar = [...new Set(veri.katsayilar.map((k) => k.yil))].sort((a, b) => b - a);
  const tl = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
  const num = (el: HTMLInputElement | HTMLSelectElement | null, def = 0) => {
    const v = Number(String(el?.value ?? '').replace(',', '.'));
    return Number.isFinite(v) ? v : def;
  };
  const yilOpts = (sel: number) => yillar.map((y) => `<option value="${y}"${y === sel ? ' selected' : ''}>${y}</option>`).join('');
  const ayOpts = (sel: number) => AYLAR.map((a, i) => `<option value="${i + 1}"${i + 1 === sel ? ' selected' : ''}>${a}</option>`).join('');

  let sonOzetMetni = '';

  function satirEkle(ilk = false) {
    const row = document.createElement('div');
    row.className = 'co-satir';
    row.dataset.coSatir = '';
    const y = veri.varsayilanYil;
    const a = veri.varsayilanAy;

    if (tur === 'aile-cocuk') {
      row.innerHTML = `
        <label>Yıl<select data-f="yil">${yilOpts(y)}</select></label>
        <label>Ay<select data-f="ay">${ayOpts(a)}</select></label>
        <label>Aile yardımı<select data-f="aile"><option value="1" selected>Evet (2.273)</option><option value="0">Hayır</option></select></label>
        <label>0–6 yaş çocuk<input type="number" min="0" max="10" data-f="kucuk" value="${ilk ? 1 : 0}"/></label>
        <label>6+ yaş çocuk<input type="number" min="0" max="10" data-f="buyuk" value="${ilk ? 1 : 0}"/></label>
        <button type="button" class="btn btn--quiet btn--kucuk co-sil">Sil</button>
      `;
    } else if (tur === 'tazminat-5510' || tur === 'tazminat-primsiz' || tur === 'tazminat-5434') {
      row.innerHTML = `
        <label>Yıl<select data-f="yil">${yilOpts(y)}</select></label>
        <label>Ay<select data-f="ay">${ayOpts(a)}</select></label>
        <label>Gün<input type="number" min="1" max="30" data-f="gun" value="30"/></label>
        <label>Ek göst./Makam farkı<input type="number" step="any" data-f="ekG" value="${ilk ? 600 : 0}"/></label>
        <label>Özel hizm. puanı (%)<input type="number" step="any" data-f="ozH" value="${ilk ? 20 : 0}"/></label>
        <label>Ek ödeme puanı (%)<input type="number" step="any" data-f="ekO" value="${ilk ? 10 : 0}"/></label>
        <label>Yan ödeme puanı<input type="number" step="any" data-f="yanO" value="${ilk ? 300 : 0}"/></label>
        ${tur === 'tazminat-5434' ? '' : '<label>Vergi dilimi<select data-f="vergi"><option value="0.15" selected>%15</option><option value="0.20">%20</option><option value="0.27">%27</option><option value="0.35">%35</option><option value="0.40">%40</option></select></label>'}
        <button type="button" class="btn btn--quiet btn--kucuk co-sil">Sil</button>
      `;
    } else if (tur === 'engellilik') {
      const e1 = veri.engellilik[1] ?? 12000;
      const e2 = veri.engellilik[2] ?? 7000;
      const e3 = veri.engellilik[3] ?? 3000;
      row.innerHTML = `
        <label>Yıl<select data-f="yil">${yilOpts(y)}</select></label>
        <label>Ay<select data-f="ay">${ayOpts(a)}</select></label>
        <label>Engellilik derecesi<select data-f="derece"><option value="${e1}">1. Derece (%80+) — ${e1.toLocaleString('tr-TR')} TL</option><option value="${e2}" selected>2. Derece (%60+) — ${e2.toLocaleString('tr-TR')} TL</option><option value="${e3}">3. Derece (%40+) — ${e3.toLocaleString('tr-TR')} TL</option></select></label>
        <label>Vergi dilimi<select data-f="vergi"><option value="0.15" selected>%15</option><option value="0.20">%20</option><option value="0.27">%27</option><option value="0.35">%35</option><option value="0.40">%40</option></select></label>
        <label>Maaştan kesilen GV (TL)<input type="number" step="any" min="0" data-f="kesilen" value="${ilk ? 1500 : 0}"/></label>
        <button type="button" class="btn btn--quiet btn--kucuk co-sil">Sil</button>
      `;
    } else if (tur === 'gelistirme') {
      row.innerHTML = `
        <label>Yıl<select data-f="yil">${yilOpts(y)}</select></label>
        <label>Ay<select data-f="ay">${ayOpts(a)}</select></label>
        <label>Ek gösterge puanı<input type="number" step="any" data-f="ekG" value="${ilk ? 600 : 0}"/></label>
        <label>Ödeme aylığı göstergesi<input type="number" step="any" data-f="aylikG" value="${ilk ? 1500 : 0}"/></label>
        <label>Geliştirme oranı (%)<input type="number" step="any" data-f="oran" value="${ilk ? 120 : 100}"/></label>
        <label>Ödenen tutar (TL)<input type="number" step="any" min="0" data-f="odenen" value="0"/></label>
        <button type="button" class="btn btn--quiet btn--kucuk co-sil">Sil</button>
      `;
    } else if (tur === 'emekli-yollugu') {
      row.innerHTML = `
        <label>Yıl<select data-f="yil">${yilOpts(y)}</select></label>
        <label>Ay<select data-f="ay">${ayOpts(a)}</select></label>
        <label>Gösterge<input type="number" step="1" data-f="gosterge" value="13558"/></label>
        <button type="button" class="btn btn--quiet btn--kucuk co-sil">Sil</button>
      `;
    } else if (tur === 'alacak-faizi') {
      row.innerHTML = `
        <label>Faiz başlangıç<input type="date" data-f="bas" value="2024-01-15"/></label>
        <label>Ödeme tarihi<input type="date" data-f="bit" value="${new Date().toISOString().slice(0, 10)}"/></label>
        <label>Yıllık faiz (%)<input type="number" step="any" min="0" data-f="oran" value="24"/></label>
        <label>Anapara (TL)<input type="number" step="any" min="0" data-f="anapara" value="10000"/></label>
        <button type="button" class="btn btn--quiet btn--kucuk co-sil">Sil</button>
      `;
    }

    row.querySelector('.co-sil')!.addEventListener('click', () => {
      if (listeEl.querySelectorAll('[data-co-satir]').length > 1) {
        row.remove();
        hesapla();
      }
    });
    row.addEventListener('input', hesapla);
    row.addEventListener('change', hesapla);
    listeEl.appendChild(row);
    hesapla();
  }

  function hesapla() {
    const satirlar = [...listeEl.querySelectorAll<HTMLElement>('[data-co-satir]')];
    let topBrut = 0,
      topKesinti = 0,
      topNet = 0,
      topPrim = 0,
      topDamga = 0,
      topGv = 0,
      topFaiz = 0;

    const trs: string[] = [];

    satirlar.forEach((row, idx) => {
      const yil = num(row.querySelector('[data-f="yil"]'), veri.varsayilanYil);
      const ay = num(row.querySelector('[data-f="ay"]'), veri.varsayilanAy);
      const k = katsayiBul(veri.katsayilar, yil, ay)!;
      const donemAd = `${AYLAR[ay - 1] ?? ay} ${yil}`;

      if (tur === 'aile-cocuk') {
        const r = hesaplaAileCocuk({
          aylikKatsayi: k.aylik,
          aileYardimiVar: row.querySelector<HTMLSelectElement>('[data-f="aile"]')?.value === '1',
          kucukCocuk: num(row.querySelector('[data-f="kucuk"]')),
          buyukCocuk: num(row.querySelector('[data-f="buyuk"]')),
        });
        topBrut += r.net;
        topNet += r.net;
        trs.push(`<tr><td>${idx + 1}</td><td>${donemAd}</td><td class="num">${k.aylik.toFixed(6)}</td><td class="num">${tl(r.aile)}</td><td class="num">${tl(r.cocuk)}</td><td class="num"><strong>${tl(r.net)}</strong></td></tr>`);
      } else if (tur === 'tazminat-5510' || tur === 'tazminat-primsiz' || tur === 'tazminat-5434') {
        const kip = tur === 'tazminat-5510' ? '5510' : tur === 'tazminat-primsiz' ? 'primsiz' : '5434';
        const r = hesaplaTazminatFarki(kip, {
          aylikKatsayi: k.aylik,
          yanOdemeKatsayi: k.yanOdeme,
          gun: num(row.querySelector('[data-f="gun"]'), 30),
          ekGostergePuani: num(row.querySelector('[data-f="ekG"]')),
          ozelHizmetPuani: num(row.querySelector('[data-f="ozH"]')),
          ekOdemePuani: num(row.querySelector('[data-f="ekO"]')),
          yanOdemePuani: num(row.querySelector('[data-f="yanO"]')),
          vergiOrani: num(row.querySelector('[data-f="vergi"]'), 0.15),
        });
        topBrut += r.brut;
        topPrim += r.toplamPrim;
        topDamga += r.damga;
        topGv += r.gelirVergisi;
        topKesinti += r.gssKisi + r.emekliKisi + r.damga + r.gelirVergisi;
        topNet += r.net;
        trs.push(`<tr><td>${idx + 1}</td><td>${donemAd}</td><td class="num">${tl(r.brut)}</td><td class="num">${tl(r.gssKisi + r.emekliKisi)}</td><td class="num">${tl(r.damga)}</td><td class="num">${tl(r.gelirVergisi)}</td><td class="num"><strong>${tl(r.net)}</strong></td></tr>`);
      } else if (tur === 'engellilik') {
        const r = hesaplaEngellilikIadesi({
          indirimMatrahi: num(row.querySelector('[data-f="derece"]')),
          vergiOrani: num(row.querySelector('[data-f="vergi"]'), 0.15),
          kesilenGelirVergisi: num(row.querySelector('[data-f="kesilen"]')),
        });
        topBrut += r.hakEdilen;
        topNet += r.odenecek;
        trs.push(`<tr><td>${idx + 1}</td><td>${donemAd}</td><td class="num">${tl(r.hakEdilen)}</td><td class="num">${tl(num(row.querySelector('[data-f="kesilen"]')))}</td><td class="num"><strong>${tl(r.odenecek)}</strong></td></tr>`);
      } else if (tur === 'gelistirme') {
        const r = hesaplaGelistirmeOdenegi({
          aylikKatsayi: k.aylik,
          ekGostergePuani: num(row.querySelector('[data-f="ekG"]')),
          odemeAyligiGostergePuani: num(row.querySelector('[data-f="aylikG"]')),
          oranYuzde: num(row.querySelector('[data-f="oran"]')),
          odenenTutar: num(row.querySelector('[data-f="odenen"]')),
        });
        topBrut += r.farkBrut;
        topDamga += r.damga;
        topKesinti += r.damga;
        topNet += r.net;
        trs.push(`<tr><td>${idx + 1}</td><td>${donemAd}</td><td class="num">${tl(r.odenmesiGereken)}</td><td class="num">${tl(r.farkBrut)}</td><td class="num">${tl(r.damga)}</td><td class="num"><strong>${tl(r.net)}</strong></td></tr>`);
      } else if (tur === 'emekli-yollugu') {
        const r = hesaplaEmekliYollugu({
          aylikKatsayi: k.aylik,
          gosterge: num(row.querySelector('[data-f="gosterge"]'), 13558),
        });
        topBrut += r.brut;
        topDamga += r.damga;
        topKesinti += r.damga;
        topNet += r.net;
        trs.push(`<tr><td>${idx + 1}</td><td>${donemAd}</td><td class="num">${r.gosterge.toLocaleString('tr-TR')}</td><td class="num">${k.aylik.toFixed(6)}</td><td class="num">${tl(r.brut)}</td><td class="num">${tl(r.damga)}</td><td class="num"><strong>${tl(r.net)}</strong></td></tr>`);
      } else if (tur === 'alacak-faizi') {
        const anapara = num(row.querySelector('[data-f="anapara"]'));
        const r = hesaplaAlacakFaiziSatir({
          baslangicIso: row.querySelector<HTMLInputElement>('[data-f="bas"]')?.value ?? '',
          odemeIso: row.querySelector<HTMLInputElement>('[data-f="bit"]')?.value ?? '',
          faizOraniYuzde: num(row.querySelector('[data-f="oran"]')),
          anapara,
        });
        topBrut += anapara;
        topFaiz += r.faiz;
        topNet += r.toplam;
        trs.push(`<tr><td>${idx + 1}</td><td class="num">${r.gun} gün</td><td class="num">%${num(row.querySelector('[data-f="oran"]'))}</td><td class="num">${tl(anapara)}</td><td class="num">${tl(r.faiz)}</td><td class="num"><strong>${tl(r.toplam)}</strong></td></tr>`);
      }
    });

    tabloEl.innerHTML = trs.join('');
    if (tur === 'alacak-faizi') {
      ozetEl.innerHTML = `
        <div class="co-kart"><span>Toplam Anapara</span><strong class="num">${tl(topBrut)}</strong></div>
        <div class="co-kart"><span>Toplam Faiz</span><strong class="num">${tl(topFaiz)}</strong></div>
        <div class="co-kart co-kart--vurgu"><span>Ödenecek Genel Toplam</span><strong class="num">${tl(topNet)}</strong></div>
      `;
      sonOzetMetni = `Toplam Anapara: ${tl(topBrut)} | Toplam Faiz: ${tl(topFaiz)} | Genel Toplam: ${tl(topNet)}`;
    } else {
      ozetEl.innerHTML = `
        <div class="co-kart"><span>Brüt / Hak Edilen Toplam</span><strong class="num">${tl(topBrut)}</strong></div>
        <div class="co-kart"><span>Toplam Kişi Kesintisi</span><strong class="num">${tl(topKesinti)}</strong></div>
        ${topPrim > 0 ? `<div class="co-kart"><span>Toplam SGK/Kesenek (D+K)</span><strong class="num">${tl(topPrim)}</strong></div>` : ''}
        <div class="co-kart co-kart--vurgu"><span>Ödenecek Net Toplam</span><strong class="num">${tl(topNet)}</strong></div>
      `;
      sonOzetMetni = `Brüt Toplam: ${tl(topBrut)} | Kişi Kesintisi: ${tl(topKesinti)} | Damga: ${tl(topDamga)} | Gelir Vergisi: ${tl(topGv)} | Ödenecek Net: ${tl(topNet)}`;
    }
  }

  root.querySelector('[data-co-ekle]')!.addEventListener('click', () => satirEkle(false));
  kopyalaBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(sonOzetMetni);
      const eski = kopyalaBtn.textContent;
      kopyalaBtn.textContent = 'Kopyalandı ✓';
      setTimeout(() => {
        kopyalaBtn.textContent = eski;
      }, 1800);
    } catch {
      alert(sonOzetMetni);
    }
  });

  satirEkle(true);
}
