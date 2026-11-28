export {};

const root = document.querySelector<HTMLElement>('[data-gunluk]');

if (root) {
  const ana = root.querySelector<HTMLElement>('[data-gunluk-ana]')!;
  const dokum = root.querySelector<HTMLDListElement>('[data-gunluk-dokum]')!;
  const input = (name: string) => root.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-alan="${name}"]`)!;
  const val = (name: string) => input(name).value;
  const num = (name: string) => val(name) && input(name).validity.valid ? Number(val(name)) : NaN;
  const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  const percentage = (n: number) => Number.isFinite(n) ? `%${fmt(n)}` : 'Hesaplanamaz';
  const tl = (n: number) => `${fmt(n)} TL`;

  function show(title: string, rows: [string, string][] = []) {
    ana.textContent = title;
    dokum.replaceChildren(...rows.map(([label, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      return row;
    }));
  }

  const calculations = {
    yuzde() {
      const a = num('a'), b = num('b');
      if (![a, b].every(Number.isFinite)) return show('Sayı ve oran girin');
      const deger = a * b / 100;
      show(fmt(deger), [['Yüzde artış sonrası', fmt(a + deger)], ['Yüzde azalış sonrası', fmt(a - deger)], ['A, B’nin yüzde kaçı?', percentage(a / b * 100)]]);
    },
    kdv() {
      const t = num('tutar'), oran = num('oran');
      if (!Number.isFinite(t)) return show('Geçerli tutarı girin');
      const matrah = val('tur') === 'dahil' ? t / (1 + oran / 100) : t;
      const vergi = matrah * oran / 100;
      show(tl(vergi), [['KDV hariç tutar', tl(matrah)], ['KDV dâhil tutar', tl(matrah + vergi)]]);
    },
    'tarih-farki'() {
      const gun = Math.abs((input('son') as HTMLInputElement).valueAsNumber - (input('ilk') as HTMLInputElement).valueAsNumber) / 86_400_000;
      if (!Number.isFinite(gun)) return show('İki tarih seçin');
      show(`${fmt(gun)} gün`, [['Hafta ve gün', `${Math.floor(gun / 7)} hafta ${gun % 7} gün`]]);
    },
    vki() {
      const boy = num('boy'), kilo = num('kilo');
      if (![boy, kilo].every(Number.isFinite)) return show('Geçerli boy ve ağırlık girin');
      const vki = kilo / (boy / 100) ** 2;
      const sinif = vki < 18.5 ? 'Düşük ağırlık' : vki < 25 ? 'Normal aralık' : vki < 30 ? 'Fazla kilolu' : 'Obezite aralığı';
      show(`${vki.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg/m²`, [['DSÖ yetişkin sınıflaması', sinif]]);
    },
    'kelime-sayaci'() {
      const txt = val('metin');
      const kelime = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      show(`${fmt(kelime)} kelime`, [['Karakter', fmt([...txt].length)], ['Boşluksuz karakter', fmt([...txt.replace(/\s/g, '')].length)], ['Cümle', fmt(txt.split(/[.!?]+/).filter(x => x.trim()).length)], ['Tahmini okuma süresi', `${Math.ceil(kelime * 60 / 200)} sn`]]);
    },
  };

  const calculate = calculations[root.dataset.gunluk as keyof typeof calculations];
  if (calculate) {
    root.addEventListener('input', calculate);
    calculate();
  }
}
