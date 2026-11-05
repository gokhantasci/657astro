interface DistrictData {
  id: string;
  slug: string;
  ad: string;
  bounds: [number, number, number, number] | null;
  has_adliye: boolean;
  teskilat?: string | null;
  bagli_acm?: string | null;
  bagli_adliye?: string | null;
  cbs_var?: boolean;
}

interface CourthouseData {
  mahal: string;
  teskilat?: string;
  bagli_acm?: string;
  cbs_var?: boolean;
}

interface ProvinceData {
  plaka: string;
  ad: string;
  slug: string;
  bounds: [number, number, number, number];
  bam: string;
  bamColor: string;
  bim: string;
  bimColor: string;
  acm_sayisi: number;
  acmler: string[];
  adliye_sayisi: number;
  cbs_sayisi: number;
  cbsler?: string[];
  adliyeler: CourthouseData[];
  idare_mahkemesi: string;
  vergi_mahkemesi: string;
  ilceler: DistrictData[];
}

interface YargiData {
  viewBox: string;
  iller: Record<string, ProvinceData>;
  bamlar: Record<string, { ad: string; renk: string; iller: { plaka: string; ad: string }[] }>;
  bimler: Record<string, { ad: string; renk: string; iller: { plaka: string; ad: string }[] }>;
}

let activeLayer: 'bam' | 'bim' = 'bam';
export let selectedPlaka: string | null = null;
let currentViewBox = [1, 0, 1436, 629];
const defaultViewBox = [1, 0, 1436, 629];
let isAnimating = false;

function toSlug(s: string): string {
  if (!s) return '';
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i').replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function initYargiHaritasi(data: YargiData) {
  const svg = document.getElementById('yargi-svg') as SVGSVGElement | null;
  if (!svg) return;

  const tooltip = document.getElementById('yargi-tooltip');
  const panel = document.getElementById('yargi-detay-paneli');
  const layerButtons = document.querySelectorAll<HTMLButtonElement>('[data-yargi-layer]');
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-yargi-reset]');
  const zoomInBtn = document.querySelector<HTMLButtonElement>('[data-yargi-zoomin]');
  const zoomOutBtn = document.querySelector<HTMLButtonElement>('[data-yargi-zoomout]');
  const searchInput = document.getElementById('yargi-arama-input') as HTMLInputElement | null;
  const searchDropdown = document.getElementById('yargi-arama-sonuclar');
  const legendContainer = document.getElementById('yargi-lejant-ogeleri');

  // Parse initial viewBox
  const vbParts = (svg.getAttribute('viewBox') || '1 0 1436 629').split(' ').map(Number);
  currentViewBox = [vbParts[0], vbParts[1], vbParts[2], vbParts[3]];

  // 1. Apply Layer Colors
  function applyLayer(layer: 'bam' | 'bim') {
    activeLayer = layer;
    layerButtons.forEach(btn => {
      const active = btn.dataset.yargiLayer === layer;
      btn.classList.toggle('btn--primary', active);
      btn.classList.toggle('btn--quiet', !active);
      btn.setAttribute('aria-pressed', String(active));
    });

    for (const [plaka, il] of Object.entries(data.iller)) {
      const el = document.getElementById(`il-${plaka}`);
      if (el) {
        const color = layer === 'bam' ? il.bamColor : il.bimColor;
        el.style.setProperty('--il-renk', color);
        el.style.fill = color;
      }
    }
    renderLegend();
  }

  // 2. Render Legend
  function renderLegend() {
    if (!legendContainer) return;
    legendContainer.innerHTML = '';
    const items = activeLayer === 'bam' ? data.bamlar : data.bimler;

    for (const [ad, item] of Object.entries(items)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'yargi-lejant-chip';
      chip.dataset.mahkeme = ad;
      chip.innerHTML = `<span class="yargi-lejant-renk" style="background-color: ${item.renk}"></span><span class="yargi-lejant-ad">${ad}</span><span class="yargi-lejant-sayi">(${item.iller.length})</span>`;

      chip.addEventListener('click', () => {
        highlightRegion(ad, item.iller.map(i => i.plaka), true);
      });

      legendContainer.appendChild(chip);
    }
  }

  function highlightRegion(regionName: string, plakalar: string[], updateUrl = true) {
    const plakaSet = new Set(plakalar);
    selectedPlaka = null;

    document.querySelectorAll<SVGElement>('.yargi-il').forEach(el => {
      const plaka = el.getAttribute('data-plaka') || '';
      const inRegion = plakaSet.has(plaka);
      el.classList.toggle('yargi-il--dimmed', !inRegion);
      el.classList.toggle('yargi-il--region-active', inRegion);
      el.classList.remove('yargi-il--selected');
    });

    document.querySelectorAll<SVGElement>('.yargi-ilce').forEach(el => {
      el.classList.remove('yargi-ilce--visible', 'yargi-ilce--selected');
    });

    document.querySelectorAll<HTMLButtonElement>('.yargi-lejant-chip').forEach(chip => {
      const isMatch = chip.dataset.mahkeme === regionName;
      chip.classList.toggle('yargi-lejant-chip--active', isMatch);
    });

    if (plakalar.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pl of plakalar) {
        const b = data.iller[pl]?.bounds;
        if (b) {
          minX = Math.min(minX, b[0]);
          minY = Math.min(minY, b[1]);
          maxX = Math.max(maxX, b[2]);
          maxY = Math.max(maxY, b[3]);
        }
      }
      if (minX !== Infinity) {
        zoomToBox([minX, minY, maxX, maxY], 0.12);
      }
    }

    renderRegionPanel(regionName, plakalar);

    if (updateUrl && typeof window !== 'undefined') {
      const slug = toSlug(regionName);
      const url = new URL(window.location.href);
      url.searchParams.delete('il');
      url.searchParams.delete('ilce');
      url.searchParams.delete('bam');
      url.searchParams.delete('bim');
      url.searchParams.set('bolge', slug);
      window.history.pushState({ region: regionName, slug }, '', url.toString());
    }
  }

  function renderRegionPanel(regionName: string, plakalar: string[]) {
    if (!panel) return;
    const regionIller = plakalar.map(pl => data.iller[pl]).filter(Boolean);
    const toplamAcm = regionIller.reduce((acc, il) => acc + il.acm_sayisi, 0);
    const toplamCbs = regionIller.reduce((acc, il) => acc + (il.cbs_sayisi || 0), 0);
    const toplamAdliye = regionIller.reduce((acc, il) => acc + il.adliye_sayisi, 0);
    const toplamIlce = regionIller.reduce((acc, il) => acc + il.ilceler.length, 0);
    const isBam = regionName.includes('BAM');
    const color = isBam 
      ? data.bamlar[regionName]?.renk || '#3b82f6'
      : data.bimler[regionName]?.renk || '#6366f1';

    panel.innerHTML = `
      <div class="yargi-panel-baslik">
        <div class="yargi-panel-il-ad">
          <span class="yargi-plaka-rozet" style="background-color: ${color};">${isBam ? 'BAM' : 'BİM'}</span>
          <h2>${regionName}</h2>
        </div>
        <button type="button" class="btn btn--quiet btn--kucuk" data-yargi-kapat title="Seçimi temizle">✕ Kapat</button>
      </div>

      <div class="yargi-ozet-kutulari">
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${regionIller.length}</span>
          <span class="yargi-ozet-etiket">Bağlı İl</span>
        </div>
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${toplamAcm}</span>
          <span class="yargi-ozet-etiket">ACM Merkezi</span>
        </div>
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${toplamCbs}</span>
          <span class="yargi-ozet-etiket">Müstakil CBS</span>
        </div>
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${toplamAdliye}</span>
          <span class="yargi-ozet-etiket">Faal Adliye</span>
        </div>
      </div>

      <div class="yargi-bolum">
        <h3 class="yargi-bolum-baslik">
          <span class="yargi-bolum-ikon"></span> Yetki Alanındaki İller (${regionIller.length} İl, ${toplamIlce} İlçe)
        </h3>
        <div class="yargi-etiket-listesi" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
          ${regionIller.map(il => `
            <button type="button" class="btn btn--quiet btn--kucuk" data-yargi-il-sec="${il.plaka}">
              <strong>${il.ad}</strong> (${il.plaka}) · ${il.acm_sayisi} ACM
            </button>
          `).join('')}
        </div>
      </div>

      <div class="yargi-bolum" style="margin-top: 14px;">
        <div style="background: var(--color-paper-sunken); border: 1px dashed var(--color-rule); border-radius: var(--radius-sm); padding: 8px 10px; font-size: var(--text-xs); color: var(--color-ink-muted);">
           <strong>Paylaşılabilir Doğrudan Bağlantı:</strong> Bu bölgenin bağlantısını doğrudan tarayıcı adres çubuğundan kopyalayıp paylaşabilirsiniz.
        </div>
      </div>
    `;

    panel.querySelector('[data-yargi-kapat]')?.addEventListener('click', () => resetZoom(true));
    panel.querySelectorAll<HTMLButtonElement>('[data-yargi-il-sec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pl = btn.dataset.yargiIlSec;
        if (pl) selectProvince(pl, undefined, true);
      });
    });
  }

  // 3. Smooth Camera Animation (viewBox)
  function animateViewBox(target: number[], duration = 400) {
    if (isAnimating) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){currentViewBox=[...target];svg?.setAttribute('viewBox',target.join(' '));return;}
    isAnimating = true;
    const start = [...currentViewBox];
    const startTime = performance.now();

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = easeOutCubic(progress);

      currentViewBox = [
        start[0] + (target[0] - start[0]) * ease,
        start[1] + (target[1] - start[1]) * ease,
        start[2] + (target[2] - start[2]) * ease,
        start[3] + (target[3] - start[3]) * ease,
      ];

      svg?.setAttribute('viewBox', currentViewBox.map(v => Math.round(v * 10) / 10).join(' '));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimating = false;
        currentViewBox = [...target];
      }
    }

    requestAnimationFrame(step);
  }

  function zoomToBox(box: [number, number, number, number], paddingRatio = 0.15) {
    const [minX, minY, maxX, maxY] = box;
    const w = maxX - minX;
    const h = maxY - minY;
    const padX = w * paddingRatio;
    const padY = h * paddingRatio;

    let targetW = w + padX * 2;
    let targetH = h + padY * 2;
    let targetX = minX - padX;
    let targetY = minY - padY;

    // Maintain aspect ratio (1436 / 629 ~= 2.28)
    const svgAspect = 1436 / 629;
    const targetAspect = targetW / targetH;

    if (targetAspect > svgAspect) {
      // Wider than SVG, expand height
      const newH = targetW / svgAspect;
      targetY -= (newH - targetH) / 2;
      targetH = newH;
    } else {
      // Taller than SVG, expand width
      const newW = targetH * svgAspect;
      targetX -= (newW - targetW) / 2;
      targetW = newW;
    }

    animateViewBox([targetX, targetY, targetW, targetH]);
  }

  function resetZoom(updateUrl = true) {
    selectedPlaka = null;
    document.querySelectorAll('.yargi-il').forEach(el => {
      el.classList.remove('yargi-il--selected', 'yargi-il--dimmed', 'yargi-il--region-active');
    });
    document.querySelectorAll('.yargi-ilce').forEach(el => {
      el.classList.remove('yargi-ilce--visible', 'yargi-ilce--selected');
    });
    document.querySelectorAll('.yargi-lejant-chip').forEach(chip => {
      chip.classList.remove('yargi-lejant-chip--active');
    });
    animateViewBox(defaultViewBox);
    renderDefaultPanel();

    if (updateUrl && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('bolge');
      url.searchParams.delete('bam');
      url.searchParams.delete('bim');
      url.searchParams.delete('il');
      url.searchParams.delete('ilce');
      window.history.pushState({}, '', url.pathname);
    }
  }

  // 4. Province Selection & Detail Panel
  function selectProvince(plaka: string, focusDistrictSlug?: string, updateUrl = true) {
    selectedPlaka = plaka;
    const il = data.iller[plaka];
    if (!il) return;

    if (updateUrl && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('bolge');
      url.searchParams.delete('bam');
      url.searchParams.delete('bim');
      url.searchParams.set('il', plaka);
      if (focusDistrictSlug) url.searchParams.set('ilce', focusDistrictSlug);
      else url.searchParams.delete('ilce');
      window.history.pushState({ plaka, focusDistrictSlug }, '', url.toString());
    }

    // Highlight province element
    document.querySelectorAll('.yargi-il').forEach(el => {
      const isThis = el.getAttribute('data-plaka') === plaka;
      el.classList.toggle('yargi-il--selected', isThis);
      el.classList.toggle('yargi-il--dimmed', !isThis);
      el.classList.remove('yargi-il--region-active');
    });

    // Reveal district elements of this province
    document.querySelectorAll('.yargi-ilce').forEach(el => {
      const belongs = el.getAttribute('data-plaka') === plaka;
      el.classList.toggle('yargi-ilce--visible', belongs);
      if (focusDistrictSlug) {
        const isFocus = belongs && el.id.endsWith(focusDistrictSlug);
        el.classList.toggle('yargi-ilce--selected', isFocus);
      } else {
        el.classList.remove('yargi-ilce--selected');
      }
    });

    // Zoom camera to province bounding box
    if (il.bounds) {
      zoomToBox(il.bounds);
    }

    // Render detailed sidebar
    renderProvincePanel(il, focusDistrictSlug);
  }

  function renderProvincePanel(il: ProvinceData, focusDistrictSlug?: string) {
    if (!panel) return;

    // adliyeVarSayisi removed

    panel.innerHTML = `
      <div class="yargi-panel-baslik">
        <div class="yargi-panel-il-ad">
          <span class="yargi-plaka-rozet">${il.plaka}</span>
          <h2>${il.ad}</h2>
        </div>
        <button type="button" class="btn btn--quiet btn--kucuk" data-yargi-kapat title="Seçimi temizle">✕ Kapat</button>
      </div>

      <div class="yargi-ozet-kutulari">
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${il.acm_sayisi}</span>
          <span class="yargi-ozet-etiket">Ağır Ceza Mahalli</span>
        </div>
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${il.cbs_sayisi}</span>
          <span class="yargi-ozet-etiket">Müstakil Başsavcılık</span>
        </div>
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${il.adliye_sayisi}</span>
          <span class="yargi-ozet-etiket">Faal Adliye</span>
        </div>
        <div class="yargi-ozet-kutu">
          <span class="yargi-ozet-sayi">${il.ilceler.length}</span>
          <span class="yargi-ozet-etiket">Toplam İlçe</span>
        </div>
      </div>

      <div class="yargi-bolum">
        <h3 class="yargi-bolum-baslik">
          <span class="yargi-bolum-ikon"></span> Adli Yargı Teşkilatı
        </h3>
        <div class="yargi-bilgi-satir">
          <span class="yargi-bilgi-etiket">Bağlı Bölge Adliye Mahkemesi:</span>
          <span class="yargi-bilgi-deger">
            <span class="yargi-rozet" style="border-left: 4px solid ${il.bamColor};">${il.bam}</span>
          </span>
        </div>
        <div class="yargi-bilgi-satir">
          <span class="yargi-bilgi-etiket">Ağır Ceza Mahkemeleri (ACM):</span>
          <div class="yargi-etiket-listesi">
            ${il.acmler.map(acm => `<span class="yargi-acm-chip">${acm} ACM</span>`).join('')}
          </div>
        </div>
        <div class="yargi-bilgi-satir">
          <span class="yargi-bilgi-etiket">Adliyeler (${il.adliyeler.length} Mahal):</span>
          <div class="yargi-adliye-listesi">
            ${il.adliyeler.map(a => `
              <div class="yargi-adliye-oge ${a.teskilat === 'ACM' ? 'yargi-adliye-oge--acm' : ''}">
                <div>
                  <strong>${a.mahal}</strong>
                  ${a.cbs_var ? '<span class="yargi-cbs-rozet" title="Müstakil Cumhuriyet Başsavcılığı Var">CBS</span>' : ''}
                </div>
                <span class="yargi-teskilat-tur">${a.teskilat === 'ACM' ? 'Ağır Ceza Merkezi' : `${a.bagli_acm} ACM Mülhakatı`}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="yargi-bolum">
        <h3 class="yargi-bolum-baslik">
          <span class="yargi-bolum-ikon"></span> İdari Yargı Teşkilatı
        </h3>
        <div class="yargi-bilgi-satir">
          <span class="yargi-bilgi-etiket">Bağlı Bölge İdare Mahkemesi:</span>
          <span class="yargi-bilgi-deger">
            <span class="yargi-rozet" style="border-left: 4px solid ${il.bimColor};">${il.bim}</span>
          </span>
        </div>
        <div class="yargi-bilgi-satir">
          <span class="yargi-bilgi-etiket">Yetkili İdare Mahkemesi:</span>
          <span class="yargi-bilgi-deger"><strong>${il.idare_mahkemesi}</strong></span>
        </div>
        <div class="yargi-bilgi-satir">
          <span class="yargi-bilgi-etiket">Yetkili Vergi Mahkemesi:</span>
          <span class="yargi-bilgi-deger"><strong>${il.vergi_mahkemesi}</strong></span>
        </div>
      </div>

      <div class="yargi-bolum">
        <h3 class="yargi-bolum-baslik">
          <span class="yargi-bolum-ikon"></span> İlçe ve Adliye Teşkilatı (${il.ilceler.length} İlçe)
        </h3>
        <div class="yargi-ilceler-tablo-sarma">
          <table class="yargi-ilceler-tablo">
            <thead>
              <tr>
                <th>İlçe</th>
                <th>Adliye Durumu</th>
                <th>Bağlılık</th>
              </tr>
            </thead>
            <tbody>
              ${il.ilceler.map(c => `
                <tr class="${focusDistrictSlug === c.slug ? 'yargi-tr--vurgulu' : ''}">
                  <td><strong>${c.ad}</strong></td>
                  <td>
                    ${c.has_adliye 
                      ? `<span class="yargi-durum-rozet yargi-durum--var">Faal Adliye (${c.teskilat || 'Adliye'})</span>${c.cbs_var ? ' <span class="yargi-durum-rozet yargi-durum--cbs" title="Müstakil Cumhuriyet Başsavcılığı Var">Müstakil CBS</span>' : ''}` 
                      : `<span class="yargi-durum-rozet yargi-durum--yok">Adliye Yok</span>`}
                  </td>
                  <td class="text-sm">
                    <strong>${c.bagli_acm ? `${c.bagli_acm} ACM` : 'Merkez'}</strong>
                    ${!c.has_adliye && c.bagli_adliye ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">(${c.bagli_adliye} Adliyesi)</div>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    panel.querySelector('[data-yargi-kapat]')?.addEventListener('click', () => resetZoom(true));
  }

  function renderDefaultPanel() {
    if (!panel) return;
    const acmSet = new Set<string>();
    const idareSet = new Set<string>();
    let toplamCbs = 0;
    let toplamAdliye = 0;

    for (const il of Object.values(data.iller)) {
      toplamCbs += il.cbs_sayisi || 0;
      toplamAdliye += il.adliye_sayisi || 0;
      il.acmler.forEach(a => acmSet.add(a));
      if (il.idare_mahkemesi) idareSet.add(il.idare_mahkemesi);
    }

    panel.innerHTML = `
      <div class="yargi-panel-bos">
        <div class="yargi-panel-bos-ikon"></div>
        <h3>Türkiye Yargı Haritası</h3>
        <p>Harita üzerinden bir ile tıklayarak veya arama kutusundan il/ilçe adı yazarak adli ve idari yargı teşkilatını, bağlı olduğu BAM ve BİM bölgelerini, Ağır Ceza Mahkemelerini ve adliye teşkilatını ayrıntılarıyla inceleyebilirsiniz.</p>
        <div class="yargi-genel-istatistik">
          <div class="yargi-ozet-kutu">
            <span class="yargi-ozet-sayi">81</span>
            <span class="yargi-ozet-etiket">İl</span>
          </div>
          <div class="yargi-ozet-kutu">
            <span class="yargi-ozet-sayi">${Object.keys(data.bamlar).length}</span>
            <span class="yargi-ozet-etiket">Bölge Adliye (BAM)</span>
          </div>
          <div class="yargi-ozet-kutu">
            <span class="yargi-ozet-sayi">${Object.keys(data.bimler).length}</span>
            <span class="yargi-ozet-etiket">Bölge İdare (BİM)</span>
          </div>
          <div class="yargi-ozet-kutu">
            <span class="yargi-ozet-sayi">${acmSet.size}</span>
            <span class="yargi-ozet-etiket">Ağır Ceza Mahk. (ACM)</span>
          </div>
          <div class="yargi-ozet-kutu">
            <span class="yargi-ozet-sayi">${toplamCbs}</span>
            <span class="yargi-ozet-etiket">Müstakil Başsavcılık</span>
          </div>
          <div class="yargi-ozet-kutu">
            <span class="yargi-ozet-sayi">${idareSet.size}</span>
            <span class="yargi-ozet-etiket">İdare Mahkemesi</span>
          </div>
        </div>
      </div>
    `;
  }

  // 5. SVG Event Listeners (Hover & Click)
  document.querySelectorAll<SVGElement>('.yargi-il').forEach(el => {
    el.setAttribute('tabindex','0');
    el.setAttribute('role','button');
    el.setAttribute('aria-label',data.iller[el.getAttribute('data-plaka')??'']?.ad??'İl seç');
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
    el.addEventListener('click', () => {
      const plaka = el.getAttribute('data-plaka');
      if (plaka) selectProvince(plaka);
    });

    el.addEventListener('pointerenter', (e) => {
      const plaka = el.getAttribute('data-plaka');
      if (!plaka || !tooltip) return;
      const il = data.iller[plaka];
      if (!il) return;

      const layerText = activeLayer === 'bam' 
        ? `<strong>${il.bam}</strong>` 
        : `<strong>${il.bim}</strong>`;

      tooltip.innerHTML = `
        <div class="yargi-tt-baslik">${il.ad} (${il.plaka})</div>
        <div class="yargi-tt-satir">${activeLayer === 'bam' ? 'BAM' : 'BİM'}: ${layerText}</div>
        <div class="yargi-tt-satir">Ağır Ceza Mahalli: <strong>${il.acm_sayisi}</strong></div>
        <div class="yargi-tt-satir">Müstakil Başsavcılık: <strong>${il.cbs_sayisi}</strong></div>
        <div class="yargi-tt-satir">Adliyeli İlçe: <strong>${il.adliye_sayisi}</strong> / ${il.ilceler.length}</div>
        <div class="yargi-tt-satir text-sm">İdare: ${il.idare_mahkemesi}</div>
      `;
      tooltip.style.display = 'block';
      moveTooltip(e);
    });

    el.addEventListener('pointermove', moveTooltip);

    el.addEventListener('pointerleave', () => {
      if (tooltip) tooltip.style.display = 'none';
    });
  });

  document.querySelectorAll<SVGElement>('.yargi-ilce').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const plaka = el.getAttribute('data-plaka');
      const distId = el.getAttribute('id') || '';
      const slug = distId.split('-')[1];
      if (plaka) selectProvince(plaka, slug);
    });

    el.addEventListener('pointerenter', (e) => {
      const plaka = el.getAttribute('data-plaka');
      const distId = el.getAttribute('id') || '';
      const slug = distId.split('-')[1];
      if (!plaka || !tooltip) return;
      const il = data.iller[plaka];
      if (!il) return;
      const dist = il.ilceler.find(c => c.slug === slug || distId.endsWith(c.slug));
      if (!dist) return;

      tooltip.innerHTML = `
        <div class="yargi-tt-baslik">${dist.ad} İlçesi (${il.ad})</div>
        <div class="yargi-tt-satir">Adliye: <strong>${dist.has_adliye ? `Faal (${dist.teskilat || 'Adliye'})` : 'Müstakil Yok'}</strong></div>
        <div class="yargi-tt-satir">Bağlı ACM: <strong>${dist.bagli_acm ? `${dist.bagli_acm} ACM` : '-'}</strong></div>
        ${!dist.has_adliye && dist.bagli_adliye ? `<div class="yargi-tt-satir text-sm">Hizmet: ${dist.bagli_adliye} Adliyesi</div>` : ''}
      `;
      tooltip.style.display = 'block';
      moveTooltip(e);
    });

    el.addEventListener('pointermove', moveTooltip);
    el.addEventListener('pointerleave', () => {
      if (tooltip) tooltip.style.display = 'none';
    });
  });

  function moveTooltip(e: PointerEvent) {
    if (!tooltip) return;
    const tw = tooltip.offsetWidth || 230;
    const th = tooltip.offsetHeight || 130;
    let x = e.clientX + 14;
    let y = e.clientY + 14;

    // Flip to left if it would overflow the right viewport edge
    if (x + tw > window.innerWidth - 16) {
      x = e.clientX - tw - 14;
    }
    // Flip upwards if it would overflow the bottom viewport edge
    if (y + th > window.innerHeight - 16) {
      y = e.clientY - th - 14;
    }

    tooltip.style.transform = `translate3d(${Math.max(8, x)}px, ${Math.max(8, y)}px, 0)`;
  }

  // 6. Toolbar & Zoom Controls
  layerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.yargiLayer as 'bam' | 'bim';
      if (layer) applyLayer(layer);
    });
  });

  resetBtn?.addEventListener('click', () => resetZoom(true));

  zoomInBtn?.addEventListener('click', () => {
    const [x, y, w, h] = currentViewBox;
    const factor = 0.75;
    const nw = w * factor;
    const nh = h * factor;
    const nx = x + (w - nw) / 2;
    const ny = y + (h - nh) / 2;
    animateViewBox([nx, ny, nw, nh], 250);
  });

  zoomOutBtn?.addEventListener('click', () => {
    const [x, y, w, h] = currentViewBox;
    const factor = 1.33;
    const nw = Math.min(defaultViewBox[2], w * factor);
    const nh = Math.min(defaultViewBox[3], h * factor);
    const nx = Math.max(defaultViewBox[0], x - (nw - w) / 2);
    const ny = Math.max(defaultViewBox[1], y - (nh - h) / 2);
    animateViewBox([nx, ny, nw, nh], 250);
  });

  // 7. Live Search Autocomplete
  if (searchInput && searchDropdown) {
    const normalize = (s: string) => s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');

    searchInput.setAttribute('aria-controls','yargi-arama-sonuclar');
    searchInput.addEventListener('keydown',e=>{if(e.key==='Escape'){searchDropdown.hidden=true;}if(e.key==='ArrowDown'){e.preventDefault();searchDropdown.querySelector<HTMLButtonElement>('button')?.focus();}});
    searchInput.addEventListener('input', () => {
      const q = normalize(searchInput.value.trim());
      if (q.length < 2) {
        searchDropdown.hidden = true;
        searchDropdown.innerHTML = '';
        return;
      }

      const matches: { text: string; sub: string; plaka: string; districtSlug?: string }[] = [];

      // Search provinces
      for (const [plaka, il] of Object.entries(data.iller)) {
        if (normalize(il.ad).includes(q) || plaka === q) {
          matches.push({
            text: `${il.ad} (${plaka})`,
            sub: `${il.bam} · ${il.acm_sayisi} ACM · ${il.adliye_sayisi} Adliye`,
            plaka
          });
        }
        // Search districts
        for (const dist of il.ilceler) {
          if (normalize(dist.ad).includes(q)) {
            matches.push({
              text: `${dist.ad} İlçesi`,
              sub: `${il.ad} · ${dist.bagli_acm ? `${dist.bagli_acm} ACM` : ''} · ${dist.has_adliye ? 'Faal Adliye' : 'Müstakil Yok'}`,
              plaka,
              districtSlug: dist.slug
            });
          }
        }
      }

      if (matches.length === 0) {
        searchDropdown.innerHTML = '<div class="yargi-arama-bos">Eşleşen il veya ilçe bulunamadı</div>';
        searchDropdown.hidden = false;
        return;
      }

      searchDropdown.innerHTML = matches.slice(0, 10).map(m => `
        <button type="button" class="yargi-arama-oge" data-plaka="${m.plaka}" ${m.districtSlug ? `data-ilce="${m.districtSlug}"` : ''}>
          <span class="yargi-arama-ad">${m.text}</span>
          <span class="yargi-arama-sub">${m.sub}</span>
        </button>
      `).join('');

      searchDropdown.hidden = false;

      searchDropdown.querySelectorAll<HTMLButtonElement>('.yargi-arama-oge').forEach(btn => {
        btn.addEventListener('click', () => {
          const plaka = btn.dataset.plaka;
          const ilce = btn.dataset.ilce;
          if (plaka) {
            selectProvince(plaka, ilce);
            searchDropdown.hidden = true;
            searchInput.value = '';
          }
        });
      });
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target as Node) && !searchDropdown.contains(e.target as Node)) {
        searchDropdown.hidden = true;
      }
    });
  }

  // Initial State & Deep Link URL Routing
  function parseUrlState() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const bolgeParam = params.get('bolge') || params.get('bam') || params.get('bim');
    const ilParam = params.get('il');
    const ilceParam = params.get('ilce');

    if (bolgeParam) {
      const targetSlug = toSlug(bolgeParam);
      let matchedRegion: { ad: string; iller: { plaka: string; ad: string }[] } | null = null;
      let matchedLayer: 'bam' | 'bim' = 'bam';

      for (const [ad, item] of Object.entries(data.bamlar)) {
        const s = toSlug(ad);
        if (s === targetSlug || s.replace('-bam', '') === targetSlug) {
          matchedRegion = item;
          matchedLayer = 'bam';
          break;
        }
      }
      if (!matchedRegion) {
        for (const [ad, item] of Object.entries(data.bimler)) {
          const s = toSlug(ad);
          if (s === targetSlug || s.replace('-bim', '') === targetSlug) {
            matchedRegion = item;
            matchedLayer = 'bim';
            break;
          }
        }
      }

      if (matchedRegion) {
        applyLayer(matchedLayer);
        highlightRegion(matchedRegion.ad, matchedRegion.iller.map(i => i.plaka), false);
        return;
      }
    }

    if (ilParam) {
      let pl = ilParam.padStart(2, '0');
      if (!data.iller[pl]) {
        const found = Object.values(data.iller).find(i => toSlug(i.ad) === toSlug(ilParam));
        if (found) pl = found.plaka;
      }
      if (data.iller[pl]) {
        applyLayer('bam');
        selectProvince(pl, ilceParam || undefined, false);
        return;
      }
    }

    applyLayer('bam');
    renderDefaultPanel();
  }

  window.addEventListener('popstate', () => {
    parseUrlState();
  });

  parseUrlState();
}
