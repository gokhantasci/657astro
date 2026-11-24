export {};
const root = document.querySelector<HTMLElement>('[data-hesap-hub]');
if (root) {
  const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

  // 1. Yüzde
  const yzA = root.querySelector<HTMLInputElement>('[data-h-yz-a]')!;
  const yzB = root.querySelector<HTMLInputElement>('[data-h-yz-b]')!;
  const yzOut = root.querySelector<HTMLElement>('[data-h-yz-out]')!;
  const yzHesap = () => {
    const a = Number(yzA.value) || 0;
    const b = Number(yzB.value) || 0;
    const yuzdesi = (a * b) / 100;
    const artmis = a + yuzdesi;
    const azalmis = a - yuzdesi;
    const oran = b !== 0 ? (a / b) * 100 : 0;
    yzOut.innerHTML = `${fmt(a)} sayısının %${fmt(b)}’si: <strong>${fmt(yuzdesi)}</strong> · %${fmt(b)} fazlası: <strong>${fmt(artmis)}</strong> · %${fmt(b)} eksiği: <strong>${fmt(azalmis)}</strong> · ${fmt(a)}, ${fmt(b)}’nin <strong>%${fmt(oran)}</strong>’idir.`;
  };
  yzA.addEventListener('input', yzHesap);
  yzB.addEventListener('input', yzHesap);
  yzHesap();

  // 2. KDV
  const kdvTutar = root.querySelector<HTMLInputElement>('[data-h-kdv-t]')!;
  const kdvOran = root.querySelector<HTMLSelectElement>('[data-h-kdv-o]')!;
  const kdvTip = root.querySelector<HTMLSelectElement>('[data-h-kdv-tip]')!;
  const kdvOut = root.querySelector<HTMLElement>('[data-h-kdv-out]')!;
  const kdvHesap = () => {
    const t = Number(kdvTutar.value) || 0;
    const o = Number(kdvOran.value) || 20;
    const dahil = kdvTip.value === 'dahil';
    const matrah = dahil ? t / (1 + o / 100) : t;
    const kdv = dahil ? t - matrah : (t * o) / 100;
    const toplam = matrah + kdv;
    kdvOut.innerHTML = `KDV Hariç Matrah: <strong>${fmt(matrah)} TL</strong> · KDV (%${o}): <strong>${fmt(kdv)} TL</strong> · KDV Dâhil Toplam: <strong>${fmt(toplam)} TL</strong>`;
  };
  [kdvTutar, kdvOran, kdvTip].forEach((e) => e.addEventListener('input', kdvHesap));
  kdvHesap();

  // 3. Tarih / Gün Farkı
  const tr1 = root.querySelector<HTMLInputElement>('[data-h-tr-1]')!;
  const tr2 = root.querySelector<HTMLInputElement>('[data-h-tr-2]')!;
  const trOut = root.querySelector<HTMLElement>('[data-h-tr-out]')!;
  const trHesap = () => {
    if (!tr1.value || !tr2.value) return;
    const d1 = new Date(tr1.value + 'T00:00:00');
    const d2 = new Date(tr2.value + 'T00:00:00');
    const gun = Math.round(Math.abs(d2.getTime() - d1.getTime()) / 86400000);
    const hafta = Math.floor(gun / 7);
    const kalanGun = gun % 7;
    const yil = (gun / 365.25).toFixed(2);
    trOut.innerHTML = `Toplam <strong>${gun.toLocaleString('tr-TR')} gün</strong> (${hafta} hafta ${kalanGun} gün · yaklaşık ${yil} yıl)`;
  };
  tr1.addEventListener('input', trHesap);
  tr2.addEventListener('input', trHesap);
  trHesap();

  // 4. VKİ (WHO) + İKM / Güvenlik Boy-Kilo Sınırı Kontrolü
  const vkiBoy = root.querySelector<HTMLInputElement>('[data-h-vki-boy]')!;
  const vkiKilo = root.querySelector<HTMLInputElement>('[data-h-vki-kilo]')!;
  const vkiOut = root.querySelector<HTMLElement>('[data-h-vki-out]')!;
  const vkiHesap = () => {
    const boyCm = Number(vkiBoy.value) || 0;
    const kilo = Number(vkiKilo.value) || 0;
    if (boyCm < 100 || kilo < 25) return;
    const m = boyCm / 100;
    const vki = kilo / (m * m);
    const sinif = vki < 18.5 ? 'Zayıf' : vki < 25 ? 'Normal (Sağlıklı)' : vki < 30 ? 'Fazla Kilolu' : 'Obez';
    const sonIki = boyCm % 100;
    const ikmMin = sonIki - 17;
    const ikmMax = sonIki + 13;
    const ikmUygun = kilo >= ikmMin && kilo <= ikmMax;
    vkiOut.innerHTML = `WHO VKİ: <strong>${vki.toFixed(1)} kg/m² (${sinif})</strong> · Adalet Bakanlığı İKM / Güvenlik boy-kilo aralığı: <strong>${ikmMin}–${ikmMax} kg</strong> (${ikmUygun ? 'Aralık içinde ✓' : 'Aralık dışında'})`;
  };
  vkiBoy.addEventListener('input', vkiHesap);
  vkiKilo.addEventListener('input', vkiHesap);
  vkiHesap();

  // 5. Kelime & Karakter Sayacı
  const ksIn = root.querySelector<HTMLTextAreaElement>('[data-h-ks-in]')!;
  const ksOut = root.querySelector<HTMLElement>('[data-h-ks-out]')!;
  const ksHesap = () => {
    const txt = ksIn.value;
    const kelimeler = txt.trim() ? txt.trim().split(/\s+/).length : 0;
    const bosluklu = txt.length;
    const bosluksuz = txt.replace(/\s/g, '').length;
    const cumle = txt.trim() ? txt.split(/[.!?]+/).filter((x) => x.trim()).length : 0;
    const okumaSn = Math.ceil((kelimeler / 200) * 60);
    ksOut.innerHTML = `Kelime: <strong>${kelimeler}</strong> · Karakter (boşluklu): <strong>${bosluklu}</strong> · Karakter (boşluksuz): <strong>${bosluksuz}</strong> · Cümle: <strong>${cumle}</strong> · Tahmini okuma: <strong>${okumaSn} sn</strong>`;
  };
  ksIn.addEventListener('input', ksHesap);
  ksHesap();
}
