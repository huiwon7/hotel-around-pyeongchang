/**
 * Admin Dashboard - Hotel Around Pyeongchang
 */

const AUTO_REFRESH_INTERVAL = 30000; // 30초

let allInquiries = [];
let refreshTimer = null;

/**
 * Initialize
 */
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initDashboard();

  // Firebase Auth 상태 감지
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      showDashboard();
    } else {
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('loginScreen').style.display = 'flex';
    }
  });
});

/**
 * Login
 */
function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const pw = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = form.querySelector('.login-btn');

    btn.textContent = '로그인 중...';
    btn.disabled = true;
    errorEl.textContent = '';

    try {
      await firebase.auth().signInWithEmailAndPassword(email, pw);
    } catch (err) {
      errorEl.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
      document.getElementById('adminPassword').value = '';
    } finally {
      btn.textContent = '로그인';
      btn.disabled = false;
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
    firebase.auth().signOut();
    stopAutoRefresh();
  });

  // Search
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);

  // Filters
  document.getElementById('filterPackage')?.addEventListener('change', applyFilters);
  document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
  document.getElementById('filterPeriod')?.addEventListener('change', applyFilters);

  // Modal close
  document.getElementById('modalClose')?.addEventListener('click', closeDetailModal);
  document.getElementById('detailModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });

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
  document.getElementById('addInquiryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.timestamp = new Date().toISOString();
    data.status = 'pending';

    try {
      await db.collection('inquiries').add(data);
      e.target.reset();
      closeAddModal();
      loadData();
    } catch (err) {
      console.error('문의 등록 실패:', err);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    }
  });
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Load data from Firestore
 */
async function loadData() {
  try {
    const snapshot = await db.collection('inquiries')
      .orderBy('timestamp', 'desc')
      .get();

    allInquiries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    updateStats();
    applyFilters();
    updateLastUpdated();
  } catch (err) {
    console.error('Firestore 데이터 로딩 실패:', err);
    allInquiries = [];
    updateStats();
    applyFilters();
  }
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

  // Status filter
  const statusFilter = document.getElementById('filterStatus')?.value || '';
  if (statusFilter) {
    filtered = filtered.filter(i => (i.status || 'pending') === statusFilter);
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
        <td colspan="10" class="empty-state">
          <div class="empty-icon">&#128203;</div>
          <p>문의 내역이 없습니다</p>
        </td>
      </tr>
    `;
    return;
  }

  const packageNames = {
    starter: 'Starter - 7박',
    professional: 'Professional - 14박',
    nomad: 'Nomad - 30박',
    paradise: 'Paradise - 90박',
    custom: '기업 맞춤'
  };

  // Store filtered results for detail view
  window._filteredInquiries = inquiries;

  const statusNames = {
    pending: '신규',
    consulting: '상담중',
    hold: '보류',
    confirmed: '예약완료'
  };

  tbody.innerHTML = inquiries.map((item, idx) => {
    const date = item.timestamp ? formatDate(item.timestamp) : '-';
    const pkgName = packageNames[item.package] || item.package || '-';
    const pkgClass = item.package || 'custom';
    const statusClass = item.status || 'pending';
    const statusName = statusNames[statusClass] || '신규';
    const memoPreview = item.memo ? escapeHtml(item.memo) : '';

    return `
      <tr class="row-${statusClass}" onclick="showDetail(${idx})" style="cursor:pointer;">
        <td>${date}</td>
        <td><strong>${escapeHtml(item.name || '-')}</strong></td>
        <td>${escapeHtml(item.company || '-')}</td>
        <td><span class="pkg-badge ${pkgClass}">${pkgName}</span></td>
        <td><span class="status-badge status-${statusClass}">${statusName}</span></td>
        <td>${escapeHtml(item.phone || '-')}</td>
        <td>${item.checkin || '-'}</td>
        <td>${escapeHtml(item.guests || '-')}</td>
        <td class="memo-cell">${memoPreview ? '<span class="memo-preview">' + memoPreview + '</span>' : '<span class="memo-empty">-</span>'}</td>
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

  const currentStatus = item.status || 'pending';
  const statusNames = {
    pending: '신규',
    consulting: '상담중',
    hold: '보류',
    confirmed: '예약완료'
  };

  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div class="detail-status-section">
      <div class="detail-label">진행상태</div>
      <div class="status-buttons" data-doc-id="${item.id}">
        <button class="status-btn status-pending ${currentStatus === 'pending' ? 'active' : ''}" onclick="updateStatus('${item.id}', 'pending')">신규</button>
        <button class="status-btn status-consulting ${currentStatus === 'consulting' ? 'active' : ''}" onclick="updateStatus('${item.id}', 'consulting')">상담중</button>
        <button class="status-btn status-hold ${currentStatus === 'hold' ? 'active' : ''}" onclick="updateStatus('${item.id}', 'hold')">보류</button>
        <button class="status-btn status-confirmed ${currentStatus === 'confirmed' ? 'active' : ''}" onclick="updateStatus('${item.id}', 'confirmed')">예약완료</button>
      </div>
    </div>
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
    <div class="detail-memo-section">
      <div class="detail-label">담당자 메모</div>
      <textarea class="memo-input" id="memoInput" rows="3" placeholder="메모를 입력하세요...">${escapeHtml(item.memo || '')}</textarea>
      <button class="btn-save-memo" onclick="saveMemo('${item.id}')">메모 저장</button>
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
 * Update inquiry status
 */
async function updateStatus(docId, newStatus) {
  try {
    await db.collection('inquiries').doc(docId).update({ status: newStatus });

    // Update local data
    const item = allInquiries.find(i => i.id === docId);
    if (item) item.status = newStatus;

    // Update active button in modal
    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.status-btn.status-${newStatus}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Refresh table
    applyFilters();
  } catch (err) {
    console.error('상태 업데이트 실패:', err);
    alert('상태 변경에 실패했습니다.');
  }
}

/**
 * Save memo
 */
async function saveMemo(docId) {
  const memo = document.getElementById('memoInput').value.trim();
  try {
    await db.collection('inquiries').doc(docId).update({ memo: memo });

    // Update local data
    const item = allInquiries.find(i => i.id === docId);
    if (item) item.memo = memo;

    // Refresh table immediately
    applyFilters();

    const btn = document.querySelector('.btn-save-memo');
    btn.textContent = '저장 완료!';
    btn.style.background = '#27ae60';
    setTimeout(() => {
      btn.textContent = '메모 저장';
      btn.style.background = '';
    }, 1500);
  } catch (err) {
    console.error('메모 저장 실패:', err);
    alert('메모 저장에 실패했습니다.');
  }
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
