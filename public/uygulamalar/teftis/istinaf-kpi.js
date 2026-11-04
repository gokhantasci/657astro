/**
 * İstinaf Defteri - KPI Kartları
 * Karar sayfasına benzer KPI kartları render eder
 */

(function() {
  'use strict';

  // KPI kartlarını render et
  function renderKPICards(stats) {
    const container = document.getElementById('kpiCards');
    if (!container) return;

    const kpis = [
      {
        id: 'istinafEdilen',
        title: 'İstinaf Edilen',
        icon: 'gavel',
        value: stats.total || 0
      },
      {
        id: 'vazgecilen',
        title: 'Vazgeçilen',
        icon: 'cancel',
        value: stats.withdrawn || 0
      },
      {
        id: 'henuzGonderilmemis',
        title: 'Henüz Gönderilmemiş',
        icon: 'schedule_send',
        value: stats.not_sent || 0
      },
      {
        id: 'istinafIncelemesinde',
        title: 'İstinaf İncelemesinde',
        icon: 'pending_actions',
        value: stats.pending_review || 0
      },
      {
        id: 'kararVerilmis',
        title: 'Karar Verilmiş',
        icon: 'task_alt',
        value: stats.decided || 0
      },
      {
        id: 'islemSayisi',
        title: 'İşlem Sayısı',
        icon: 'analytics',
        value: stats.other || 0,
        subtitle: new Date().toLocaleDateString('tr-TR', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' tarihinden bugüne'
      }
    ];

    container.innerHTML = kpis.map(kpi => `
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="text-muted small">${kpi.title}</span>
              <span class="material-symbols-rounded text-muted">${kpi.icon}</span>
            </div>
            <div class="h3 mb-0 fw-bold">${formatNumber(kpi.value)}</div>
            ${kpi.subtitle ? `<small class="text-muted">${kpi.subtitle}</small>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Sayı formatla (1234 -> 1.23K)
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  }

  // Global olarak expose et
  window.istinafRenderKPICards = renderKPICards;
})();
