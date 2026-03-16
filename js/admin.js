/**
 * Admin Dashboard - Hotel Around Pyeongchang
 */

const ADMIN_PASSWORD = '***REMOVED***';
const STORAGE_KEY_URL = 'adminScriptUrl';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyAFBefe-RXjNuVzV3leNnaaZ-xtt69h9cpipJ2WhXHbdlLv7cF9Pu__c3BLG2XGQOU_g/exec';
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
    document.getElementById('telegramSection').style.display = 'none';

    // Pre-fill saved URL
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
    if (savedUrl) {
      document.getElementById('scriptUrlInput').value = savedUrl;
    }
  });

  // Save URL
  document.getElementById('btnSaveUrl')?.addEventListener('click', saveScriptUrl);

  // Telegram setup toggle
  document.getElementById('btnTelegramSetup')?.addEventListener('click', () => {
    const section = document.getElementById('telegramSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
    document.getElementById('setupSection').style.display = 'none';

    // Pre-fill saved values
    const savedToken = localStorage.getItem('telegramBotToken');
    const savedChatId = localStorage.getItem('telegramChatId');
    if (savedToken) document.getElementById('telegramTokenInput').value = savedToken;
    if (savedChatId) document.getElementById('telegramChatIdInput').value = savedChatId;
  });

  // Save Telegram settings
  document.getElementById('btnSaveTelegram')?.addEventListener('click', saveTelegramSettings);

  // Test Telegram notification
  document.getElementById('btnTestTelegram')?.addEventListener('click', testTelegramNotification);

  // Test data buttons
  document.getElementById('btnTestData')?.addEventListener('click', addTestData);
  document.getElementById('btnClearData')?.addEventListener('click', clearAllData);

  // Add inquiry modal
  document.getElementById('btnAddInquiry')?.addEventListener('click', () => {
    document.getElementById('addModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('addModalClose')?.addEventListener('click', closeAddModal);
  document.getElementById('addModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddModal();
  });

  // Add inquiry form submit
  document.getElementById('addInquiryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.timestamp = new Date().toISOString();
    data.id = Date.now();
    data.status = 'pending';

    const inquiries = JSON.parse(localStorage.getItem('workationInquiries') || '[]');
    inquiries.push(data);
    localStorage.setItem('workationInquiries', JSON.stringify(inquiries));

    e.target.reset();
    closeAddModal();
    loadLocalData();
  });
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('active');
  document.body.style.overflow = '';
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
 * Save Telegram settings
 */
function saveTelegramSettings() {
  const token = document.getElementById('telegramTokenInput').value.trim();
  const chatId = document.getElementById('telegramChatIdInput').value.trim();
  const status = document.getElementById('telegramStatus');

  if (!token || !chatId) {
    status.textContent = 'Bot Token과 Chat ID를 모두 입력해주세요.';
    status.style.color = '#e74c3c';
    return;
  }

  localStorage.setItem('telegramBotToken', token);
  localStorage.setItem('telegramChatId', chatId);

  status.textContent = '텔레그램 설정이 저장되었습니다.';
  status.style.color = '#27ae60';
}

/**
 * Test Telegram notification
 */
async function testTelegramNotification() {
  const token = localStorage.getItem('telegramBotToken');
  const chatId = localStorage.getItem('telegramChatId');
  const status = document.getElementById('telegramStatus');

  if (!token || !chatId) {
    status.textContent = '먼저 설정을 저장해주세요.';
    status.style.color = '#e74c3c';
    return;
  }

  status.textContent = '테스트 알림 전송 중...';
  status.style.color = '#2980b9';

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ 호텔어라운드 평창 알림 테스트\n\n텔레그램 알림이 정상적으로 연동되었습니다.'
      })
    });

    const result = await response.json();
    if (result.ok) {
      status.textContent = '테스트 알림이 전송되었습니다. 텔레그램을 확인하세요!';
      status.style.color = '#27ae60';
    } else {
      status.textContent = `전송 실패: ${result.description || '설정을 다시 확인해주세요.'}`;
      status.style.color = '#e74c3c';
    }
  } catch (err) {
    status.textContent = '전송 실패: 네트워크 오류가 발생했습니다.';
    status.style.color = '#e74c3c';
  }
}

/**
 * Load data from Google Sheets
 */
async function loadData() {
  const scriptUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;

  if (!scriptUrl) {
    loadLocalData();
    return;
  }

  try {
    const response = await fetch(scriptUrl, { redirect: 'follow' });
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

    // Merge with localStorage data (avoid duplicates by timestamp+name)
    const localStored = localStorage.getItem('workationInquiries');
    if (localStored) {
      const localData = JSON.parse(localStored);
      localData.forEach(local => {
        const exists = allInquiries.some(item =>
          item.timestamp === local.timestamp && item.name === local.name
        );
        if (!exists) {
          allInquiries.push(local);
        }
      });
    }

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
    const scriptUrl = localStorage.getItem(STORAGE_KEY_URL);
    const hasLocalData = localStorage.getItem('workationInquiries');
    let emptyMsg = '문의 내역이 없습니다';

    if (!scriptUrl && !hasLocalData) {
      emptyMsg = '데이터 소스가 연결되지 않았습니다.<br><small style="color:#999;">하단의 <strong>Google Sheets 설정</strong> 버튼을 눌러 연동하거나,<br>메인 사이트에서 테스트 문의를 제출해 보세요.</small>';
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-icon">&#128203;</div>
          <p>${emptyMsg}</p>
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

  // Store filtered results for detail view
  window._filteredInquiries = inquiries;

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
  const item = (window._filteredInquiries || allInquiries)[index];
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

/**
 * Test data management
 */
function addTestData() {
  const sampleNames = ['김민수', '이수진', '박지훈', '정하늘', '최서연'];
  const sampleCompanies = ['테크스타트업', '크리에이티브랩', '노마드코퍼레이션', '프리워크', '디지털브릿지'];
  const packages = ['starter', 'professional', 'nomad', 'paradise', 'custom'];
  const guestOptions = ['1', '2', '3-5', '6-10', '10+'];
  const messages = [
    '워케이션 패키지 관련 상세 정보 부탁드립니다.',
    '팀 단위로 이용 가능한지 문의드립니다.',
    '장기 투숙 시 추가 할인이 가능한가요?',
    '체크인 시간 조정이 가능할까요?',
    '기업 맞춤 패키지 상담 요청합니다.'
  ];

  const existing = JSON.parse(localStorage.getItem('workationInquiries') || '[]');

  const newInquiries = sampleNames.map((name, i) => {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

    const checkinDate = new Date();
    checkinDate.setDate(checkinDate.getDate() + 7 + Math.floor(Math.random() * 30));

    return {
      id: Date.now() + i,
      timestamp: date.toISOString(),
      name: name,
      company: sampleCompanies[i],
      email: `${name.replace(/[가-힣]/g, () => String.fromCharCode(97 + Math.floor(Math.random() * 26)))}@example.com`,
      phone: `010-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      package: packages[i],
      checkin: checkinDate.toISOString().split('T')[0],
      guests: guestOptions[i],
      message: messages[i],
      status: 'pending'
    };
  });

  const merged = [...existing, ...newInquiries];
  localStorage.setItem('workationInquiries', JSON.stringify(merged));
  loadLocalData();
}

function clearAllData() {
  if (!confirm('모든 테스트 데이터를 삭제하시겠습니까?')) return;
  localStorage.removeItem('workationInquiries');
  allInquiries = [];
  updateStats();
  applyFilters();
}
