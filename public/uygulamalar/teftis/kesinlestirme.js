(function(){
  'use strict';

  // Helper function
  function $(sel){ return document.querySelector(sel); }

  // Storage for extracted data
  window.__kesinlestirmeData = {
    kararDefteri: null, // Will store: [{esasNo, kararNo, kararTarihi}, ...]
    kesinlestirmeKontrol: null, // Will store data from step 2
    infazGecVerilenler: null, // Will store data from step 3
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    mergedData: null // Will store merged table data with all columns
  };

  // Update TODO list card
  function updateTodoList(){
    const container = $('#todoListContainer');
    if (!container) return;

    const data = window.__kesinlestirmeData;

    let html = '<div class="card mb-3" id="todoListPanel">';
    html += '<div class="card-header d-flex align-items-center gap-2">';
    html += '<span class="material-symbols-rounded">checklist</span>';
    html += '<strong>Bilgi</strong>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<ol class="m-0 ps-4 lh-lg">';

    // Step 1
    if (data.step1Complete){
      html += '<li class="text-decoration-line-through text-muted">';
      html += 'Karar Defterleri yüklenecek ';
      html += '<span class="text-success fw-bold">✓ ' +
              (data.kararDefteri ? data.kararDefteri.length : 0) +
              ' kayıt hafızaya alındı</span>';
      html += '</li>';
    } else {
      html += '<li>Karar Defterleri yüklenecek</li>';
    }

    // Step 2
    if (data.step2Complete){
      html += '<li style="text-decoration:line-through;color:var(--muted);">';
      html += 'Gönderilen Kesinleştirme ve İnfaza Verme Kontrolü EXCEL dosyası yüklenecek ';
      html += '<span style="color:var(--success);font-weight:bold;">✓ ' +
              (data.kesinlestirmeKontrol ? data.kesinlestirmeKontrol.length : 0) +
              ' kayıt hafızaya alındı</span>';
      html += '</li>';
    } else {
      html += '<li>Gönderilen Kesinleştirme ve İnfaza Verme Kontrolü EXCEL dosyası yüklenecek</li>';
    }

    // Step 3
    if (data.step3Complete){
      html += '<li style="text-decoration:line-through;color:var(--muted);">';
      html += 'Gönderilen İnfaza Geç Verilenler EXCEL dosyası yüklenecek ';
      html += '<span style="color:var(--success);font-weight:bold;">✓ ' +
              (data.infazGecVerilenler ? data.infazGecVerilenler.length : 0) +
              ' kayıt hafızaya alındı</span>';
      html += '</li>';
    } else {
      html += '<li>Gönderilen İnfaza Geç Verilenler EXCEL dosyası yüklenecek</li>';
    }

    html += '</ol>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  // Update kararDefteriPanel content dynamically based on current step
  function updateKararDefteriPanel(){
    const data = window.__kesinlestirmeData;
    const panelHead = document.querySelector('#kararDefteriPanel .card-header strong');
    const panelDesc = document.querySelector('#kararDefteriPanel .card-body > p.text-muted');
    const dropZone = document.querySelector('#dropZoneKarar');
    const fileInput = document.querySelector('#kararInput');
    const selectButton = document.querySelector('#kararDefteriPanel .btn');

    if (!panelHead || !panelDesc) return;

    // Determine current step
    let currentStep = 1;
    if (data.step1Complete && !data.step2Complete) {
      currentStep = 2;
    } else if (data.step1Complete && data.step2Complete && !data.step3Complete) {
      currentStep = 3;
    }

    switch(currentStep) {
      case 1:
        // Step 1: Karar Defteri
        panelHead.innerHTML = '<span class="material-symbols-rounded me-2">upload</span>1. Adım: Karar Defteri';
        panelDesc.innerHTML = 'UYAP > Raporlar > Defterler > Karar Defteri dosyasını yükleyin.';
        if (dropZone) dropZone.style.display = 'block';
        if (fileInput) fileInput.style.display = 'block';
        if (selectButton) selectButton.style.display = 'block';
        break;

      case 2:
        // Step 2: Kesinleşme ve İnfaza Verme Kontrolü
        panelHead.innerHTML = '<span class="material-symbols-rounded me-2">upload</span>2. Adım: Kesinleşme ve İnfaza Verme Kontrolü';
        panelDesc.innerHTML = 'Tarafınıza gönderilen Kesinleştirme ve İnfaza Verme Kontrolü EXCEL dosyasını yükleyiniz.';
        if (dropZone) dropZone.style.display = 'block';
        if (fileInput) fileInput.style.display = 'block';
        if (selectButton) selectButton.style.display = 'block';
        break;

      case 3:
        // Step 3: İnfaza Geç Verilenler
        panelHead.innerHTML = '<span class="material-symbols-rounded me-2">upload</span>3. Adım: İnfaza Geç Verilenler';
        panelDesc.innerHTML = 'Tarafınıza gönderilen İnfaza Geç Verilenler EXCEL dosyasını yükleyiniz.';
        if (dropZone) dropZone.style.display = 'block';
        if (fileInput) fileInput.style.display = 'block';
        if (selectButton) selectButton.style.display = 'block';
        break;
    }
  }

  // Generate merged summary table
  function generateMergedTable(){
    const kararData = window.__kesinlestirmeData.kararDefteri;
    const kesinlestirmeData = window.__kesinlestirmeData.kesinlestirmeKontrol;

    if (!kararData || kararData.length === 0) return;

    // Create lookup map from kesinlestirme data (by Esas No)
    const kesinlestirmeMap = {};
    if (kesinlestirmeData){
      for (let k = 0; k < kesinlestirmeData.length; k++){
        const item = kesinlestirmeData[k];
        kesinlestirmeMap[item.esasNo] = item;
      }
    }

    const container = $('#resultsContainer');
    if (!container) return;

    let html = '<div class="card mb-3" id="mergedResultPanel">';
    html += '<div class="card-header d-flex align-items-center justify-content-between">';
    html += '<div class="d-flex align-items-center gap-2">';
    html += '<span class="material-symbols-rounded">table_chart</span>';
    html += '<strong>Birleştirilmiş Özet</strong>';
    html += '</div>';
    html += '<button class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" id="exportMergedExcel">';
    html += '<span class="material-symbols-rounded fs-6">download</span> Excel';
    html += '</button>';
    html += '</div>';
    html += '<div class="card-body">';
    html += '<div class="table-responsive">';
    html += '<table class="table w-100">';
    html += '<thead><tr>';
    html += '<th>SIRA</th>';
    html += '<th>ESAS NO</th>';
    html += '<th>KARAR NO</th>';
    html += '<th>KARAR TARİHİ</th>';
    html += '<th>KARAR TÜRÜ VE MAHİYETİ<br><small>(Mahkûmiyet-HAGB/Erteleme) (Para/Hapis Cezası)</small></th>';
    html += '<th>KESİNLEŞME TARİHİ</th>';
    html += '<th>KESİNLEŞTİRME İŞLEM TARİHİ</th>';
    html += '<th>KESİNLEŞTİRME İŞLEMİNDE GECİKME SÜRESİ<br><small>(Gün) ve AÇIKLAMA</small></th>';
    html += '<th>İNFAZA VERİLİŞ TARİHİ</th>';
    html += '<th>İNFAZA VERMEDE GECİKME SÜRESİ<br><small>(Gün)</small></th>';
    html += '</tr></thead>';
    html += '<tbody>';

    // Create merged data structure
    const mergedData = [];

    for (let i = 0; i < kararData.length; i++){
      const row = kararData[i];
      const kesinlestirme = kesinlestirmeMap[row.esasNo] || {};

      mergedData.push({
        sira: i + 1,
        esasNo: row.esasNo,
        kararNo: row.kararNo,
        kararTarihi: row.kararTarihi,
        kararTuruMahiyet: kesinlestirme.kararTuruMahiyet || '',
        kesinlesmeTarihi: kesinlestirme.kesinlesmeTarihi || '',
        kesinlestirmeIslemTarihi: kesinlestirme.kesinlestirmeIslemTarihi || '',
        kesinlestirmeGecikme: kesinlestirme.kesinlestirmeGecikme || '',
        infazTarihi: kesinlestirme.infazTarihi || '',
        infazGecikme: kesinlestirme.infazGecikme || '',
        aciklama: kesinlestirme.aciklama || ''
      });

      // Combine gecikme süre and açıklama
      let gecikmeText = kesinlestirme.kesinlestirmeGecikme || '-';
      if (kesinlestirme.aciklama){
        gecikmeText += (gecikmeText !== '-' ? ' - ' : '') + kesinlestirme.aciklama;
      }

      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td>' + (row.esasNo || '') + '</td>';
      html += '<td>' + (row.kararNo || '') + '</td>';
      html += '<td>' + (row.kararTarihi || '') + '</td>';
      html += '<td>' + (kesinlestirme.kararTuruMahiyet || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + (kesinlestirme.kesinlesmeTarihi || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + (kesinlestirme.kesinlestirmeIslemTarihi || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + gecikmeText + '</td>';
      html += '<td>' + (kesinlestirme.infazTarihi || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + (kesinlestirme.infazGecikme || '<span class="muted">-</span>') + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;

    // Store merged data
    window.__kesinlestirmeData.mergedData = mergedData;

    // Wire export button
    const exportBtn = $('#exportMergedExcel');
    if (exportBtn){
      exportBtn.addEventListener('click', exportMergedToExcel);
    }

    // Enable drag scroll if available
  }

  // Export merged table to Excel
  function exportMergedToExcel(){
    const data = window.__kesinlestirmeData.mergedData;
    if (!data || data.length === 0){
      if (window.toast){
        window.toast({
          type: 'warning',
          title: 'Uyarı',
          body: 'Dışa aktarılacak veri bulunamadı.',
          delay: 3000
        });
      }
      return;
    }

    // Prepare data for Excel
    const excelData = [
      ['SIRA', 'ESAS NO', 'KARAR NO', 'KARAR TARİHİ',
        'KARAR TÜRÜ',
        'KESİNLEŞME TARİHİ', 'KESİNLEŞTİRME İŞLEM TARİHİ',
        'KESİNLEŞTİRME İŞLEMİNDE GECİKME SÜRESİ (Gün)',
        'İNFAZA VERİLİŞ TARİHİ', 'İNFAZA VERMEDE GECİKME SÜRESİ (Gün)']
    ];

    for (let i = 0; i < data.length; i++){
      const row = data[i];
      excelData.push([
        row.sira,
        row.esasNo,
        row.kararNo || '-',
        row.kararTarihi || '-',
        row.kararTuru || '-',
        row.kesinlesmeTarihi || '-',
        row.kesinlestirmeIslemTarihi || '-',
        row.kesinlestirmeGecikme || '-',
        row.infazTarihi || '-',
        row.infazGecikme || '-'
      ]);
    }

    if (window.XLSX){
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Sütun genişliklerini otomatik ayarla
      const colWidths = [];
      excelData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellValue = String(cell || '');
          const cellLength = cellValue.length;
          if (!colWidths[colIndex] || colWidths[colIndex] < cellLength) {
            colWidths[colIndex] = cellLength;
          }
        });
      });
      ws['!cols'] = colWidths.map(w => ({ wch: Math.min(Math.max(w + 2, 10), 50) }));
      
      XLSX.utils.book_append_sheet(wb, ws, 'Kesinleşme İnfaz');
      XLSX.writeFile(wb, 'kesinlesme-infaz-raporu.xlsx');

      if (window.toast){
        window.toast({
          type: 'success',
          title: 'Excel İndirildi',
          body: 'Rapor başarıyla indirildi.',
          delay: 3000
        });
      }
    } else {
      if (window.toast){
        window.toast({
          type: 'error',
          title: 'Hata',
          body: 'Excel kütüphanesi yüklenemedi.',
          delay: 3000
        });
      }
    }
  }

  // Handle "Kayıtları Ayıkla ve İndir" button click
  function handleAyiklaIndir(){
    const mergedData = window.__kesinlestirmeData.mergedData;
    const metadata = window.__kesinlestirmeData.metadata || {};

    if (!mergedData || mergedData.length === 0){
      if (window.toast){
        window.toast({
          type: 'warning',
          title: 'Uyarı',
          body: 'Birleştirilmiş veri bulunamadı.',
          delay: 3000
        });
      }
      return;
    }

    if (!window.XLSX){
      if (window.toast){
        window.toast({
          type: 'error',
          title: 'Hata',
          body: 'Excel kütüphanesi yüklenemedi.',
          delay: 3000
        });
      }
      return;
    }

    // Show confirmation modal before processing
    showAyiklaConfirmationModal();
  }

  // Show confirmation modal for ayikla operation
  function showAyiklaConfirmationModal(){
    const mergedData = window.__kesinlestirmeData.mergedData;
    const totalRows = mergedData.length;

    // Quick calculation to get kontrol and ayiklanan counts
    const groupedByEsas = {};
    for (let i = 0; i < mergedData.length; i++){
      const record = mergedData[i];
      const esasNo = record.esasNo;
      if (!groupedByEsas[esasNo]){
        groupedByEsas[esasNo] = [];
      }
      groupedByEsas[esasNo].push(record);
    }

    const kontrolCount = Object.keys(groupedByEsas).length; // One per Esas No
    const ayiklananCount = totalRows - kontrolCount;

    // Create modal backdrop with blur
    const backdrop = document.createElement('div');
    backdrop.id = 'ayiklaModalBackdrop';
    backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--modal-backdrop, rgba(0,0,0,0.7));backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:9998;';

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'ayiklaModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--adalet-card-bg, #ffffff);color:var(--adalet-text, #0f172a);padding:0;border-radius:8px;box-shadow:var(--modal-shadow, 0 4px 20px rgba(0,0,0,0.3));z-index:9999;max-width:600px;width:90%;max-height:80vh;overflow:auto;border:1px solid var(--adalet-border, #e5e7eb);';

    let modalHTML = '<div class="p-3 border-bottom border-danger" style="background: var(--adalet-light, #f8fafc); border-color: var(--danger, #dc3545) !important;">';
    modalHTML += '<h2 class="mb-0 text-danger"><span class="material-symbols-rounded" style="vertical-align:middle;font-size:32px;">warning</span> DİKKAT</h2>';
    modalHTML += '</div>';

    modalHTML += '<div class="p-3" style="color: var(--adalet-text, #0f172a); line-height:1.6;">';
    modalHTML += '<p>Lütfen verilerin doğruluğunun <b>sizin sorumluluğunuzda</b> olduğunu bilerek, kayıtları bir kaç kez teyit ediniz.</p>';
    modalHTML += '<p>Yüklemiş olduğunuz tablolardan <b>toplam ' + totalRows + ' satır</b> veri geldi, bu verilerden 1 excel dosyası oluşturmak üzeresiniz.</p>';

    modalHTML += '<div class="alert alert-success mb-3 p-3 rounded" style="background: var(--success-bg, #d1edff); border-color: var(--success-border, #bee5eb); color: var(--success-text, #0f5132);">';
    modalHTML += '<p class="mb-2">Excel dosyasında <b class="text-success">' + kontrolCount + ' satır</b> <b>"kontrol"</b> sayfasına filtrelendi.</p>';
    modalHTML += '<p class="mb-2 small"><b>Filtreleme koşulları:</b></p>';
    modalHTML += '<ul class="mb-2 small" style="padding-left:20px;">';
    modalHTML += '<li>Tüm dosyalar tek kayıt olarak aktarıldı</li>';
    modalHTML += '<li>En ağır hapis cezası → yoksa para cezası → yoksa HAGB → yoksa diğer kayıtlardan en geç olan koşulu uygulandı</li>';
    modalHTML += '</ul>';
    modalHTML += '</div>';

    modalHTML += '<div class="alert alert-warning mb-3 p-3 rounded" style="background: var(--warning-bg, #fff3cd); border-color: var(--warning-border, #ffeaa7); color: var(--warning-text, #664d03);">';
    modalHTML += '<p class="mb-0"><b>⚠️ Çalışmalarınızı "kontrol" sayfasında yapınız.</b></p>';
    modalHTML += '<ul class="mb-2 small" style="padding-left:20px;">';
    modalHTML += '<li>Çalışmalarınızı yaparken <b>sayfa adlarını değiştirmeden</b> tamamlayınız</li>';
    modalHTML += '<li>Satır <b>silme</b> yapabilirsiniz</li>';
    modalHTML += '<li>Bu tabloyu bitirdiğinizde <b><i>tablo yapısını bozmadan</i></b> tekrar bu menüden yüklemeniz halinde <b>WORD</b> belgenizi indirebileceksiniz</li>';
    modalHTML += '</ul>';
    modalHTML += '</div>';

    modalHTML += '<div class="alert alert-danger mb-3 p-3 rounded" style="background: var(--danger-bg, #f8d7da); border-color: var(--danger-border, #f5c6cb); color: var(--danger-text, #721c24);">';
    modalHTML += '<p class="mb-0 text-danger">Kalan <b class="text-danger">' + ayiklananCount + ' adet</b> kayıt <b>"ayiklanan"</b> tablosuna aktarıldı, sorulduğunda hesap verilebilir şekilde saklayabilirsiniz.</p>';
    modalHTML += '</div>';

    modalHTML += '<div class="alert alert-primary mb-3 p-3 rounded" style="background: var(--primary-bg, #cce5ff); border-color: var(--primary-border, #b3d4fc); color: var(--primary-text, #004085);">';
    modalHTML += '<p class="mb-2 text-primary small"><b>💡 Önemli Hatırlatma:</b></p>';
    modalHTML += '<p class="text-primary small">Eğer kayıtlarda <b>Karar No</b> ve <b>Karar Tarihi</b> eksik ise; bu yılları da kapsar <b>Karar Defteri</b>ni ilk aşamada yükleyip adımları tamamlayıp, <b>eksiksiz dosyanızı indirmeyi unutmayınız.</b></p>';
    modalHTML += '</div>';

    modalHTML += '<div class="alert alert-info mb-3 p-3 rounded" style="background: var(--info-bg, #d1ecf1); border-color: var(--info-border, #bee5eb); color: var(--info-text, #0c5460);">';
    modalHTML += '<p class="mb-0 small text-body"><b>ℹ️ Geri yükleme:</b> Bu tabloyu <b>geri yüklediğinizde</b> süreleri tekrar hesaplama, gecikmelerden 60 gün düşme, 0 olan kayıtları silme işlemlerini yapacağız.</p>';
    modalHTML += '</div>';
    modalHTML += '</div>';

    modalHTML += '<div class="p-3 border-top" style="background: var(--adalet-light, #f8fafc); border-color: var(--adalet-border, #e5e7eb) !important;">';
    modalHTML += '<label class="form-check form-check-inline mb-3" style="cursor:pointer; color: var(--adalet-text, #0f172a);">';
    modalHTML += '<input class="form-check-input me-2" type="checkbox" id="ayiklaConfirmCheck">';
    modalHTML += '<span style="color: var(--adalet-text, #0f172a);">Okudum, anladım ve sorumluluğu kabul ediyorum</span>';
    modalHTML += '</label>';
    modalHTML += '<div class="d-flex gap-2 justify-content-end">';
    modalHTML += '<button id="ayiklaModalCancel" class="btn btn-outline-secondary" style="border-color: var(--adalet-border, #e5e7eb); color: var(--adalet-text, #0f172a);">İptal</button>';
    modalHTML += '<button id="ayiklaModalConfirm" class="btn btn-primary" disabled style="background: var(--adalet-primary, #c8102e); border-color: var(--adalet-primary, #c8102e);">Tamam ve İndir</button>';
    modalHTML += '</div>';
    modalHTML += '</div>';

    modal.innerHTML = modalHTML;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Wire checkbox
    const checkbox = document.getElementById('ayiklaConfirmCheck');
    const confirmBtn = document.getElementById('ayiklaModalConfirm');

    if (checkbox && confirmBtn){
      checkbox.addEventListener('change', function(){
        if (this.checked){
          confirmBtn.disabled = false;
          confirmBtn.style.opacity = '1';
          confirmBtn.style.cursor = 'pointer';
        } else {
          confirmBtn.disabled = true;
          confirmBtn.style.opacity = '0.5';
          confirmBtn.style.cursor = 'not-allowed';
        }
      });
    }

    // Wire cancel button
    const cancelBtn = document.getElementById('ayiklaModalCancel');
    if (cancelBtn){
      cancelBtn.addEventListener('click', function(){
        document.body.removeChild(backdrop);
        document.body.removeChild(modal);
      });
    }

    // Wire confirm button
    if (confirmBtn){
      confirmBtn.addEventListener('click', function(){
        if (this.disabled) return;

        document.body.removeChild(backdrop);
        document.body.removeChild(modal);

        // Proceed with ayiklama
        processAyiklamaAndDownload();
      });
    }
  }

  // Process ayiklama and download Excel
  function processAyiklamaAndDownload(){
    const mergedData = window.__kesinlestirmeData.mergedData;
    const metadata = window.__kesinlestirmeData.metadata || {};

    // Show processing toast
    if (window.toast){
      window.toast({
        type: 'info',
        title: 'Ayıklama İşlemi',
        body: 'Kayıtlar ayıklanıyor...',
        delay: 2000
      });
    }

    // Group records by Esas No
    const groupedByEsas = {};
    for (var i = 0; i < mergedData.length; i++){
      const record = mergedData[i];
      var esasNo = record.esasNo;

      if (!groupedByEsas[esasNo]){
        groupedByEsas[esasNo] = [];
      }
      groupedByEsas[esasNo].push(record);
    }

    // Process each group and decide which record goes to "kontrol" and which to "ayiklanan"
    let kontrolRecords = [];
    let ayiklananRecords = [];

    for (var esasNo in groupedByEsas){
      const records = groupedByEsas[esasNo];
      const result = processEsasGroup(records);

      kontrolRecords.push(result.kontrol);
      ayiklananRecords = ayiklananRecords.concat(result.ayiklanan);
    }

    // Separate HAGB and non-HAGB records
    const nonHAGBRecords = [];
    const hagbRecords = [];

    for (var i = 0; i < kontrolRecords.length; i++){
      if (isHAGB(kontrolRecords[i].kararTuru)){
        hagbRecords.push(kontrolRecords[i]);
      } else {
        nonHAGBRecords.push(kontrolRecords[i]);
      }
    }

    // Sort non-HAGB records (Mahkumiyet/Hapis/Para) by gecikme descending
    nonHAGBRecords.sort(function(a, b){
      const aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      const bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });

    // Sort HAGB records by gecikme descending
    hagbRecords.sort(function(a, b){
      const aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      const bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });

    // Clear infaz fields for ALL HAGB records
    for (var i = 0; i < hagbRecords.length; i++){
      hagbRecords[i].infazTarihi = '-';
      hagbRecords[i].infazGecikme = '-';
    }

    // Combine: non-HAGB first, then HAGB
    kontrolRecords = nonHAGBRecords.concat(hagbRecords);

    // Sort ayiklanan records: same logic as kontrol (non-HAGB first, then HAGB)
    const ayiklananNonHAGB = [];
    const ayiklananHAGB = [];

    for (var i = 0; i < ayiklananRecords.length; i++){
      if (isHAGB(ayiklananRecords[i].kararTuru)){
        ayiklananHAGB.push(ayiklananRecords[i]);
      } else {
        ayiklananNonHAGB.push(ayiklananRecords[i]);
      }
    }

    // Sort non-HAGB by gecikme descending
    ayiklananNonHAGB.sort(function(a, b){
      const aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      const bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });

    // Sort HAGB by gecikme descending
    ayiklananHAGB.sort(function(a, b){
      const aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      const bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });

    // Combine ayiklanan: non-HAGB first, then HAGB
    ayiklananRecords = ayiklananNonHAGB.concat(ayiklananHAGB);

    // Re-number SIRA
    for (var i = 0; i < kontrolRecords.length; i++){
      kontrolRecords[i].sira = i + 1;
    }
    for (var i = 0; i < ayiklananRecords.length; i++){
      ayiklananRecords[i].sira = i + 1;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: "kontrol"
    const kontrolData = [
      ['SIRA', 'Esas No', 'Karar No', 'Karar Tarihi', 'Karar Türü',
        'Kesinleşme Tarihi', 'Kesinleştirme İşlem Tarihi',
        'Kesinleştirme İşleminde Gecikme Süresi', 'Gecikme Nedeni',
        'İnfaza Veriliş Tarihi', 'İnfaza Vermede Gecikme Süresi']
    ];

    for (var i = 0; i < kontrolRecords.length; i++){
      var row = kontrolRecords[i];
      kontrolData.push([
        row.sira,
        row.esasNo || '-',
        row.kararNo || '-',
        row.kararTarihi || '-',
        row.kararTuru || '-',
        row.kesinlesmeTarihi || '-',
        row.kesinlestirmeIslemTarihi || '-',
        row.kesinlestirmeGecikme || '-',
        row.gecikmeNedeni || '-',
        row.infazTarihi || '-',
        row.infazGecikme || '-'
      ]);
    }

    const wsKontrol = XLSX.utils.aoa_to_sheet(kontrolData);
    XLSX.utils.book_append_sheet(wb, wsKontrol, 'kontrol');

    // Sheet 2: "ayiklanan"
    const ayiklananData = [
      ['SIRA', 'Esas No', 'Karar No', 'Karar Tarihi', 'Karar Türü',
        'Kesinleşme Tarihi', 'Kesinleştirme İşlem Tarihi',
        'Kesinleştirme İşleminde Gecikme Süresi',
        'İnfaza Veriliş Tarihi', 'İnfaza Vermede Gecikme Süresi', 'Silinme Sebebi']
    ];

    for (var i = 0; i < ayiklananRecords.length; i++){
      var row = ayiklananRecords[i];
      ayiklananData.push([
        row.sira,
        row.esasNo || '-',
        row.kararNo || '-',
        row.kararTarihi || '-',
        row.kararTuru || '-',
        row.kesinlesmeTarihi || '-',
        row.kesinlestirmeIslemTarihi || '-',
        row.kesinlestirmeGecikme || '-',
        row.infazTarihi || '-',
        row.infazGecikme || '-',
        row.silinmeSebebi || '-'
      ]);
    }

    const wsAyiklanan = XLSX.utils.aoa_to_sheet(ayiklananData);
    XLSX.utils.book_append_sheet(wb, wsAyiklanan, 'ayiklanan');

    // Generate filename: BirimAdi_BUGÜN_infaz_birlestirilmis.xls
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = dd + '.' + mm + '.' + yyyy;

    let birimAdi = metadata.birimAdi || 'Birim';
    // Clean birim adı for filename
    birimAdi = birimAdi.replace(/[^a-zA-Z0-9_]/g, '_');

    const filename = birimAdi + '_' + dateStr + '_infaz_birlestirilmis.xls';

    // Download file
    XLSX.writeFile(wb, filename);

    if (window.toast){
      window.toast({
        type: 'success',
        title: 'Başarılı',
        body: 'Excel dosyası indirildi: ' + filename,
        delay: 3000
      });
    }
  }

  // Process a group of records with same Esas No
  function processEsasGroup(records){
    if (records.length === 1){
      return {
        kontrol: records[0],
        ayiklanan: []
      };
    }

    // Categorize records
    const hapisRecords = [];
    const paraRecords = [];
    const hagbRecords = [];
    const otherRecords = [];

    for (var i = 0; i < records.length; i++){
      const rec = records[i];
      const kararTuru = (rec.kararTuru || '').toUpperCase();

      if (kararTuru.indexOf('HAPİS') !== -1 || kararTuru.indexOf('HAPIS') !== -1){
        hapisRecords.push(rec);
      } else if (kararTuru.indexOf('PARA') !== -1){
        paraRecords.push(rec);
      } else if (isHAGB(kararTuru)){
        hagbRecords.push(rec);
      } else {
        otherRecords.push(rec);
      }
    }

    let kontrolRecord = null;
    let ayiklananList = [];
    let sebep = '';

    // Logic 1: If there's HAPIS
    if (hapisRecords.length > 0){
      sebep = 'Daha ağır olan HAPİS kaydı bulunması';

      if (hapisRecords.length === 1){
        kontrolRecord = hapisRecords[0];
        ayiklananList = paraRecords.concat(hagbRecords).concat(otherRecords);
      } else {
        // Multiple HAPIS: pick longest duration, then highest gecikme, then first
        hapisRecords.sort(function(a, b){
          // Compare duration (extract number from karar türü)
          const aDuration = extractHapisDuration(a.kararTuru);
          const bDuration = extractHapisDuration(b.kararTuru);

          if (bDuration !== aDuration) return bDuration - aDuration; // Longer first

          // If same duration, compare gecikme
          const aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
          const bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;

          return bGecikme - aGecikme; // Higher gecikme first
        });

        kontrolRecord = hapisRecords[0];
        ayiklananList = hapisRecords.slice(1).concat(paraRecords).concat(hagbRecords).concat(otherRecords);
      }
    }
    // Logic 2: No HAPIS, but PARA exists
    else if (paraRecords.length > 0){
      sebep = 'Daha ağır olan Para Cezası kaydı bulunması';

      if (paraRecords.length === 1){
        kontrolRecord = paraRecords[0];
        ayiklananList = hagbRecords.concat(otherRecords);
      } else {
        // Multiple PARA: pick highest amount, then latest date, then first
        paraRecords.sort(function(a, b){
          const aAmount = extractParaAmount(a.kararTuru);
          const bAmount = extractParaAmount(b.kararTuru);

          if (bAmount !== aAmount) return bAmount - aAmount; // Higher amount first

          // If same amount, compare kesinlestirme date (later first)
          const aDate = parseDate(a.kesinlestirmeIslemTarihi);
          const bDate = parseDate(b.kesinlestirmeIslemTarihi);

          if (aDate && bDate){
            return bDate.getTime() - aDate.getTime(); // Later first
          }

          return 0; // Keep original order (first wins)
        });

        kontrolRecord = paraRecords[0];
        ayiklananList = paraRecords.slice(1).concat(hagbRecords).concat(otherRecords);
      }
    }
    // Logic 3: No HAPIS, no PARA, but HAGB exists
    else if (hagbRecords.length > 0){
      sebep = 'HAGB kaydı tabloya eklendi';
      kontrolRecord = hagbRecords[0];
      ayiklananList = hagbRecords.slice(1).concat(otherRecords);
    }
    // Logic 4: None of above, pick most delayed
    else {
      sebep = 'mükerrer kayıt';

      const allRecords = otherRecords.length > 0 ? otherRecords : records;
      allRecords.sort(function(a, b){
        const aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
        const bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
        return bGecikme - aGecikme;
      });

      kontrolRecord = allRecords[0];
      ayiklananList = allRecords.slice(1);
    }

    // Clear infaz fields for HAGB records
    if (kontrolRecord && isHAGB(kontrolRecord.kararTuru)){
      kontrolRecord.infazTarihi = '-';
      kontrolRecord.infazGecikme = '-';
    }

    // Mark ayiklanan records with sebep
    for (var i = 0; i < ayiklananList.length; i++){
      ayiklananList[i].silinmeSebebi = sebep;

      // Clear infaz fields for HAGB records in ayiklanan too
      if (isHAGB(ayiklananList[i].kararTuru)){
        ayiklananList[i].infazTarihi = '-';
        ayiklananList[i].infazGecikme = '-';
      }
    }

    return {
      kontrol: kontrolRecord,
      ayiklanan: ayiklananList
    };
  }

  // Helper: Check if karar türü is HAGB
  function isHAGB(kararTuru){
    const upper = (kararTuru || '').toUpperCase();
    return upper.indexOf('HAGB') !== -1 ||
           upper.indexOf('HÜKMÜN AÇIKLANMASININ GERİ BIRAKILMASI') !== -1 ||
           upper.indexOf('GERİ BIRAKILMASI') !== -1 ||
           upper.indexOf('GERİ BIRAK') !== -1 ||
           upper.indexOf('GERİ BIRAKILMASI') !== -1;
  }

  // Helper: Extract hapis duration from karar türü (in months/years)
  function extractHapisDuration(kararTuru){
    if (!kararTuru) return 0;

    const str = String(kararTuru).toUpperCase();
    let months = 0;

    // Look for patterns like "2 YIL", "6 AY", "1 YIL 3 AY"
    const yilMatch = str.match(/(\d+)\s*YIL/);
    const ayMatch = str.match(/(\d+)\s*AY/);

    if (yilMatch){
      months += parseInt(yilMatch[1]) * 12;
    }
    if (ayMatch){
      months += parseInt(ayMatch[1]);
    }

    return months;
  }

  // Helper: Extract para amount from karar türü
  function extractParaAmount(kararTuru){
    if (!kararTuru) return 0;

    const str = String(kararTuru).toUpperCase();

    // Look for patterns like "1000 TL", "5.000 TL", "10000"
    const match = str.match(/(\d+(?:[.,]\d+)*)\s*(?:TL|TRY|LIRA)?/);

    if (match){
      const numStr = match[1].replace(/[.,]/g, '');
      return parseInt(numStr) || 0;
    }

    return 0;
  }

  // Letter to column index (A=0, B=1, etc.)
  function letterToIndex(letter){
    const upper = String(letter).toUpperCase();
    const code = upper.charCodeAt(0);
    return code - 65;
  }

  // Read file as ArrayBuffer
  function readAsArrayBuffer(file){
    return new Promise(function(resolve, reject){
      if (file.arrayBuffer){
        file.arrayBuffer().then(resolve).catch(reject);
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e){ resolve(e.target.result); };
      reader.onerror = function(){ reject(new Error('Dosya okunamadı')); };
      reader.readAsArrayBuffer(file);
    });
  }

  // Read workbook and return rows
  function readWorkbook(file){
    return readAsArrayBuffer(file).then(function(data){
      if (!window.XLSX || !XLSX.read){
        throw new Error('XLSX kütüphanesi yüklenemedi.');
      }
      const wb = XLSX.read(data, {type: 'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(ws, {header: 1, raw: false});
    });
  }

  // Validate B3 cell contains "KARAR DEFTERİ"
  function validateKararDefteri(rows){
    // B3 means row index 2 (0-based), column index 1 (B)
    if (!rows || rows.length < 3){
      return {valid: false, message: 'Dosya çok kısa, B3 hücresi bulunamadı.'};
    }
    const row3 = rows[2]; // 0-based index 2 = row 3
    if (!row3 || row3.length < 2){
      return {valid: false, message: 'B3 hücresi boş.'};
    }
    const b3Value = String(row3[1] || '').toUpperCase().trim();
    if (b3Value.indexOf('KARAR DEFTERİ') === -1){
      return {valid: false, message: 'B3 hücresinde "KARAR DEFTERİ" bulunamadı. Lütfen doğru dosyayı yükleyin.'};
    }
    return {valid: true};
  }

  // Validate Kesinleştirme ve İnfaza Verme Kontrolü file
  function validateKesinlestirmeKontrol(rows){
    // D3 should contain "KESİNLEŞTİRME VE İNFAZA VERME KONTROLÜ"
    if (!rows || rows.length < 3){
      return {valid: false, message: 'Dosya çok kısa, D3 hücresi bulunamadı.'};
    }
    const row3 = rows[2]; // 0-based index 2 = row 3
    if (!row3 || row3.length < 4){ // D = index 3
      return {valid: false, message: 'D3 hücresi boş.'};
    }
    const d3Value = String(row3[3] || '').toUpperCase().trim();
    if (d3Value.indexOf('KESİNLEŞTİRME VE İNFAZA VERME KONTROLÜ') === -1){
      return {valid: false, message: 'D3 hücresinde "KESİNLEŞTİRME VE İNFAZA VERME KONTROLÜ" bulunamadı. Lütfen doğru dosyayı yükleyin.'};
    }
    return {valid: true};
  }

  // Validate İnfaza Geç Verilenler Kontrolü file
  function validateInfazGecVerilenler(rows){
    // D3 should contain "İNFAZA GEÇ VERİLENLERİN KONTROLÜ"
    if (!rows || rows.length < 3){
      return {valid: false, message: 'Dosya çok kısa, D3 hücresi bulunamadı.'};
    }
    const row3 = rows[2]; // 0-based index 2 = row 3
    if (!row3 || row3.length < 4){ // D = index 3
      return {valid: false, message: 'D3 hücresi boş.'};
    }
    const d3Value = String(row3[3] || '').toUpperCase().trim();
    if (d3Value.indexOf('İNFAZA GEÇ VERİLENLERİN KONTROLÜ') === -1){
      return {valid: false, message: 'D3 hücresinde "İNFAZA GEÇ VERİLENLERİN KONTROLÜ" bulunamadı. Lütfen doğru dosyayı yükleyin.'};
    }
    return {valid: true};
  }

  // Extract data from Kesinleştirme Kontrolü file
  // Columns: C=Esas No, F=Karar No, H=Karar Tarihi, J=Karar Türü, L=Kesinleşme Tarihi,
  //          M=Kesinleştirme İşlem Tarihi, N=Gecikme Süresi, O=İnfaza Veriliş Tarihi,
  //          Q=İnfaza Gecikme Süresi, R=Açıklama
  function extractKesinlestirmeData(rows){
    const cIdx = letterToIndex('C'); // Esas No
    const fIdx = letterToIndex('F'); // Karar No
    const hIdx = letterToIndex('H'); // Karar Tarihi
    const jIdx = letterToIndex('J'); // Karar Türü ve Mahiyeti
    const lIdx = letterToIndex('L'); // Kesinleşme Tarihi
    const mIdx = letterToIndex('M'); // Kesinleştirme İşlem Tarihi
    const nIdx = letterToIndex('N'); // Kesinleştirme Gecikme Süresi
    const oIdx = letterToIndex('O'); // İnfaza Veriliş Tarihi
    const qIdx = letterToIndex('Q'); // İnfaza Gecikme Süresi
    const rIdx = letterToIndex('R'); // Açıklama

    const extracted = [];

    // Data starts from row 12 (index 11)
    for (let i = 11; i < rows.length; i++){
      const row = rows[i];
      if (!row) continue;

      const esasNo = row[cIdx];

      // Skip if Esas No is empty
      if (!esasNo || String(esasNo).trim() === '') continue;

      // Skip if this looks like a header row (contains "Esas No" or similar header text)
      const esasNoStr = String(esasNo).trim().toUpperCase();
      if (esasNoStr.indexOf('ESAS') !== -1 || esasNoStr.indexOf('NO') !== -1) continue;

      const kararNo = row[fIdx];
      const kararTarihi = row[hIdx];

      extracted.push({
        esasNo: String(esasNo).trim(),
        kararNo: kararNo ? String(kararNo).trim() : '',
        kararTarihi: kararTarihi ? String(kararTarihi).trim() : '',
        kararTuruMahiyet: row[jIdx] ? String(row[jIdx]).trim() : '',
        kesinlesmeTarihi: row[lIdx] ? String(row[lIdx]).trim() : '',
        kesinlestirmeIslemTarihi: row[mIdx] ? String(row[mIdx]).trim() : '',
        kesinlestirmeGecikme: row[nIdx] ? String(row[nIdx]).trim() : '',
        infazTarihi: row[oIdx] ? String(row[oIdx]).trim() : '',
        infazGecikme: row[qIdx] ? String(row[qIdx]).trim() : '',
        aciklama: row[rIdx] ? String(row[rIdx]).trim() : ''
      });
    }

    return extracted;
  }

  // Extract data from Karar Defteri (Esas No, Karar No, Karar Tarihi)
  // Assuming columns like in karar.php: B=Esas No, C=Karar No, E=Karar Tarihi
  function extractKararData(rows){
    const bIdx = letterToIndex('B'); // Esas No
    const cIdx = letterToIndex('C'); // Karar No
    const eIdx = letterToIndex('E'); // Karar Tarihi

    const extracted = [];

    // Skip header rows (assuming data starts after row with headers)
    // We'll start from row 1 (index 1) and filter non-empty B, C, E
    for (let i = 1; i < rows.length; i++){
      const row = rows[i];
      if (!row) continue;

      const esasNo = row[bIdx];
      const kararNo = row[cIdx];
      const kararTarihi = row[eIdx];

      // Only include rows where B, C, E are all non-empty
      if (esasNo && String(esasNo).trim() !== '' &&
         kararNo && String(kararNo).trim() !== '' &&
         kararTarihi && String(kararTarihi).trim() !== ''){
        extracted.push({
          esasNo: String(esasNo).trim(),
          kararNo: String(kararNo).trim(),
          kararTarihi: String(kararTarihi).trim()
        });
      }
    }

    return extracted;
  }

  // Extract data from İnfaza Geç Verilenler file
  // Columns: C=Hâkim, F=Esas No, H=İnfaz No, K=Ceza, L=Kesinleştirme İşlemi,
  //          M=Kesinleşme Tarihi, O=İnfaza Verildiği Tarih, P=Gecikme
  // Also extracts metadata: G5=Birim Adı, G6=Denetim Aralığı
  function extractInfazGecData(rows){
    const cIdx = letterToIndex('C'); // Hâkim
    const fIdx = letterToIndex('F'); // Esas No
    const gIdx = letterToIndex('G'); // For metadata
    const hIdx = letterToIndex('H'); // İnfaz No
    const kIdx = letterToIndex('K'); // Ceza
    const lIdx = letterToIndex('L'); // Kesinleştirme İşlemi
    const mIdx = letterToIndex('M'); // Kesinleşme Tarihi
    const oIdx = letterToIndex('O'); // İnfaza Verildiği Tarih
    const pIdx = letterToIndex('P'); // Gecikme

    // Extract metadata from G5 and G6
    let birimAdi = '';
    let denetimAraligi = '';
    if (rows.length > 4 && rows[4] && rows[4][gIdx]){ // Row 5 (index 4)
      birimAdi = String(rows[4][gIdx]).trim();
    }
    if (rows.length > 5 && rows[5] && rows[5][gIdx]){ // Row 6 (index 5)
      denetimAraligi = String(rows[5][gIdx]).trim();
    }

    const extracted = [];

    // Data starts from row 12 (index 11)
    for (let i = 11; i < rows.length; i++){
      const row = rows[i];
      if (!row) continue;

      const esasNo = row[fIdx];

      // Skip if Esas No is empty
      if (!esasNo || String(esasNo).trim() === '') continue;

      // Skip if this looks like a header row
      const esasNoStr = String(esasNo).trim().toUpperCase();
      if (esasNoStr.indexOf('ESAS') !== -1 || esasNoStr.indexOf('NO') !== -1) continue;

      extracted.push({
        hakim: row[cIdx] ? String(row[cIdx]).trim() : '',
        esasNo: String(esasNo).trim(),
        infazNo: row[hIdx] ? String(row[hIdx]).trim() : '',
        ceza: row[kIdx] ? String(row[kIdx]).trim() : '',
        kesinlestirmeIslemi: row[lIdx] ? String(row[lIdx]).trim() : '',
        kesinlesmeTarihi: row[mIdx] ? String(row[mIdx]).trim() : '',
        infazVerilisTarihi: row[oIdx] ? String(row[oIdx]).trim() : '',
        gecikme: row[pIdx] ? String(row[pIdx]).trim() : ''
      });
    }

    return {
      data: extracted,
      metadata: {
        birimAdi: birimAdi,
        denetimAraligi: denetimAraligi
      }
    };
  }

  // Handle Karar Defteri files (Step 1) or Kesinleştirme Kontrolü files (Step 2)
  function handleKararFiles(files){
    if (!files || files.length === 0) return;

    const statusDiv = $('#kararStatus');
    if (statusDiv){
      statusDiv.innerHTML = '<div class="muted">Dosyalar işleniyor...</div>';
    }

    try { window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerKesin', true); } catch(e) { try { window.XlsSpinner && window.XlsSpinner.show(); } catch(e){} }
    let allData = [];
    const filePromises = [];

    for (let i = 0; i < files.length; i++){
      filePromises.push(readWorkbook(files[i]));
    }

    // Check which step we're on
    const isStep1 = !window.__kesinlestirmeData.step1Complete;
    const isStep2 = window.__kesinlestirmeData.step1Complete && !window.__kesinlestirmeData.step2Complete;
    const isStep3 = window.__kesinlestirmeData.step1Complete && window.__kesinlestirmeData.step2Complete && !window.__kesinlestirmeData.step3Complete;

    Promise.all(filePromises).then(function(allRows){
      if (isStep1){
        // Step 1: Process Karar Defteri
        for (var f = 0; f < allRows.length; f++){
          var rows = allRows[f];
          var validation = validateKararDefteri(rows);

          if (!validation.valid){
            throw new Error(files[f].name + ': ' + validation.message);
          }

          var data = extractKararData(rows);
          allData = allData.concat(data);
        }

        window.__kesinlestirmeData.kararDefteri = allData;
        window.__kesinlestirmeData.step1Complete = true;

        processStep1Success(allData, statusDiv);

      } else if (isStep2) {
        // Step 2: Process Kesinleştirme Kontrolü
        for (var f = 0; f < allRows.length; f++){
          var rows = allRows[f];
          var validation = validateKesinlestirmeKontrol(rows);

          if (!validation.valid){
            throw new Error(files[f].name + ': ' + validation.message);
          }

          var data = extractKesinlestirmeData(rows);
          allData = allData.concat(data);
        }

        window.__kesinlestirmeData.kesinlestirmeKontrol = allData;
        window.__kesinlestirmeData.step2Complete = true;

        processStep2Success(allData, statusDiv);

      } else if (isStep3) {
        // Step 3: Process İnfaza Geç Verilenler
        for (var f = 0; f < allRows.length; f++){
          var rows = allRows[f];
          var validation = validateInfazGecVerilenler(rows);

          if (!validation.valid){
            throw new Error(files[f].name + ': ' + validation.message);
          }

          const result = extractInfazGecData(rows);
          allData = allData.concat(result.data);

          // Store metadata from first file
          if (f === 0 && result.metadata){
            window.__kesinlestirmeData.metadata = result.metadata;
          }
        }

        window.__kesinlestirmeData.infazGecVerilenler = allData;
        window.__kesinlestirmeData.step3Complete = true;

        processStep3Success(allData, statusDiv);window.teftisKullanildi?.();
      }

    }).catch(function(err){
      if (statusDiv){
        statusDiv.innerHTML = '<div class="alert alert-danger m-0 p-2">' +
          '<span class="material-symbols-rounded alert-icon">error</span>' +
          '<div class="alert-body" style="padding:0;">' +
          '<strong>Hata!</strong> ' + err.message +
          '</div></div>';
      }

      if (window.toast){
        window.toast({
          type: 'error',
          title: 'Yükleme Hatası',
          body: err.message,
          delay: 5000
        });
      }
    }).finally(function(){
      try { window.setInlineXlsLoading && window.setInlineXlsLoading('#xlsInlineSpinnerKesin', false); } catch(e) { try { window.XlsSpinner && window.XlsSpinner.hide(); } catch(e){} }
    });
  }

  // Process Step 1 success
  function processStep1Success(allData, statusDiv){
    if (statusDiv){
      statusDiv.innerHTML = '<div class="alert alert-success m-0 p-2">' +
        '<span class="material-symbols-rounded alert-icon">check_circle</span>' +
        '<div class="alert-body" style="padding:0;">' +
        '<b>1. Adım Başarılı!</b> ' + allData.length + ' kayıt yüklendi.' +
        '</div></div>';
    }

    // Update TODO list
    updateTodoList();

    // Update panel content dynamically
    updateKararDefteriPanel();

    // Close reminder alert
    const reminderHost = $('#kesinlestirmeReminderHost');
    if (reminderHost){
      reminderHost.innerHTML = '';
    }

    // Show step 2 alert after TODO list
    const todoContainer = $('#todoListContainer');
    if (todoContainer && window.showAlert){
      const step2AlertHost = document.createElement('div');
      step2AlertHost.id = 'step2AlertHost';
      todoContainer.insertAdjacentElement('afterend', step2AlertHost);

      window.showAlert(step2AlertHost, {
        type: 'warning',
        title: '2. Adım: Kesinleşme ve İnfaza Verme Kontrolü Dosyası',
        message: 'Kesinleştirme ve İnfaza Verme Kontrolü dosyasını şimdi yükleyebilirsiniz.',
        dismissible: true
      });
    }

    // Show next steps
    const additionalSteps = $('#additionalSteps');
    if (additionalSteps){
      additionalSteps.style.display = 'block';
    }

    // Toast notification
    if (window.toast){
      window.toast({
        type: 'success',
        title: 'Karar Defteri Yüklendi',
        body: allData.length + ' kayıt başarıyla işlendi.',
        delay: 3000
      });
    }
  }

  // Increment JQ counter
  function incrementJQCounter(){
    // jQuery ile sayacı arttır
    if (window.jQuery && typeof window.jQuery.getJSON === 'function'){
      window.jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response){
        try {
          const adetRaw = (response && typeof response.adet !== 'undefined') ? (response.adet * 1) : 0;
          if (window.toast){
            window.toast({
              type: 'success',
              title: 'Sayaç Güncellendi',
              body: 'İşlem sayacı başarıyla güncellendi: ' + adetRaw.toLocaleString('tr-TR'),
              delay: 3000
            });
          }
        } catch (e) {
          // Hata varsa görmezden gel
        }
      }).fail(function(){
        // Hata varsa görmezden gel
      });
    }
  }

  // Process Step 2 success
  function processStep2Success(allData, statusDiv){
    // Update TODO list
    updateTodoList();

    // Increment JQ counter
    incrementJQCounter();

    // Close step2AlertHost if exists
    const step2AlertHost = document.getElementById('step2AlertHost');
    if (step2AlertHost){
      step2AlertHost.remove();
    }

    // Create step 2 success alert below kararStatus
    const kararStatus = $('#kararStatus');
    if (kararStatus && window.showAlert){
      const step2SuccessHost = document.createElement('div');
      step2SuccessHost.id = 'step2SuccessHost';
      step2SuccessHost.style.marginTop = '12px';
      kararStatus.insertAdjacentElement('afterend', step2SuccessHost);

      window.showAlert(step2SuccessHost, {
        type: 'success',
        title: '2. Adım Başarılı!',
        message: allData.length + ' kayıt yüklendi.',
        dismissible: true
      });
    }

    // Update panel content dynamically
    updateKararDefteriPanel();

    // Create step 3 instruction alert in step2AlertHost position
    const step3InstructionHost = document.createElement('div');
    step3InstructionHost.id = 'step3InstructionHost';
    step3InstructionHost.className = 'mb-3';

    // Insert after step2SuccessHost
    const step2Host = document.getElementById('step2SuccessHost');
    if (step2Host){
      step2Host.insertAdjacentElement('afterend', step3InstructionHost);
    }

    if (window.showAlert){
      window.showAlert(step3InstructionHost, {
        type: 'success',
        title: '3. Adıma Geçebilirsiniz',
        message: 'Artık İnfaza Geç Verilenler dosyasını yükleyebilirsiniz.',
        dismissible: true
      });
    }

    // Generate merged table with only step 2 data (step 1 kept in memory, not merged yet)
    generateMergedTableFromStep2Only();

    // Toast notification
    if (window.toast){
      window.toast({
        type: 'success',
        title: 'Kesinleştirme Kontrolü Yüklendi',
        body: allData.length + ' kayıt hafızaya alındı.',
        delay: 3000
      });
    }
  }

  // Process Step 3 success
  function processStep3Success(allData, statusDiv){
    // Update TODO list
    updateTodoList();

    // Close step3InstructionHost if exists
    const step3InstructionHost = document.getElementById('step3InstructionHost');
    if (step3InstructionHost){
      step3InstructionHost.remove();
    }

    // Create step 3 success alert below step2SuccessHost
    const step2Host = document.getElementById('step2SuccessHost');
    if (step2Host && window.showAlert){
      const step3SuccessHost = document.createElement('div');
      step3SuccessHost.id = 'step3SuccessHost';
      step3SuccessHost.style.marginTop = '12px';
      step2Host.insertAdjacentElement('afterend', step3SuccessHost);

      window.showAlert(step3SuccessHost, {
        type: 'success',
        title: '3. Adım Başarılı!',
        message: 'Tüm adımlar tamamlandı! Birleştirilmiş özet oluşturuluyor...',
        dismissible: true
      });
    }

    // Create "Kayıtları Ayıkla ve İndir" button
    const step3Host = document.getElementById('step3SuccessHost');
    if (step3Host){
      const filterButtonContainer = document.createElement('div');
      filterButtonContainer.id = 'filterButtonContainer';
      filterButtonContainer.style.marginTop = '12px';
      filterButtonContainer.style.textAlign = 'center';

      filterButtonContainer.innerHTML = '<button class="btn btn-primary w-100" id="ayiklaIndirBtn">' +
        '<span class="material-symbols-rounded" style="vertical-align:middle;">filter_alt</span> ' +
        'Kayıtları Ayıkla ve İndir</button>';

      step3Host.insertAdjacentElement('afterend', filterButtonContainer);

      // Wire button event
      const ayiklaBtn = document.getElementById('ayiklaIndirBtn');
      if (ayiklaBtn){
        ayiklaBtn.addEventListener('click', function(){
          handleAyiklaIndir();
        });
      }
    }

    // Generate final merged table from all 3 steps
    generateFinalMergedTable();

    // Toast notification
    if (window.toast){
      window.toast({
        type: 'success',
        title: 'Tüm Veriler Yüklendi',
        body: 'Birleştirilmiş özet başarıyla oluşturuldu.',
        delay: 3000
      });
    }
  }

  // Calculate date difference in days
  function dateDiffInDays(date1Str, date2Str){
    if (!date1Str || !date2Str) return null;

    // Try to parse dates - handle common Turkish date formats
    const d1 = parseDate(date1Str);
    const d2 = parseDate(date2Str);

    if (!d1 || !d2) return null;

    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // Parse date from string (handles DD.MM.YYYY, DD/MM/YYYY, etc.)
  function parseDate(dateStr){
    if (!dateStr) return null;

    const str = String(dateStr).trim();

    // Try DD.MM.YYYY or DD/MM/YYYY
    const parts = str.split(/[./\-]/);
    if (parts.length === 3){
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)){
        return new Date(year, month, day);
      }
    }

    return null;
  }

  // Generate final merged table from all 3 steps
  function generateFinalMergedTable(){
    const step1Data = window.__kesinlestirmeData.kararDefteri; // {esasNo, kararNo, kararTarihi}
    const step2Data = window.__kesinlestirmeData.kesinlestirmeKontrol; // {esasNo, ...}
    const step3Data = window.__kesinlestirmeData.infazGecVerilenler; // {esasNo, ceza, kesinlesmeTarihi, infazVerilisTarihi, ...}

    const container = $('#resultsContainer');
    if (!container) return;

    // Create lookup maps for step1 data
    const step1Map = {};
    if (step1Data){
      for (var i = 0; i < step1Data.length; i++){
        var item = step1Data[i];
        step1Map[item.esasNo] = item;
      }
    }

    // Create lookup map for step3 data (to check if esasNo exists in step3)
    const step3Map = {};
    if (step3Data){
      for (var i = 0; i < step3Data.length; i++){
        var item = step3Data[i];
        step3Map[item.esasNo] = item;
      }
    }

    const mergedData = [];

    // First, add all data from Step 2
    if (step2Data && step2Data.length > 0){
      for (var i = 0; i < step2Data.length; i++){
        const s2 = step2Data[i]; // Kesinleştirme Kontrolü
        var s1 = step1Map[s2.esasNo]; // Karar Defteri

        // Karar No ve Karar Tarihi: Step1'den al, yoksa Step2'den
        var kararNo = s1 ? s1.kararNo : (s2.kararNo || '');
        var kararTarihi = s1 ? s1.kararTarihi : (s2.kararTarihi || '');

        // Karar Türü: Step2'den
        var kararTuru = s2.kararTuruMahiyet || '';

        // Kesinleşme Tarihi: Step2'den
        var kesinlesmeTarihi = s2.kesinlesmeTarihi || '';

        // Kesinleştirme İşlem Tarihi: Step2'den
        var kesinlestirmeIslemTarihi = s2.kesinlestirmeIslemTarihi || '';

        // Kesinleştirme Gecikme: Step2'den
        var kesinlestirmeGecikme = s2.kesinlestirmeGecikme || '';

        // İnfaza Veriliş Tarihi: Step2'den
        var infazTarihi = s2.infazTarihi || '';

        // İnfaza Gecikme: Step2'den
        var infazGecikme = s2.infazGecikme || '';

        mergedData.push({
          sira: i + 1,
          esasNo: s2.esasNo,
          kararNo: kararNo,
          kararTarihi: kararTarihi,
          kararTuru: kararTuru,
          kesinlesmeTarihi: kesinlesmeTarihi,
          kesinlestirmeIslemTarihi: kesinlestirmeIslemTarihi,
          kesinlestirmeGecikme: kesinlestirmeGecikme,
          infazTarihi: infazTarihi,
          infazGecikme: infazGecikme
        });
      }
    }

    // Then, add all data from Step 3
    if (step3Data && step3Data.length > 0){
      for (var i = 0; i < step3Data.length; i++){
        const s3 = step3Data[i]; // İnfaza Geç Verilenler
        var s1 = step1Map[s3.esasNo]; // Karar Defteri

        // Karar No ve Karar Tarihi: Step1'den al
        var kararNo = s1 ? s1.kararNo : '';
        var kararTarihi = s1 ? s1.kararTarihi : '';

        // Karar Türü: Step3'ten (Ceza)
        var kararTuru = s3.ceza || '';

        // Kesinleşme Tarihi: Step3'ten
        var kesinlesmeTarihi = s3.kesinlesmeTarihi || '';

        // Kesinleştirme İşlem Tarihi: Step3'ten (infazVerilisTarihi)
        var kesinlestirmeIslemTarihi = s3.infazVerilisTarihi || '';

        // Kesinleştirme İşleminde Gecikme Süresi: kesinlestirmeIslemTarihi - kesinlesmeTarihi - 60
        var kesinlestirmeGecikme = '';
        if (kesinlestirmeIslemTarihi && kesinlesmeTarihi){
          var diff = dateDiffInDays(kesinlestirmeIslemTarihi, kesinlesmeTarihi);
          if (diff !== null){
            var gecikme = diff - 60;
            kesinlestirmeGecikme = gecikme > 0 ? String(gecikme) : '0';
          }
        }

        // İnfaza Veriliş Tarihi: Step3'ten
        var infazTarihi = s3.infazVerilisTarihi || '';

        // İnfaza Vermede Gecikme Süresi: infazTarihi - kesinlesmeTarihi - 60
        var infazGecikme = '';
        if (infazTarihi && kesinlesmeTarihi){
          var diff = dateDiffInDays(infazTarihi, kesinlesmeTarihi);
          if (diff !== null){
            var gecikme = diff - 60;
            infazGecikme = gecikme > 0 ? String(gecikme) : '0';
          }
        }

        mergedData.push({
          sira: mergedData.length + 1,
          esasNo: s3.esasNo,
          kararNo: kararNo,
          kararTarihi: kararTarihi,
          kararTuru: kararTuru,
          kesinlesmeTarihi: kesinlesmeTarihi,
          kesinlestirmeIslemTarihi: kesinlestirmeIslemTarihi,
          kesinlestirmeGecikme: kesinlestirmeGecikme,
          infazTarihi: infazTarihi,
          infazGecikme: infazGecikme
        });
      }
    }

    // Sort by kesinlestirmeGecikme descending (büyükten küçüğe)
    mergedData.sort(function(a, b){
      const aVal = parseInt(a.kesinlestirmeGecikme) || 0;
      const bVal = parseInt(b.kesinlestirmeGecikme) || 0;
      return bVal - aVal; // Descending
    });

    // Re-number SIRA after sorting
    for (var i = 0; i < mergedData.length; i++){
      mergedData[i].sira = i + 1;
    }

    // Store in global data
    window.__kesinlestirmeData.mergedData = mergedData;

    // Render paginated table
    renderFinalMergedTable(mergedData);
  }

  // Render final merged table with pagination
  function renderFinalMergedTable(mergedData){
    const container = $('#resultsContainer');
    if (!container) return;

    // Pagination settings
    const itemsPerPage = 20;
    let currentPage = 1;
    const totalPages = Math.ceil(mergedData.length / itemsPerPage);

    function renderTable(page){
      let html = '<div class="card mb-3" id="mergedResultPanel">';
      html += '<div class="card-header d-flex align-items-center justify-content-between">';
      html += '<div class="d-flex align-items-center gap-2">';
      html += '<h3 class="mb-0 flex-grow-1">Birleştirilmiş Özet</h3>';
      html += '<button class="btn btn-sm btn-success" onclick="window.kesinlestirmeExportToExcel()" title="Excel\'e Aktar">';
      html += '<i class="fa fa-file-excel-o"></i> Excel İndir</button>';
      html += '</div>';
      html += '</div>'; // .panel-head

      // Top pagination controls
      html += '<div class="p-3 bg-body-secondary border-bottom">';
      html += '<div class="d-flex justify-content-between align-items-center">';
      html += '<div><strong>Sayfa ' + page + ' / ' + totalPages + '</strong> &nbsp; ';
      html += 'Gösterilen: ' + ((page - 1) * itemsPerPage + 1) + ' - ' + Math.min(page * itemsPerPage, mergedData.length) + ' / ' + mergedData.length + '</div>';
      html += '<div>';
      html += '<button class="btn btn-sm btn-outline-secondary" id="prevPageTop" ' + (page === 1 ? 'disabled' : '') + '>Önceki</button> ';
      html += '<button class="btn btn-sm btn-outline-secondary" id="nextPageTop" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

      html += '<div class="table-responsive">';
      html += '<table class="table table-striped table-hover mb-0">';
      html += '<thead>';
      html += '<tr>';
      html += '<th>SIRA</th>';
      html += '<th>Esas No</th>';
      html += '<th>Karar No</th>';
      html += '<th>Karar Tarihi</th>';
      html += '<th>Karar Türü</th>';
      html += '<th>Kesinleşme Tarihi</th>';
      html += '<th>Kesinleştirme İşlem Tarihi</th>';
      html += '<th>Kesinleştirme İşleminde Gecikme Süresi</th>';
      html += '<th>İnfaza Veriliş Tarihi</th>';
      html += '<th>İnfaza Vermede Gecikme Süresi</th>';
      html += '</tr>';
      html += '</thead>';
      html += '<tbody>';

      const startIdx = (page - 1) * itemsPerPage;
      const endIdx = Math.min(startIdx + itemsPerPage, mergedData.length);

      // Render rows for current page
      for (let i = startIdx; i < endIdx; i++){
        const row = mergedData[i];

        html += '<tr>';
        html += '<td>' + row.sira + '</td>';
        html += '<td>' + (row.esasNo || '') + '</td>';
        html += '<td>' + (row.kararNo || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kararTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kararTuru || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlesmeTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlestirmeIslemTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlestirmeGecikme || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.infazTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.infazGecikme || '<span class="muted">-</span>') + '</td>';
        html += '</tr>';
      }

      html += '</tbody>';
      html += '</table>';
      html += '</div>'; // .table-responsive

      // Bottom pagination controls
      html += '<div class="p-3 bg-body-secondary border-top">';
      html += '<div class="d-flex justify-content-between align-items-center">';
      html += '<div><strong>Sayfa ' + page + ' / ' + totalPages + '</strong></div>';
      html += '<div>';
      html += '<button class="btn btn-sm btn-outline-secondary" id="prevPageBottom" ' + (page === 1 ? 'disabled' : '') + '>Önceki</button> ';
      html += '<button class="btn btn-sm btn-outline-secondary" id="nextPageBottom" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

      html += '</div>';

      container.innerHTML = html;

      // Wire up pagination buttons
      const prevTop = document.getElementById('prevPageTop');
      const nextTop = document.getElementById('nextPageTop');
      const prevBottom = document.getElementById('prevPageBottom');
      const nextBottom = document.getElementById('nextPageBottom');

      if (prevTop){
        prevTop.onclick = function(){ if (currentPage > 1){ currentPage--; renderTable(currentPage); } };
      }
      if (nextTop){
        nextTop.onclick = function(){ if (currentPage < totalPages){ currentPage++; renderTable(currentPage); } };
      }
      if (prevBottom){
        prevBottom.onclick = function(){ if (currentPage > 1){ currentPage--; renderTable(currentPage); } };
      }
      if (nextBottom){
        nextBottom.onclick = function(){ if (currentPage < totalPages){ currentPage++; renderTable(currentPage); } };
      }
    }

    renderTable(currentPage);
  }

  // Generate merged table from Step 2 data only
  function generateMergedTableFromStep2Only(){
    const kesinlestirmeData = window.__kesinlestirmeData.kesinlestirmeKontrol;

    if (!kesinlestirmeData || kesinlestirmeData.length === 0) return;

    const container = $('#resultsContainer');
    if (!container) return;

    // Pagination settings
    const itemsPerPage = 20;
    let currentPage = 1;
    const totalPages = Math.ceil(kesinlestirmeData.length / itemsPerPage);

    function renderTable(page){
      let html = '<div class="card mb-3" id="mergedResultPanel">';
      html += '<div class="card-header d-flex align-items-center justify-content-between">';
      html += '<div class="d-flex align-items-center gap-2">';
      html += '<span class="material-symbols-rounded">table_chart</span>';
      html += '<strong>Birleştirilmiş Özet</strong>';
      html += '<span class="muted ms-2">(' + kesinlestirmeData.length + ' kayıt)</span>';
      html += '</div>';
      html += '<div class="title-actions">';
      html += '<button class="btn ghost" id="exportMergedExcel">';
      html += '<span class="material-symbols-rounded">download</span> Excel İndir';
      html += '</button>';
      html += '</div>';
      html += '</div>';
      html += '<div class="card-body">';

      // Pagination controls - top
      html += '<div class="d-flex justify-content-between align-items-center mb-3 p-3 bg-body-secondary rounded">';
      html += '<div class="muted">Sayfa ' + page + ' / ' + totalPages + '</div>';
      html += '<div class="d-flex gap-2">';
      html += '<button class="btn ghost" id="prevPage" ' + (page === 1 ? 'disabled' : '') + '>◀ Önceki</button>';
      html += '<button class="btn ghost" id="nextPage" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki ▶</button>';
      html += '</div>';
      html += '</div>';

      html += '<div class="table-wrap">';
      html += '<table class="table w-100">';
      html += '<thead><tr>';
      html += '<th>SIRA</th>';
      html += '<th>ESAS NO</th>';
      html += '<th>KARAR NO</th>';
      html += '<th>KARAR TARİHİ</th>';
      html += '<th>KARAR TÜRÜ VE MAHİYETİ<br><small>(Mahkûmiyet-HAGB/Erteleme) (Para/Hapis Cezası)</small></th>';
      html += '<th>KESİNLEŞME TARİHİ</th>';
      html += '<th>KESİNLEŞTİRME İŞLEM TARİHİ</th>';
      html += '<th>KESİNLEŞTİRME İŞLEMİNDE GECİKME SÜRESİ<br><small>(Gün) ve AÇIKLAMA</small></th>';
      html += '<th>İNFAZA VERİLİŞ TARİHİ</th>';
      html += '<th>İNFAZA VERMEDE GECİKME SÜRESİ<br><small>(Gün)</small></th>';
      html += '</tr></thead>';
      html += '<tbody>';

      // Calculate range for current page
      const startIdx = (page - 1) * itemsPerPage;
      const endIdx = Math.min(startIdx + itemsPerPage, kesinlestirmeData.length);

      // Render rows for current page
      for (let i = startIdx; i < endIdx; i++){
        const row = kesinlestirmeData[i];

        // Combine gecikme süre and açıklama
        let gecikmeText = row.kesinlestirmeGecikme || '-';
        if (row.aciklama){
          gecikmeText += (gecikmeText !== '-' ? ' - ' : '') + row.aciklama;
        }

        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>'; // Display row number starting from 1
        html += '<td>' + (row.esasNo || '') + '</td>';
        html += '<td>' + (row.kararNo || '') + '</td>';
        html += '<td>' + (row.kararTarihi || '') + '</td>';
        html += '<td>' + (row.kararTuruMahiyet || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlesmeTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlestirmeIslemTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + gecikmeText + '</td>';
        html += '<td>' + (row.infazTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.infazGecikme || '<span class="muted">-</span>') + '</td>';
        html += '</tr>';
      }

      html += '</tbody></table>';
      html += '</div>';

      // Pagination controls - bottom
      html += '<div class="d-flex justify-content-between align-items-center mt-3 p-3 bg-body-secondary rounded">';
      html += '<div class="muted">Gösterilen: ' + (startIdx + 1) + ' - ' + endIdx + ' / ' + kesinlestirmeData.length + '</div>';
      html += '<div class="d-flex gap-2">';
      html += '<button class="btn ghost" id="prevPageBottom" ' + (page === 1 ? 'disabled' : '') + '>◀ Önceki</button>';
      html += '<button class="btn ghost" id="nextPageBottom" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki ▶</button>';
      html += '</div>';
      html += '</div>';

      html += '</div>';
      html += '</div>';

      container.innerHTML = html;

      // Wire pagination buttons
      const prevBtn = $('#prevPage');
      const nextBtn = $('#nextPage');
      const prevBtnBottom = $('#prevPageBottom');
      const nextBtnBottom = $('#nextPageBottom');

      if (prevBtn){
        prevBtn.addEventListener('click', function(){
          if (currentPage > 1){
            currentPage--;
            renderTable(currentPage);
          }
        });
      }

      if (nextBtn){
        nextBtn.addEventListener('click', function(){
          if (currentPage < totalPages){
            currentPage++;
            renderTable(currentPage);
          }
        });
      }

      if (prevBtnBottom){
        prevBtnBottom.addEventListener('click', function(){
          if (currentPage > 1){
            currentPage--;
            renderTable(currentPage);
          }
        });
      }

      if (nextBtnBottom){
        nextBtnBottom.addEventListener('click', function(){
          if (currentPage < totalPages){
            currentPage++;
            renderTable(currentPage);
          }
        });
      }

      // Wire export button
      const exportBtn = $('#exportMergedExcel');
      if (exportBtn){
        exportBtn.addEventListener('click', function(){
          exportMergedToExcel();
        });
      }

      // Enable drag scroll if available
      if (window.enableTableWrapDrag){
        window.enableTableWrapDrag();
      }
    }

    // Store merged data (all records)
    const mergedData = [];
    for (let i = 0; i < kesinlestirmeData.length; i++){
      const row = kesinlestirmeData[i];
      mergedData.push({
        sira: i + 12, // Row number starts from 12
        esasNo: row.esasNo,
        kararNo: row.kararNo,
        kararTarihi: row.kararTarihi,
        kararTuruMahiyet: row.kararTuruMahiyet || '',
        kesinlesmeTarihi: row.kesinlesmeTarihi || '',
        kesinlestirmeIslemTarihi: row.kesinlestirmeIslemTarihi || '',
        kesinlestirmeGecikme: row.kesinlestirmeGecikme || '',
        infazTarihi: row.infazTarihi || '',
        infazGecikme: row.infazGecikme || '',
        aciklama: row.aciklama || ''
      });
    }
    window.__kesinlestirmeData.mergedData = mergedData;

    // Render first page
    renderTable(currentPage);
  }

  // Merge Karar Defteri with Kesinleştirme Kontrolü and generate table
  function mergeAndGenerateTable(){
    const kararData = window.__kesinlestirmeData.kararDefteri;
    const kesinlestirmeData = window.__kesinlestirmeData.kesinlestirmeKontrol;

    if (!kararData || !kesinlestirmeData) return;

    // Create lookup map from kesinlestirme data (by Esas No)
    const kesinlestirmeMap = {};
    for (let i = 0; i < kesinlestirmeData.length; i++){
      const item = kesinlestirmeData[i];
      kesinlestirmeMap[item.esasNo] = item;
    }

    // Generate merged table
    generateMergedTable();
  }

  // Wire up Karar Defteri upload
  function wireKararUpload(){
    const input = $('#kararInput');
    const dropZone = $('#dropZoneKarar');

    if (input){
      input.addEventListener('change', function(e){
        handleKararFiles(e.target.files);
      });
    }

    if (dropZone){
      // Prevent browser default behavior
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName){
        dropZone.addEventListener(eventName, function(e){
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });

      // Visual feedback
      ['dragenter', 'dragover'].forEach(function(eventName){
        dropZone.addEventListener(eventName, function(){
          dropZone.classList.add('drag-over');
        }, false);
      });

      ['dragleave', 'drop'].forEach(function(eventName){
        dropZone.addEventListener(eventName, function(){
          dropZone.classList.remove('drag-over');
        }, false);
      });

      // Handle drop
      dropZone.addEventListener('drop', function(e){
        const files = e.dataTransfer.files;
        if (files && files.length > 0){
          handleKararFiles(files);
        }
      }, false);

      // Click to open file selector
      dropZone.addEventListener('click', function(){
        if (input) input.click();
      });
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    // Show reminder alert
    const reminderHost = $('#kesinlestirmeReminderHost');
    if (reminderHost && window.showAlert){
      window.showAlert(reminderHost, {
        type: 'info',
        title: 'Dikkat',
        message: 'Bu sayfa ile kesinleşme ve infaz sürelerini kontrol edebilirsiniz. İlk olarak UYAP > Raporlar > Defterler > Karar Defteri dosyasını yükleyin.',
        dismissible: true
      });
    }

    // Initialize TODO list
    updateTodoList();

    // Initialize panel content
    updateKararDefteriPanel();

    // Wire upload handlers
    wireKararUpload();
  });

  // Expose export function globally
  window.kesinlestirmeExportToExcel = exportMergedToExcel;

})();

