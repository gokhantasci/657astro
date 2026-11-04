(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  // ---- DOM elemanları
  const dropZone = $('#dropZone');
  const fileInput = $('#excelInput');
  const hintEl = $('#selectedFilesHint');

  // ---- Sabitler
  const REQUIRED_SHEET = 'czmIstinafDefteriRaporu';
  const pageSize = 20;

  // ---- Durum
  let ozetData = [];
  let currentPage = 1;

  // ---- Yardımcılar
  const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [m]));
  const normalize = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  const letterToIndex = L => {
    L = String(L).toUpperCase().trim();
    let n = 0;
    for (let i = 0; i < L.length; i++) n = n * 26 + (L.charCodeAt(i) - 64);
    return n - 1;
  };

  function iconFor(type) {
    return type === 'success' ? 'check_circle' : type === 'warning' ? 'warning' : type === 'danger' ? 'error' : 'info';
  }

  function toastWithIcon(type, title, msg, delay = 5000) {
    if (typeof window.toast !== 'function') {
      return;
    }
    // HTML escape to prevent tag rendering in message
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    const bodyHtml = `<div style="display:flex;align-items:flex-start;gap:.5rem;">
      <span class="material-symbols-rounded" style="font-size:22px;">${iconFor(type)}</span>
      <div>${escapeHtml(msg)}</div></div>`;
    window.toast({
      type,
      title,
      body: bodyHtml,
      delay
    });
  }

  // Modal için dosya detaylarını göster
  function showFileDetailsModal(court, column, items) {
    // Remove existing modal if any
    const existing = document.getElementById('file-modal');
    if (existing) existing.remove();
    const existingBackdrop = document.getElementById('file-backdrop');
    if (existingBackdrop) existingBackdrop.remove();

    const columnNames = {
      incelemede: 'İncelemede',
      esastanRed: 'Esastan Red',
      bozma: 'Bozma',
      kismen: 'Kısmen'
    };
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'file-backdrop';
    backdrop.className = 'ozet-backdrop';
    document.body.appendChild(backdrop);
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'file-modal';
    modal.className = 'modal-card file-modal';
    modal.innerHTML = `
      <div class="modal-head">
        <h2>${court} - ${columnNames[column]}</h2>
        <div class="title-actions">
          <button id="file-close-top" class="btn btn-sm btn-outline-secondary" aria-label="Kapat">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      </div>
      <div class="modal-body">
        <div id="file-list-container"></div>
        <div id="file-pagination-container" class="mt-3"></div>
      </div>
      <div class="modal-foot d-flex justify-content-end">
        <button id="file-close-foot" class="btn btn-secondary btn-sm">Kapat</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Get elements
    const listContainer = modal.querySelector('#file-list-container');
    const paginationContainer = modal.querySelector('#file-pagination-container');
    const btnClose1 = modal.querySelector('#file-close-top');
    const btnClose2 = modal.querySelector('#file-close-foot');
    
    // Close functions
    const closeModal = () => {
      modal.classList.remove('show');
      backdrop.classList.remove('show');
      setTimeout(() => {
        modal.remove();
        backdrop.remove();
      }, 200);
    };
    
    btnClose1.addEventListener('click', closeModal);
    btnClose2.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    
    // Filter items
    const filtered = items.filter(it => {
      const itemCourt = extractCourtFromO(it.oRaw);
      if (itemCourt !== court) return false;
      
      const neticeRaw = String(deriveNeticeFromO(it.oRaw) || '');
      const oRaw = String(it.oRaw || '');
      
      function normTR(s) {
        return String(s || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
      }
      
      function isKismen(neticeRaw, oRaw) {
        const t = normTR(neticeRaw || oRaw);
        return /kısmen.*hükmün.*bozulmas[ıi]/i.test(t) || /kısmen.*esastan.*ret/i.test(t);
      }
      
      function isIncelemede(neticeRaw, oRaw) {
        const t = normTR(neticeRaw || oRaw);
        return /incelemede/i.test(t);
      }
      
      function isEsastanRed(neticeRaw, oRaw) {
        const t = normTR(neticeRaw || oRaw);
        // Kısmen varsa Esastan Red sayma
        if (/kısmen/i.test(t)) return false;
        return /esastan\s*red(d[iı]|i)?/i.test(t) || /esastan.*ret/i.test(t);
      }
      
      function isBozma(neticeRaw, oRaw) {
        const t = normTR(neticeRaw || oRaw);
        if (/kısmen/i.test(t)) return false;
        const hasBozulma = /hükmün\s*bozulmas[ıi]/i.test(t);
        const hasKararCekimi = /(karar[ıi]\s*(veril(mi[şs]|miştir)|bağlanmıştır))/i.test(t) || /karar[ıi]/i.test(t);
        return hasBozulma && hasKararCekimi;
      }
      
      if (column === 'kismen') return isKismen(neticeRaw, oRaw);
      if (column === 'incelemede') return isIncelemede(neticeRaw, oRaw);
      if (column === 'esastanRed') return isEsastanRed(neticeRaw, oRaw);
      if (column === 'bozma') return isBozma(neticeRaw, oRaw);
      return false;
    });
    
    // Pagination setup
    const itemsPerPage = 10;
    let currentPage = 1;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    function renderPage(page) {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = filtered.slice(start, end);
      
      const listHtml = pageItems.map((it, idx) => `
        <div class="border-bottom py-2">
          <div class="fw-bold">${start + idx + 1}. ${escapeHtml(it.esasNo || '-')}</div>
          <div class="small text-muted">${escapeHtml(it.oRaw || '-')}</div>
        </div>
      `).join('');
      
      listContainer.innerHTML = listHtml || '<p class="text-muted">Bu sayfada dosya bulunamadı.</p>';
      
      renderPagination(page);
    }
    
    function renderPagination(current) {
      if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
      }
      
      let paginationHtml = '<ul class="page-numbers">';
      
      // Previous
      if (current > 1) {
        paginationHtml += `<li><a class="page-numbers" href="#" data-page="${current - 1}">« Önceki</a></li>`;
      }
      
      // Page numbers
      for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
        if (i === current) {
          paginationHtml += `<li><span class="page-numbers current">${i}</span></li>`;
        } else {
          paginationHtml += `<li><a class="page-numbers" href="#" data-page="${i}">${i}</a></li>`;
        }
      }
      
      // Next
      if (current < totalPages) {
        paginationHtml += `<li><a class="page-numbers" href="#" data-page="${current + 1}">Sonraki »</a></li>`;
      }
      
      paginationHtml += '</ul>';
      
      paginationContainer.innerHTML = paginationHtml;
      
      // Add event listeners
      paginationContainer.querySelectorAll('a.page-numbers').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const page = parseInt(this.getAttribute('data-page'));
          currentPage = page;
          renderPage(page);
        });
      });
    }
    
    if (filtered.length === 0) {
      listContainer.innerHTML = '<p class="text-muted">Bu kategoride dosya bulunamadı.</p>';
      paginationContainer.innerHTML = '';
    } else {
      renderPage(1);
    }
    
    // Show modal
    modal.classList.add('show');
    backdrop.classList.add('show');
  }

  // --- Yardım butonu: yükleme kuralları
  const helpBtn = document.getElementById('istinafHelpBtn');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      toastWithIcon(
        'info',
        'Yükleme Bilgisi',
        'Excel dosyası .xls/.xlsx olmalıdır. Gerekli sayfa adı: <b>czmIstinafDefteriRaporu</b>. Birden fazla dosyayı seçebilirsiniz. Yükledikten sonra özet ve rapor araçları aktifleşir.',
        7000
      );
    });
  }

  function isExcelFile(f) {
    if (!f || !f.name) return false;
    const n = f.name.toLowerCase();
    return n.endsWith('.xls') || n.endsWith('.xlsx');
  }

  function isRedOrRet(netice){
	  return /^\s*re[dt]\s*-\s*/i.test(String(netice || ''));
  }

  function extractReasonFromNetice(netice){
	  const m = String(netice || '').match(/^\s*re[dt]\s*-\s*(.+)$/i);
	  return m ? m[1].trim() : '';
  }

  function renderKesinKararTablo(items){
	  // Filtre: "Red - …" veya "Ret - …"
	  const rows = (items || []).filter(it => isRedOrRet(it.netice));

	  // Kart konumu: reportContainer içine
	  const reportContainer = document.getElementById('reportContainer');
	  if (!reportContainer) return;

	  // Eski kartı sil, temiz kur
	  let card = document.getElementById('kesinKararCard');
	  if (card) card.remove();

	  card = document.createElement('div');
	  card.className = 'card mb-3';
	  card.id = 'kesinKararCard';

	  card.innerHTML = `
	  <div class="card-header d-flex justify-content-between align-items-center">
		<div class="d-flex align-items-center gap-2">
		  <span class="material-symbols-rounded">gavel</span>
		  <strong>1- Karar kesin olmasına veya öngörülen süre dolmasına rağmen kanun yolu merciine gönderilen dosyalar</strong>
		</div>
		<button id="btnCopyKesin" class="btn btn-outline-primary btn-sm" type="button">
		  <span class="material-symbols-rounded me-1" style="font-size: 1rem;">content_copy</span>
		  Kopyala
		</button>
	  </div>
	  <div class="card-body">
		<div class="table-responsive">
		  <table class="table table-hover" id="kesinKararTable">
			<thead>
			  <tr>
				<th>SIRA</th>
				<th>ESAS NO</th>
				<th>KARAR NO</th>
				<th>KARARIN KESİN OLMA SEBEBİ AÇIKLAMA</th>
			  </tr>
			</thead>
			<tbody></tbody>
		  </table>
		  ${rows.length ? '' : `<div class="text-muted">Uygun kayıt bulunamadı.</div>`}
		</div>
	  </div>
	`;

	  // reportContainer'a ekle
	  reportContainer.appendChild(card);

	  if (!rows.length) return;

	  const tbody = card.querySelector('#kesinKararTable tbody');
	  tbody.innerHTML = rows.map((it, idx) => {
      const reason = extractReasonFromNetice(it.netice) || it.netice || '';
      return `
		  <tr>
			<td class="num">${idx + 1}</td>
			<td>${(it.esasNo || '')}</td>
			<td>${(it.kararNo || '')}</td>
			<td>${reason}</td>
		  </tr>`;
	  }).join('');
	  const btnCopyKesin = card.querySelector('#btnCopyKesin');
    if (btnCopyKesin){
		  btnCopyKesin.addEventListener('click', () => copyTableBodyToClipboard('kesinKararTable'));
    }
  }


  const isEsasOrKararNo = v => /^\s*\d{4}\/\d{1,6}\s*$/.test(String(v || ''));
  const isDateLike = v => {
    const s = String(v || '').trim();
    return /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s);
  };

  function toDate(v) {
    if (!v) return null;
    if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(+v) ? null : v;
    const s = String(v).trim();
    let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) {
      const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
      return isNaN(+d) ? null : d;
    }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
      return isNaN(+d) ? null : d;
    }
    return null;
  }

  function extractDosyaNoFromD(text) {
    const m = String(text || '').match(/(\d{4}\/\d{1,6})/);
    return m ? m[1] : '';
  }

  async function copyTableBodyToClipboard(tableId){
	  const tbl = document.getElementById(tableId);
	  if (!tbl){ window.toast?.({type:'warning', title:'Bulunamadı', body:'Tablo bulunamadı.'}); return; }

	  const tbody = tbl.tBodies && tbl.tBodies[0];
	  if (!tbody){ window.toast?.({type:'warning', title:'Boş', body:'Kopyalanacak satır yok.'}); return; }

	  // tbody satırlarını TSV olarak hazırla
	  const lines = [];
	  for (const tr of Array.from(tbody.rows)){
      const cols = Array.from(tr.cells).map(td => String(td.textContent || '').trim());
      lines.push(cols.join('\t'));
	  }
	  const text = lines.join('\n');
	  if (!text){
      window.toast?.({type:'warning', title:'Boş', body:'Kopyalanacak satır yok.'});
      return;
	  }

	  try {
      if (navigator.clipboard && navigator.clipboard.writeText){
		  await navigator.clipboard.writeText(text);
      } else {
		  // Eski tarayıcı için fallback
		  const ta = document.createElement('textarea');
		  ta.value = text;
		  ta.style.position = 'fixed';
		  ta.style.left = '-9999px';
		  document.body.appendChild(ta);
		  ta.select();
		  document.execCommand('copy');
		  ta.remove();
      }
      window.toast?.({type:'success', title:'Kopyalandı', body:'Kopyalama işlemi başarılı.'});
	  } catch (e){
      window.toast?.({type:'danger', title:'Hata', body:'Panoya kopyalanamadı.'});
	  }
  }


  function renderNotSentTablo(items){
	  // KPI "Henüz Gönderilmemiş" ile aynı küme: classifyItem(...) => bucket === "not_sent"
	  const notSentRows = (items || []).filter(it => {
      // net kontrol: mevcut classifyItem ile uyuşsun
      const c = classifyItem({ oRaw: it.oRaw, netice: it.netice });
      return c && c.bucket === 'not_sent';
	  });

	  // Hedef: reportContainer içine, kesinKararCard'ın altına
	  const reportContainer = document.getElementById('reportContainer');
	  if (!reportContainer) return;

	  // Eski kart varsa temizle
	  let card = document.getElementById('notSentCard');
	  if (card) card.remove();

	  // Yeni kart
	  card = document.createElement('div');
	  card.className = 'card mb-3';
	  card.id = 'notSentCard';

	  card.innerHTML = `
	  <div class="card-header d-flex justify-content-between align-items-center">
		<div class="d-flex align-items-center gap-2">
		  <span class="material-symbols-rounded">schedule_send</span>
		  <strong>2- Kanun yolu merciine henüz gönderilmeyen dosyalar</strong>
		</div>
		<button id="btnCopyNotSent" class="btn btn-outline-primary btn-sm" type="button">
		  <span class="material-symbols-rounded me-1" style="font-size: 1rem;">content_copy</span>
		  Kopyala
		</button>
	  </div>
	  <div class="card-body">
		<div class="table-responsive">
		  <table class="table table-hover" id="notSentTable">
			<thead>
			  <tr>
				<th>SIRA</th>
				<th>ESAS NO</th>
				<th>KARAR NO</th>
				<th>KANUN YOLUNA BAŞVURMA TARİHİ</th>
			  </tr>
			</thead>
			<tbody></tbody>
		  </table>
		  ${notSentRows.length ? '' : `<div class="text-muted">Uygun kayıt bulunamadı.</div>`}
		</div>
	  </div>
	`;

	  // kesinKararCard'ın hemen altına yerleştir
	  const kesin = document.getElementById('kesinKararCard');
	  if (kesin) kesin.insertAdjacentElement('afterend', card);
	  else reportContainer.appendChild(card);

	  if (!notSentRows.length) return;

	  const tbody = card.querySelector('#notSentTable tbody');
	  tbody.innerHTML = notSentRows.map((it, idx) => `
		<tr>
		  <td class="num">${idx + 1}</td>
		  <td>${escapeHtml(it.esasNo || '')}</td>
		  <td>${escapeHtml(it.kararNo || '')}</td>
		  <td>${escapeHtml(it.istinafDilekceTarihi || '')}</td>
		</tr>
	  `).join('');

	  const btnCopyNotSent = card.querySelector('#btnCopyNotSent');
    if (btnCopyNotSent){
		  btnCopyNotSent.addEventListener('click', () => copyTableBodyToClipboard('notSentTable'));
    }
  }


  // O sütununu okunabilir, standart netice cümlesine çevirir
  function deriveNeticeFromO(text) {
    const raw = String(text || '').trim();
    if (!raw) {return 'İstinaf Dilekçesi verilmiş, başvuru değerlendirilmemiş';}

    // 1) Tam "Kabul"
    if (/^\s*kabul\s*$/i.test(raw)) {return 'İstinaf Dilekçesi verilmiş, başvuru kabul edilmiş';}

    // 2) "Kabul - ... Ceza Dairesi'ne Gönderilmiştir." → incelemede
    if (/^\s*kabul\s*-\s*/i.test(raw) && /ceza\s*dairesi.*gönderilmiştir/i.test(raw)) {
      const m = raw.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s+(\d+)\.\s*ceza\s*dairesi/i);
      if (m) {
        const il = m[1].trim();
        const daire = m[2];
        return `${il} Bölge Adliye Mahkemesi ${daire}. Ceza Dairesinde incelemede`;
      }
      return 'Bölge Adliye Mahkemesinde incelemede';
    }

    // 3) İstinaf Başvurusunun Reddi -> "İstinaf Başvurusunun Reddi (Esas No: ... Karar No: ...)"
    if (/^\s*istinaf\s*başvurusunun\s*reddi/i.test(raw)) {
      const match = raw.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s*(\d+)\.\s*ceza\s*dairesi.*?(\d{4}\/\d{1,6})\s+esas\s+(\d{4}\/\d{1,6})/);
      if (match) {
        const courtName = match[1]; // Mahkeme adı
        const daireNo = match[2];   // Daire numarası
        const esasNo = match[3];    // Esas No
        const kararNo = match[4];   // Karar No
        return `İstinaf Başvurusunun Reddi (Esas No: ${esasNo} Karar No: ${kararNo})`;
      }
      return 'İstinaf Başvurusunun Reddi';
    }

    // 4) “<il> BAM <n>. Ceza Dairesi ... ile ... kararına bağlanmıştır.” → normalize et
    const reNorm = /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s+(\d+)\.\s*ceza\s*dairesi[\s\S]*?\bile\s+(.+?)\s+karar(?:ına|ina)\b[\s\S]*?bağlanmıştır\.?/i;
    const m2 = raw.match(reNorm);
    if (m2) {
      const il = m2[1].trim();
      const daire = m2[2];
      const kararMetni = m2[3].replace(/\s+/g, ' ').trim();

      // İstinaf Başvurusunun Reddi için özel kontrol
      if (kararMetni === 'İstinaf Başvurusunun Reddi') {
        return 'Red - ? Sebep Kontrol Ediniz.';
      } else {
        return `${il} Bölge Adliye Mahkemesi ${daire}. Ceza Dairesi ${kararMetni} kararı vermiştir.`;
      }
    }


    // 4.5) "Sakarya Bölge Adliye Mahkemesi 1. Ceza Dairesi 21/02/2022 tarihinde 2021/1847 Esas 2022/341 Karar No ile İstinaf Başvurusunun Reddi kararına bağlanmıştır." → Red - (Esas No: 2021/1847 Karar No: 2022/341)
    const redMatch = raw.match(/([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s*(\d+)\.\s*ceza\s*dairesi.*?(\d{4}\/\d{1,6})\s+esas\s+(\d{4}\/\d{1,6})/);
    if (redMatch) {
      const courtName = redMatch[1]; // Mahkeme adı
      const daireNo = redMatch[2];   // Daire numarası
      const esasNo = redMatch[3];    // Esas No
      const kararNo = redMatch[4];   // Karar No
      return `Red - (? Sebep Kontrol ?) (Esas No: ${esasNo} Karar No: ${kararNo})`;
    }

    // 5) Bilinen kısa kalıplar
    if (/hükmün\s*bozulması/i.test(raw)) {return 'Hükmün Bozulması kararı verilmiş';}

    if (/esastan\s*reddi/i.test(raw)) {return 'İstinaf Başvurusunun Esastan Reddine kararı verilmiş';}

    if (/düzelterek\s*onama/i.test(raw)) {return 'Düzelterek Onama kararı verilmiş';}

    if (/\bonama\b/i.test(raw)) {return 'Onama kararı verilmiş';}

    // 6) Vazgeçme durumu ekleniyor (tarih formatına uygun)
    if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{1}\+?'de Vazgeçmiştir\./i.test(raw)) {
      return {
        bucket: 'withdrawn',
        decision: 'İstinaftan Vazgeçme'
      };
    }

    // 7) Varsayılan olarak metni olduğu gibi döndür
    return raw;
  }


  function parseDosyaNoKey(s) {
    const m = String(s || '').match(/(\d{4})\/(\d{1,6})/);
    return m ? [parseInt(m[1]), parseInt(m[2])] : [0, 0];
  }

  function renderRaporOzet(stats, fileCount, totalRows, emptyRows, duplicateRows) {
    const el = document.getElementById('raporOzetBody');
    if (!el) return;

    // 1. temel rakamlar
    const satirOkunan = totalRows ?? 0;
    const bosAtlanan = emptyRows ?? 0;
    const mukerrerAtlanan = duplicateRows ?? 0;
    const incelenen = satirOkunan - bosAtlanan - mukerrerAtlanan;
    const dosyaAdedi = fileCount ?? 1;

    // 2. En çok gönderilen daire
    let mostCourt = '-';
    if (stats.courtCount && Object.keys(stats.courtCount).length) {
      const sorted = Object.entries(stats.courtCount)
        .sort((a, b) => b[1] - a[1]);
      mostCourt = `${sorted[0][0]} (${sorted[0][1]} dosya)`;
    }

    // 3. En çok verilen karar türü
    let mostDecision = '-';
    if (stats.decisions && Object.keys(stats.decisions).length) {
      const sorted = Object.entries(stats.decisions)
        .sort((a, b) => b[1] - a[1]);
      mostDecision = `${sorted[0][0]} (${sorted[0][1]} karar)`;
    }

    // 4. Ek istatistik öneriler
    const total = stats.total || 0;
    const decided = stats.decided || 0;
    const pending = stats.pending_review || 0;
    const notSent = stats.not_sent || 0;
    const decidedRate = total ? ((decided / total) * 100).toFixed(1) : 0;
    const pendingRate = total ? ((pending / total) * 100).toFixed(1) : 0;

    // 5. Rapor özeti metni
    const html = `
		<ul class="report-summary">
		  <li><b>${dosyaAdedi}</b> XLS dosyasından toplam <b>${satirOkunan.toLocaleString('tr-TR')}</b> satır okundu.</li>
		  <li><b>${bosAtlanan.toLocaleString('tr-TR')}</b> satır boş olması nedeniyle, <b>${mukerrerAtlanan.toLocaleString('tr-TR')}</b> satır mükerrer olması nedeniyle atlandı.</li>
		  <li>İncelenen <b>${incelenen.toLocaleString('tr-TR')}</b> satırdan:</li>
		  <ul>
			<li>📂 En çok dosya <b>${mostCourt}</b>’ye gönderilmiş.</li>
			<li>⚖️ En çok <b>${mostDecision}</b> türünden karar verilmiş.</li>
			<li>📊 Karar verilen oran: <b>%${decidedRate}</b></li>
			<li>⏳ İncelemede olan oran: <b>%${pendingRate}</b></li>
			<li>📥 Henüz gönderilmemiş dosya sayısı: <b>${notSent.toLocaleString('tr-TR')}</b></li>
		  </ul>
		</ul>
	  `;

    el.innerHTML = html;
  }

  // Daire Özet Tablosundan Rapor Özeti güncelle - SADECE TABLO
  function updateRaporOzetFromTable() {
    // Tablo zaten renderDaireOzetTablo() tarafından gösteriliyor
    // Bu fonksiyon artık hiçbir şey yapmıyor
  }

  // Şehir + Daire ayıklama (gerekiyorsa üstte tanımlı olanı kullanın)
  function extractCourtFromO(oRaw) {
    const s = String(oRaw || '');
    const re = /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s+bölge\s+adliye\s+mahkemesi\s+(\d+)\.\s*ceza\s*dairesi/i;
    const m = s.match(re);
    if (!m) return null;
    const il = m[1].trim();
    const daireNo = m[2].trim();
    return `${il} Bölge Adliye Mahkemesi ${daireNo}. Ceza Dairesi`;
  }

  // Daire bazlı özet tablo + sıralama
  function renderDaireOzetTablo(items) {

    const counts = {}; // { court: { incelemede, esastanRed, bozma, kismen } }
    function normTR(s) {
      return String(s || '')
        .toLocaleLowerCase('tr')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // KISMEN: "Kısmen Hükmün Bozulması" / "Kısmen Esastan Ret" (öncelik!)
    function isKismen(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      return /kısmen.*hükmün.*bozulmas[ıi]/i.test(t) ||
                /kısmen.*esastan.*ret/i.test(t);
    }

    // İNCELEMEDE
    function isIncelemede(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      return /incelemede/i.test(t);
    }

    // ESASTAN RED (reddi/reddine/ret varyantları)
    function isEsastanRed(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      return /esastan\s*red(d[iı]|i)?/i.test(t) || /esastan.*ret/i.test(t);
    }

    // BOZMA: "Hükmün Bozulması ... kararı verilmiş/vermiştir/bağlanmıştır."
    // DİKKAT: Kısmen değilse!
    function isBozma(neticeRaw, oRaw) {
      const t = normTR(neticeRaw || oRaw);
      if (/kısmen/i.test(t)) return false; // kısmenler ayrı sütuna
      // çekirdek: "hükmün bozulması" + (kararı verilmiş|vermiştir|bağlanmıştır)
      const hasBozulma = /hükmün\s*bozulmas[ıi]/i.test(t);
      const hasKararCekimi = /(karar[ıi]\s*(veril(mi[şs]|miştir)|bağlanmıştır))/i.test(t) ||
                /karar[ıi]/i.test(t); // deriveNeticeFromO "kararı vermiştir" / "verilmiş" varyantı
      return hasBozulma && hasKararCekimi;
    }

    for (const it of (items || [])) {
      const court = extractCourtFromO(it.oRaw);
      if (!court) continue;

      const neticeRaw = String(deriveNeticeFromO(it.oRaw) || '');
      const oRaw = String(it.oRaw || '');

      if (!counts[court]) {
        counts[court] = {
          incelemede: 0,
          esastanRed: 0,
          bozma: 0,
          kismen: 0
        };
      }

      if (isKismen(neticeRaw, oRaw)) {
        counts[court].kismen++;
      } else if (isIncelemede(neticeRaw, oRaw)) {
        counts[court].incelemede++;
      } else if (isEsastanRed(neticeRaw, oRaw)) {
        counts[court].esastanRed++;
      } else if (isBozma(neticeRaw, oRaw)) {
        counts[court].bozma++;
      }
    }

    // Satır dizisi
    const rows = Object.entries(counts).map(([court, c]) => ({
      court,
      incelemede: c.incelemede | 0,
      esastanRed: c.esastanRed | 0,
      bozma: c.bozma | 0,
      kismen: c.kismen | 0
    }));

    // Toplamlar
    const totals = rows.reduce((acc, r) => {
      acc.incelemede += r.incelemede;
      acc.esastanRed += r.esastanRed;
      acc.bozma += r.bozma;
      acc.kismen += r.kismen;
      return acc;
    }, {
      incelemede: 0,
      esastanRed: 0,
      bozma: 0,
      kismen: 0
    });

    // Tablonun konacağı yer
    const panel = document.querySelector('#raporOzetBody') || document.getElementById('raporOzetBody');
    if (!panel) return;

    // Tablo iskeleti
    panel.innerHTML = `
		<table class="table table-ozet" id="daireOzetTable" style="width:100%;border-collapse:collapse">
		  <thead>
			<tr>
			  <th data-key="court"       class="orderable" style="width:40%">Daire</th>
			  <th data-key="incelemede"  class="orderable" style="width:15%">İncelemede</th>
			  <th data-key="esastanRed"  class="orderable" style="width:15%">Esastan Red</th>
			  <th data-key="bozma"       class="orderable" style="width:15%">Bozma</th>
			  <th data-key="kismen"      class="orderable" style="width:15%">Kısmen</th>
			</tr>
		  </thead>
		  <tbody></tbody>
		  <tfoot>
			<tr class="total-row">
			  <td><b>Toplam</b></td>
			  <td><b>${totals.incelemede}</b></td>
			  <td><b>${totals.esastanRed}</b></td>
			  <td><b>${totals.bozma}</b></td>
			  <td><b>${totals.kismen}</b></td>
			</tr>
		  </tfoot>
		</table>
	  `;

    const tbody = panel.querySelector('#daireOzetTable tbody');

    function drawBody(data) {
      tbody.innerHTML = data.map(r => `
		  <tr data-court="${escapeHtml(r.court)}">
			<td>${r.court}</td>
			<td class="num clickable" data-column="incelemede" style="cursor: pointer; text-decoration: underline;">${r.incelemede}</td>
			<td class="num clickable" data-column="esastanRed" style="cursor: pointer; text-decoration: underline;">${r.esastanRed}</td>
			<td class="num clickable" data-column="bozma" style="cursor: pointer; text-decoration: underline;">${r.bozma}</td>
			<td class="num clickable" data-column="kismen" style="cursor: pointer; text-decoration: underline;">${r.kismen}</td>
		  </tr>
		`).join('');
      
      // Click event'leri ekle
      tbody.querySelectorAll('td.clickable').forEach(td => {
        td.addEventListener('click', function() {
          const row = this.closest('tr');
          const court = row.getAttribute('data-court');
          const column = this.getAttribute('data-column');
          const count = parseInt(this.textContent);
          if (count > 0) {
            showFileDetailsModal(court, column, items);
          }
        });
      });
    }

    // İlk çizim
    drawBody(rows);

    // Sıralama
    const thead = panel.querySelector('#daireOzetTable thead');
    const sortState = {
      key: null,
      dir: 1
    }; // 1: asc, -1: desc

    thead.addEventListener('click', (e) => {
      const th = e.target.closest('.orderable');
      if (!th) return;
      const key = th.getAttribute('data-key');
      if (!key) return;

      // yönü değiştir
      if (sortState.key === key) sortState.dir *= -1;
      else {
        sortState.key = key;
        sortState.dir = 1;
      }

      const dir = sortState.dir;

      // oku güncelle
      thead.querySelectorAll('.orderable').forEach(thEl => thEl.classList.remove('asc', 'desc'));
      th.classList.add(dir === 1 ? 'asc' : 'desc');

      const sorted = rows.slice().sort((a, b) => {
        if (key === 'court') {
          return a.court.localeCompare(b.court, 'tr') * dir;
        } else {
          return ((a[key] || 0) - (b[key] || 0)) * dir;
        }
      });

      drawBody(sorted);
    });

  }


  async function readSheetRowsArray(file, requiredSheetName) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {
      type: 'array',
      cellDates: true,
      raw: false
    });
    const target = wb.SheetNames.find(n => n.toLowerCase().trim() === requiredSheetName.toLowerCase());
    if (!target) throw new Error(`Hatalı dosya yüklendi <b>${requiredSheetName}</b> sayfası bulunamadı`);
    const ws = wb.Sheets[target];
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false
    });
    return {
      sheetName: target,
      rows
    };
  }

  // ---- Sınıflandırma / İstatistik
  function classifyItem(item) {
    const o = normalize(item.oRaw || ''); // O sütunun ham metni
    const t = normalize(item.netice || ''); // türetilmiş açıklama

    // 1) Henüz Gönderilmemiş: O boş ya da tam "kabul"
    if (!o || o === 'kabul') {
      return {
        bucket: 'not_sent'
      };
    }

    // 2) İncelemede: "Kabul - ... Ceza Dairesi'ne Gönderilmiştir."
    if (o.startsWith('kabul -') && o.includes('ceza dairesi')) {
      return {
        bucket: 'pending_review'
      };
    }

    // 3) Red - ... (sebep değişken olabilir) → Karar Verilmiş (Red kararı)
    //    Örnek: "Red - Kesin Kararın İstinafının Reddi"
    if (o.startsWith('red -')) {
      return {
        bucket: 'decided',
        decision: 'Red'
      };
    }

    // 4) Karar Verilmiş: netice metninden karar türlerini yakala
    if (
      t.includes('kararı vermiş') ||
            t.includes('kararına bağlanmıştır') ||
            t.includes('karar verilmiş')
    ) {
      if (t.includes('hükmün bozulması')) {
        return {
          bucket: 'decided',
          decision: 'Bozma'
        };
      }
      if (t.includes('esastan red')) {
        return {
          bucket: 'decided',
          decision: 'Esastan Red'
        };
      }
      if (t.includes('düzelterek onama')) {
        return {
          bucket: 'decided',
          decision: 'Düzelterek Onama'
        };
      }
      if (t.includes('onama')) {
        return {
          bucket: 'decided',
          decision: 'Onama'
        };
      }
      return {
        bucket: 'decided',
        decision: 'Diğer'
      };
    }

    // 5) Ek güvenlik: netice cümlesinde “değerlendirilmemiş” varsa yine not_sent say
    if (t.includes('değerlendirilmemiş')) {
      return {
        bucket: 'not_sent'
      };
    }

    if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{1}\+?'de Vazgeçmiştir\./i.test(o)) {
      return {
        bucket: 'withdrawn', // Burada bucket olarak "withdrawn" ekliyoruz
        decision: 'İstinaftan Vazgeçme'
      };
    }

    // 7) Diğer her şey
    return {
      bucket: 'other'
    };
  }

  function computeStats(items) {
    const s = {
      total: items.length,
      withdrawn: 0,
      not_sent: 0,
      pending_review: 0,
      decided: 0,
      other: 0,
      decisions: {}
    };
    for (const it of items) {
      const c = classifyItem(it);
      if (c.bucket === 'decided') {
        s.decided++;
        const k = c.decision || 'Diğer';
        s.decisions[k] = (s.decisions[k] || 0) + 1;
      } else s[c.bucket]++;
    }
    return s;
  }

  // ---- Üst Sağ (detay) ve Üst Sol (KPI) render
  function renderStatsPanels(stats, fileCount, totalRows, emptyRows, duplicateRows) {
    // KPI kartlarını render et (yeni istinaf-kpi.js kullanarak)
    if (typeof window.istinafRenderKPICards === 'function') {
      window.istinafRenderKPICards(stats);
    }
    
    // Rapor Özeti Kartını reportContainer'a ekle
    const reportContainer = document.getElementById('reportContainer');
    if (reportContainer) {
      let raporOzetCard = document.getElementById('raporOzetCard');
      if (raporOzetCard) raporOzetCard.remove();
      
      raporOzetCard = document.createElement('div');
      raporOzetCard.className = 'card mb-3';
      raporOzetCard.id = 'raporOzetCard';
      
      raporOzetCard.innerHTML = `
        <div class="card-header">
          <div class="d-flex align-items-center gap-2">
            <span class="material-symbols-rounded">summarize</span>
            <strong>Rapor Özeti</strong>
          </div>
        </div>
        <div class="card-body" id="raporOzetBody">
          <!-- renderRaporOzet tarafından doldurulacak -->
        </div>
      `;
      
      reportContainer.insertBefore(raporOzetCard, reportContainer.firstChild);
      
      // Rapor özetini doldur
      renderRaporOzet(stats, fileCount, totalRows, emptyRows, duplicateRows);
    }
  }

  // ---- Dedupe: (Esas No + Karar No + Karar Tarihi), en eski İstinaf Dilekçesi
  function dedupeByEarliestIstinaf(items) {
    const map = new Map();
    let removed = 0;
    for (const it of items) {
      const key = [String(it.esasNo || ''), String(it.kararNo || ''), String(it.kararTarihi || '')].join('||');
      const cur = map.get(key);
      if (!cur) map.set(key, it);
      else {
        const d1 = toDate(it.istinafDilekceTarihi) || new Date(8640000000000000);
        const d0 = toDate(cur.istinafDilekceTarihi) || new Date(8640000000000000);
        if (d1 < d0) {
          map.set(key, it);
          removed++;
        } else {
          removed++;
        }
      }
    }
    return {
      items: Array.from(map.values()),
      removed
    };
  }

  // ---- Eski KPI fonksiyonu (artık kullanılmıyor - istinaf-kpi.js kullanılıyor)
  /*
  function ensureKpiCards() {
    const ustSol = $('#cardAltSol');
    if (!ustSol) return;

    const ch = ustSol.querySelector('.card-head');
    if (ch) ch.remove();

    let body = ustSol.querySelector('.card-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'card-body';
      ustSol.appendChild(body);
    }

    if (body.querySelector('.kpi-grid')) return;

    body.innerHTML = `
		<section class="kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;">
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">İstinaf Edilen</span><span class="material-symbols-rounded kpi-icon">work</span></div>
			<div class="kpi-value" id="kpiIstinafEdilen">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>

		  <!-- Yeni Vazgeçilen Kartı Eklendi -->
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Vazgeçilen<br></span><span class="material-symbols-rounded kpi-icon">cancel</span></div>
			<div class="kpi-value" id="kpiVazgecilen">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>

		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Henüz Gönderilmemiş</span><span class="material-symbols-rounded kpi-icon">outgoing_mail</span></div>
			<div class="kpi-value" id="kpiNotSent">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">İstinaf İncelemesinde</span><span class="material-symbols-rounded kpi-icon">assignment</span></div>
			<div class="kpi-value" id="kpiPending">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Karar Verilmiş<br></span><span class="material-symbols-rounded kpi-icon">gavel</span></div>
			<div class="kpi-value" id="kpiDecided">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>

		  <!-- YENİ: İşlem Sayısı -->
		  <div class="card kpi">
			<div class="kpi-head">
			  <span class="kpi-title">İşlem Sayısı</span>
			  <span class="material-symbols-rounded kpi-icon">contract_edit</span>
			</div>
			<div class="kpi-value" id="kpiIslem">0</div>
			<div class="kpi-sub muted">28/10/2025 tarihinden bugüne</div>
		  </div>
		</section>
		`;

  }
  */


  // ---- Modal: gerçek overlay + backdrop (benzersiz id’ler)
  (function injectModalStyles() {
    if (document.getElementById('kanunyolu-modal-style')) return;
    const css = `
      body.modal-open { overflow: hidden; }
      .ozet-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.5);
        z-index: 1040;
        display: none;
      }
      .ozet-backdrop.show {
        display: block;
      }
      .modal-card.ozet-modal {
        position: fixed;
        z-index: 1050;
        inset: 50% auto auto 50%;
        transform: translate(-50%,-50%);
        width: min(1100px, 96vw);
        max-height: 90vh;
        display: none;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,.3);
        overflow: hidden;
      }
      .modal-card.file-modal {
        position: fixed;
        z-index: 1050;
        inset: 50% auto auto 50%;
        transform: translate(-50%,-50%);
        width: min(800px, 96vw);
        max-height: 90vh;
        display: none;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,.3);
        overflow: hidden;
      }
      .modal-card.file-modal.show {
        display: flex;
        flex-direction: column;
      }
      [data-bs-theme="dark"] .modal-card.file-modal {
        background: var(--adalet-card-bg, #1E1E1E);
        color: var(--adalet-text, #E0E0E0);
        border: 1px solid var(--adalet-border, #34495E);
      }
      [data-bs-theme="light"] .modal-card.file-modal,
      :root:not([data-bs-theme="dark"]) .modal-card.file-modal {
        background: #fff;
        color: #212529;
        border: 1px solid var(--adalet-border, #BDC3C7);
      }
        background: var(--adalet-card-bg, #1E1E1E);
        color: var(--adalet-text, #E0E0E0);
        border: 1px solid var(--adalet-border, #34495E);
      }
      [data-bs-theme="light"] .modal-card.ozet-modal,
      :root:not([data-bs-theme="dark"]) .modal-card.ozet-modal {
        background: #fff;
        color: #212529;
        border: 1px solid var(--adalet-border, #BDC3C7);
      }
      [data-bs-theme="dark"] .modal-card .modal-head {
        border-bottom-color: var(--adalet-border, #34495E);
        background: var(--adalet-card-bg, #1E1E1E);
      }
      [data-bs-theme="dark"] .modal-card .modal-foot {
        border-top-color: var(--adalet-border, #34495E);
        background: var(--adalet-card-bg, #1E1E1E);
      }
      [data-bs-theme="dark"] #ozet-table {
        color: var(--adalet-text, #E0E0E0);
      }
      [data-bs-theme="dark"] #ozet-table thead {
        background: var(--adalet-light, #2C3E50);
        border-color: var(--adalet-border, #34495E);
        color: var(--adalet-text, #E0E0E0);
      }
      [data-bs-theme="dark"] #ozet-table thead.table-light {
        background: var(--adalet-light, #2C3E50);
      }
      [data-bs-theme="dark"] #ozet-table th,
      [data-bs-theme="dark"] #ozet-table td {
        border-color: var(--adalet-border, #34495E);
      }
      [data-bs-theme="dark"] #ozet-table tbody tr:hover {
        background: rgba(196, 30, 58, 0.1);
      }
      [data-bs-theme="dark"] #ozet-table.table-striped tbody tr:nth-of-type(odd) {
        background: rgba(255,255,255,.02);
      }
      [data-bs-theme="dark"] #ozet-search {
        background: var(--adalet-light, #2C3E50);
        border-color: var(--adalet-border, #34495E);
        color: var(--adalet-text, #E0E0E0);
      }
      [data-bs-theme="dark"] #ozet-search::placeholder {
        color: var(--adalet-text-light, #95A5A6);
      }
      [data-bs-theme="dark"] #ozet-search:focus {
        background: var(--adalet-light, #2C3E50);
        border-color: var(--adalet-primary, #C41E3A);
        box-shadow: 0 0 0 0.2rem rgba(196, 30, 58, 0.25);
      }
      [data-bs-theme="dark"] #ozet-pager-meta {
        color: var(--adalet-text-light, #95A5A6);
      }
      .modal-card .modal-head {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .modal-card .modal-head h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .modal-card .modal-body {
        padding: 1.5rem;
        overflow: auto;
        flex: 1;
      }
      .modal-card .modal-foot {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--bs-border-color);
      }
      .modal-card .title-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .modal-card .pager {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      #ozet-table {
        width: 100%;
        font-size: 0.875rem;
      }
      #ozet-table td,
      #ozet-table th {
        white-space: nowrap;
        padding: 0.5rem;
      }
    `;
    const style = document.createElement('style');
    style.id = 'kanunyolu-modal-style';
    style.textContent = css;
    document.head.appendChild(style);
  })();

  const backdrop = document.createElement('div');
  backdrop.className = 'ozet-backdrop';
  document.body.appendChild(backdrop);

  const modal = document.createElement('div');
  modal.id = 'ozet-modal';
  modal.className = 'modal-card ozet-modal';
  modal.innerHTML = `
    <div class="modal-head">
      <h2>İstinaf Özet Tablosu</h2>
      <div class="title-actions">
        <input id="ozet-search" class="form-control form-control-sm" placeholder="Ara..." style="width: 200px;">
        <button id="ozet-export-xls" class="btn btn-success btn-sm">
          <span class="material-symbols-rounded me-1" style="font-size: 1rem;">download</span>
          Excel
        </button>
        <button id="ozet-print-all" class="btn btn-primary btn-sm">
          <span class="material-symbols-rounded me-1" style="font-size: 1rem;">print</span>
          Yazdır
        </button>
        <button id="ozet-close-top" class="btn btn-sm btn-outline-secondary" aria-label="Kapat">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    </div>
    <div class="modal-body">
      <div id="ozet-pager-meta" class="text-muted mb-2"></div>
      <div class="table-responsive">
        <table id="ozet-table" class="table table-striped table-hover">
          <thead class="table-light">
            <tr>
              <th>Esas No</th>
              <th>Karar No</th>
              <th>Karar Tarihi</th>
              <th>İstinaf Dilekçesi Tarihi</th>
              <th>Netice</th>
              <th>Hakim</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
    <div class="modal-foot d-flex justify-content-between align-items-center">
      <div class="pager">
        <button id="ozet-page-prev" class="btn btn-outline-secondary btn-sm">
          <span class="material-symbols-rounded me-1" style="font-size: 1rem;">chevron_left</span>
          Önceki
        </button>
        <span id="ozet-page-info" class="text-muted mx-2"></span>
        <button id="ozet-page-next" class="btn btn-outline-secondary btn-sm">
          Sonraki
          <span class="material-symbols-rounded ms-1" style="font-size: 1rem;">chevron_right</span>
        </button>
      </div>
      <button id="ozet-close-foot" class="btn btn-secondary btn-sm">Kapat</button>
    </div>`;
  document.body.appendChild(modal);

  // Modal scoped elemanlar (ID çakışması önlendi)
  const modalTbody = modal.querySelector('#ozet-table tbody');
  const pagerInfo = modal.querySelector('#ozet-page-info');
  const pagerMeta = modal.querySelector('#ozet-pager-meta');
  const searchBox = modal.querySelector('#ozet-search');
  const btnPrev = modal.querySelector('#ozet-page-prev');
  const btnNext = modal.querySelector('#ozet-page-next');
  const btnClose1 = modal.querySelector('#ozet-close-top');
  const btnClose2 = modal.querySelector('#ozet-close-foot');
  const btnExport = modal.querySelector('#ozet-export-xls');
  const btnPrint = modal.querySelector('#ozet-print-all');

  function openModal() {
    document.body.classList.add('modal-open');
    backdrop.classList.add('show');
    modal.classList.add('show');
    renderModalPage();
  }

  function closeModal() {
    modal.classList.remove('show');
    backdrop.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
  backdrop.addEventListener('click', closeModal);
  btnClose1.addEventListener('click', closeModal);
  btnClose2.addEventListener('click', closeModal);

  function renderModalPage() {
    const term = searchBox.value.trim().toLowerCase();
    const filtered = term ?
      ozetData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(term))) :
      ozetData;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    modalTbody.innerHTML = pageItems.map(it => `
      <tr>
        <td>${escapeHtml(it.esasNo || '')}</td>
        <td>${escapeHtml(it.kararNo || '')}</td>
        <td>${escapeHtml(it.kararTarihi || '')}</td>
        <td>${escapeHtml(it.istinafDilekceTarihi || '')}</td>
        <td>${escapeHtml(it.netice || '')}</td>
        <td>${escapeHtml(it.hakim || '')}</td>
      </tr>
    `).join('');

    pagerInfo.textContent = `Sayfa ${currentPage}/${totalPages}`;
    pagerMeta.textContent = `${filtered.length} kayıt gösteriliyor (toplam ${ozetData.length})`;
  }

  btnPrev.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderModalPage();
    }
  });
  btnNext.addEventListener('click', () => {
    const term = searchBox.value.trim().toLowerCase();
    const filteredLen = term ?
      ozetData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(term))).length :
      ozetData.length;
    const totalPages = Math.max(1, Math.ceil(filteredLen / pageSize));
    if (currentPage < totalPages) {
      currentPage++;
      renderModalPage();
    }
  });
  searchBox.addEventListener('input', () => {
    currentPage = 1;
    renderModalPage();
  });

  btnExport.addEventListener('click', () => {
    // Export kolonları sabit sırada
    const exportRows = ozetData.map(it => ({
      'Esas No': it.esasNo,
      'Karar No': it.kararNo,
      'Karar Tarihi': it.kararTarihi,
      'İstinaf Dilekçesi Tarihi': it.istinafDilekceTarihi,
      'Netice': it.netice,
      'Hakim': it.hakim
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Özet');
    XLSX.writeFile(wb, 'istinaf_ozet.xlsx');
  });

  btnPrint.addEventListener('click', () => {
    const w = window.open('', '_blank');
    const exportRows = ozetData.map(it => `
      <tr>
        <td>${escapeHtml(it.esasNo || '')}</td>
        <td>${escapeHtml(it.kararNo || '')}</td>
        <td>${escapeHtml(it.kararTarihi || '')}</td>
        <td>${escapeHtml(it.istinafDilekceTarihi || '')}</td>
        <td>${escapeHtml(it.netice || '')}</td>
        <td>${escapeHtml(it.hakim || '')}</td>
      </tr>`).join('');
    w.document.write(`
      <html><head><title>İstinaf Özet Tablosu</title>
      <style>
        body{font:14px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell;}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;white-space:nowrap}
        thead{background:#eee}
      </style></head>
      <body>
        <h2>İstinaf Özet Tablosu</h2>
        <table>
          <thead><tr>
            <th>Esas No</th><th>Karar No</th><th>Karar Tarihi</th>
            <th>İstinaf Dilekçesi Tarihi</th><th>Netice</th><th>Hakim</th>
          </tr></thead>
          <tbody>${exportRows}</tbody>
        </table>
      </body></html>`);
    w.document.close();
    w.print();
  });

  function showOzetButton() {
    if (!$('#btnOpenOzet')) {
      const btn = document.createElement('button');
      btn.id = 'btnOpenOzet';
      btn.className = 'btn btn-outline-primary w-100';
      btn.innerHTML = '<span class="material-symbols-rounded me-1" style="font-size: 1rem;">table_chart</span>Özet Tabloyu Aç';
      btn.addEventListener('click', openModal);
      
      const container = document.getElementById('btnOzetContainer');
      if (container) {
        container.appendChild(btn);
      } else {
        document.body.appendChild(btn);
      }
    }
  }

  function getDateRangeFromRows(rowsInput) {
    // Her koşulda diziye normalize et
    const rows = Array.isArray(rowsInput) ?
      rowsInput :
      (window.__lastExcelRows && (window.__lastExcelRows.rowsUsed || window.__lastExcelRows.rows)) || [];

    if (!Array.isArray(rows) || rows.length === 0) return null;

    const eIdx = letterToIndex('E'); // Karar Tarihi
    const dates = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!Array.isArray(r)) continue;
      const d = dateFromCell(r[eIdx]);
      if (d instanceof Date && !isNaN(d)) dates.push(d);
    }

    if (dates.length === 0) return null;

    const minDate = new Date(Math.min.apply(null, dates));
    const maxDate = new Date(Math.max.apply(null, dates));
    return {
      min: minDate,
      max: maxDate
    };
  }

  function getDateRangeFromItems(items) {
    if (!Array.isArray(items) || !items.length) return null;
    const ds = [];
    for (const it of items) {
      const d = dateFromCell(it.kararTarihi);
      if (d instanceof Date && !isNaN(d)) ds.push(d);
    }
    if (!ds.length) return null;
    return {
      min: new Date(Math.min.apply(null, ds)),
      max: new Date(Math.max.apply(null, ds))
    };
  }


  function renderDateFilterZone() {
    const container = document.getElementById('dateFilterContainer');
    if (!container) return;

    // Eski zone varsa kaldır
    let wrap = document.getElementById('dateFilterZone');
    if (wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'dateFilterZone';
    wrap.className = 'mt-3';

    // Varsayılan min/max: ozetData içindeki Karar Tarihi'nden
    let minVal = '',
      maxVal = '';
    const rangeItems = getDateRangeFromItems(ozetData);
    if (rangeItems) {
      const fmt = (d) => d.toISOString().slice(0, 10);
      minVal = fmt(rangeItems.min);
      maxVal = fmt(rangeItems.max);
    }

    wrap.innerHTML = `
		<div class="row g-2">
		  <div class="col-12">
		    <label for="startDate" class="form-label small mb-1">İlk Tarih</label>
		    <input id="startDate" type="date" class="form-control" value="${minVal}">
		  </div>
		  <div class="col-12">
		    <label for="endDate" class="form-label small mb-1">Son Tarih</label>
		    <input id="endDate" type="date" class="form-control" value="${maxVal}">
		  </div>
		  <div class="col-6">
		    <button id="dateFilterBtn" type="button" class="btn btn-primary w-100">
		      <span class="material-symbols-rounded me-1" style="font-size: 1rem;">filter_alt</span>
		      Filtrele
		    </button>
		  </div>
		  <div class="col-6">
		    <button id="dateResetBtn" type="button" class="btn btn-outline-secondary w-100">
		      <span class="material-symbols-rounded me-1" style="font-size: 1rem;">refresh</span>
		      Sıfırla
		    </button>
		  </div>
		</div>
	  `;
    container.appendChild(wrap);

    const btnFilter = document.getElementById('dateFilterBtn');
    const btnReset = document.getElementById('dateResetBtn');

    btnFilter.addEventListener('click', () => {
      const sVal = document.getElementById('startDate').value;
      const eVal = document.getElementById('endDate').value;

      if (!Array.isArray(ozetData) || !ozetData.length) {
        window.toast?.({
          type: 'warning',
          title: 'Veri yok',
          body: 'Önce Excel yükleyin.'
        });
        return;
      }

      const start = sVal ? new Date(sVal + 'T00:00:00') : null;
      const end = eVal ? new Date(eVal + 'T23:59:59') : null;

      const filteredItems = ozetData.filter(it => {
        const d = dateFromCell(it.kararTarihi);
        if (!(d instanceof Date) || isNaN(d)) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });

      if (filteredItems.length) {
        window.toast?.({
          type: 'info',
          title: 'Filtre uygulandı',
          body: `${filteredItems.length} kayıt ${sVal || '?'} - ${eVal || '?'} aralığında`
        });
        // 🔁 Daire özet tablosunu FİLTRELENMİŞ item’larla yeniden oluştur
        // ✅ KPI + Karar Türleri panelini filtreye göre güncelle
        const statsFiltered = computeStats(filteredItems);
        renderStatsPanels(statsFiltered);

        // ✅ Daire özet tablosunu da filtreye göre yeniden çiz
        renderDaireOzetTablo(filteredItems);
        renderKesinKararTablo(filteredItems);
        renderNotSentTablo(filteredItems);
      } else {
        window.toast?.({
          type: 'warning',
          title: 'Kayıt bulunamadı',
          body: 'Bu tarih aralığında uygun kayıt yok.'
        });
      }
    });

    btnReset.addEventListener('click', () => {
      // Varsayılan item aralığına dön
      const r = getDateRangeFromItems(ozetData);
      const fmt = (d) => d && !isNaN(d) ? d.toISOString().slice(0, 10) : '';
      document.getElementById('startDate').value = r ? fmt(r.min) : '';
      document.getElementById('endDate').value = r ? fmt(r.max) : '';

      const all = ozetData; // tüm kayıtlar
      if (Array.isArray(all) && all.length) {
        // ✅ KPI + Karar Türleri panelini tam veriyle güncelle
        const statsAll = computeStats(all);
        renderStatsPanels(statsAll);

        // ✅ Tabloyu tam veriyle geri getir
        renderDaireOzetTablo(all);
        renderKesinKararTablo(all);
        renderNotSentTablo(all);

        window.toast?.({
          type: 'primary',
          title: 'Filtre sıfırlandı',
          body: 'Tüm kayıtlar gösteriliyor.'
        });
      }
    });
  }


  // Excel hücresinden JS Date üretir (dd/mm/yyyy, yyyy-mm-dd, Excel seri vs.)
  function dateFromCell(v) {
    if (v == null || v === '') return null;

    // Zaten Date ise
    if (Object.prototype.toString.call(v) === '[object Date]') {
      return isNaN(+v) ? null : v;
    }

    // Sayı veya sayısal string: Excel seri numarası desteği
    if (typeof v === 'number' || (/^\d+([.,]\d+)?$/.test(String(v).trim()))) {
      const n = Number(String(v).replace(',', '.'));
      // Excel seri tarih aralığı (yaklaşık): 1899-12-30 tabanlı
      if (!isNaN(n) && n > 25569 && n < 60000) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(epoch.getTime() + n * 86400 * 1000);
      }
      // sayısal ama seri değilse düşmeye devam etsin
    }

    const s = String(v).trim();

    // yyyy-mm-dd / yyyy.mm.dd / yyyy/mm/dd
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

    // dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy
    m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

    // Son çare: native parse (ISO vs.)
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }


// ---- Ana akış
async function processFiles(files) {
  // 0) Fonksiyon geneli için gerekli değişkenler (HER ŞEYDEN ÖNCE!)
  let excelFiles = [];
  const allItems = [];
  let totalRowsRead = 0;
  let skippedEmpty = 0;
  const rowsUsedRaw = [];

  // 1) Spinner aç
  try {
    try {
      window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerIst', true);
      window.XlsSpinner && window.XlsSpinner.show();
    } catch (e) {}

    // 2) Excel filtrele
    excelFiles = files.filter(isExcelFile);
    if (!excelFiles.length) {
      toastWithIcon('warning', 'Uyarı', 'Yalnızca <b>.xls</b> / <b>.xlsx</b> dosyalarına izin verilir.');
      return;
    }

    const COL = {
      D: letterToIndex('D'),
      E: letterToIndex('E'),
      F: letterToIndex('F'),
      J: letterToIndex('J'),
      O: letterToIndex('O'),
      Q: letterToIndex('Q') // HAKİM
    };

    // 3) Dosyaları oku
    for (const f of excelFiles) {
      try {
        const { rows } = await readSheetRowsArray(f, REQUIRED_SHEET);
        if (rows.length <= 1) continue;
        totalRowsRead += (rows.length - 1);

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const esasNo  = extractDosyaNoFromD(row[COL.D]);
          const kararNo = row[COL.F] || '';
          const kararTrh = row[COL.E] || '';
          const dilekce  = row[COL.J] || '';
          const netice   = deriveNeticeFromO(row[COL.O]);
          const hakim    = row[COL.Q] || '';
          const oHam     = row[COL.O] || ''; // O sütunun HAM metni

          // tamamen boş satırları atla
          if (!(isEsasOrKararNo(esasNo) || isEsasOrKararNo(kararNo) || isDateLike(kararTrh))) {
            skippedEmpty++;
            continue;
          }

          rowsUsedRaw.push(row);

          allItems.push({
            esasNo,
            kararNo,
            kararTarihi: kararTrh,
            istinafDilekceTarihi: dilekce,
            netice,              // deriveNeticeFromO ile
            hakim,
            oRaw: String(oHam)   // ham O sütunu
          });
        }
      } catch (err) {
        toastWithIcon('danger', 'Hatalı Dosya', err.message || 'Okuma/validasyon hatası.');
      }
    }
  } finally {
    // 4) Spinner kapat
    try {
      window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerIst', false);
      window.XlsSpinner && window.XlsSpinner.hide();
    } catch (e) {}
  }

  // 5) allItems artık burada güvenle kullanılabilir
  const beforeDedupe = allItems.length;
  const { items: deduped, removed: dupRemoved } = dedupeByEarliestIstinaf(allItems);

  deduped.sort((a, b) => {
    const [ya, na] = parseDosyaNoKey(a.esasNo);
    const [yb, nb] = parseDosyaNoKey(b.esasNo);
    return ya !== yb ? ya - yb : na - nb;
  });

  ozetData = deduped;

  window.__lastExcelRows = window.__lastExcelRows || {};
  window.__lastExcelRows.rowsUsed = rowsUsedRaw;

  if (window.istinafHakimFilter && typeof window.istinafHakimFilter.setData === 'function') {
    window.istinafHakimFilter.setData(ozetData);
  }

  renderDateFilterZone(rowsUsedRaw);

  showOzetButton();
  const stats = computeStats(deduped);
  renderStatsPanels(stats, excelFiles.length, totalRowsRead, skippedEmpty, dupRemoved);
  renderDaireOzetTablo(ozetData);
  renderKesinKararTablo(ozetData);
  renderNotSentTablo(ozetData);

  const bodyTxt =
    `${excelFiles.length} dosya işlendi. ${totalRowsRead} satır okundu, ` +
    `${dupRemoved} tekrar kaldırıldı.`;
  toastWithIcon('success', 'Rapor Hazır', bodyTxt, 7500);
}
  // ---- Olaylar
  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput && fileInput.click());
    ['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.style.opacity = '0.9';
    }));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.style.opacity = '1';
    }));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      Promise.resolve().then(() => processFiles(files));
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      Promise.resolve().then(() => processFiles(files));
    });
  }

  // Kısa sayı formatlayıcı (1.2K, 3.4M...)
  function nFormatter(num, digits = 1) {
    const abs = Math.abs(num);
    const units = [{
      v: 1e9,
      s: 'B'
    }, // milyar
    {
      v: 1e6,
      s: 'M'
    }, // milyon
    {
      v: 1e3,
      s: 'K'
    } // bin
    ];
    for (const u of units) {
      if (abs >= u.v) {
        const val = (num / u.v).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1');
        return `${val}${u.s}`;
      }
    }
    return String(num);
  }


  // Dış kaynaktan "İşlem Sayısı" çeker, KPI'yı günceller.
  // jQuery varsa jQuery.getJSON ile; yoksa fetch ile dener.
  function updateIslemSayaci() {
    const updateDom = (adetRaw) => {
      const kpiEl = document.getElementById('kpiIslem');
      if (kpiEl) kpiEl.textContent = nFormatter(adetRaw, 2);
      if (typeof window.loadExampleExcelAndRender === 'function') {
        try {
          window.loadExampleExcelAndRender(adetRaw);
        } catch (_) {}
      }
    };

    const onError = () => updateDom(0);

    // jQuery varsa
    if (window.jQuery && typeof window.jQuery.getJSON === 'function') {
      window.jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response) {
        try {
          const adetRaw = (response && typeof response.adet !== 'undefined') ? (response.adet * 1) : 0;
          updateDom(adetRaw);
        } catch (e) {
          onError();
        }
      }).fail(onError);
      return;
    }

    // jQuery yoksa fetch fallback
    fetch('https://sayac.657.com.tr/arttirkarar', {
      method: 'GET'
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(json => {
        const adetRaw = (json && typeof json.adet !== 'undefined') ? (json.adet * 1) : 0;
        updateDom(adetRaw);
      })
      .catch(onError);
  }

  // Event listeners
  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput && fileInput.click());
    ['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.style.opacity = '0.7';
    }));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.style.opacity = '1';
    }));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      processFiles(files);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      processFiles(files);
    });
  }

  // Sayfa açılışında bir kere çağır
  // ensureKpiCards(); // artık gerekmiyor, istinaf-kpi.js kullanıyoruz
  updateIslemSayaci();

  // ---- Hakim Filtreleme API (istinaf-hakim-filter.js tarafından çağrılacak)
  window.istinafFilterByHakim = function(filteredData) {
    if (filteredData === null) {
      // Filtreyi kaldır, tüm veriyi göster
      renderDaireOzetTablo(ozetData);
      renderKesinKararTablo(ozetData);
      renderNotSentTablo(ozetData);
      
      // KPI'ları güncelle (Rapor Özeti kartını oluşturmadan)
      const stats = computeStats(ozetData);
      if (typeof window.istinafRenderKPICards === 'function') {
        window.istinafRenderKPICards(stats);
      }
    } else {
      // Filtrelenmiş veriyi göster
      renderDaireOzetTablo(filteredData);
      renderKesinKararTablo(filteredData);
      renderNotSentTablo(filteredData);
      
      // KPI'ları filtrelenmiş veriye göre güncelle (Rapor Özeti kartını oluşturmadan)
      const stats = computeStats(filteredData);
      if (typeof window.istinafRenderKPICards === 'function') {
        window.istinafRenderKPICards(stats);
      }
    }
  };

})();
