(() => {
  'use strict';
  if (window.__kalemDenetimiBooted) return; window.__kalemDenetimiBooted = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const state = { years: [], rows: [], allNotDone: false, birimAdi: '' };
  const STEP_NAMES = ['Birim Adı', 'Denetim Aralığı', 'Yıllara Göre Denetim'];

  function toast(type, title, body){
    if (typeof window.toast === 'function') { window.toast({type, title, body}); return; }
    if (type === 'danger') { try { alert(body); } catch (e) {} }
  }

  function parseDateStr(s){
    const m = String(s || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = parseInt(m[1],10), mo = parseInt(m[2],10), y = parseInt(m[3],10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== (mo - 1) || dt.getDate() !== d) return null;
    return dt;
  }
  function fmtDate(d){
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  function getYearsBetween(start, end){
    const ys = [];
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++){
      ys.push(y);
    }
    return ys;
  }

  function setStep(step){
    const steps = $$('.yim-step');
    const prevBtn = $('#yimPrevBtn');
    const nextBtn = $('#yimNextBtn');
    const finishBtn = $('#yimFinishBtn');
    const badge = $('#yimStepBadge');
    const label = $('#yimStepLabel');
    const progress = $('#yimProgress');
    const total = STEP_NAMES.length;
    steps.forEach(s => {
      const sStep = parseInt(s.dataset.step || '0', 10);
      s.classList.toggle('d-none', sStep !== step);
    });
    if (badge) badge.textContent = `Adım ${step} / ${total}`;
    if (label) label.textContent = STEP_NAMES[step - 1] || '';
    if (progress) progress.style.width = `${Math.round((step / total) * 100)}%`;
    if (prevBtn) prevBtn.disabled = step === 1;
    if (nextBtn) nextBtn.style.display = step < total ? 'inline-flex' : 'none';
    if (finishBtn) finishBtn.style.display = step === total ? 'inline-flex' : 'none';
  }

  function yearCardHtml(y){
    return `
      <div class="yim-card" data-year="${y}">
        <div class="fw-semibold mb-2">${y} yılında kalem denetim tutanağı düzenlendi mi?</div>
        <div class="d-flex flex-wrap gap-3 mb-2">
          <div class="form-check">
            <input class="form-check-input" type="radio" name="denetim_${y}" id="denetim_${y}_yapildi" value="yapildi">
            <label class="form-check-label" for="denetim_${y}_yapildi">Yapıldı</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="denetim_${y}" id="denetim_${y}_yapilmadi" value="yapilmadi">
            <label class="form-check-label" for="denetim_${y}_yapilmadi">Yapılmadı</label>
          </div>
        </div>
        <div class="yim-report-wrap disabled">
          <hr class="my-2">
          <div class="fw-semibold mb-2">Denetim Yapıldıysa Sonunda Rapor Düzenlendi mi?</div>
          <div class="form-text small text-muted mb-2">(Sadece "Yapıldı" ise seçiniz)</div>
          <div class="d-flex flex-wrap gap-3 mb-2">
            <div class="form-check">
              <input class="form-check-input" disabled type="radio" name="rapor_${y}" id="rapor_${y}_duzenlendi" value="duzenlendi">
              <label class="form-check-label" for="rapor_${y}_duzenlendi">Düzenlendi</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" disabled type="radio" name="rapor_${y}" id="rapor_${y}_duzenlenmedi" value="duzenlenmedi">
              <label class="form-check-label" for="rapor_${y}_duzenlenmedi">Düzenlenmedi</label>
            </div>
          </div>

          <div class="yim-report-details-date" style="display:none;">
            <div class="row g-2">
              <div class="col-12 col-md-4">
                <label class="form-label mb-1">Rapor Düzenlenme Tarihi</label>
                <input disabled type="text" class="form-control" id="rapor_tarih_${y}" placeholder="gg/aa/yyyy">
              </div>
            </div>
          </div>

          <div class="yim-report-details-people" style="display:none;">
            <div class="row g-2">
              <div class="col-12 col-md-6">
                <label class="form-label mb-1">İlgili Hakim / Başkan (Ad Soyad)</label>
                <input disabled type="text" class="form-control" id="hakim_${y}" placeholder="Ad Soyad">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label mb-1">Sicil</label>
                <input disabled type="text" class="form-control" id="sicil_${y}" placeholder="Sicil">
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  function renderYearQuestions(years){
    const host = $('#yimYearQuestions');
    if (!host) return;
    host.innerHTML = years.map(yearCardHtml).join('');
    // Ensure initial state for each year (controls disabled/enabled as needed)
    years.forEach(y => {
      toggleReportWrap(y);
      toggleReportDetails(y);
    });
  }

  function getRadioValue(name){
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  }

  function clearReportFields(year){
    $$(`input[name="rapor_${year}"]`).forEach(r => r.checked = false);
    const tarih = $(`#rapor_tarih_${year}`);
    const hakim = $(`#hakim_${year}`);
    const sicil = $(`#sicil_${year}`);
    if (tarih) tarih.value = '';
    if (hakim) hakim.value = '';
    if (sicil) sicil.value = '';
  }

  function toggleReportWrap(year){
    const wrap = document.querySelector(`.yim-card[data-year="${year}"] .yim-report-wrap`);
    const dateBox = document.querySelector(`.yim-card[data-year="${year}"] .yim-report-details-date`);
    const peopleBox = document.querySelector(`.yim-card[data-year="${year}"] .yim-report-details-people`);
    const denetim = getRadioValue(`denetim_${year}`);
    const raporRadios = Array.from(document.querySelectorAll(`.yim-card[data-year="${year}"] input[name="rapor_${year}"]`));
    const tarihField = document.querySelector(`#rapor_tarih_${year}`);
    const hakimField = document.querySelector(`#hakim_${year}`);
    const sicilField = document.querySelector(`#sicil_${year}`);

    if (denetim === 'yapildi'){
      // Denetim yapıldıysa: rapor sorusunu aktif et, alt bölümleri rapora göre göster
      wrap?.classList.remove('disabled');
      raporRadios.forEach(r => { r.disabled = false; r.onchange = () => toggleReportDetails(year); });
      if (dateBox) dateBox.style.display = 'none';
      if (peopleBox) peopleBox.style.display = 'none';
      if (tarihField) { tarihField.value = ''; tarihField.disabled = true; }
      if (hakimField) { hakimField.value = ''; hakimField.disabled = true; }
      if (sicilField) { sicilField.value = ''; sicilField.disabled = true; }
      toggleReportDetails(year);

    } else if (denetim === 'yapilmadi'){
      // Denetim yapılmadıysa: rapor sorusu pasif, fakat hakim ve sicil zorunlu olsun
      wrap?.classList.remove('disabled');
      raporRadios.forEach(r => { r.disabled = true; r.checked = false; r.onchange = null; });
      if (dateBox) dateBox.style.display = 'none';
      if (peopleBox) peopleBox.style.display = 'block';
      if (tarihField) { tarihField.value = ''; tarihField.disabled = true; }
      if (hakimField) { hakimField.disabled = false; }
      if (sicilField) { sicilField.disabled = false; }

    } else {
      // Henüz seçim yok
      wrap?.classList.add('disabled');
      raporRadios.forEach(r => { r.disabled = true; r.checked = false; r.onchange = null; });
      if (dateBox) dateBox.style.display = 'none';
      if (peopleBox) peopleBox.style.display = 'none';
      if (tarihField) { tarihField.value = ''; tarihField.disabled = true; }
      if (hakimField) { hakimField.value = ''; hakimField.disabled = true; }
      if (sicilField) { sicilField.value = ''; sicilField.disabled = true; }
    }
  }

  function toggleReportDetails(year){
    const dateBox = document.querySelector(`.yim-card[data-year="${year}"] .yim-report-details-date`);
    const peopleBox = document.querySelector(`.yim-card[data-year="${year}"] .yim-report-details-people`);
    const rapor = getRadioValue(`rapor_${year}`);
    const tarih = $(`#rapor_tarih_${year}`);
    const hakim = $(`#hakim_${year}`);
    const sicil = $(`#sicil_${year}`);
    if (!rapor){
      if (dateBox) dateBox.style.display = 'none';
      if (peopleBox) peopleBox.style.display = 'none';
      if (tarih) { tarih.value = ''; tarih.disabled = true; }
      if (hakim) { hakim.value = ''; hakim.disabled = true; }
      if (sicil) { sicil.value = ''; sicil.disabled = true; }
      return;
    }
    // For both duzenlendi and duzenlenmedi, show people inputs
    if (peopleBox) peopleBox.style.display = 'block';
    if (hakim) hakim.disabled = false;
    if (sicil) sicil.disabled = false;
    if (rapor === 'duzenlendi'){
      if (dateBox) dateBox.style.display = 'block';
      if (tarih) tarih.disabled = false;
    } else {
      if (dateBox) dateBox.style.display = 'none';
      if (tarih) { tarih.value = ''; tarih.disabled = true; }
    }
  }

  function renderSummaryTable(rows){
    const host = $('#yimSummaryTable');
    if (!host) return;
    let html = '<table class="table table-bordered yim-table text-center align-middle">';
    html += `<thead><tr>
      <th>SIRA</th>
      <th>YIL</th>
      <th>DENETİM YAPILIP YAPILMADIĞI</th>
      <th>DENETİM YAPILDIYSA SONUNDA RAPOR DÜZENLENİP DÜZENLENMEDİĞİ</th>
      <th>RAPOR DÜZENLENDİYSE TARİHİ</th>
      <th>İLGİLİ HÂKİM (Ad – Soyad – Sicil)</th>
    </tr></thead><tbody>`;
    rows.forEach((r, i) => {
      const hakimStr = (r.hakim && r.sicil) ? `${r.hakim} - ${r.sicil}` : (r.hakim || r.sicil || '-');
      html += `<tr>
        <td>${i + 1}</td>
        <td>${r.yil}</td>
        <td>${r.denetimYapildiMi}</td>
        <td>${r.raporDuzenlendiMi}</td>
        <td>${r.raporTarih}</td>
        <td>${hakimStr}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    host.innerHTML = html;
  }

  function collectRows(){
    const rows = [];
    for (const year of state.years){
      const denetim = getRadioValue(`denetim_${year}`);
      if (!denetim){
        toast('warning', 'Eksik Bilgi', `${year} yılı için denetim durumu seçilmelidir.`);
        return null;
      }
      let rapor = '';
      if (denetim === 'yapildi'){
        rapor = getRadioValue(`rapor_${year}`);
        if (!rapor){
          toast('warning', 'Eksik Bilgi', `${year} yılı için rapor durumu seçilmelidir.`);
          return null;
        }
      }

      let raporTarih = '-';
      let hakim = '-';
      let sicil = '-';
      // Regardless of denetim status, hakim and sicil must be provided
      const hakimVal = ($(`#hakim_${year}`)?.value || '').trim();
      const sicilVal = ($(`#sicil_${year}`)?.value || '').trim();
      if (denetim === 'yapildi'){
        if (!rapor){
          toast('warning', 'Eksik Bilgi', `${year} yılı için rapor durumu seçilmelidir.`);
          return null;
        }
        if (rapor === 'duzenlendi'){
          const tarihVal = $(`#rapor_tarih_${year}`)?.value || '';
          const dt = parseDateStr(tarihVal);
          if (!dt){
            toast('warning', 'Eksik Bilgi', `${year} yılı için rapor tarihi geçerli olmalıdır (gg/aa/yyyy).`);
            return null;
          }
          if (!hakimVal || !sicilVal){
            toast('warning', 'Eksik Bilgi', `${year} yılı için hakim/başkan adı ve sicil girilmelidir.`);
            return null;
          }
          raporTarih = fmtDate(dt);
          hakim = hakimVal;
          sicil = sicilVal;
        } else if (rapor === 'duzenlenmedi'){
          // No date required, but hakim and sicil must be provided
          if (!hakimVal || !sicilVal){
            toast('warning', 'Eksik Bilgi', `${year} yılı için hakim/başkan adı ve sicil girilmelidir.`);
            return null;
          }
          hakim = hakimVal;
          sicil = sicilVal;
        }
      } else {
        // denetim != 'yapildi' (yapilmadi) -> still require hakim and sicil
        if (!hakimVal || !sicilVal){
          toast('warning', 'Eksik Bilgi', `${year} yılı için hakim/başkan adı ve sicil girilmelidir.`);
          return null;
        }
        hakim = hakimVal;
        sicil = sicilVal;
      }

      rows.push({
        yil: String(year),
        denetimYapildiMi: denetim === 'yapildi' ? 'Yapıldı' : 'Yapılmadı',
        raporDuzenlendiMi: denetim !== 'yapildi' ? '-' : (rapor === 'duzenlendi' ? 'Düzenlendi' : 'Düzenlenmedi'),
        raporTarih,
        hakim,
        sicil
      });
    }
    return rows;
  }

  async function downloadDocx(){
    if (!state.rows.length){
      toast('warning','Veri yok','Tabloyu oluşturduktan sonra indiriniz.');
      return;
    }
    const apiUrl = '/api/yimdenetim_writer.php';
    const payload = { rows: state.rows, birimAdi: state.birimAdi || '' };
    const btn = $('#yimDownloadBtn');
    if (btn){ btn.disabled = true; btn.classList.add('busy'); }
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });
      const ct = (res.headers.get('Content-Type') || '').toLowerCase();
      const cd = res.headers.get('Content-Disposition') || '';
      let blob = null;
      if (res.ok && (ct.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || /filename\\s*=\\s*\"?[^\";]*\\.docx\"?/i.test(cd))){
        blob = await res.blob();
      } else if (res.ok){
        const tmp = await res.blob();
        const ab = await tmp.arrayBuffer();
        const u8 = new Uint8Array(ab);
        if (u8.length >= 2 && u8[0] === 0x50 && u8[1] === 0x4B){
          blob = new Blob([ab], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        }
      }
      if (!blob){
        let msg = `(${res.status}) Word dosyası oluşturulamadı.`;
        try { const t = await res.clone().text(); try { const j = JSON.parse(t); if (j && j.reason) msg = j.reason; } catch (e) { if (t) msg = t.slice(0,500); } } catch (e) {}
        toast('danger','Hata', msg);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '10- YAZI İŞLERİ MÜDÜRLÜKLERİNİN DENETİMİ KONTROLÜ.docx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('success','İndiriliyor','Word belgesi indiriliyor.');
    } catch (e){
      toast('danger','Ağ Hatası', String(e));
    } finally {
      if (btn){ btn.disabled = false; btn.classList.remove('busy'); }
    }
  }

  function initWizard(){
    setStep(1);
    const nextBtn = $('#yimNextBtn');
    const prevBtn = $('#yimPrevBtn');
    const finishBtn = $('#yimFinishBtn');

    nextBtn?.addEventListener('click', () => {
      const current = document.querySelector('.yim-step:not(.d-none)');
      const step = current ? parseInt(current.dataset.step || '1', 10) : 1;
      if (step === 1){
        const birim = ($('#yimBirimAdi')?.value || '').trim();
        if (!birim){
          toast('warning','Eksik Bilgi','Birim adı girilmelidir.');
          return;
        }
        state.birimAdi = birim;
        setStep(2);
        return;
      }
      if (step === 2){
        const startStr = ($('#yimStartDate')?.value || '').trim();
        const endStr = ($('#yimEndDate')?.value || '').trim();
        const d1 = parseDateStr(startStr);
        const d2 = parseDateStr(endStr);
        if (!d1 || !d2){
          toast('warning','Tarih Hatası','Başlangıç ve bitiş tarihleri gg/aa/yyyy formatında olmalıdır.');
          return;
        }
        if (d2 < d1){
          toast('warning','Tarih Hatası','Bitiş tarihi başlangıç tarihinden önce olamaz.');
          return;
        }
        state.years = getYearsBetween(d1, d2);
        renderYearQuestions(state.years);
        setStep(3);
      }
    });

    prevBtn?.addEventListener('click', () => {
      const current = document.querySelector('.yim-step:not(.d-none)');
      const step = current ? parseInt(current.dataset.step || '1', 10) : 1;
      if (step <= 1) return;
      setStep(step - 1);
    });

    finishBtn?.addEventListener('click', () => {
      const rows = collectRows();
      if (!rows) return;
      state.rows = rows;
      state.allNotDone = rows.every(r => r.denetimYapildiMi === 'Yapılmadı');
      renderSummaryTable(rows);if(rows.length)window.teftisKullanildi?.();
      const card = $('#yimSummaryCard');
      if (card) card.style.display = 'block';
      const extra = $('#yimExtraLink');
      if (extra){
        extra.innerHTML = state.allNotDone
          ? `<a href="https://657.com.tr/denetimtutanagi.docx" target="_blank" rel="noopener">Örnek denetim tutanağı indirmek için tıklayınız</a>`
          : '';
      }
    });

    $('#yimYearQuestions')?.addEventListener('change', (e) => {
      const t = e.target;
      if (!t || !t.name) return;
      const m1 = t.name.match(/^denetim_(\d{4})$/);
      if (m1){ toggleReportWrap(m1[1]); return; }
      const m2 = t.name.match(/^rapor_(\d{4})$/);
      if (m2){ toggleReportDetails(m2[1]); return; }
    });
  }

  function bindDownload(){
    $('#yimDownloadBtn')?.addEventListener('click', downloadDocx);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initWizard();
    bindDownload();
  });
})();
