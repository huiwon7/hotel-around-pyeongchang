/**
 * Hotel Around Pyeongchang - Authentication Module
 * Handles login, registration, and user management
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();
  initLoginForm();
  initRegisterForm();
  initPasswordToggle();
  initPasswordStrength();
  initTermsAgree();
  initPhoneFormat();
  checkLoginStatus();
});

/**
 * Auth Tab Switching
 */
function initAuthTabs() {
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (tab.dataset.tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
      }
    });
  });
}

/**
 * Login Form Handler
 */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const remember = form.querySelector('[name="remember"]').checked;

    // Validate
    if (!validateEmail(email)) {
      showError(document.getElementById('loginEmail'), '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // Check credentials
    const users = JSON.parse(localStorage.getItem('workationUsers') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Login success
      const session = {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        loginTime: new Date().toISOString()
      };

      if (remember) {
        localStorage.setItem('workationSession', JSON.stringify(session));
      } else {
        sessionStorage.setItem('workationSession', JSON.stringify(session));
      }

      showNotification('success', `${user.name}님, 환영합니다!`);

      setTimeout(() => {
        window.location.href = 'mypage.html';
      }, 1500);

    } else {
      showNotification('error', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  });
}

/**
 * Registration Form Handler
 */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = {
      name: document.getElementById('registerName').value,
      phone: document.getElementById('registerPhone').value,
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value,
      passwordConfirm: document.getElementById('registerPasswordConfirm').value,
      company: document.getElementById('registerCompany').value,
      interests: Array.from(form.querySelectorAll('[name="interest"]:checked')).map(cb => cb.value),
      agreeMarketing: form.querySelector('[name="agreeMarketing"]').checked
    };

    // Validate
    if (!formData.name.trim()) {
      showError(document.getElementById('registerName'), '이름을 입력해주세요.');
      return;
    }

    if (!validatePhone(formData.phone)) {
      showError(document.getElementById('registerPhone'), '올바른 연락처를 입력해주세요.');
      return;
    }

    if (!validateEmail(formData.email)) {
      showError(document.getElementById('registerEmail'), '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // Check if email exists
    const users = JSON.parse(localStorage.getItem('workationUsers') || '[]');
    if (users.find(u => u.email === formData.email)) {
      showError(document.getElementById('registerEmail'), '이미 가입된 이메일입니다.');
      return;
    }

    if (!validatePassword(formData.password)) {
      showError(document.getElementById('registerPassword'), '8자 이상, 영문과 숫자를 포함해주세요.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      showError(document.getElementById('registerPasswordConfirm'), '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!form.querySelector('[name="agreeTerms"]').checked ||
        !form.querySelector('[name="agreePrivacy"]').checked) {
      showNotification('error', '필수 약관에 동의해주세요.');
      return;
    }

    // Create user
    const newUser = {
      id: Date.now(),
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      company: formData.company,
      interests: formData.interests,
      agreeMarketing: formData.agreeMarketing,
      createdAt: new Date().toISOString(),
      reservations: []
    };

    users.push(newUser);
    localStorage.setItem('workationUsers', JSON.stringify(users));

    showNotification('success', '회원가입이 완료되었습니다!');

    // Auto login
    const session = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      company: newUser.company,
      phone: newUser.phone,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('workationSession', JSON.stringify(session));

    setTimeout(() => {
      window.location.href = 'mypage.html';
    }, 1500);
  });
}

/**
 * Password Toggle
 */
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const type = input.type === 'password' ? 'text' : 'password';
  input.type = type;
}

function initPasswordToggle() {
  // Already handled via inline onclick
}

/**
 * Password Strength Indicator
 */
function initPasswordStrength() {
  const passwordInput = document.getElementById('registerPassword');
  const strengthDiv = document.getElementById('passwordStrength');

  if (!passwordInput || !strengthDiv) return;

  // Create strength bars
  for (let i = 0; i < 4; i++) {
    const bar = document.createElement('div');
    bar.className = 'strength-bar';
    strengthDiv.appendChild(bar);
  }

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);

    strengthDiv.className = 'password-strength';
    if (strength >= 4) {
      strengthDiv.classList.add('very-strong');
    } else if (strength >= 3) {
      strengthDiv.classList.add('strong');
    } else if (strength >= 2) {
      strengthDiv.classList.add('medium');
    } else if (strength >= 1) {
      strengthDiv.classList.add('weak');
    }
  });
}

function calculatePasswordStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return strength;
}

/**
 * Terms Agreement
 */
function initTermsAgree() {
  const agreeAll = document.getElementById('agreeAll');
  if (!agreeAll) return;

  const termCheckboxes = document.querySelectorAll('.terms-detail input[type="checkbox"]');

  agreeAll.addEventListener('change', () => {
    termCheckboxes.forEach(cb => {
      cb.checked = agreeAll.checked;
    });
  });

  termCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      agreeAll.checked = Array.from(termCheckboxes).every(c => c.checked);
    });
  });
}

/**
 * Phone Number Format
 */
function initPhoneFormat() {
  const phoneInputs = document.querySelectorAll('[type="tel"]');

  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');

      if (value.length > 11) {
        value = value.slice(0, 11);
      }

      if (value.length > 7) {
        value = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{0,4})/, '$1-$2');
      }

      e.target.value = value;
    });
  });
}

/**
 * Social Login (Demo)
 */
function socialLogin(provider) {
  showNotification('info', `${provider === 'kakao' ? '카카오' : '네이버'} 로그인은 데모 모드입니다.`);

  // Demo: Create demo user
  const demoUser = {
    id: Date.now(),
    name: provider === 'kakao' ? '카카오사용자' : '네이버사용자',
    email: `${provider}user${Date.now()}@demo.com`,
    phone: '010-0000-0000',
    company: '',
    provider: provider,
    createdAt: new Date().toISOString(),
    reservations: []
  };

  const users = JSON.parse(localStorage.getItem('workationUsers') || '[]');
  users.push(demoUser);
  localStorage.setItem('workationUsers', JSON.stringify(users));

  const session = {
    id: demoUser.id,
    name: demoUser.name,
    email: demoUser.email,
    phone: demoUser.phone,
    loginTime: new Date().toISOString()
  };
  localStorage.setItem('workationSession', JSON.stringify(session));

  setTimeout(() => {
    window.location.href = 'mypage.html';
  }, 1500);
}

/**
 * Check Login Status
 */
function checkLoginStatus() {
  const session = getSession();
  if (session && window.location.pathname.includes('login.html')) {
    window.location.href = 'mypage.html';
  }
}

function getSession() {
  return JSON.parse(localStorage.getItem('workationSession')) ||
         JSON.parse(sessionStorage.getItem('workationSession'));
}

/**
 * Validation Helpers
 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone.replace(/-/g, ''));
}

function validatePassword(password) {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

function showError(input, message) {
  input.classList.add('error');

  // Remove existing error
  const existingError = input.parentElement.querySelector('.error-msg');
  if (existingError) existingError.remove();

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-msg';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem;';

  input.parentElement.appendChild(errorDiv);

  input.addEventListener('input', () => {
    input.classList.remove('error');
    errorDiv.remove();
  }, { once: true });
}

/**
 * Notification
 */
function showNotification(type, message) {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
    </div>
  `;

  const colors = {
    success: '#27ae60',
    error: '#e74c3c',
    info: '#3498db'
  };

  notification.style.cssText = `
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type]};
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 3000;
    animation: slideDown 0.3s ease;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideDown 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Make functions globally accessible
window.togglePassword = togglePassword;
window.socialLogin = socialLogin;
