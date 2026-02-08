/**
 * Admin Dashboard - Hotel Around Pyeongchang
 */

const ADMIN_PASSWORD = 'hotelaround2025';
const STORAGE_KEY_URL = 'adminScriptUrl';
const STORAGE_KEY_AUTH = 'adminAuth';
const AUTO_REFRESH_INTERVAL = 30000; // 30초

let allInquiries = [];
let refreshTimer = null;

/**
 * Initialize
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  if (sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true') {
    showDashboard();
  }

  initLogin();
  initDashboard();
});

/**
 * Login
 */
function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');

    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
      showDashboard();
    } else {
      errorEl.textContent = '비밀번호가 올바르지 않습니다.';
      document.getElementById('adminPassword').value = '';
    }
  });
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadData();
  startAutoRefresh();
}

/**
 * Dashboard controls
 */
function initDashboard() {
  // Refresh button
  document.getElementById('btnRefresh')?.addEventListener('click', loadData);

  // Logout
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    stopAutoRefresh();
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').textContent = '';
  });

  // Search
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);

  // Filters
  document.getElementById('filterPackage')?.addEventListener('change', applyFilters);
  document.getElementById('filterPeriod')?.addEventListener('change', applyFilters);

  // Modal close
  document.getElementById('modalClose')?.addEventListener('click', closeDetailModal);
  document.getElementById('detailModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });

  // Setup toggle
  document.getElementById('btnSetup')?.addEventListener('click', () => {
    const section = document.getElementById('setupSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';

    // Pre-fill saved URL
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
    if (savedUrl) {
      document.getElementById('scriptUrlInput').value = savedUrl;
    }
  });

  // Save URL
  document.getElementById('btnSaveUrl')?.addEventListener('click', saveScriptUrl);
}

/**
 * Save Google Apps Script URL
 */
function saveScriptUrl() {
  const input = document.getElementById('scriptUrlInput');
  const status = document.getElementById('urlStatus');
  const url = input.value.trim();

  if (!url) {
    status.textContent = 'URL을 입력해주세요.';
    status.style.color = '#e74c3c';
    return;
  }

  localStorage.setItem(STORAGE_KEY_URL, url);

  // Also set for main site form
  window.GOOGLE_SCRIPT_URL = url;

  status.textContent = 'URL이 저장되었습니다. 데이터를 불러옵니다...';
  status.style.color = '#27ae60';

  loadData();
}

/**
 * Load data from Google Sheets
 */
async function loadData() {
  const scriptUrl = localStorage.getItem(STORAGE_KEY_URL);

  if (!scriptUrl) {
    // No URL set - show local data or empty
    loadLocalData();
    return;
  }

  try {
    const response = await fetch(scriptUrl);
    if (!response.ok) throw new Error('Network error');

    const data = await response.json();
    allInquiries = data.map((row, idx) => ({
      id: idx,
      timestamp: row.timestamp || '',
      name: row.name || '',
      company: row.company || '',
      email: row.email || '',
      phone: row.phone || '',
      package: row.package || '',
      checkin: row.checkin || '',
      guests: row.guests || '',
      message: row.message || '',
      status: row.status || 'pending'
    }));

    // Sort newest first
    allInquiries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    updateStats();
    applyFilters();
    updateLastUpdated();
  } catch (err) {
    console.error('데이터 로딩 실패:', err);
    loadLocalData();
  }
}

/**
 * Fallback: load from localStorage
 */
function loadLocalData() {
  const stored = localStorage.getItem('workationInquiries');
  if (stored) {
    allInquiries = JSON.parse(stored);
    allInquiries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else {
    allInquiries = [];
  }

  updateStats();
  applyFilters();
  updateLastUpdated();
}

/**
 * Update stats cards
 */
function updateStats() {
  const total = allInquiries.length;
  const today = new Date().toISOString().split('T')[0];
  const todayCount = allInquiries.filter(i =>
    i.timestamp && i.timestamp.startsWith(today)
  ).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = allInquiries.filter(i =>
    i.timestamp && new Date(i.timestamp) >= weekAgo
  ).length;

  // Popular package
  const pkgCount = {};
  allInquiries.forEach(i => {
    if (i.package) {
      pkgCount[i.package] = (pkgCount[i.package] || 0) + 1;
    }
  });
  const topPkg = Object.entries(pkgCount).sort((a, b) => b[1] - a[1])[0];
  const packageNames = {
    starter: 'Starter',
    professional: 'Professional',
    nomad: 'Nomad',
    paradise: 'Paradise',
    custom: '기업 맞춤'
  };

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statToday').textContent = todayCount;
  document.getElementById('statWeek').textContent = weekCount;
  document.getElementById('statPackage').textContent =
    topPkg ? (packageNames[topPkg[0]] || topPkg[0]) : '-';
}

/**
 * Apply filters and render table
 */
function applyFilters() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const pkgFilter = document.getElementById('filterPackage')?.value || '';
  const periodFilter = document.getElementById('filterPeriod')?.value || '';

  let filtered = [...allInquiries];

  // Search filter
  if (search) {
    filtered = filtered.filter(i =>
      (i.name || '').toLowerCase().includes(search) ||
      (i.company || '').toLowerCase().includes(search) ||
      (i.email || '').toLowerCase().includes(search) ||
      (i.phone || '').includes(search)
    );
  }

  // Package filter
  if (pkgFilter) {
    filtered = filtered.filter(i => i.package === pkgFilter);
  }

  // Period filter
  if (periodFilter) {
    const now = new Date();
    filtered = filtered.filter(i => {
      if (!i.timestamp) return false;
      const date = new Date(i.timestamp);
      if (periodFilter === 'today') {
        return date.toDateString() === now.toDateString();
      } else if (periodFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      } else if (periodFilter === 'month') {
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  renderTable(filtered);
}

/**
 * Render inquiry table
 */
function renderTable(inquiries) {
  const tbody = document.getElementById('inquiryBody');
  if (!tbody) return;

  if (inquiries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-icon">&#128203;</div>
          <p>문의 내역이 없습니다</p>
        </td>
      </tr>
    `;
    return;
  }

  const packageNames = {
    starter: 'Starter',
    professional: 'Professional',
    nomad: 'Nomad',
    paradise: 'Paradise',
    custom: '기업 맞춤'
  };

  tbody.innerHTML = inquiries.map((item, idx) => {
    const date = item.timestamp ? formatDate(item.timestamp) : '-';
    const pkgName = packageNames[item.package] || item.package || '-';
    const pkgClass = item.package || 'custom';

    return `
      <tr>
        <td>${date}</td>
        <td><strong>${escapeHtml(item.name || '-')}</strong></td>
        <td>${escapeHtml(item.company || '-')}</td>
        <td><span class="pkg-badge ${pkgClass}">${pkgName}</span></td>
        <td>${escapeHtml(item.phone || '-')}</td>
        <td>${escapeHtml(item.email || '-')}</td>
        <td>${item.checkin || '-'}</td>
        <td>${escapeHtml(item.guests || '-')}</td>
        <td><button class="btn-detail" onclick="showDetail(${idx})">보기</button></td>
      </tr>
    `;
  }).join('');
}

/**
 * Show detail modal
 */
function showDetail(index) {
  const item = allInquiries[index];
  if (!item) return;

  const packageNames = {
    starter: 'Starter - 7박',
    professional: 'Professional - 14박',
    nomad: 'Nomad - 30박',
    paradise: 'Paradise - 90박',
    custom: '기업 맞춤 패키지'
  };

  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div class="detail-row">
      <div class="detail-label">접수일시</div>
      <div class="detail-value">${item.timestamp ? formatDateTime(item.timestamp) : '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">이름</div>
      <div class="detail-value">${escapeHtml(item.name || '-')}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">회사</div>
      <div class="detail-value">${escapeHtml(item.company || '-')}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">이메일</div>
      <div class="detail-value"><a href="mailto:${escapeHtml(item.email)}">${escapeHtml(item.email || '-')}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">연락처</div>
      <div class="detail-value"><a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone || '-')}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">패키지</div>
      <div class="detail-value">${packageNames[item.package] || item.package || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">체크인</div>
      <div class="detail-value">${item.checkin || '-'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">인원</div>
      <div class="detail-value">${escapeHtml(item.guests || '-')}명</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">메시지</div>
      <div class="detail-value message">${escapeHtml(item.message || '(없음)')}</div>
    </div>
  `;

  document.getElementById('detailModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Auto refresh
 */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(loadData, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Utilities
 */
function formatDate(isoString) {
  const d = new Date(isoString);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${month}.${day} ${hours}:${mins}`;
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일 ${h}:${min}`;
}

function updateLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (el) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `최종 업데이트: ${h}:${m}`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
