export {};

interface Tesis {
  ad: string;
  kurum: string;
  ilce: string;
  adres: string;
  telefon: string;
  web: string;
  sosyal: string;
  fiyat: string;
  puan: string;
  googleMaps: string;
  kaynak: string;
  dogrulama: string;
}

interface IlVeri {
  plaka: string;
  ad: string;
  slug: string;
  tesisSayisi: number;
  dogrulanmisSayisi: number;
  tesisler: Tesis[];
}

const root = document.querySelector<HTMLElement>('[data-km-app]');
if (root) {
  const hamEl = document.querySelector('#km-veri');
  const iller: IlVeri[] = hamEl ? JSON.parse(hamEl.textContent || '[]') : [];
  const ilByPlaka = new Map(iller.map((x) => [x.plaka, x]));
  const ilBySlug = new Map(iller.map((x) => [x.slug, x]));

  const elHarita = root.querySelector<HTMLElement>('[data-km-harita]')!;
  const elTooltip = root.querySelector<HTMLElement>('[data-km-tooltip]')!;
  const elBaslik = root.querySelector<HTMLElement>('[data-km-il-baslik]')!;
  const elLink = root.querySelector<HTMLAnchorElement>('[data-km-il-link]')!;
  const elKartlar = root.querySelector<HTMLElement>('[data-km-kartlar]')!;
  const elAra = root.querySelector<HTMLInputElement>('[data-km-ara]')!;
  const elKurumBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-km-kurum]')];

  let seciliPlaka = '54'; // Varsayılan: Sakarya (veya ?il= parametresi)
  let seciliKurum = '';

  function tesisKartiHtml(t: Tesis, ilAd?: string): string {
    const telHtml = t.telefon
      ? `<p class="km-meta"><strong>Telefon:</strong> <a href="tel:${t.telefon.split('/')[0].replace(/[^+\d]/g, '')}">${t.telefon}</a></p>`
      : '';
    return `<article class="km-kart">
      <div class="km-kart__ust">
        <h3>${t.ad}${ilAd ? ` (${ilAd})` : ''}</h3>
        <span class="km-rozet">${t.kurum}</span>
      </div>
      <p class="km-meta">${t.ilce ? `${t.ilce} · ` : ''}${t.adres}</p>
      ${telHtml}
      <p class="km-fiyat"><strong>2026 Örnek Fiyat:</strong> ${t.fiyat}</p>
      <p class="km-meta"><strong>Google Maps:</strong> ${t.puan}</p>
      <div class="km-linkler">
        ${t.web ? `<a href="${t.web}" target="_blank" rel="noopener noreferrer">Resmî Web ↗</a>` : ''}
        ${t.sosyal ? `<a href="${t.sosyal}" target="_blank" rel="noopener noreferrer">Sosyal / Duyuru ↗</a>` : ''}
        <a href="${t.googleMaps}" target="_blank" rel="noopener noreferrer">Google Maps &amp; Puanlar ↗</a>
      </div>
    </article>`;
  }

  function guncelle() {
    const q = elAra.value.trim().toLocaleLowerCase('tr-TR');
    elHarita.querySelectorAll<SVGGElement>('g[id^="il-"]').forEach((g) => {
      g.classList.toggle('is-selected', g.dataset.plaka === seciliPlaka && !q);
    });

    if (q) {
      const bulunan: { t: Tesis; il: IlVeri }[] = [];
      for (const il of iller) {
        const ilUygun = il.ad.toLocaleLowerCase('tr-TR').includes(q) || il.plaka === q;
        for (const t of il.tesisler) {
          if (seciliKurum && t.kurum !== seciliKurum) continue;
          const metin = `${t.ad} ${t.kurum} ${t.ilce} ${t.adres}`.toLocaleLowerCase('tr-TR');
          if (ilUygun || metin.includes(q)) bulunan.push({ t, il });
        }
      }
      elBaslik.textContent = `Arama Sonuçları (${bulunan.length})`;
      elLink.hidden = true;
      elKartlar.innerHTML = bulunan.length
        ? bulunan.slice(0, 30).map((x) => tesisKartiHtml(x.t, x.il.ad)).join('')
        : '<p class="km-meta">Aramanıza uygun kamu misafirhanesi bulunamadı.</p>';
      return;
    }

    const il = ilByPlaka.get(seciliPlaka) ?? iller[0];
    if (!il) return;
    const filtreli = seciliKurum ? il.tesisler.filter((t) => t.kurum === seciliKurum) : il.tesisler;
    elBaslik.textContent = `${il.ad} Kamu Misafirhaneleri (${filtreli.length})`;
    elLink.hidden = false;
    elLink.href = `/kamu-misafirhaneleri/${il.slug}/`;
    elKartlar.innerHTML = filtreli.length
      ? filtreli.map((t) => tesisKartiHtml(t)).join('')
      : `<p class="km-meta">${il.ad} için "${seciliKurum}" kategorisinde kayıt bulunamadı; "Tümü" seçeneğini deneyin.</p>`;
  }

  elHarita.querySelectorAll<SVGGElement>('g[id^="il-"]').forEach((g) => {
    const plaka = g.dataset.plaka || '';
    const il = ilByPlaka.get(plaka);
    if (!il) return;
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `${il.ad} kamu misafirhaneleri (${il.tesisSayisi} tesis)`);

    const sec = () => {
      seciliPlaka = plaka;
      elAra.value = '';
      guncelle();
    };
    g.addEventListener('click', sec);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sec();
      }
    });
    g.addEventListener('mousemove', (e) => {
      const rect = elHarita.getBoundingClientRect();
      elTooltip.textContent = `${il.plaka} ${il.ad} · ${il.tesisSayisi} tesis`;
      elTooltip.style.left = `${Math.min(rect.width - 170, Math.max(8, e.clientX - rect.left + 12))}px`;
      elTooltip.style.top = `${Math.max(8, e.clientY - rect.top - 34)}px`;
      elTooltip.hidden = false;
    });
    g.addEventListener('mouseleave', () => {
      elTooltip.hidden = true;
    });
  });

  elAra.addEventListener('input', guncelle);
  elKurumBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      seciliKurum = btn.dataset.kmKurum || '';
      elKurumBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      guncelle();
    })
  );

  const qIl = new URLSearchParams(window.location.search).get('il')?.toLocaleLowerCase('tr-TR');
  if (qIl && ilBySlug.has(qIl)) {
    seciliPlaka = ilBySlug.get(qIl)!.plaka;
  }
  guncelle();
}
