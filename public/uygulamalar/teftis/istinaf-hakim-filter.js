// İstinaf Hakim Filtresi - Karar defterinden hakim bilgilerini parse edip filtreleme sağlar
(function() {
  'use strict';

  // ---- DOM referansları
  const $ = (s, r = document) => r.querySelector(s);
  const hakimDropZone = $('#hakimDropZone');
  const hakimInput = $('#hakimExcelInput');
  const hakimSelect = $('#hakimSelect');
  const hakimFilterContainer = $('#hakimFilterContainer');
  const hakimMatchCount = $('#hakimMatchCount');

  if (!hakimDropZone || !hakimInput) {
    console.warn('Hakim filter: DOM elementleri bulunamadı');
    return;
  }

  // ---- Global state
  let kararHakimMap = {}; // {esasNo: [hakim1, hakim2, ...]}
  let uniqueHakimler = [];
  let istinafData = []; // Ana istinaf verisi (window'dan alınacak)

  // ---- Yardımcı fonksiyonlar
  function normalize(s) {
    return String(s || '').trim().replace(/\s+/g, ' ');
  }

  function normalizeEsasNo(esasNo) {
    // "2025/1" veya "2025 / 1" gibi formatları standartlaştır
    const cleaned = String(esasNo || '').trim().replace(/\s+/g, '');
    const match = cleaned.match(/^(\d{4})\/(\d+)$/);
    if (match) return `${match[1]}/${match[2]}`;
    return cleaned;
  }

  function toastWithIcon(type, title, msg, delay = 5000) {
    if (typeof window.toast !== 'function') return;
    const icons = {success: 'check_circle', warning: 'warning', danger: 'error', info: 'info'};
    const icon = icons[type] || 'info';
    const bodyHtml = `<div style="display:flex;align-items:flex-start;gap:.5rem;">
      <span class="material-symbols-rounded" style="font-size:22px;">${icon}</span>
      <div>${msg}</div></div>`;
    window.toast({type, title, body: bodyHtml, delay});
  }

  // ---- XLSX parsing
  async function waitForXlsxReady(timeout = 3000) {
    return new Promise(resolve => {
      if (window.XLSX && typeof XLSX.read === 'function') return resolve(true);
      
      function onReady(e) {
        document.removeEventListener('xlsx-ready', onReady);
        resolve(!!(e && e.detail && e.detail.ok));
      }
      document.addEventListener('xlsx-ready', onReady);
      
      setTimeout(() => {
        resolve(!!(window.XLSX && typeof XLSX.read === 'function'));
      }, timeout);
    });
  }

  async function parseXLSX(file) {
    const ok = await waitForXlsxReady();
    if (!ok || !(window.XLSX && typeof XLSX.read === 'function')) {
      throw new Error('XLSX kütüphanesi yüklenemedi');
    }
    
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, {type: 'array'});
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, {header: 1, raw: true});
    const header = (json[0] || []).map(String);
    const rows = json.slice(1).map(r => r.map(v => (v == null ? '' : String(v))));
    return {header, rows};
  }

  // ---- Sütun bulma (karar.php'deki mantık)
  function findColumnIndex(header, ...names) {
    const upper = header.map(h => String(h).trim().toUpperCase());
    for (const name of names) {
      const idx = upper.indexOf(name.toUpperCase());
      if (idx > -1) return idx;
    }
    return -1;
  }

  function letterToIndex(letter) {
    letter = String(letter).toUpperCase().trim();
    let n = 0;
    for (let i = 0; i < letter.length; i++) {
      n = n * 26 + (letter.charCodeAt(i) - 64);
    }
    return n - 1;
  }

  // ---- Karar defterlerini parse et
  async function parseKararFiles(files) {
    const newHakimMap = {};
    
    for (const file of files) {
      try {
        const {header, rows} = await parseXLSX(file);
        
        // Sütunları bul
        let colC = findColumnIndex(header, 'ESAS NO', 'ESAS', 'C');
        if (colC === -1) colC = letterToIndex('C'); // Fallback: C sütunu
        
        // Hakim sütunları: H, I, J, K (kullanıcı tanımlı veya default)
        const colH = letterToIndex('H');
        const colI = letterToIndex('I');
        const colJ = letterToIndex('J');
        const colK = letterToIndex('K');
        
        rows.forEach(row => {
          const esasNo = normalizeEsasNo(row[colC]);
          if (!esasNo) return;
          
          const hakimler = [
            normalize(row[colH]),
            normalize(row[colI]),
            normalize(row[colJ]),
            normalize(row[colK])
          ].filter(h => h && h.length > 0);
          
          if (hakimler.length > 0) {
            if (!newHakimMap[esasNo]) {
              newHakimMap[esasNo] = [];
            }
            // Duplicate kontrolü ile ekle
            hakimler.forEach(h => {
              if (!newHakimMap[esasNo].includes(h)) {
                newHakimMap[esasNo].push(h);
              }
            });
          }
        });
        
      } catch (err) {
        console.error('Karar defteri parse hatası:', file.name, err);
        toastWithIcon('danger', 'Hata', `${file.name} dosyası okunamadı: ${err.message}`);
      }
    }
    
    return newHakimMap;
  }

  // ---- Benzersiz hakim listesini çıkar
  function extractUniqueHakimler(hakimMap) {
    const allHakimler = new Set();
    Object.values(hakimMap).forEach(hakimList => {
      hakimList.forEach(h => allHakimler.add(h));
    });
    return Array.from(allHakimler).sort((a, b) => 
      a.localeCompare(b, 'tr', {sensitivity: 'base'})
    );
  }

  // ---- UI güncelleme
  function populateHakimSelect(hakimler) {
    hakimSelect.innerHTML = '<option value="">Tümü</option>';
    hakimler.forEach(hakim => {
      const option = document.createElement('option');
      option.value = hakim;
      option.textContent = hakim;
      hakimSelect.appendChild(option);
    });
    
    hakimFilterContainer.style.display = 'block';
    
    // İlk yükleme sonrası eşleşen dosya sayısını göster
    const matchedCount = istinafData.filter(item => {
      const normalizedEsas = normalizeEsasNo(item.esasNo || item.C || '');
      return kararHakimMap[normalizedEsas] && kararHakimMap[normalizedEsas].length > 0;
    }).length;
    
    updateMatchCount(istinafData.length);
    toastWithIcon('success', 'Karar Defteri Yüklendi', 
      `${hakimler.length} hakim bulundu. ${matchedCount} dosya eşleşti. Filtreleme hazır!`, 4000);
  }

  function updateMatchCount(count) {
    if (hakimMatchCount) {
      hakimMatchCount.textContent = count;
    }
  }

  // ---- Filtreleme uygula (mevcut rapor üzerinde)
  function applyHakimFilter(selectedHakim) {
    if (!window.istinafFilterByHakim) {
      console.warn('window.istinafFilterByHakim fonksiyonu bulunamadı');
      return;
    }
    
    if (!istinafData || istinafData.length === 0) {
      toastWithIcon('warning', 'Veri Yok', 'Önce İstinaf defteri yükleyin', 3000);
      return;
    }
    
    if (!selectedHakim) {
      // Tümünü göster - filtreyi kaldır
      window.istinafFilterByHakim(null);
      updateMatchCount(istinafData.length);
      console.log('Hakim filtresi kaldırıldı, tüm veriler gösteriliyor');
      return;
    }
    
    // Filtreleme: esasNo'ya göre hakim eşleştir
    const filtered = istinafData.filter(item => {
      const normalizedEsas = normalizeEsasNo(item.esasNo || item.C || '');
      const hakimler = kararHakimMap[normalizedEsas] || [];
      return hakimler.some(h => h === selectedHakim);
    });
    
    window.istinafFilterByHakim(filtered);
    updateMatchCount(filtered.length);
    
    console.log(`Hakim "${selectedHakim}" için ${filtered.length} dosya bulundu`);
    
    // Eşleşme yoksa uyarı
    if (filtered.length === 0) {
      toastWithIcon('info', 'Eşleşme Bulunamadı', 
        `"${selectedHakim}" hakimi için karar defterinde eşleşen dosya bulunamadı.`, 4000);
    }
  }

  // ---- Event Listeners: Dosya yükleme
  async function handleFiles(files) {
    try { window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerIstHakim', true); } catch(e) { try { window.XlsSpinner && window.XlsSpinner.show(); } catch(e){} }
    try {
    if (!files || files.length === 0) return;
    
    // İstinaf defteri yüklenmemiş uyarısı
    if (!istinafData || istinafData.length === 0) {
      toastWithIcon('warning', 'Önce İstinaf Defteri Yükleyin', 
        'Hakime göre filtreleme yapabilmek için önce yukarıdaki alandan İstinaf defterini yüklemelisiniz.', 5000);
      return;
    }
    
    const excelFiles = Array.from(files).filter(f => {
      const n = f.name.toLowerCase();
      return n.endsWith('.xls') || n.endsWith('.xlsx');
    });
    
    if (excelFiles.length === 0) {
      toastWithIcon('warning', 'Geçersiz Dosya', 'Lütfen .xls veya .xlsx formatında karar defteri yükleyin');
      return;
    }
    
    toastWithIcon('info', 'Karar Defteri Okunuyor', 
      `${excelFiles.length} dosya işleniyor...`, 2000);
    
    const newHakimMap = await parseKararFiles(excelFiles);
    
    // Mevcut map ile birleştir
    Object.keys(newHakimMap).forEach(esasNo => {
      if (!kararHakimMap[esasNo]) {
        kararHakimMap[esasNo] = [];
      }
      newHakimMap[esasNo].forEach(h => {
        if (!kararHakimMap[esasNo].includes(h)) {
          kararHakimMap[esasNo].push(h);
        }
      });
    });
    
    uniqueHakimler = extractUniqueHakimler(kararHakimMap);
    populateHakimSelect(uniqueHakimler);
    
    console.log('Karar-Hakim Map:', kararHakimMap);
    console.log('Benzersiz Hakimler:', uniqueHakimler);
    } finally {
      try { window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerIstHakim', false); } catch(e) { try { window.XlsSpinner && window.XlsSpinner.hide(); } catch(e){} }
    }
  }

  // Dropzone events
  hakimDropZone.addEventListener('click', () => hakimInput.click());
  
  hakimDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    hakimDropZone.classList.add('drag-over');
  });
  
  hakimDropZone.addEventListener('dragleave', () => {
    hakimDropZone.classList.remove('drag-over');
  });
  
  hakimDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    hakimDropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  
  hakimInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Hakim seçimi değiştiğinde
  if (hakimSelect) {
    hakimSelect.addEventListener('change', (e) => {
      applyHakimFilter(e.target.value);
    });
  }

  // ---- Global API
  window.istinafHakimFilter = {
    setData: (data) => {
      istinafData = data || [];
      console.log('İstinaf data set:', istinafData.length, 'kayıt');
    },
    getHakimMap: () => kararHakimMap,
    getHakimler: () => uniqueHakimler,
    reset: () => {
      kararHakimMap = {};
      uniqueHakimler = [];
      hakimSelect.innerHTML = '<option value="">Tümü</option>';
      hakimFilterContainer.style.display = 'none';
      updateMatchCount(0);
    }
  };

  console.log('İstinaf Hakim Filter: Hazır ✓');
})();
