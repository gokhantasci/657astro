import { hesapla, excelSay, TABLOLAR, GIDER_KALEMLERI, type Tablo, type GiderId, type Ucretler } from '../lib/yargilama-gideri';
import { tl, sayiOku } from '../lib/bicim';

const kok = document.querySelector<HTMLElement>('[data-yg]');
const veriEl = document.getElementById('yg-veri');
if (kok && veriEl) {
  const { ucretler }: { ucretler: Ucretler } = JSON.parse(veriEl.textContent!);
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = kok) => r.querySelector<T>(s)!;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = kok) => [...r.querySelectorAll<T>(s)];
  const adetInput = (t: Tablo, i: number) => $<HTMLInputElement>(`[data-yg-adet="${t}:${i}"]`);
  const giderler: Record<GiderId, number[]> = Object.fromEntries(GIDER_KALEMLERI.map(k => [k.id, []])) as unknown as Record<GiderId, number[]>;

  const adetOku = (inp: HTMLInputElement) => Math.max(0, Math.floor(sayiOku(inp.value)) || 0);
  const guncelle = () => {
    const adetler = Object.fromEntries(TABLOLAR.map(t => [t, ucretler[t].map((_, i) => adetOku(adetInput(t, i)))])) as Record<Tablo, number[]>;
    const r = hesapla(ucretler, { adetler, giderler });
    $('[data-yg-k="posta"]').textContent = tl(r.ozet.posta.tutar);
    $('[data-yg-k="etebligat"]').textContent = tl(r.ozet.etebligat.tutar);
    $('[data-yg-k="toplam"]').textContent = tl(r.toplam);
    $('[data-yg-dokum]').textContent = r.dokum;
    for (const t of TABLOLAR) $(`[data-yg-sekme-adet="${t}"]`).textContent = r.ozet[t].adet ? String(r.ozet[t].adet) : '';
  };

  // Adet alanları: yalnızca tam sayı, artı/eksi düğmeleri.
  $$<HTMLInputElement>('[data-yg-adet]').forEach(inp => {
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/[^\d]/g, ''); guncelle(); });
    inp.addEventListener('blur', () => { if (inp.value === '') inp.value = '0'; });
    inp.addEventListener('focus', () => inp.select());
  });
  kok.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-yg-artir], [data-yg-azalt]');
    if (!b) return;
    const inp = b.parentElement!.querySelector<HTMLInputElement>('input')!;
    inp.value = String(Math.max(0, adetOku(inp) + (b.hasAttribute('data-yg-artir') ? 1 : -1)));
    guncelle();
  });

  // Sekmeler: ok tuşlarıyla gezilir; betik yoksa bütün tablolar alt alta görünür.
  const sekmeler = $$<HTMLButtonElement>('[data-yg-sekme]');
  const sekmeSec = (t: string, odak = false) => {
    sekmeler.forEach(s => {
      const secili = s.dataset.ygSekme === t;
      s.setAttribute('aria-selected', String(secili));
      s.tabIndex = secili ? 0 : -1;
      if (secili && odak) s.focus();
    });
    $$('[data-yg-panel]').forEach(p => { p.hidden = p.dataset.ygPanel !== t; });
  };
  sekmeler.forEach((s, i) => {
    s.addEventListener('click', () => sekmeSec(s.dataset.ygSekme!));
    s.addEventListener('keydown', e => {
      const yon = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!yon) return;
      e.preventDefault();
      sekmeSec(sekmeler[(i + yon + sekmeler.length) % sekmeler.length].dataset.ygSekme!, true);
    });
  });
  sekmeSec(TABLOLAR[0]);

  // Tarihle bul: gg.aa.yyyy o güne düşen dönemi, yyyy o yıla dokunan dönemleri gösterir.
  $$<HTMLInputElement>('[data-yg-ara]').forEach(ara => {
    const panel = ara.closest<HTMLElement>('[data-yg-panel]')!;
    ara.addEventListener('input', () => {
      const q = ara.value.trim();
      const p = q.split(/[./-]/);
      let bas = '', bit = '';
      if (p.length === 3 && p[2].length === 4) bas = bit = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
      else if (/^\d{4}$/.test(q)) { bas = `${q}-01-01`; bit = `${q}-12-31`; }
      let gorunen = 0;
      $$('[data-yg-satir]', panel).forEach(li => {
        const sb = li.dataset.bas!, sbit = li.dataset.bit || '9999-12-31';
        const uyar = !q || (bas ? sb <= bit && sbit >= bas : li.textContent!.includes(q));
        li.hidden = !uyar;
        if (uyar) gorunen++;
      });
      $('[data-yg-bos]', panel).hidden = gorunen > 0;
    });
  });

  // Diğer giderler: her kaleme birden çok tutar.
  $$('[data-yg-kalem]').forEach(kalem => {
    const id = kalem.dataset.ygKalem as GiderId;
    const inp = $<HTMLInputElement>('[data-yg-tutar]', kalem);
    const liste = $('[data-yg-liste]', kalem);
    const ciz = () => {
      liste.replaceChildren(...giderler[id].map((v, i) => {
        const li = document.createElement('li');
        const s = document.createElement('span'); s.className = 'num'; s.textContent = tl(v);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'pin'; b.textContent = '×';
        b.setAttribute('aria-label', `${tl(v)} tutarını çıkar`);
        b.addEventListener('click', () => { giderler[id].splice(i, 1); ciz(); guncelle(); inp.focus(); });
        li.append(s, b);
        return li;
      }));
    };
    const ekle = () => {
      const v = sayiOku(inp.value);
      if (!(v > 0)) { inp.setAttribute('aria-invalid', 'true'); return; }
      inp.removeAttribute('aria-invalid');
      giderler[id].push(v);
      inp.value = '';
      ciz();
      guncelle();
    };
    $('[data-yg-ekle]', kalem).addEventListener('click', ekle);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ekle(); } });
  });

  // Excel: kütüphane yalnızca dosya seçilince indirilir.
  const durum = $('[data-yg-durum]');
  const birak = $('[data-yg-birak]');
  const yaz = (metin: string, hata = false) => { durum.hidden = false; durum.textContent = metin; durum.classList.toggle('birak__durum--hata', hata); };
  const dosyaIsle = async (f: File) => {
    if (!/\.(xls|xlsx)$/i.test(f.name)) { yaz('Yalnızca XLS ya da XLSX dosyası okunabilir.', true); return; }
    yaz(`${f.name} okunuyor…`);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const satirlar = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });
      const r = excelSay(satirlar, ucretler);
      const toplamSatir = r.sayac.aps + r.sayac.normal + r.sayac.etebligat + r.sayac.eyazisma + r.sayac.kep;
      if (!toplamSatir) { yaz('Dosyada esas numarası ve tebligat türü olan satır bulunamadı. UYAP tebligat sorgulama çıktısını yüklediğinizden emin olun.', true); return; }
      for (const t of TABLOLAR) r.adetler[t].forEach((n, i) => { if (n) { const inp = adetInput(t, i); inp.value = String(adetOku(inp) + n); } });
      guncelle();
      const esas = r.esaslar.length === 1 ? `${r.esaslar[0]} esas sayılı dosyada` : `${r.esaslar.length} esasta`;
      yaz(`${esas} ${r.sayac.aps} APS, ${r.sayac.normal} normal tebligat, ${r.sayac.etebligat} e-tebligat, ${r.sayac.eyazisma} e-yazışma ve ${r.sayac.kep} KEP iletisi sayıldı ve tarihlerine göre eklendi.`
        + (r.sayac.tarihsiz ? ` ${r.sayac.tarihsiz} satırın tarihi okunamadı ya da hiçbir ücret dönemine düşmedi; bunları elle ekleyin.` : ''));
    } catch {
      yaz('Dosya okunamadı. Excel dosyasının bozuk olmadığından emin olun.', true);
    }
  };
  $<HTMLInputElement>('[data-yg-dosya]').addEventListener('change', e => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) void dosyaIsle(f);
    (e.target as HTMLInputElement).value = '';
  });
  birak.addEventListener('dragover', e => { e.preventDefault(); birak.classList.add('is-uzerinde'); });
  birak.addEventListener('dragleave', () => birak.classList.remove('is-uzerinde'));
  birak.addEventListener('drop', e => {
    e.preventDefault();
    birak.classList.remove('is-uzerinde');
    const f = e.dataTransfer?.files?.[0];
    if (f) void dosyaIsle(f);
  });

  // Kopyala ve temizle
  const kopyalandi = $('[data-yg-kopyalandi]');
  $('[data-yg-kopyala]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('[data-yg-dokum]').textContent ?? ''); kopyalandi.textContent = 'Kopyalandı'; }
    catch { kopyalandi.textContent = 'Kopyalanamadı; metni seçip kopyalayın.'; }
    setTimeout(() => { kopyalandi.textContent = ''; }, 2500);
  });
  $('[data-yg-temizle]').addEventListener('click', () => {
    $$<HTMLInputElement>('[data-yg-adet]').forEach(i => { i.value = '0'; });
    for (const k of GIDER_KALEMLERI) giderler[k.id].length = 0;
    $$('[data-yg-liste]').forEach(l => l.replaceChildren());
    durum.hidden = true;
    guncelle();
  });
  guncelle();
}
