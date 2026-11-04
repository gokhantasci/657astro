/* ===============================
 * TEFTİŞ: KARAR KPI + RAPOR (tek parça)
 *  - Hakimler sadece Ayarlar/IDX i,j,k (varsayılan I,J,K) üzerinden toplanır (H KULLANILMAZ)
 *  - searchSicil: case-insensitive includes, boşsa filtre yok
 *  - Tarihler kullanıcı yazdığı gibi sabit kalır; başlangıç & bitiş günleri DAHİL
 *  - No-Judge modal, Case modal (pager + yazdır/indir), yatay sürükleme
 * =============================== */

/* ===============================
 * 1) Yardımcılar
 * =============================== */
(function(){
  if (typeof window.letterToIndex !== 'function'){
    window.letterToIndex = function(col){
      if (col == null) return 0;
      const s = String(col).trim().toUpperCase(); if (!s) return 0;
      let n = 0; for (let i = 0;i < s.length;i++){ const c = s.charCodeAt(i); if (c < 65 || c > 90) continue; n = n * 26 + (c - 64); }
      return Math.max(0,n - 1);
    };
  }
})();
function $(s){ return document.querySelector(s); }
function text(el,v){ if (el) el.textContent = String(v); }
function nonEmpty(v){ return v !== null && v !== undefined && String(v).trim() !== ''; }
function toNum(v){ if (v == null) return 0; const n = parseFloat(String(v).replace(',','.')); return isNaN(n) ? 0 : n; }
function siteAddress(){ try {return location.origin || (location.protocol + '//' + location.host);} catch (_){return 'https://657.com.tr';} }
function indexToLetter(index){ if (index == null || index < 0) return ''; let s = ''; let n = index + 1; while (n > 0){ const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); } return s; }
function yearFromCell(v){
  if (v == null) return '';
  const s = String(v).trim();
  if (/^\d{4}$/.test(s)) return s;
  const m = s.match(/(\d{4})/); if (m) return m[1];
  const n = Number(s.replace(',','.'));
  if (!isNaN(n) && n > 25569 && n < 60000){
    const epoch = new Date(Date.UTC(1899,11,30));
    const d = new Date(epoch.getTime() + n * 86400 * 1000);
    return String(d.getUTCFullYear());
  }
  return '';
}
function dateFromCell(v){
  if (v == null) return null;
  const s = String(v).trim();
  const m = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); if (m) return new Date(+m[1],+m[2] - 1,+m[3]);
  const n = Number(s.replace(',','.')); if (!isNaN(n) && n > 25569 && n < 60000){ const epoch = new Date(Date.UTC(1899,11,30)); return new Date(epoch.getTime() + n * 86400 * 1000); }
  const m2 = s.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/); if (m2) return new Date(+m2[3],+m2[2] - 1,+m2[1]);
  return null;
}
function fmtYMD(d){ if (!d) return ''; const mm = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2); return d.getFullYear() + '-' + mm + '-' + dd; }
function fmtTR(d){ if (!d) return ''; const dd = ('0' + d.getDate()).slice(-2), mm = ('0' + (d.getMonth() + 1)).slice(-2), yy = d.getFullYear(); return dd + '.' + mm + '.' + yy; }
function normalizeHeaderLabel(h){ const s = String(h || '').trim(); const m = s.match(/^\(\s*(.*?)\s*\)$/); return m ? m[1] : s; }
function fmtDMYstr(s){
  if (!s) return '';
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  const d = new Date(s); if (isNaN(d)) return String(s);
  const dd = ('0' + d.getDate()).slice(-2), mm = ('0' + (d.getMonth() + 1)).slice(-2), yy = d.getFullYear();
  return dd + '/' + mm + '/' + yy;
}

// Hakim anahtarlarını (sadece I,J,K) getir
function getJudgeKeysForRow(r, IDX){
  const out = []; function pushIf(v){ v = (v == null ? '' : String(v)).trim(); if (v) out.push(v); }
  pushIf(r[IDX.i]); pushIf(r[IDX.j]); pushIf(r[IDX.k]);
  return out;
}

/* ===============================
 * 2) No-Judge (Hakimi olmayan) Modal
 * =============================== */
(function(){
  function ensureStandardModal(){
    let modal = document.getElementById('standardModal'); if (modal) return modal;
    modal = document.createElement('div'); 
    modal.id = 'standardModal'; 
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'standardModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" id="standardModalLabel">
              <span class="material-symbols-rounded text-warning">warning</span>
              Tablo Format Uyumsuzluğu
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
          </div>
          <div class="modal-body">
            <p>Tablonuzun standart tablodan farkli oldugu goruldu, algilanan degisiklikler uygulandi, lutfen Ayarlar kismindaki sutunlarin dogru olup olmadigini yuklenen excel dosyanizdan teyit ediniz.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Tamam</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }
  function ensureNoJudgeModal(){
    let modal = document.getElementById('noJudgeModal'); if (modal) return modal;
    modal = document.createElement('div'); 
    modal.id = 'noJudgeModal'; 
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'noJudgeModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" id="noJudgeModalLabel">
              <span class="material-symbols-rounded text-warning">warning</span>
              Hakim Bilgisi Bulunmayan Dosyalar
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <input id="noJudgeSearch_missing" type="search" class="form-control" placeholder="Dosya / Esas / Karar No ara...">
            </div>
            <div class="table-responsive" id="noJudgeTableWrap">
              <table id="noJudgeTable" class="table table-sm table-hover">
                <thead class="table-light">
                      <tr>
                        <th>#</th>
                        <th>Esas No (C)</th>
                        <th>Karar No</th>
                        <th>Tür</th>
                        <th style="display:none">Savcı Sicili</th>
                          <th style="display:none">Hakim</th>
                      </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-success" id="btnNoJudgeExport_missing">
              <span class="material-symbols-rounded me-1" style="font-size:0.875rem;">download</span>
              Excel
            </button>
            <button class="btn btn-sm btn-secondary" id="btnNoJudgePrint_missing">
              <span class="material-symbols-rounded me-1" style="font-size:0.875rem;">print</span>
              Yazdır
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Kapat</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    document.getElementById('noJudgeSearch_missing').addEventListener('input',function(){ filterNoJudgeTable(this.value); });
    document.getElementById('btnNoJudgeExport_missing').addEventListener('click',exportNoJudgeToExcel);
    document.getElementById('btnNoJudgePrint_missing').addEventListener('click',printNoJudgeTable);
    return modal;
  }
  function fillNoJudgeTable(){
    const saved = window.__lastExcelRows; if (!saved || !saved.rowsUsed || !saved.noJudgeRows) return;
    const bIdx = letterToIndex('B'), cIdx = letterToIndex('C'), eIdx = letterToIndex('E');
    const rows = saved.rowsUsed, miss = saved.noJudgeRows;
    const tb = $('#noJudgeTable tbody'); if (!tb) return; tb.innerHTML = '';
    const data = [];
    for (let i = 0;i < miss.length;i++){
      const idx = miss[i], r = rows[idx] || [];
      const esas = nonEmpty(r[cIdx]) ? String(r[cIdx]) : '';
      const yil = yearFromCell(r[eIdx]) || ''; const b = nonEmpty(r[bIdx]) ? String(r[bIdx]) : '';
      const karar = (yil ? yil : '') + (b ? ('/' + b) : '');
      const tr = document.createElement('tr');
      tr.innerHTML = '<td style="padding:8px;border-bottom:1px solid #0001">' + (idx + 1) + '</td>' +
                   '<td style="padding:8px;border-bottom:1px solid #0001">' + esas + '</td>' +
                   '<td style="padding:8px;border-bottom:1px solid #0001">' + karar + '</td>';
      tb.appendChild(tr); data.push({sira:(idx + 1), esas:esas, karar:karar});
    }
    window.__noJudgeData = data;
    const s = $('#noJudgeSearch_missing'); if (s) s.value = '';
  }
  function filterNoJudgeTable(q){
    q = (q || '').toLowerCase(); const tb = $('#noJudgeTable tbody'); if (!tb || !window.__noJudgeData) return; tb.innerHTML = '';
    window.__noJudgeData.forEach(function(row){
      const t = (String(row.sira) + ' ' + row.esas + ' ' + row.karar).toLowerCase();
      if (q && t.indexOf(q) === -1) return;
      const tr = document.createElement('tr');
      tr.innerHTML = '<td style="padding:8px;border-bottom:1px solid #0001">' + row.sira + '</td>' +
                   '<td style="padding:8px;border-bottom:1px solid #0001">' + row.esas + '</td>' +
                   '<td style="padding:8px;border-bottom:1px solid #0001">' + row.karar + '</td>';
      tb.appendChild(tr);
    });
  }
  function printNoJudgeTable(){
    const w = window.open('','_blank'); if (!w) return; const addr = siteAddress();
    const wrap = $('#noJudgeTableWrap'); let html = wrap ? wrap.innerHTML : '';
    if (!html || html.indexOf('<table') === -1){
      const tableEl = $('#hakimKararlar') || document.querySelector('.report-table') || document.querySelector('table');
      if (!tableEl){ alert('Yazdırılacak tablo bulunamadı.'); try {w.close();} catch (_){ } return; }
      html = tableEl.outerHTML;
    }
    w.document.write('<html><head><meta charset="utf-8"><title>Hakim Bilgisi Bulunmayan</title>' +
                     '<style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:20px} th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}</style></head><body>' +
                     '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h2>Rapor</h2><div class="addr">' + addr + '</div></div>' +
                     html + '</body></html>');
    w.document.close(); try {w.focus(); w.print();} catch (_){}
  }
  function exportNoJudgeToExcel(){
    if (!window.XLSX){ alert('Excel dışa aktarım için XLSX kütüphanesi gerekli.'); return; }
    if (Array.isArray(window.__noJudgeData) && window.__noJudgeData.length){
      const aoa = [['Hakim Bilgisi Bulunmayan Dosyalar','',siteAddress()],[],['#','Esas No (C)','Karar No']];
      window.__noJudgeData.forEach(r => aoa.push([r.sira,r.esas,r.karar]));
      var wb = XLSX.utils.book_new(); var ws = XLSX.utils.aoa_to_sheet(aoa); XLSX.utils.book_append_sheet(wb, ws, 'Eksik Hakim'); XLSX.writeFile(wb,'hakim-bilgisi-eksik.xlsx'); return;
    }
    const tableEl = $('#hakimKararlar') || document.querySelector('.report-table') || document.querySelector('table');
    if (!tableEl){ alert('Dışa aktarılacak tablo bulunamadı.'); return; }
    var wb = XLSX.utils.book_new(); var ws = XLSX.utils.table_to_sheet(tableEl); XLSX.utils.book_append_sheet(wb, ws, 'Tablo'); XLSX.writeFile(wb,'rapor.xlsx');
  }
  function showNoJudgeModal(){ 
    const modalEl = ensureNoJudgeModal();
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    fillNoJudgeTable(); 
  }
  function hideNoJudgeModal(){ 
    const modalEl = document.getElementById('noJudgeModal'); 
    if (modalEl) {
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }
  }
  window.ensureStandardModal = ensureStandardModal;
  window.showNoJudgeModal = showNoJudgeModal;
  window.hideNoJudgeModal = hideNoJudgeModal;
})();

/* ===============================
 * 3) Case Modal (pager + yazdır/indir)
 * =============================== */
(function(){
  function ensureCaseModal(){
    let m = $('#caseModal'); if (m) return m;
    m = document.createElement('div'); 
    m.id = 'caseModal'; 
    m.className = 'modal fade';
    m.setAttribute('tabindex', '-1');
    m.setAttribute('aria-labelledby', 'caseModalLabel');
    m.setAttribute('aria-hidden', 'true');

    m.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2" id="caseModalLabel">
              <span class="material-symbols-rounded">list_alt</span>
              <span id="caseModalTitle">Kayıtlar</span>
                  <div class="ms-3 d-flex align-items-center gap-2">
                <div class="form-check form-switch" style="font-size:0.9rem;">
                  <input class="form-check-input" type="checkbox" id="caseToggleType" />
                  <label class="form-check-label small" for="caseToggleType">Tür</label>
                </div>
                <div class="form-check form-switch" style="font-size:0.9rem;">
                  <input class="form-check-input" type="checkbox" id="caseToggleSavci" />
                  <label class="form-check-label small" for="caseToggleSavci">Savcı</label>
                </div>
                    <div class="form-check form-switch" style="font-size:0.9rem;">
                      <input class="form-check-input" type="checkbox" id="caseToggleHakim" />
                      <label class="form-check-label small" for="caseToggleHakim">Hakim</label>
                    </div>
              </div>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <input id="caseSearch" type="search" class="form-control form-control-sm" placeholder="Ara... (Esas No, Karar No)">
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover" id="caseTable">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Esas No (C)</th>
                    <th>Karar No</th>
                    <th style="display:none">Tür</th>
                    <th style="display:none">Savcı Sicili</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-success" id="btnCaseExportAll">
                <span class="material-symbols-rounded me-1" style="font-size:0.875rem;">download</span>
                İndir (XLS)
              </button>
              <button class="btn btn-sm btn-secondary" id="btnCasePrintAll">
                <span class="material-symbols-rounded me-1" style="font-size:0.875rem;">print</span>
                Yazdır
              </button>
            </div>
            <div class="d-flex gap-2 align-items-center">
              <button class="btn btn-sm btn-outline-secondary" id="btnCasePrev">
                <span class="material-symbols-rounded" style="font-size:0.875rem;">chevron_left</span>
              </button>
              <span id="casePager" class="text-muted small" style="min-width:80px;text-align:center"></span>
              <button class="btn btn-sm btn-outline-secondary" id="btnCaseNext">
                <span class="material-symbols-rounded" style="font-size:0.875rem;">chevron_right</span>
              </button>
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Kapat</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(m);

    $('#btnCasePrev').addEventListener('click', () => pageCase(-1));
    $('#btnCaseNext').addEventListener('click', () => pageCase(1));
    $('#btnCasePrintAll').addEventListener('click', printAllCases);
    $('#btnCaseExportAll').addEventListener('click', exportAllCases);
    $('#caseSearch').addEventListener('input', (e) => filterCaseTable(e.target.value));
    // toggle handlers for modal header switches
    const typeToggle = document.getElementById('caseToggleType');
    const savciToggle = document.getElementById('caseToggleSavci');
    const hakimToggle = document.getElementById('caseToggleHakim');
    if (typeToggle){ typeToggle.addEventListener('change', function(){ CASE_STATE.showTypeForced = this.checked; window.teftisStorage.setItem('case.showType', this.checked ? '1' : '0'); renderCaseTable(); }); }
    if (savciToggle){ savciToggle.addEventListener('change', function(){ CASE_STATE.showSavciForced = this.checked; window.teftisStorage.setItem('case.showSavci', this.checked ? '1' : '0'); renderCaseTable(); }); }
    if (hakimToggle){ hakimToggle.addEventListener('change', function(){ CASE_STATE.showHakimForced = this.checked; window.teftisStorage.setItem('case.showHakim', this.checked ? '1' : '0'); renderCaseTable(); }); }
    return m;
  }
  const CASE_STATE = {rows:[], filteredRows:[], page:1, size:10, title:'', searchQuery:'', decisionType: null, showSavci: false, showSavciForced: null, showTypeForced: null, showHakim: false, showHakimForced: null};
  
  function filterCaseTable(query){
    CASE_STATE.searchQuery = query.toLowerCase();
    if (!query.trim()) {
      CASE_STATE.filteredRows = CASE_STATE.rows;
    } else {
      CASE_STATE.filteredRows = CASE_STATE.rows.filter(r => {
        const searchText = (String(r.sira || '') + ' ' + String(r.esas || '') + ' ' + String(r.karar || '') + ' ' + String(r.karartur || '') + ' ' + String(r.savci || '') + ' ' + String(r.hakim || '')).toLowerCase();
        return searchText.indexOf(CASE_STATE.searchQuery) > -1;
      });
    }
    CASE_STATE.page = 1; // Reset to first page
    renderCaseTable();
    // Show a small '(auto)' hint if savcı or hakim columns are shown automatically (not forced)
    const savciLabel = document.querySelector('label[for="caseToggleSavci"]');
    if (savciLabel){ let hint = savciLabel.querySelector('.tiny-auto'); if (CASE_STATE.showSavciForced === null && CASE_STATE.showSavci){ if (!hint){ hint = document.createElement('span'); hint.className='tiny-auto ms-1 text-muted small'; hint.textContent='(auto)'; savciLabel.appendChild(hint); } } else if (hint) { hint.remove(); } }
    const hakimLabel = document.querySelector('label[for="caseToggleHakim"]');
    if (hakimLabel){ let hint = hakimLabel.querySelector('.tiny-auto'); if (CASE_STATE.showHakimForced === null && CASE_STATE.showHakim){ if (!hint){ hint = document.createElement('span'); hint.className='tiny-auto ms-1 text-muted small'; hint.textContent='(auto)'; hakimLabel.appendChild(hint); } } else if (hint) { hint.remove(); } }
  }
  
  function renderCaseTable(){
    const tb = $('#caseTable tbody'); if (!tb) return; tb.innerHTML = '';
    const autoType = CASE_STATE.decisionType === 'Toplam';
    const showType = CASE_STATE.showTypeForced !== null ? CASE_STATE.showTypeForced : !!autoType;
    const autoSavci = Array.isArray(CASE_STATE.rows) && CASE_STATE.rows.some(r => !!(r.savci || '').toString().trim());
    const showSavci = CASE_STATE.showSavciForced !== null ? CASE_STATE.showSavciForced : !!autoSavci;
    const autoHakim = Array.isArray(CASE_STATE.rows) && CASE_STATE.rows.some(r => !!(r.hakim || '').toString().trim());
    const showHakim = CASE_STATE.showHakimForced !== null ? CASE_STATE.showHakimForced : !!autoHakim;
    // Build header dynamically to avoid misalignment when toggles change
    const columns = [ { key: 'sira', label: '#' }, { key: 'esas', label: 'Esas No (C)' }, { key: 'karar', label: 'Karar No' } ];
    if (showType) columns.push({ key: 'karartur', label: 'Tür' });
    if (showSavci) columns.push({ key: 'savci', label: 'Savcı Sicili' });
    if (showHakim) columns.push({ key: 'hakim', label: 'Hakim' });
    const thead = document.querySelector('#caseTable thead tr');
    if (thead){ thead.innerHTML = columns.map(c => '<th>' + c.label + '</th>').join(''); }
    const dataToShow = CASE_STATE.filteredRows.length > 0 || CASE_STATE.searchQuery ? CASE_STATE.filteredRows : CASE_STATE.rows;
    const start = (CASE_STATE.page - 1) * CASE_STATE.size, end = Math.min(start + CASE_STATE.size, dataToShow.length);
    for (let i = start;i < end;i++){
      const r = dataToShow[i];
      const tr = document.createElement('tr');
      let rowHtml = '<td style="padding:8px;border-bottom:1px solid #0001">' + r.sira + '</td>' +
            '<td style="padding:8px;border-bottom:1px solid #0001">' + (r.esas || '') + '</td>' +
            '<td style="padding:8px;border-bottom:1px solid #0001">' + (r.karar || '') + '</td>';
      if (showType){ rowHtml += '<td style="padding:8px;border-bottom:1px solid #0001">' + (r.karartur || '') + '</td>'; }
      if (showSavci){ rowHtml += '<td style="padding:8px;border-bottom:1px solid #0001">' + (r.savci || '') + '</td>'; }
      if (showHakim){ rowHtml += '<td style="padding:8px;border-bottom:1px solid #0001">' + (r.hakim || '') + '</td>'; }
      tr.innerHTML = rowHtml;
      tb.appendChild(tr);
    }
    const pager = $('#casePager');
    if (pager){ const total = Math.max(1,Math.ceil(dataToShow.length / CASE_STATE.size)); pager.textContent = CASE_STATE.page + ' / ' + total; }
    const ttl = $('#caseModalTitle'); if (ttl) ttl.textContent = CASE_STATE.title || 'Kayıtlar';
  }
  function pageCase(delta){
    const dataToShow = CASE_STATE.filteredRows.length > 0 || CASE_STATE.searchQuery ? CASE_STATE.filteredRows : CASE_STATE.rows;
    const total = Math.max(1,Math.ceil(dataToShow.length / CASE_STATE.size));
    CASE_STATE.page = Math.min(total, Math.max(1, CASE_STATE.page + delta));
    renderCaseTable();
  }
  function printAllCases(){
    const w = window.open('','_blank'); if (!w) return;
    const dataToShow = CASE_STATE.filteredRows.length > 0 || CASE_STATE.searchQuery ? CASE_STATE.filteredRows : CASE_STATE.rows;
    const rows = dataToShow || [];
    const showType = CASE_STATE.showTypeForced !== null ? CASE_STATE.showTypeForced : !!CASE_STATE.showType;
    const showSavci = CASE_STATE.showSavciForced !== null ? CASE_STATE.showSavciForced : !!CASE_STATE.showSavci;
    const showHakim = CASE_STATE.showHakimForced !== null ? CASE_STATE.showHakimForced : !!CASE_STATE.showHakim;
    let html = '<table style="width:100%;border-collapse:collapse" border="0" cellspacing="0" cellpadding="0"><thead>' +
         '<tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">#</th>' +
         '<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Esas No (C)</th>' +
         '<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Karar No</th>' + (showType ? '<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Tür</th>' : '') + (showSavci ? '<th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Savcı Sicili</th>' : '') + '</tr></thead><tbody>';
    rows.forEach(function(r){
      html += '<tr><td style="padding:8px;border-bottom:1px solid #eee">' + r.sira + '</td>' +
            '<td style="padding:8px;border-bottom:1px solid #eee">' + (r.esas || '') + '</td>' +
            '<td style="padding:8px;border-bottom:1px solid #eee">' + (r.karar || '') + '</td>' +
            (showType ? '<td style="padding:8px;border-bottom:1px solid #eee">' + (r.karartur || '') + '</td>' : '') +
            (showSavci ? '<td style="padding:8px;border-bottom:1px solid #eee">' + (r.savci || '') + '</td>' : '') +
            (showHakim ? '<td style="padding:8px;border-bottom:1px solid #eee">' + (r.hakim || '') + '</td>' : '') + '</tr>';
    });
    html += '</tbody></table>';
    w.document.write('<html><head><meta charset="utf-8"><title>' + (CASE_STATE.title || 'Kayıtlar') + '</title>' +
                     '<style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:20px}</style></head><body>' +
                     '<h2 style="margin:0 0 12px 0">' + (CASE_STATE.title || 'Kayıtlar') + '</h2>' + html + '</body></html>');
    w.document.close(); try {w.focus(); w.print();} catch (_){ }
  }
  function exportAllCases(){
    if (!window.XLSX){ alert('Excel dışa aktarım için XLSX kütüphanesi gerekli.'); return; }
    const dataToShow = CASE_STATE.filteredRows.length > 0 || CASE_STATE.searchQuery ? CASE_STATE.filteredRows : CASE_STATE.rows;
    const showType = CASE_STATE.showTypeForced !== null ? CASE_STATE.showTypeForced : !!CASE_STATE.showType;
    const showSavci = CASE_STATE.showSavciForced !== null ? CASE_STATE.showSavciForced : !!CASE_STATE.showSavci;
    const showHakim = CASE_STATE.showHakimForced !== null ? CASE_STATE.showHakimForced : !!CASE_STATE.showHakim;
    const aoa = [['Kayıtlar','','']];
    const header = [];
    if (showSavci || showHakim) header.push('#','Esas No (C)','Karar No','Tür','Savcı Sicili','Hakim');
    else header.push('#','Esas No (C)','Karar No', (showType ? 'Tür' : ''));
    aoa.push(header.filter(h => h !== ''));
    (dataToShow || []).forEach(r => aoa.push(showSavci || showHakim ? [r.sira,r.esas,r.karar,r.karartur,r.savci,r.hakim] : (showType ? [r.sira,r.esas,r.karar,r.karartur] : [r.sira,r.esas,r.karar])));
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(aoa); XLSX.utils.book_append_sheet(wb, ws, 'Kayıtlar');
    XLSX.writeFile(wb, 'sicil-detay.xlsx');
  }
  function showCaseModal(rows, title, decisionType, showSavci){ 
    const modalEl = ensureCaseModal();
    const bsModal = new bootstrap.Modal(modalEl);
    CASE_STATE.rows = rows || []; 
    CASE_STATE.filteredRows = CASE_STATE.rows;
    CASE_STATE.searchQuery = '';
    CASE_STATE.page = 1; 
    CASE_STATE.title = title || 'Kayıtlar';
    CASE_STATE.decisionType = decisionType || null;
    // Load persisted toggles (if not set by show args or forced)
    try { const sType = window.teftisStorage.getItem('case.showType'); if (sType !== null && CASE_STATE.showTypeForced === null) CASE_STATE.showTypeForced = (String(sType) === '1'); const sSavci = window.teftisStorage.getItem('case.showSavci'); if (sSavci !== null && CASE_STATE.showSavciForced === null) CASE_STATE.showSavciForced = (String(sSavci) === '1'); const sHakim = window.teftisStorage.getItem('case.showHakim'); if (sHakim !== null && CASE_STATE.showHakimForced === null) CASE_STATE.showHakimForced = (String(sHakim) === '1'); } catch(_){ }
    // compute auto behavior for savci and hakim (show if any row has savci/hakim)
    const autoSavci = Array.isArray(CASE_STATE.rows) && CASE_STATE.rows.some(r => !!(r.savci || '').toString().trim());
    const autoHakim = Array.isArray(CASE_STATE.rows) && CASE_STATE.rows.some(r => !!(r.hakim || '').toString().trim());
    // If showSavci argument provided, use it to force. Otherwise prefer forced override if set; else auto
    CASE_STATE.showSavci = typeof showSavci !== 'undefined' ? !!showSavci : (CASE_STATE.showSavciForced !== null ? !!CASE_STATE.showSavciForced : !!autoSavci);
    // set showType according to decisionType presence and forced override
    const autoType = CASE_STATE.decisionType === 'Toplam';
    CASE_STATE.showType = CASE_STATE.showTypeForced !== null ? !!CASE_STATE.showTypeForced : !!autoType;
    CASE_STATE.showHakim = CASE_STATE.showHakimForced !== null ? !!CASE_STATE.showHakimForced : !!autoHakim;
    // ensure DOM toggles reflect the computed state (if present)
    const typeToggle = document.getElementById('caseToggleType'); if (typeToggle){ typeToggle.checked = !!CASE_STATE.showType; }
    const savciToggle = document.getElementById('caseToggleSavci'); if (savciToggle){ savciToggle.checked = !!CASE_STATE.showSavci; }
    const hakimToggle = document.getElementById('caseToggleHakim'); if (hakimToggle){ hakimToggle.checked = !!CASE_STATE.showHakim; }
    const searchInput = $('#caseSearch');
    if (searchInput) searchInput.value = '';
    renderCaseTable();
    bsModal.show();
  }
  function hideCaseModal(){ 
    const modalEl = $('#caseModal'); 
    if (modalEl) {
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }
  }
  window.showCaseModal = showCaseModal; window.hideCaseModal = hideCaseModal;
  // Open Toplam modal showing all rows and force columns visible (not persisted)
  window.openToplamModal = function(){
    const used = (window.__lastExcelRows && window.__lastExcelRows.rowsUsed) || [];
    const rows = used.map((r,i) => _rowToCaseObj(r,i));
    const oldType = CASE_STATE.showTypeForced; const oldSav = CASE_STATE.showSavciForced; const oldHak = CASE_STATE.showHakimForced;
    // For Toplam modal, prefer minimal defaults (no automatic columns)
    CASE_STATE.showTypeForced = false; CASE_STATE.showSavciForced = false; CASE_STATE.showHakimForced = false;
    showCaseModal(rows, 'Toplam');
    const modalEl = document.getElementById('caseModal');
    if (modalEl){
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal){
        const revert = function(){ CASE_STATE.showTypeForced = oldType; CASE_STATE.showSavciForced = oldSav; CASE_STATE.showHakimForced = oldHak; renderCaseTable(); modalEl.removeEventListener('hidden.bs.modal', revert); };
        modalEl.addEventListener('hidden.bs.modal', revert);
      }
    }
  };
})();

// Click handler: open Savcı modal when KPI is clicked
(function(){
  const el = document.getElementById('kpiSavci');
  if (!el) return;
  el.style.cursor = 'pointer';
  el.addEventListener('click', function(){
    const used = (window.__lastExcelRows && window.__lastExcelRows.rowsUsed) || [];
    const rows = [];
    for (let i = 0;i < used.length;i++){
      const obj = _rowToCaseObj(used[i], i);
      if (obj.savci) rows.push(obj);
    }
    // Show modal with Tür (Toplam) and Savcı sicili column
    // Open modal with minimal columns but force Savcı column on
    window.showCaseModal(rows, 'Savcılar', null, true);
  });
})();

/* ===============================
 * 4) Hücre Tıklama + Modal Açma
 * =============================== */
function _decideTypeByIDX(r, IDX){
  const o = toNum(r[IDX.o]), p = toNum(r[IDX.p]), t = toNum(r[IDX.t]), m = toNum(r[IDX.m]), q = toNum(r[IDX.q]), z = toNum(r[IDX.z]);
  if (o > 0) return 'Mahkumiyet';
  if (p > 0) return 'HAGB';
  if (t > 0) return 'Gör/Yet/Birleş';
  if (m > 0) return 'Beraat';
  if (q > 0) return 'Red';
  if (z > 0) return 'Tazminat';
  return 'Düşme/Cvyo/Diğer';
}
function _hasJudgeForRow(rr, IDX){
  function _ne(x){ return x != null && String(x).trim() !== ''; }
  return _ne(rr[IDX.i]) || _ne(rr[IDX.j]) || _ne(rr[IDX.k]); // SADECE I,J,K
}
function _rowToCaseObj(r, idx){
  const bIdx = letterToIndex('B'), cIdx = letterToIndex('C'), eIdx = letterToIndex('E');
  const esas = nonEmpty(r[cIdx]) ? String(r[cIdx]) : '';
  const yil = yearFromCell(r[eIdx]) || '';
  const b = nonEmpty(r[bIdx]) ? String(r[bIdx]) : '';
  const IDX = (window.__matrixSource || {}).IDX || {};
  const karartur = _decideTypeByIDX(r, IDX);
  const L = IDX.l != null ? IDX.l : letterToIndex('L');
  const savci = nonEmpty(r[L]) ? String(r[L]) : '';
  const hakimKeys = getJudgeKeysForRow(r, IDX);
  const hakim = hakimKeys.length ? hakimKeys.join(', ') : '';
  return {sira:(idx + 1), esas:esas, karar:(yil ? yil : '') + (b ? ('/' + b) : ''), karartur:karartur, savci:savci, hakim:hakim};
}
window.cellClickHandler = function(td){
  const rowType = td.getAttribute('data-type'); const colKey = td.getAttribute('data-col');
  if (colKey === '__EMPTY__'){ openEmptyModalFor(rowType); return; }
  openJudgeSicilModal(colKey,rowType);
};
function openEmptyModalFor(decisionType){
  const ms = window.__matrixSource || {}; const used = (window.__lastExcelRows && window.__lastExcelRows.rowsUsed) || []; const IDX = ms.IDX || {};
  const rows = [];
  for (let i = 0;i < used.length;i++){
    const r = used[i]; if (_hasJudgeForRow(r,IDX)) continue;
    const t = _decideTypeByIDX(r,IDX); if (decisionType && decisionType !== 'Toplam' && t !== decisionType) continue;
    rows.push(_rowToCaseObj(r,i));
  }
  window.showNoJudgeModal();
  const tb = $('#noJudgeTable tbody'); if (!tb) return; tb.innerHTML = '';
  rows.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td style="padding:8px;border-bottom:1px solid #0001">' + o.sira + '</td>' +
                 '<td style="padding:8px;border-bottom:1px solid #0001">' + o.esas + '</td>' +
                 '<td style="padding:8px;border-bottom:1px solid #0001">' + o.karar + '</td>';
    tb.appendChild(tr);
  });
  window.__noJudgeData = rows.slice();
  const titleEl = document.querySelector('#noJudgeModalLabel span:last-child');
  if (!titleEl) {
    const labelEl = document.getElementById('noJudgeModalLabel');
    if (labelEl) {
      const textPart = labelEl.childNodes[labelEl.childNodes.length - 1];
      if (textPart && textPart.nodeType === Node.TEXT_NODE) {
        textPart.textContent = 'Hakim Bilgisi Bulunmayan Dosyalar' + (decisionType && decisionType !== 'Toplam' ? ' — ' + decisionType : '');
      }
    }
  }
}
// Savcı siciline özel modal (L sütunu)
function openSavciModal(sicil, decisionType){
  const ms = window.__matrixSource || {};
  const used = (window.__lastExcelRows && window.__lastExcelRows.rowsUsed) || [];
  const IDX  = ms.IDX || {};
  const L = (IDX && typeof IDX.l === 'number') ? IDX.l : letterToIndex('L');

  const rows = [];
  for (let i = 0;i < used.length;i++){
    const r = used[i];
    if (String(r[L] || '').trim() !== String(sicil)) continue;
    const t = _decideTypeByIDX(r, IDX);
    if (decisionType && decisionType !== 'Toplam' && t !== decisionType) continue;
    rows.push(_rowToCaseObj(r, i));
  }
  if (rows.length === 0){
    if (window.toast){ window.toast({type:'warning', title:'Kayıt bulunamadı', body:'Bu savcı siciline ait kayıt bulunamadı.'}); }
    return;
  }
  window.showCaseModal(rows, 'Savcı Sicili: ' + sicil + (decisionType && decisionType !== 'Toplam' ? ' — ' + decisionType : ''), decisionType);
}
function openJudgeSicilModal(sicil, decisionType){
  const ms = window.__matrixSource || {}; const used = (window.__lastExcelRows && window.__lastExcelRows.rowsUsed) || []; const IDX = ms.IDX || {};
  const rows = [];
  for (let i = 0;i < used.length;i++){
    const r = used[i]; let hit = false;
    if (String(r[IDX.i] || '').trim() === String(sicil)) hit = true;
    if (String(r[IDX.j] || '').trim() === String(sicil)) hit = true;
    if (String(r[IDX.k] || '').trim() === String(sicil)) hit = true;
    if (!hit) continue;
    const t = _decideTypeByIDX(r,IDX);
    if (decisionType && decisionType !== 'Toplam' && t !== decisionType) continue;
    rows.push(_rowToCaseObj(r,i));
  }
  if (rows.length === 0){ if (window.toast){ window.toast({type:'warning',title:'Kayıt bulunamadı',body:'Bu sicile ait, seçili türde kayıt yok.'}); } return; }
  window.showCaseModal(rows, 'Sicil: ' + sicil + (decisionType && decisionType !== 'Toplam' ? ' — ' + decisionType : ''), decisionType, false);
}

/* ===============================
 * 5) Ek Özet (ikonlu + filtreye duyarlı)
 * =============================== */
function updateExtraSummaryByRows(rows, minD, maxD){
  try {
    const host = document.querySelector('.altsag') || document.querySelector('#altsag') || document.querySelector('[class*="altsag"]');
    if (!host) return;
    let sec = document.getElementById('extraSummary'); if (!sec){ sec = document.createElement('section'); sec.className = 'card summary-card'; sec.id = 'extraSummary'; host.appendChild(sec); }

    const eIdx = letterToIndex('E'); let dMin = null, dMax = null;
    for (let i = 0;i < rows.length;i++){ const d = dateFromCell(rows[i][eIdx]); if (!d) continue; if (!dMin || d < dMin) dMin = d; if (!dMax || d > dMax) dMax = d; }
    if (minD) dMin = minD; if (maxD) dMax = maxD;

    // Savcı sicilleri L sütunundan
    const IDX = (window.__matrixSource || {}).IDX || {}; const L = IDX.l != null ? IDX.l : letterToIndex('L');
    let map = {}, total = 0;
    for (let r = 0;r < rows.length;r++){ const s = String((rows[r] || [])[L] || '').trim(); if (!s) continue; map[s] = (map[s] || 0) + 1; total++; }

    const parts = []; Object.keys(map).sort().forEach(function(sic){
      const c = map[sic];
      parts.push('<a href="#" class="extra-sicil-link" data-sicil="' + sic + '">' + sic + '</a> sicilli Cumhuriyet Savcısının <a href="#" class="extra-sicil-link" data-sicil="' + sic + '"><b>' + c + '</b></a> adet');
    });

    sec.innerHTML =
      '<h2><span class="material-symbols-rounded">article</span> Ek Özet</h2>' +
      '<p id="extraSummaryText">Veriler <b>' + fmtTR(dMin) + '</b> ile <b>' + fmtTR(dMax) +
      '</b> <u>(başlangıç ve bitiş günleri DAHİL)</u> tarihleri arasında, toplam <b>' + rows.length +
      '</b> dosya içermektedir; ' + (parts.length ? parts.join(', ') : 'Cumhuriyet Savcısı sicili bulunamadı.') + ' karara katıldığı görülmüştür.</p>' +
      '<small>Not: Cumhuriyet Savcısı sicilleri L sütunundan çözümlenir.</small>';

    sec.addEventListener('click', function(e){
      const a = e.target.closest('.extra-sicil-link'); if (!a) return;
      e.preventDefault(); openSavciModal(a.getAttribute('data-sicil'), null);
    });
  } catch (_){}
}

/* ===============================
 * 6) Yükleme Sonrası Uyarı (Hakimi olmayan)
 * =============================== */
function renderNoJudgeAlert_afterUpload(missingCount){
  try {
    const uploadCard = document.querySelector('.card.card-upload'); if (!uploadCard) return;
    if (typeof window.showAlert === 'function'){
      window.showAlert({
        containerAfter: uploadCard,
        variant: 'danger',
        title: 'Hakim Bilgisi Eksik',
        body: 'Karar defterinde <b>' + missingCount + '</b> adet dosyada hakim sicili bulunamadı.',
        closable: true,
        link: { text: 'Eksikleri göster', onclick: function(){ window.showNoJudgeModal(); } }
      });
    }
  } catch (_){}
}

/* ===============================
 * 7) Excel İşlemleri + Rapor Render
 */

// Show danger alert under Excel upload card after Excel is loaded
  function showExcelColumnWarning(containerSelector){
  var uploadCard = document.querySelector('.card.card-upload');
  if (!uploadCard) return;
  // Remove previous alert if exists
  var prev = uploadCard.nextElementSibling;
  if (prev && prev.classList.contains('alert-danger')) prev.remove();
  var alert = document.createElement('div');
  alert.className = 'alert alert-danger alert-dismissible fade show mt-2';
  // Build expected column mapping list
  function getSettingCol(id, def){ const el = document.getElementById(id); return el && el.value ? ('' + el.value).trim().toUpperCase() : def; }
  function cell(name, letter){ return '<tr><td style="padding:4px 8px">' + name + '</td><td style="padding:4px 8px"><b>' + (letter || '-') + '</b></td></tr>'; }
  var html = '<strong>Dikkat</strong><br>Yüklemiş olduğunuz Excel deki sütunların aşağıdaki sütunlarla eşitlendiğine emin olunuz. Değilse kendinize göre düzenleyip, kaydedip, tekrar yükleyiniz<div style="margin-top:8px"><table style="border-collapse:collapse"><tbody>';
  html += cell('Esas No (C)', 'C');
  html += cell('Karar No (B)', 'B');
  html += cell('Yıl (E)', 'E');
  var colL = getSettingCol('col_l','L');
  html += cell('Savcı Sicili (L)', colL);
  var colI = getSettingCol('col_i','I'), colJ = getSettingCol('col_j','J'), colK = getSettingCol('col_k','K');
  html += cell('Hakim (I,J,K)', colI + ', ' + colJ + ', ' + colK);
  var cols = [getSettingCol('col_o','O'), getSettingCol('col_p','P'), getSettingCol('col_t','T'), getSettingCol('col_m','M'), getSettingCol('col_q','Q'), getSettingCol('col_z','Z')];
  html += cell('Karar Türü (O/P/T/M/Q/Z)', cols.join(', '));
  html += '</tbody></table></div>';
  // also include actual header row mapping (if available)
  var loadedHeaders = (window.__lastExcelRows && window.__lastExcelRows.headers) || null;
  if (loadedHeaders && Array.isArray(loadedHeaders)){
    var table2 = '<div style="margin-top:8px">Yüklenen dosya sütun başlıkları:<div style="margin-top:6px"><table style="border-collapse:collapse"><tbody>';
    for (var i = 0;i < loadedHeaders.length;i++){
      table2 += '<tr><td style="padding:4px 8px">' + indexToLetter(i) + '</td><td style="padding:4px 8px"><b>' + (loadedHeaders[i] || '') + '</b></td></tr>';
    }
    table2 += '</tbody></table></div></div>';
    html += table2;
  }
  alert.innerHTML = html;
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn-close';
  closeBtn.setAttribute('aria-label', 'Kapat');
  closeBtn.addEventListener('click', function(){ alert.remove(); });
  // prepend close button so it's visible on the right
  alert.insertBefore(closeBtn, alert.firstChild);
  // If a specific container selector provided, try to insert after that element (useful for KPI area)
  try {
    if (containerSelector){
      const el = (typeof containerSelector === 'string') ? document.querySelector(containerSelector) : containerSelector;
      if (el && el.parentNode){ el.parentNode.insertBefore(alert, el.nextSibling); return; }
    }
  } catch(_){ }
  // Default: insert after upload card
  uploadCard.parentNode.insertBefore(alert, uploadCard.nextSibling);
}
window.showExcelColumnWarning = showExcelColumnWarning;
// Export the helper to global so other pages can call it
window.showExcelColumnWarning = showExcelColumnWarning;

(function(){
  function getLetterFromInput(id,fb){ const el = document.getElementById(id); const v = el && el.value ? ('' + el.value).trim() : ''; return v || fb || ''; }
  function getIDXFromSettings(){
    const map = { i:getLetterFromInput('col_i','I'), j:getLetterFromInput('col_j','J'), k:getLetterFromInput('col_k','K'),
      l:getLetterFromInput('col_l','L'), m:getLetterFromInput('col_m','M'), o:getLetterFromInput('col_o','O'),
      p:getLetterFromInput('col_p','P'), q:getLetterFromInput('col_q','Q'), t:getLetterFromInput('col_t','T'),
      z:getLetterFromInput('col_z','Z'), h:getLetterFromInput('col_h','H') /* H okunur ama KULLANILMAZ */ };
    let IDX = {},k; for (k in map) IDX[k] = letterToIndex(map[k]); return IDX;
  }
  function allNumeric(arr){ let vals = [],i; for (i = 0;i < arr.length;i++){ const v = arr[i]; if (nonEmpty(v)) vals.push(v); } if (vals.length === 0) return false; for (i = 0;i < vals.length;i++){ if (!(/^\s*\d+(,\d+|\.\d+)?\s*$/.test(String(vals[i])))) return false; } return true; }
  function uniqueNonEmpty(list){ let seen = {},c = 0,i,s; for (i = 0;i < list.length;i++){ s = String(list[i] || '').trim(); if (s && !seen[s]){ seen[s] = 1; c++; } } return c; }
  function updateKPIs(total,savciCount,hakimCount){ text($('#kpiTotal'),total); text($('#kpiSavci'),savciCount); text($('#kpiHakim'),hakimCount); }
  function normalizeTurkish(str){ return String(str || '').toLocaleLowerCase('tr').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u'); }
  function detectIDXFromHeaders(headers, sampleRows, merges){
    // Only adjust when the merged "Suc" header on row 8 is not F8:H8; otherwise leave settings untouched
    if (!Array.isArray(merges) || !merges.length) return null;

    let sucIdx = -1;
    const rowsToScan = [];
    if (Array.isArray(headers) && headers.length) rowsToScan.push(headers);
    if (Array.isArray(sampleRows) && sampleRows.length) rowsToScan.push(...sampleRows.slice(0, 25));
    for (let r = 0; r < rowsToScan.length && sucIdx === -1; r++) {
      const row = rowsToScan[r] || [];
      for (let c = 0; c < row.length; c++) {
        const val = row[c];
        if (val && normalizeTurkish(val).includes('suc')) { sucIdx = c; break; }
      }
    }
    if (sucIdx === -1) sucIdx = letterToIndex('F'); // fallback to standard suc column

    const row8SucMerge = merges.find(merge => merge.s.r <= 7 && merge.e.r >= 7 && merge.s.c <= sucIdx && merge.e.c >= sucIdx);
    const isStandard = row8SucMerge && row8SucMerge.s.c === letterToIndex('F') && row8SucMerge.e.c === letterToIndex('H');
    if (row8SucMerge && isStandard) {
      return { i:'I', isStandard:true };
    }
    if (row8SucMerge && !isStandard) {
      return { i:'H', isStandard:false };
    }
    return null;
  }

  function applyIDXToInputs(map){
    if (!map) return;
    const ids = { i:'col_i', j:'col_j', k:'col_k', l:'col_l', m:'col_m', o:'col_o', p:'col_p', q:'col_q', t:'col_t', z:'col_z' };
    Object.keys(ids).forEach((k) => {
      const el = document.getElementById(ids[k]);
      if (el && map[k]) el.value = map[k];
    });
  }

  function buildResultCard(total,savciCount,hakimCount,info){
    
    // Bootstrap layout için reportContainer
    const host = document.getElementById('reportContainer');
    if (!host) {
      return;
    }
    
    let card = document.getElementById('result-card'); 
    if (!card) { 
      card = document.createElement('div'); 
      card.className = 'card'; 
      card.id = 'result-card'; 
      host.appendChild(card); 
    }
    
    card.innerHTML = '<div class="card-header d-flex align-items-center gap-2">' +
                     '<span class="material-symbols-rounded">analytics</span>' +
                     '<strong>Rapor Özeti</strong>' +
                     '</div>' +
                     '<div class="card-body" id="reportBody"></div>';
  }

  function readAsArrayBuffer(file){
    return new Promise(function(resolve,reject){
      if (file.arrayBuffer){ file.arrayBuffer().then(resolve).catch(reject); return; }
      const r = new FileReader(); r.onload = e => resolve(e.target.result); r.onerror = () => reject(new Error('Dosya okunamadı')); r.readAsArrayBuffer(file);
    });
  }
  function readWorkbook(file){
    return readAsArrayBuffer(file).then(function(data){
      if (!window.XLSX || !XLSX.read) throw new Error('XLSX yüklenemedi.');
      const wb = XLSX.read(data,{type:'array'});
      let imageCount = 0;
      if (wb && Array.isArray(wb.SheetNames)){
        wb.SheetNames.forEach(function(name){
          const ws = wb.Sheets[name];
          if (ws && ws['!images'] && Array.isArray(ws['!images'])) imageCount += ws['!images'].length;
          if (ws && ws['!pictures'] && Array.isArray(ws['!pictures'])) imageCount += ws['!pictures'].length;
        });
      }
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws,{header:1,raw:false});

      // 8. satırdaki birleşmiş hücreleri say ve logla
      const merges = ws['!merges'] || [];

      return { rows, imageCount, merges };
    });
  }
  function validateSameExtension(files){
    if (!files || files.length === 0) return {ok:true,ext:null};
    function extOf(n){ const p = String(n).toLowerCase().split('.'); return p[p.length - 1]; }
    const first = extOf(files[0].name);
    if (['xls','xlsx'].indexOf(first) === -1) return {ok:false,message:'Lütfen sadece .xls veya .xlsx seçin.'};
    for (let i = 1;i < files.length;i++){ const e = extOf(files[i].name); if (e !== first) return {ok:false,message:'Aynı anda sadece tek format: ya .xls ya da .xlsx.'}; if (['xls','xlsx'].indexOf(e) === -1) return {ok:false,message:'Lütfen sadece .xls veya .xlsx seçin.'}; }
    return {ok:true,ext:first};
  }

  function renderNoJudgeAlert(noJudgeRows){
    const uploadCard = document.querySelector('.card.card-upload'); if (!uploadCard) return;
    if (!noJudgeRows || !noJudgeRows.length) return;
    renderNoJudgeAlert_afterUpload(noJudgeRows.length);
  }

  // --- ANA HESAPLAMA ---
  function computeFromRows(rows, filesCount){
    // Önce otomatik tespiti uygula (varsayılanlar/ayarlar üzerine yazar)
    if (window.__lastExcelRows && window.__lastExcelRows.autoIDX) {
      applyIDXToInputs(window.__lastExcelRows.autoIDX);
    }
    const IDX = getIDXFromSettings();
    const bIdx = letterToIndex('B'), cIdx = letterToIndex('C'), eIdx = letterToIndex('E');

    let used = [], i;
    for (i = 0;i < rows.length;i++){
      const r = rows[i]; if (!r) continue;
      if (nonEmpty(r[bIdx]) && nonEmpty(r[cIdx]) && nonEmpty(r[eIdx])) used.push(r);
    }

    // Savcı sayısı (L)
    let savciList = [], s; for (s = 0;s < used.length;s++){ const v = used[s][IDX.l]; if (nonEmpty(v)) savciList.push(v); }
    const savciCount = uniqueNonEmpty(savciList);

    // Hakim sayısı -> SADECE I,J,K
    const combined = [];
    for (let x = 0;x < used.length;x++){ combined.push(used[x][IDX.i], used[x][IDX.j], used[x][IDX.k]); }
    const hakimCount = uniqueNonEmpty(combined);

    // Hakimi olmayan satırlar -> SADECE I,J,K’e bak
    let noJudgeRows = [], rix;
    for (rix = 0; rix < used.length; rix++){
      const hasJudge = nonEmpty(used[rix][IDX.i]) || nonEmpty(used[rix][IDX.j]) || nonEmpty(used[rix][IDX.k]);
      if (!hasJudge) noJudgeRows.push(rix);
    }

    updateKPIs(used.length,savciCount,hakimCount);

    // Update kpiIslem counter from API
    fetch('https://sayac.657.com.tr/arttirkarar')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data && typeof data.adet !== 'undefined') {
          const adetRaw = data.adet * 1;
          const sayfasayac = nFormatter(adetRaw, 2);
          const kpiEl = document.getElementById('kpiIslem');
          if (kpiEl) kpiEl.innerHTML = sayfasayac;
        }
      })
      .catch(function(err) {
      });

    window.__matrixSource = {used:used, IDX:IDX};
    buildResultCard(used.length,savciCount,hakimCount,'Seçilen dosya sayısı: ' + filesCount + '. (Toplam, B+C+E dolu satırlardan.)');

    try { renderDecisionMatrixV5(used, IDX); } catch (_){}

    window.__lastExcelRows = window.__lastExcelRows || {};
    window.__lastExcelRows.rowsUsed = used;
    window.__lastExcelRows.noJudgeRows = noJudgeRows;

    // Ek özet + İlk tarih aralığını kaydet (yalnızca referans)
    (function(){
      let minD = null,maxD = null;
      for (let r = 0;r < used.length;r++){
        const d = dateFromCell(used[r][eIdx]); if (!d) continue;
        if (!minD || d < minD) minD = d; if (!maxD || d > maxD) maxD = d;
      }
      window.__initialDateRange = { min: minD, max: maxD };
      updateExtraSummaryByRows(used,minD,maxD);
    })();

    renderNoJudgeAlert(noJudgeRows);
  }
  window.computeFromRows = computeFromRows;

  function handleFiles(fileList){
    const files = [].slice.call(fileList || []); if (files.length === 0) return;
    window.__userExcelLoaded = true;
    const fileNames = files.map(f => f && f.name ? f.name : 'dosya').filter(Boolean);
    const ok = validateSameExtension(files); if (!ok.ok){ if (window.toast) window.toast({type:'error',title:'Yükleme hatası',body:ok.message || ''}); else alert(ok.message || ''); return; }
    const allRows = [];
    try { window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerKar', true); } catch(e){}
    // Yield to the event loop so UI updates (spinner can paint) before heavy XLS processing
    Promise.resolve().then(() => Promise.all(files.map(f => readWorkbook(f)))).then(resArr => {
      let totalImageCount = 0;
      for (let r = 0;r < resArr.length;r++){
        const rows = resArr[r].rows;
        totalImageCount += resArr[r].imageCount || 0;
        // capture the header row if present (first file only)
        if (!window.__lastExcelRows) window.__lastExcelRows = {};
        if (!window.__lastExcelRows.headers && rows && rows.length > 0){ window.__lastExcelRows.headers = rows[0]; }
        for (let i = 1;i < rows.length;i++){
          let row = rows[i], empty = true;
          for (let c = 0;c < (row ? row.length : 0);c++){ if (nonEmpty(row[c])){ empty = false; break; } }
          if (!empty) allRows.push(row);
        }
      }
      window.__lastExcelRows = window.__lastExcelRows || {}; window.__lastExcelRows.rows = allRows; window.__lastExcelRows.files = files; window.__lastExcelRows.imageCount = totalImageCount; window.__lastExcelRows.merges = resArr[0].merges;
      // Otomatik sütun tespiti (Suç sütununa göre)
      try {
        const autoMap = detectIDXFromHeaders(window.__lastExcelRows.headers, window.__lastExcelRows.rows, window.__lastExcelRows.merges);
        if (autoMap) {
          applyIDXToInputs(autoMap);
          window.__lastExcelRows.autoIDX = autoMap;
        }
        if (autoMap && !autoMap.isStandard) {
          try {
            const modal = ensureStandardModal();
            if (modal) {
              if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
              } else {
                alert('Tablonuzun standart tablodan farkli oldugu goruldu, algilanan degisiklikler uygulandi, lutfen Ayarlar kismindaki sutunlarin dogru olup olmadigini yuklenen excel dosyanizdan teyit ediniz.');
              }
            } else {
            }
          } catch (e) {
          }
        }
      } catch(_){}
      computeFromRows(allRows, files.length);
      try { showExcelColumnWarning('#kpiRow'); } catch (_){ try { showExcelColumnWarning(); } catch(_){} }
      if (window.toast) window.toast({type:'success',title:'Yükleme tamam',body:fileNames.join(', ') + ' başarıyla yüklendi — ' + allRows.length + ' satır işlendi'});
      document.dispatchEvent(new Event('excel-uploaded'));
    }).catch(err => {
      if (window.toast) window.toast({type:'error',title:'Okuma hatası',body:(err && err.message) || 'Dosya okunamadı.'}); else alert((err && err.message) || 'Dosya okunamadı.');
    }).finally(() => {
      try{ window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerKar', false); } catch(e){}
    });

  }

  function recomputeFromSaved(){
    const s = window.__lastExcelRows;
    if (!s || !Array.isArray(s.rows) || s.rows.length === 0){
      if (window.toast){ window.toast({type:'danger',title:'Excel yüklenmedi',body:'Lütfen önce bir veya daha fazla Excel dosyası yükleyin.',delay:5000}); } else alert('Önce Excel dosyası yükleyin.');
    } else {
      computeFromRows(s.rows,(s.files ? s.files.length : 1));
      try {
        const names = (s.files || []).map(f => f && f.name ? f.name : 'dosya').join(', ');
        if (window.toast) window.toast({type:'info',title:'Yeniden hesaplama tamam',body:'Daha önce yüklenen şu dosyalar (' + names + ') içindeki ' + s.rows.length + ' satır, Ayarlar’daki sütun ayarlarına göre tekrar hesaplandı.',delay:5000});
      } catch (_){}
    }
  }

  function ensureInputSetup(){
    const input = $('#excelInput'); 
    if (!input) {
      return null;
    }
    input.setAttribute('accept','.xls,.xlsx'); 
    input.setAttribute('multiple','true'); 
    return input;
  }

  function wire(){
    
    const input = ensureInputSetup(); 
    if (input) {
      input.addEventListener('change', e => {
        handleFiles(e.target.files);
      });
    }
    
    // Run butonu için retry mekanizması (dinamik script yüklemesi için)
    function attachRunButton(retries = 10) {
      const runBtn = $('#run'); 
      if (runBtn) {
        runBtn.addEventListener('click', function() {
          recomputeFromSaved();
        });
      } else {
        if (retries > 0) {
          setTimeout(function() { attachRunButton(retries - 1); }, 100);
        }
      }
    }
    
    attachRunButton();

    // Global drag/drop prevention
    window.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, false);
    
    window.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, false);

    // Prevent browser from opening dropped files
    const dropZone = $('#dropZone');
    if (dropZone) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });

      ['dragenter', 'dragover'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function(e) {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('drag-over');
        }, false);
      });

      ['dragleave', 'drop'].forEach(function(eventName) {
        dropZone.addEventListener(eventName, function(e) {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('drag-over');
        }, false);
      });

      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          // Schedule handleFiles in next microtask to allow UI to paint (spinner to show)
          Promise.resolve().then(() => handleFiles(files));
        }
      }, false);
      
      // Click to upload
      dropZone.addEventListener('click', function(e) {
        e.preventDefault();
        if (input) {
          input.click();
        }
      });
    }
  }

  // === Rapor grid’i + filtre (tarih dahil, dd/mm/yyyy toast) ===
  window.renderDecisionMatrixV5 = function(used,IDX){
    const eIdx = letterToIndex('E');


    function decideType(r){
      const o = toNum(r[IDX.o]), p = toNum(r[IDX.p]), t = toNum(r[IDX.t]), m = toNum(r[IDX.m]), q = toNum(r[IDX.q]), z = toNum(r[IDX.z]);
      if (o > 0) return 'Mahkumiyet';
      if (p > 0) return 'HAGB';
      if (t > 0) return 'Gör/Yet/Birleş';
      if (m > 0) return 'Beraat';
      if (q > 0) return 'Red';
      if (z > 0) return 'Tazminat';
      return 'Düşme/Cvyo/Diğer';
    }

    // Kolonları SADECE I,J,K içeriğine göre oluştur
    const cols = [],seen = {};
    for (let j = 0;j < used.length;j++){
      const keys = getJudgeKeysForRow(used[j], IDX);
      for (let u = 0;u < keys.length;u++){
        const key = String(keys[u] || '').trim();
        if (key && !seen[key]){ seen[key] = 1; cols.push(key); }
      }
    }

    // İlk min/max referansı
    let minD = null,maxD = null;
    for (let r = 0;r < used.length;r++){ const d = dateFromCell(used[r][eIdx]); if (!d) continue; if (!minD || d < minD) minD = d; if (!maxD || d > maxD) maxD = d; }

    function buildGrid(rows){
      const TYPES = ['Mahkumiyet','Beraat','Düşme/Cvyo/Diğer','Zamanaşımı','HAGB','Gör/Yet/Birleş','Red','Tazminat'];
      const grid = {}; TYPES.forEach(function(t){grid[t] = {};}); grid['Toplam'] = {};
      const EMPTY = '__EMPTY__';
      for (let i = 0;i < rows.length;i++){
        let r = rows[i], t = decideType(r), keys = getJudgeKeysForRow(r,IDX);
        if (keys.length === 0) keys = [EMPTY];
        for (let u = 0;u < keys.length;u++){ const k = keys[u]; grid[t][k] = (grid[t][k] || 0) + 1; }
      }
      let outCols = cols.slice();
      let hasEmpty = false; for (const ti in grid){ if (grid[ti][EMPTY]){ hasEmpty = true; break; } }
      if (hasEmpty) outCols.push(EMPTY);

      // aktif filtre varsa sıfır sütunları gizle + toast
      (function(){
        const sVal = (($('#startDate') || {}).value) || '', eVal = (($('#endDate') || {}).value) || '', sic = (($('#searchSicil') || {}).value) || '';
        const filtered = !!(sVal || eVal || sic.trim());
        if (filtered && window.toast){
          const parts = [];
          if (sVal || eVal){ parts.push('tarih aralığı (' + fmtDMYstr(sVal || '') + ' - ' + fmtDMYstr(eVal || '') + ')'); }
          if (sic) parts.push('sicil (' + sic + ')');
          window.toast({type:'info',title:'Filtre uygulandı',body:parts.length ? ('Filtre: ' + parts.join(', ')) : 'Kriterlere göre filtre uygulandı.'});
        }
        if (!filtered) return;
        const keep = [];
        const sicLower = sic.toLocaleLowerCase('tr');
        for (let c = 0;c < outCols.length;c++){
          let key = outCols[c], sum = 0;
          for (const t in grid){ if (t !== 'Toplam') sum += (grid[t][key] || 0); }
          // Eğer sicil araması varsa sadece bu kolonu tut
          const keyMatch = sicLower ? String(key || '').toLocaleLowerCase('tr').includes(sicLower) : true;
          if (sum > 0 && keyMatch) keep.push(key);
        }
        if (keep.length) outCols = keep;
      })();

      grid['Toplam'] = {}; outCols.forEach(function(k){ let s = 0; for (const t in grid){ if (t !== 'Toplam') s += (grid[t][k] || 0); } grid['Toplam'][k] = s; });
      return {grid:grid, columns:outCols, EMPTY_KEY:EMPTY};
    }

    function applyFilters(rows){
      const sEl = $('#startDate'), eEl = $('#endDate'), sicEl = $('#searchSicil');
      // GÜN BAŞI / GÜN SONU => dahil
      const sd = sEl && sEl.value ? new Date(sEl.value + 'T00:00:00') : null;
      const ed = eEl && eEl.value ? new Date(eEl.value + 'T23:59:59.999') : null;
      const sic = (sicEl ? String(sicEl.value).trim() : '').toLocaleLowerCase('tr');

      const keep = [];
      for (let r = 0;r < rows.length;r++){
        const rr = rows[r]; const d = dateFromCell(rr[eIdx]);
        if (sd && d && d < sd) continue;
        if (ed && d && d > ed) continue;

        if (sic){
          const keys = getJudgeKeysForRow(rr, IDX);
          let hit = false;
          for (let k = 0;k < keys.length;k++){
            if (String(keys[k]).toLocaleLowerCase('tr').indexOf(sic) > -1){ hit = true; break; }
          }
          if (!hit) continue;
        }
        keep.push(rr);
      }
      return keep;
    }

    function render(){
      
      // KULLANICI TARİH GİRDİYSE KORU
      const prevSD = (document.getElementById('startDate') || {}).value || '';
      const prevED = (document.getElementById('endDate')   || {}).value || '';

      const rows = applyFilters(used);
      const built = buildGrid(rows);
      const grid = built.grid, outCols = built.columns, EMPTY = built.EMPTY_KEY;

      const card = document.getElementById('result-card'); 
      if (!card) {
        return;
      }
      
      // Card Header - Sadece Başlık
      let headerHTML = '';
      headerHTML += '<div class="card-header d-flex align-items-center gap-2">';
      headerHTML += '<span class="material-symbols-rounded">analytics</span>';
      headerHTML += '<strong>Rapor Özeti</strong>';
      headerHTML += '</div>';
      
      const body = document.createElement('div'); 
      body.className = 'card-body';
      body.id = 'reportBody';

      // Bootstrap stil filtre ve butonlar
      let h = '';
      
      // Filtre alanı (Tarih + Sicil + Butonlar)
      h += '<div class="mb-3">';
      h += '<div class="row g-2 align-items-end">';

      const initialMin = (window.__initialDateRange && window.__initialDateRange.min) ? window.__initialDateRange.min : minD;
      const initialMax = (window.__initialDateRange && window.__initialDateRange.max) ? window.__initialDateRange.max : maxD;

      h += '<div class="col-6 col-md-2">';
      h += '<label for="startDate" class="form-label small mb-1"><strong>İlk tarih</strong></label>';
      h += '<input id="startDate" type="date" class="form-control form-control-sm" value="' + (prevSD || fmtYMD(initialMin) || '') + '">';
      h += '</div>';
      
      h += '<div class="col-6 col-md-2">';
      h += '<label for="endDate" class="form-label small mb-1"><strong>Son tarih</strong></label>';
      h += '<input id="endDate" type="date" class="form-control form-control-sm" value="' + (prevED || fmtYMD(initialMax) || '') + '">';
      h += '</div>';
      
      h += '<div class="col-12 col-md-3">';
      h += '<label for="searchSicil" class="form-label small mb-1"><strong>Sicil Ara</strong></label>';
      h += '<input id="searchSicil" type="text" class="form-control form-control-sm" placeholder="Sicil ara (örn: 139329)">';
      h += '</div>';
      
      h += '<div class="col-12 col-md-5">';
      h += '<div class="d-flex gap-2 justify-content-end flex-wrap">';
      h += '<button id="filterBtn" type="button" class="btn btn-sm btn-primary">';
      h += '<span class="material-symbols-rounded me-1" style="font-size:0.875rem;">filter_alt</span>';
      h += 'Filtrele';
      h += '</button>';
      h += '<button id="clearFilterBtn" type="button" class="btn btn-sm btn-secondary">';
      h += '<span class="material-symbols-rounded me-1" style="font-size:0.875rem;">filter_alt_off</span>';
      h += 'Temizle';
      h += '</button>';
      h += '<button class="btn btn-sm btn-success" id="saveReportExcel">';
      h += '<span class="material-symbols-rounded me-1" style="font-size:0.875rem;">download</span>';
      h += 'Kaydet (Excel)';
      h += '</button>';
      h += '</div>';
      h += '</div>';
      
      h += '</div>';
      h += '</div>';

      // Bootstrap responsive tablo
      h += '<div class="table-responsive" style="overflow-x:auto;">';
      h += '<table class="table table-sm table-hover" style="white-space:nowrap;">';
      h += '<thead class="table-light">';
      h += '<tr>';
      h += '<th class="sticky-col">Karar Türleri</th>';
      for (let i2 = 0;i2 < outCols.length;i2++){
        const label = (outCols[i2] === EMPTY) ? '(boş)' : '(' + outCols[i2] + ')';
        const cls = (outCols[i2] === EMPTY) ? ' class="text-muted"' : '';
        h += '<th' + cls + '>' + label + '</th>';
      }
      h += '</tr>';
      h += '</thead>';
      h += '<tbody>';
      
      const ORDER = ['Mahkumiyet','Beraat','Düşme/Cvyo/Diğer','Zamanaşımı','HAGB','Gör/Yet/Birleş','Red','Tazminat','Toplam'];
      for (let rix = 0; rix < ORDER.length; rix++){
        const rowT = ORDER[rix];
        const isTotal = (rowT === 'Toplam');
        h += '<tr' + (isTotal ? ' class="table-secondary fw-bold"' : '') + '>';
        // make Toplam label clickable to open total modal showing all rows/columns
        if (isTotal){
          h += '<td class="sticky-col cursor-pointer' + (isTotal ? ' fw-bold' : '') + '" onclick="openToplamModal()">' + rowT + '</td>';
        } else {
          h += '<td class="sticky-col' + (isTotal ? ' fw-bold' : '') + '">' + rowT + '</td>';
        }
        for (let cix = 0;cix < outCols.length;cix++){
          const key = outCols[cix]; 
          const v = (grid[rowT] && grid[rowT][key]) ? grid[rowT][key] : 0;
          const tdClass = (key === EMPTY) ? 'text-muted' : '';
          const clickable = !isTotal && v > 0 ? 'cursor-pointer' : '';
          h += '<td class="' + tdClass + ' ' + clickable + '" data-type="' + rowT + '" data-col="' + key + '" onclick="cellClickHandler(this)">' + v + '</td>';
        }
        h += '</tr>';
      }
      h += '</tbody>';
      h += '</table>';
      h += '</div>';

      body.innerHTML = h;

      // body yerleşti -> inputları GERİ YAZ (sabit kalsın)
      const sdEl = document.getElementById('startDate'); if (prevSD && sdEl) sdEl.value = prevSD;
      const edEl = document.getElementById('endDate');   if (prevED && edEl) edEl.value = prevED;

      if (window.enableTableWrapDrag) window.enableTableWrapDrag();
        // Card header'ı ekle veya güncelle
        let cardHeader = card.querySelector('.card-header');
        if (!cardHeader) {
          cardHeader = document.createElement('div');
          cardHeader.className = 'card-header';
          card.insertBefore(cardHeader, card.firstChild);
        }
        cardHeader.innerHTML = headerHTML;
        // Body'yi ekle veya değiştir
        const old = card.querySelector('.card-body');
        if (old) old.replaceWith(body); 
        else card.appendChild(body);

      // buton davranışları + Ek Özet’i filtreye göre güncelle
      const fBtn = $('#filterBtn'), clrBtn = $('#clearFilterBtn'), dBtn = $('#dateFilterBtn'), dReset = $('#dateResetBtn'), saveBtn = $('#saveReportExcel');

      function updateSummaryFor(currentRows){
        let md = null, xd = null;
        for (let i = 0;i < currentRows.length;i++){ const d = dateFromCell(currentRows[i][eIdx]); if (!d) continue; if (!md || d < md) md = d; if (!xd || d > xd) xd = d; }
        updateExtraSummaryByRows(currentRows, md, xd);
      }

      if (fBtn) fBtn.onclick = function(){ render(); const filtered = applyFilters(used); updateSummaryFor(filtered); };
      if (dBtn) dBtn.onclick = function(){ render(); const filtered = applyFilters(used); updateSummaryFor(filtered); };
      if (clrBtn) clrBtn.onclick = function(){ const s = $('#searchSicil'); if (s) s.value = ''; render(); updateExtraSummaryByRows(used, minD, maxD); };
      if (dReset) dReset.onclick = function(){ const sd = $('#startDate'), ed = $('#endDate'); if (sd) sd.value = ''; if (ed) ed.value = ''; render(); updateExtraSummaryByRows(used, minD, maxD); };
      if (saveBtn) saveBtn.onclick = function(){ if (!window.XLSX) return; const table = card.querySelector('table'); if (!table) return; const wb = XLSX.utils.book_new(); const ws = XLSX.utils.table_to_sheet(table); XLSX.utils.book_append_sheet(wb, ws, 'Rapor'); XLSX.writeFile(wb,'rapor.xlsx'); };

      // başlık (sicil) öneri
      (function setupSicilAutocomplete(){
        const input = document.getElementById('searchSicil'); if (!input) return;
        let dl = document.getElementById('sicilSuggestions'); if (!dl){ dl = document.createElement('datalist'); dl.id = 'sicilSuggestions'; document.body.appendChild(dl); }
        input.setAttribute('list','sicilSuggestions');
        function getHeaders(){
          const headers = []; const t = document.querySelector('#result-card table') || document.querySelector('.report-table') || document.querySelector('table');
          if (!t) return headers;
          t.querySelectorAll('thead th').forEach(function(th){ const raw = (th.textContent || '').replace(/\s+/g,' ').trim(); const txt = normalizeHeaderLabel(raw); if (txt) headers.push(txt); });
          return Array.from(new Set(headers));
        }
        let headers = getHeaders();
        function refreshList(q){ dl.innerHTML = ''; if (!q || q.length < 1) return; const ql = q.toLocaleLowerCase('tr'); headers.filter(function(h){return h.toLocaleLowerCase('tr').includes(ql);}).slice(0,50).forEach(function(h){ const opt = document.createElement('option'); opt.value = h; dl.appendChild(opt); }); }
        input.addEventListener('input',function(e){ headers = getHeaders(); refreshList(e.target.value); });
        input.addEventListener('keydown',function(e){
          if (e.key === 'Enter'){
            e.preventDefault();
            const val = normalizeHeaderLabel(input.value.trim());
            const ok = headers.some(function(h){return h.toLocaleLowerCase('tr') === val.toLocaleLowerCase('tr');});
            if (!ok){ if (window.toast) window.toast({type:'error',title:'Başlık bulunamadı',body:'Girdiğiniz "' + val + '" sütun başlıkları arasında yok.'}); else alert('Başlık yok'); return; }
            if (fBtn) fBtn.click();
          }
        });
      })();
    }

    // === Masaüstü/mobil yatay sürükleme (drag to scroll) ===
    (function enableHorizontalDrag(){
      window.enableTableWrapDrag = function(){
        const wrap = document.querySelector('#result-card .table-wrap');
        if (!wrap) return;
        if (wrap.__dragBound) return;
        wrap.__dragBound = true;

        let isDown = false, startX = 0, scrollLeft = 0;

        wrap.style.overflowX = 'auto';
        wrap.addEventListener('mousedown', function(e){
          isDown = true;
          wrap.classList.add('grabbing');
          startX = e.pageX - wrap.offsetLeft;
          scrollLeft = wrap.scrollLeft;
        });
        wrap.addEventListener('mouseleave', function(){
          isDown = false;
          wrap.classList.remove('grabbing');
        });
        wrap.addEventListener('mouseup', function(){
          isDown = false;
          wrap.classList.remove('grabbing');
        });
        wrap.addEventListener('mousemove', function(e){
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - wrap.offsetLeft;
          const walk = (x - startX);
          wrap.scrollLeft = scrollLeft - walk;
        });

        wrap.setAttribute('role','region');
        wrap.setAttribute('aria-label','Rapor tablosu yatay kaydırma');
      };
    })();

    render();
  };

  function startWhenReady(){
    function start(){ wire(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }
  startWhenReady();
})();

/* ===============================
 * 8) Sayaç + Örnek Excel + kpiIslem
 * =============================== */

// Kısaltma
function nFormatter(num, digits){
  const si = [
    {v: 1E9, s: 'B'},   // milyar
    {v: 1E6, s: 'M'},   // milyon
    {v: 1E3, s: 'B.'},  // bin
    {v: 1,   s: ''}
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  num = Number(num) || 0;
  for (let i = 0; i < si.length; i++) {
    if (num >= si[i].v) return (num / si[i].v).toFixed(digits).replace(rx, '$1') + si[i].s;
  }
  return String(num);
}

// kanca
window.kpiIslem = function(sayfaSayacAdet){
  try {
    // Genişletilebilir kanca
  } catch (_){}
};

// Kullanıcı Excel yüklerse örnek veriyi iptal için bayrak
window.__userExcelLoaded = window.__userExcelLoaded || false;
document.addEventListener('excel-uploaded', function(){ window.__userExcelLoaded = true; });

function loadExampleExcelAndRender(_sayfaSayacRaw){
  if (window.__userExcelLoaded) return;

  fetch('./data/ornek.xls').then(function(res){
    if (!res.ok) throw new Error('Örnek excel bulunamadı.');
    return res.arrayBuffer();
  }).then(function(buf){
    if (!window.XLSX || !XLSX.read) throw new Error('XLSX kütüphanesi hazır değil.');
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:false });

    const allRows = [];
    for (let i = 1;i < rows.length;i++){
      const row = rows[i];
      let empty = true;
      for (let c = 0;c < (row ? row.length : 0);c++){
        if (row[c] != null && String(row[c]).trim() !== '') { empty = false; break; }
      }
      if (!empty) allRows.push(row);
    }

    if (typeof window.computeFromRows === 'function') {
      window.computeFromRows(allRows, 1);
    }
    window.kpiIslem(_sayfaSayacRaw || 0);

    if (window.toast) {
      window.setTimeout(function(){
        window.toast({
          type: 'warning',
          title: 'Örnek veri',
          body: 'Ekranda görmekte olduğunuz veriler test amaçlıdır. UYAP > Raporlar > Defterler > Defter Sorgu > Karar Defterini Excel formatında yüklediğinizde gerçek verileriniz işlenecektir.',
          delay: 10000
        });
      }, 10000);
    }
  }).catch(function(_e){
    // sessiz
  });
}

function initSayacAndExample(){
  if (!window.jQuery || !jQuery.getJSON) {
    loadExampleExcelAndRender(0);
    return;
  }
  jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response) {
    try {
      const adetRaw = (response && typeof response.adet !== 'undefined') ? (response.adet * 1) : 0;
      const sayfasayac = nFormatter(adetRaw, 2);
      const kpiEl = document.getElementById('kpiIslem');
      if (kpiEl) kpiEl.innerHTML = sayfasayac;
      loadExampleExcelAndRender(adetRaw);
    } catch (e) {
      loadExampleExcelAndRender(0);
    }
  }).fail(function() {
    loadExampleExcelAndRender(0);
  });
}
