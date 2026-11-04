document.addEventListener('DOMContentLoaded', function(){
  (function(){
    const $ = (s) => document.querySelector(s);
    const input = $('#excelInput');
    const runBtn = $('#run');
  // Prevent the browser default behavior of opening files when dropped outside the drop zone
  // (drops on the document can navigate to the file). We prevent default globally and
  // let the dropzone handle the actual files.
  function _globalPrevent(e){ e.preventDefault(); e.stopPropagation && e.stopPropagation(); }
  document.addEventListener('dragover', _globalPrevent);
  document.addEventListener('drop', _globalPrevent);
  const dropZone = document.getElementById('dropZone');
  let resultCard = $('#resultCard');
  // References to parts of the result card; will be set when the card is created.
  let headEl = null;
  let bodyEl = null;

  // Factory: create the results panel only when the first file is processed.
  function createResultCard(){
    // resultCard kaldırıldı - artık oluşturulmayacak
    return;
  }
  function parseCSV(text){
    const hasSemicolon = text.indexOf(';') > -1;
    const hasComma = text.indexOf(',') > -1;
    const sep = hasSemicolon && !hasComma ? ';' : ',';
    const rows = text.split(/\r?\n/).filter(r => r.trim().length > 0).map(r => r.split(sep).map(c => c.replace(/^\uFEFF/, '').trim()));
    return {header: rows[0] || [], rows: rows.slice(1)};
  }
  // Wait for the xlsx-loader to initialize (fires 'xlsx-ready' CustomEvent)
  let _xlsxReady = null;
  function waitForXlsxReady(timeout = 3000){
    if (_xlsxReady) return _xlsxReady;
    _xlsxReady = new Promise(resolve => {
      // If XLSX already present, resolve true
      if (window.XLSX && typeof XLSX.read === 'function') return resolve(true);
      // Listen for loader event
      function onReady(e){
        try { document.removeEventListener('xlsx-ready', onReady); } catch (e){}
        resolve(!!(e && e.detail && e.detail.ok));
      }
      document.addEventListener('xlsx-ready', onReady);
      // Fallback timeout
      setTimeout(() => {
        // If XLSX is now present, ok; otherwise resolve false
        resolve(!!(window.XLSX && typeof XLSX.read === 'function'));
      }, timeout);
    });
    return _xlsxReady;
  }

  async function parseXLSX(file){
    const ok = await waitForXlsxReady();
    if (!ok || !(window.XLSX && typeof XLSX.read === 'function')){
      throw new Error('XLSX kütüphanesi yüklenemedi. Lütfen internet bağlantınızı veya /assets/js/xlsx.full.min.js dosyasını kontrol edin. Alternatif olarak .csv kullanabilirsiniz.');
    }
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, {type:'array'});
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, {header:1, raw:true});
    const header = (json[0] || []).map(String);
    const rows = json.slice(1).map(r => r.map(v => (v == null ? '' : v)));
    return {header, rows};
  }
  function toNumber(v){
    const n = Number(String(v).replace(/\./g,'').replace(',','.'));
    return isFinite(n) ? n : 0;
  }
  function resolveIndexes(header){
    const upper = header.map(h => String(h).trim().toUpperCase());
    const letterToIndex = (L) => {
      L = L.toUpperCase();
      let idx = 0;
      for (let i = 0;i < L.length;i++){ idx = idx * 26 + (L.charCodeAt(i) - 64); }
      return idx - 1;
    };
    const byName = (names) => {
      for (const n of names){
        const i = upper.indexOf(n.toUpperCase());
        if (i > -1) return i;
      }
      return -1;
    };
    const idx = {
      M: byName(['BERAAT','BER']),
      O: byName(['MAHKUMIYET','MAHKUMİYET','HÜKÜM','HUKUM','CEZA']),
      P: byName(['HAGB','HÜKMÜN AÇIKLANMASININ GERİ BIRAKILMASI']),
      Q: byName(['RED','RET']),
      T: byName(['GÖR/YET/BİRLEŞ','GÖREV','YETKİ','BİRLEŞ']),
      Z: byName(['TAZMİNAT','TAZMINAT'])
    };
    const fallback = {M:'M', O:'O', P:'P', Q:'Q', T:'T', Z:'Z'};
    for (const k of Object.keys(fallback)){
      if (idx[k] < 0) idx[k] = letterToIndex(fallback[k]);
    }
    return idx;
  }
  function classifyRow(row, idx){
    const vO = toNumber(row[idx.O]);
    const vP = toNumber(row[idx.P]);
    const vT = toNumber(row[idx.T]);
    const vM = toNumber(row[idx.M]);
    const vQ = toNumber(row[idx.Q]);
    const vZ = toNumber(row[idx.Z]);
    if (vO > 0) return 'Mahkumiyet';
    if (vP > 0) return 'HAGB';
    if (vT > 0) return 'Gör/Yet/Birleş';
    if (vM > 0) return 'BERAAT';
    if (vQ > 0) return 'RED';
    if (vZ > 0) return 'Tazminat';
    return 'Düşme/Cvyo/Diğer';
  }
  function render(header, rows, idx){
    // resultCard kaldırıldı - artık render edilmeyecek
    return;
  }

  // Fallback modal show/hide if Bootstrap JS is not available
  function showModalFallback(modalEl){
    if (!modalEl) return;
    try {
      // If already shown, ignore
      if (modalEl.classList.contains('show')) return;
      modalEl.style.display = 'block';
      modalEl.classList.add('show');
      document.body.classList.add('modal-open');
      // add backdrop
      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop){
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      } else {
        backdrop.classList.add('show');
      }
      // Ensure dismiss buttons work without bootstrap
      modalEl.querySelectorAll('[data-bs-dismiss]').forEach(btn => {
        btn.addEventListener('click', function(){ hideModalFallback(modalEl); });
      });
    } catch (e) { console.warn('showModalFallback error', e); }
  }
  function hideModalFallback(modalEl){
    if (!modalEl) return;
    try {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    } catch (e) { console.warn('hideModalFallback error', e); }
  }

  // Inline warning shown above the report container when modal cannot be displayed
  function showInlineWarning(msg, type='info'){
    try {
      // Prefer the right-column statusMessage element if present (matches existing look)
      const status = document.getElementById('statusMessage');
      if (status) {
        status.className = 'alert alert-' + (type || 'info') + ' d-flex align-items-start gap-2 mb-3';
        status.setAttribute('role','alert');
        status.innerHTML = '<span class="material-symbols-rounded mt-1">info</span><div class="flex-grow-1">' + msg + '</div><button type="button" class="btn-close ms-2" aria-label="Kapat"></button>';
        status.style.display = 'block';
        const btn = status.querySelector('.btn-close'); if (btn){ btn.addEventListener('click', () => { status.style.display = 'none'; }); }
        return status;
      }

      // Fallback: insert above report container (previous behavior)
      const id = 'kararInlineWarning';
      let existing = document.getElementById(id);
      if (existing){
        existing.className = 'alert alert-' + (type || 'info') + ' mb-3';
        existing.innerHTML = msg + ' <button type="button" class="btn-close" aria-label="Kapat"></button>';
        const btn = existing.querySelector('.btn-close'); if (btn){ btn.addEventListener('click', () => existing.remove()); }
        existing.style.display = 'block';
        return existing;
      }
      const report = document.getElementById('reportContainer') || document.querySelector('#resultCard') || document.querySelector('.card') || document.querySelector('.container-fluid');
      if (!report) return null;
      const el = document.createElement('div');
      el.id = id;
      el.className = 'alert alert-' + (type || 'info') + ' mb-3';
      el.role = 'alert';
      el.innerHTML = msg + ' <button type="button" class="btn-close" aria-label="Kapat"></button>';
      report.parentNode.insertBefore(el, report);
      const btn = el.querySelector('.btn-close'); if (btn){ btn.addEventListener('click', () => el.remove()); }
      return el;
    } catch (e) { console.warn('showInlineWarning error', e); }
    return null;
  }

  function hideInlineWarning(){
    try {
      const status = document.getElementById('statusMessage');
      if (status){ status.style.display = 'none'; }
      const el = document.getElementById('kararInlineWarning'); if (el) el.remove();
    } catch(e) { console.warn('hideInlineWarning error', e); }
  }


  async function runFromFile(f){
    let parsed;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    // Helper: show a small inline spinner inside the report container or next to the drop zone
    function createInlineSpinner(host){
      try {
        if (!host) return null;
        const wrapper = document.createElement('div');
        wrapper.className = 'inline-xls-spinner';
        wrapper.innerHTML = `
          <div class="d-flex align-items-center gap-2 p-2" style="background:var(--adalet-card-bg);border-radius:8px;border:1px solid var(--adalet-border);">
            <div class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></div>
            <div class="small text-muted">Veriler hazırlanıyor…</div>
          </div>`;
        host.appendChild(wrapper);
        return wrapper;
      } catch (e) { return null; }
    }

    function removeInlineSpinner(sp){ if (!sp) return; try { sp.remove(); } catch(e){} }

    // Show inline spinner
    const reportHost = document.getElementById('reportContainer') || document.querySelector('.panel-body') || document.body;
    const _spinner = createInlineSpinner(reportHost);
    try {
      try { window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerKar', true); } catch(e) { try { window.XlsSpinner && window.XlsSpinner.show(); }catch(e){} }
      if (ext === 'xlsx' || ext === 'xls'){
        parsed = await parseXLSX(f);
      } else if (ext === 'csv'){
        parsed = parseCSV(await f.text());
      } else {
        const msg = 'Desteklenen uzantılar: .xlsx, .xls, .csv';
        if (window.toast) window.toast({type:'warning', title:'Dosya Türü', body: msg});
        return;
      }
    } catch (err){
      const msg = err && err.message ? err.message : 'Dosya okunamadı.';
      if (window.toast) window.toast({type:'danger', title:'Hata', body: msg});
      return;
    } finally {
      // Remove spinner regardless of success/failure
      removeInlineSpinner(_spinner);
      try { window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerKar', false); } catch(e) { try { window.XlsSpinner && window.XlsSpinner.hide(); }catch(e){} }
    }

    const idx = resolveIndexes(parsed.header);
    render(parsed.header, parsed.rows, idx);
  }
  function onInputChanged(e){
    const f = e.target.files && e.target.files[0];
    if (f) {
      hideInlineWarning();
      try {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (ext === 'xls' || ext === 'xlsx') {
          showInlineWarning('<strong>Dikkat:</strong> Karar defteri ile Zamanaşımı Dosyalarını tespit etmek mümkün değildir. Bu nedenle UYAP\'tan Zamanaşımı ile Düşen Dosyalar raporundan gerekli tespiti yaptıktan sonra buradaki dosya miktarını Düşme/Cvyo/Diğer olarak gösterilen dosyalar sayısından düşerek tabloyu doldurunuz.', 'warning');
        }
      } catch (err) { console.warn('Error while checking file extension', err); }
      runFromFile(f);
    }
  }
  input.addEventListener('change', onInputChanged);
  if (runBtn){
    runBtn.addEventListener('click', () => {
      const f = input.files && input.files[0];
      if (!f) { alert('Lütfen bir dosya seçin.'); return; }
      onInputChanged({target: {files:[f]}});
    });
  }

  // Dropzone etkileşimi (sürükle-bırak)
  if (dropZone){
    dropZone.addEventListener('click', () => input && input.click());
    ['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('is-over'); }));
    ['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('is-over'); }));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation && e.stopPropagation();
      const dt = e.dataTransfer; if (!dt || !dt.files || dt.files.length === 0) return;
      const f = dt.files[0];
      hideInlineWarning();
      try {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (ext === 'xls' || ext === 'xlsx') {
          showInlineWarning('<strong>Dikkat:</strong> Karar defteri ile Zamanaşımı Dosyalarını tespit etmek mümkün değildir. Bu nedenle UYAP\'tan Zamanaşımı ile Düşen Dosyalar raporundan gerekli tespiti yaptıktan sonra buradaki dosya miktarını Düşme/Cvyo/Diğer olarak gösterilen dosyalar sayısından düşerek tabloyu doldurunuz.', 'warning');
        }
      } catch (err) { console.warn('Error while checking file extension', err); }
      // Fire and forget - runFromFile handles errors and toasts
      runFromFile(f);
    });
  }
})();
});
