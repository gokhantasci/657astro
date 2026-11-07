document.addEventListener('DOMContentLoaded', function(){
  console.debug('byu-applied.js loaded');
  const byuInput = document.getElementById('byuInput');
  const byuDrop = document.getElementById('byuDrop');
  const status = document.getElementById('byuStatus');
  const cards = document.getElementById('byuCards');
  // detail table removed — no table body element
  const klContainer = document.getElementById('byuKLTable');
  const dateFrom = document.getElementById('byuDateFrom');
  const dateTo = document.getElementById('byuDateTo');
  const applyBtn = document.getElementById('byuApplyFilter');

  // State
  let lastRows = [];
  let lastKfreq = {};
  let lastLfreq = {};

  function downloadCSV(content, filename){
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.setAttribute('download', filename || 'export.csv'); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function excelSerialToDate(serial){
    if (typeof serial !== 'number') return null;
    // Excel to JS date: account for 1900 leap year bug
    const days = Math.floor(serial);
    const frac = serial - days;
    // Excel epoch to unix: (days - 25569) * 86400 * 1000; adjust if >59
    const adjDays = days > 59 ? days - 1 : days;
    const ms = (adjDays - 25569) * 86400 * 1000 + Math.round(frac * 86400) * 1000;
    return new Date(ms);
  }

  function showStatus(msg, type='info'){
    if (!status) {
      console.warn('byuStatus element not found; message:', msg);
      try { alert(msg); } catch(e){}
      return;
    }
    status.className = 'alert alert-' + type + ' d-flex align-items-start gap-2 mb-3';
    status.style.display = 'block';
    status.innerHTML = '<span class="material-symbols-rounded mt-1">info</span><div>'+msg+'</div><button type="button" class="btn-close ms-auto" aria-label="Kapat"></button>';
    const btn = status.querySelector('.btn-close'); if (btn) btn.addEventListener('click', ()=> status.style.display='none');
  }
  function hideStatus(){ if (!status) return; status.style.display='none'; }

  function parseDateCell(v){
    // Normalize Excel date serials or string dates
    if (!v && v !== 0) return null;
    if (v instanceof Date) return v;
    if (typeof v === 'number') return excelSerialToDate(v);
    const s = String(v).trim();
    // numeric string? treat as serial
    if (/^\d+(?:\.\d+)?$/.test(s)){
      const n = Number(s);
      if (!isNaN(n)) return excelSerialToDate(n);
    }
    const d = new Date(s);
    if (isNaN(d)) return null;
    return d;
  }

  function formatDate(d){
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function uniqueCount(arr){
    const set = new Set(arr.filter(v=>v!==undefined && v!==null && String(v).trim()!==''));
    return set.size;
  }

  // Dosya no validation and normalization: accept formats like 2020/1111 or 2020/1
  function isValidDosyaNo(v){
    if (!v && v !== 0) return false;
    const s = String(v).trim();
    // Match year/number where year is 2-4 digits and number is one or more digits
    return /^\d{2,4}\s*\/\s*\d+$/.test(s);
  }

  function normalizeDosyaNo(v){
    if (!v && v !== 0) return null;
    const s = String(v).trim();
    const m = s.match(/^(\d{2,4})\s*\/\s*(\d+)$/);
    if (!m) return null;
    // remove leading zeros from the number portion
    return m[1] + '/' + String(parseInt(m[2],10));
  }

  function renderCards(rows){
    // Only consider rows with valid Dosya No for file counts
    const validRows = rows.filter(r => isValidDosyaNo(r[2]));
    const uniqueFiles = Array.from(new Set(validRows.map(r => normalizeDosyaNo(r[2])).filter(x=>x)));
    // Total: number of BYU'dan karar verilen suç kayıtları (valid rows)
    const totalByuSuclar = validRows.length;

    cards.innerHTML = '';
    const cardHtml = (title, value) => `
      <div class="col-12 col-md-6 col-lg-3">
        <div class="card h-100"><div class="card-body"><div class="small text-muted">${title}</div><div class="h4 fw-bold">${value}</div></div></div>
      </div>`;
    cards.insertAdjacentHTML('beforeend', cardHtml('Karar Verilen BYU Dosyası Sayısı (eşsiz C sütunu)', uniqueFiles.length));
    cards.insertAdjacentHTML('beforeend', cardHtml("BYU'dan Karar Verilen Suç Sayısı", totalByuSuclar));
  }

  // Detail table removed — no rendering required
  function renderTable(rows){
    // noop: table removed as per UI change
    return;
  }

  function renderKLFrequency(rows){
    // K -> index 10, L -> index 11
    const kfreq = {};
    const lfreq = {};
    rows.forEach(r => {
      const k = (r[10] || '').toString().trim();
      const l = (r[11] || '').toString().trim();
      if (k) kfreq[k] = (kfreq[k]||0) + 1;
      if (l) lfreq[l] = (lfreq[l]||0) + 1;
    });

    let html = '<div class="row">';
    html += '<div class="col-md-6"><h6>K sütunu frekans</h6><table class="table table-sm"><thead><tr><th>Değer</th><th>Dosya Sayısı</th></tr></thead><tbody>';
    Object.keys(kfreq).sort().forEach(k=> html += `<tr><td>${k}</td><td>${kfreq[k]}</td></tr>`);
    html += '</tbody></table></div>';

    html += '<div class="col-md-6"><h6>L sütunu frekans</h6><table class="table table-sm"><thead><tr><th>Değer</th><th>Dosya Sayısı</th></tr></thead><tbody>';
    Object.keys(lfreq).sort().forEach(l=> html += `<tr><td>${l}</td><td>${lfreq[l]}</td></tr>`);
    html += '</tbody></table></div>';

    html += '</div>';
    if (!klContainer) { console.warn('byuKLTable element not found, skipping K/L render'); return; }
    klContainer.innerHTML = html;
    // store frequencies for export
    lastKfreq = kfreq; lastLfreq = lfreq;
    // bind export KL button
    const exportKLBtn = document.getElementById('exportKL');
    if (exportKLBtn) {
      exportKLBtn.onclick = function(){
        let csv = 'Column,Value,Count\n';
        Object.keys(lastKfreq).forEach(k=> csv += 'K,"'+k+'",'+lastKfreq[k]+'\n');
        Object.keys(lastLfreq).forEach(l=> csv += 'L,"'+l+'",'+lastLfreq[l]+'\n');
        downloadCSV(csv, 'byu_kl.csv');
      };
    }
  }

  function applyDateFilter(rows){
    const from = dateFrom.value ? new Date(dateFrom.value) : null;
    const to = dateTo.value ? new Date(dateTo.value) : null;
    if (!from && !to) return rows;
    return rows.filter(r => {
      const d = parseDateCell(r[3]);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  // initDataTable removed: detail table was removed from UI
  function initDataTable(){
    // noop
    return;
  }

  function processWorkbook(workbook){
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, {header:1, raw:false, defval:''});

    // Check I3 -> data[2][8]
    const i3 = (data[2] && data[2][8]) ? String(data[2][8]).trim() : '';
    const expected = 'Karar Tarihine Göre Karara Çıkan BYU Dosyaları';
    if (i3 !== expected){
      showStatus('Lütfen Basit Yargılama Usulü Uygulanan Dosyalar Raporu ekranından "Karar Tarihine Göre Karara Çıkan BYU Dosyaları" raporunu yükleyiniz.', 'danger');
      return;
    }

    hideStatus();

    // Data table starts at C10 (row 10 -> index 9). We'll read rows from index 9 and only rows that contain something in C
    const rows = data.slice(9).filter(r => (r[2] !== undefined && String(r[2]).trim() !== ''));

    // store rows
    lastRows = rows.slice();window.teftisKullanildi?.();
    lastDisplayedRows = rows.slice();

    // initial render
    renderCards(rows);
    renderKLFrequency(rows);

    // hide the initial hint alert (valid file loaded)
    try { document.getElementById('byuInitAlert').style.display = 'none'; } catch(e){}

    // attach filter button to re-render
    applyBtn.onclick = function(){
      const filtered = applyDateFilter(rows);
      renderCards(filtered);
      renderKLFrequency(filtered);
    };
  }

  async function handleFile(file){
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, {type:'array'});
      processWorkbook(wb);
    } catch(err){
      showStatus('Dosya okunamadı: ' + (err && err.message ? err.message : ''), 'danger');
      console.error(err);
    }
  }

  // Input / drop bindings
  byuInput && byuInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    handleFile(f);
  });

  ['dragenter','dragover'].forEach(ev => byuDrop && byuDrop.addEventListener(ev, e=>{ e.preventDefault(); byuDrop.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => byuDrop && byuDrop.addEventListener(ev, e=>{ e.preventDefault(); byuDrop.classList.remove('dragover'); }));
  byuDrop && byuDrop.addEventListener('drop', e=>{
    e.preventDefault();
    const dt = e.dataTransfer; if (!dt || !dt.files || dt.files.length===0) return;
    const f = dt.files[0];
    handleFile(f);
  });

});
