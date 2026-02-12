/**
 * Hotel Around Pyeongchang - Main JavaScript
 * Premium Workation Website (Redesigned)
 */

document.addEventListener('DOMContentLoaded', () => {
  window.GOOGLE_SCRIPT_URL = localStorage.getItem('adminScriptUrl') || '';

  initNavigation();
  initScrollEffects();
  initStatsCounter();
  initRoomsSlider();
  initContactForm();
  initTabs();
});

/**
 * Navigation
 */
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navOverlay = document.getElementById('navOverlay');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('nav--scrolled');
    } else {
      navbar.classList.remove('nav--scrolled');
    }
  });

  // Mobile menu toggle
  function toggleMenu() {
    navMenu.classList.toggle('open');
    if (navOverlay) navOverlay.classList.toggle('open');
  }

  if (navToggle) {
    navToggle.addEventListener('click', toggleMenu);
  }
  if (navOverlay) {
    navOverlay.addEventListener('click', toggleMenu);
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });

        // Close mobile menu
        navMenu.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('open');
      }
    });
  });

  // Active link tracking
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

  sections.forEach(section => sectionObserver.observe(section));
}

/**
 * Scroll-triggered fade-in animations
 */
function initScrollEffects() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in, .icon-card, .workspace-item, .pricing-card, .room-card, .facility-item, .food-card, .pkg-detail').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  const style = document.createElement('style');
  style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);
}

/**
 * Animated stats counter
 */
function initStatsCounter() {
  const stats = document.querySelectorAll('.intro-stat__number');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countTo = parseInt(target.getAttribute('data-count'));
        animateCounter(target, countTo);
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element, target) {
  const duration = 2000;
  const frameDuration = 1000 / 60;
  const totalFrames = Math.round(duration / frameDuration);
  let frame = 0;

  const counter = setInterval(() => {
    frame++;
    const progress = frame / totalFrames;
    const eased = progress * (2 - progress);
    element.textContent = Math.round(target * eased).toLocaleString();
    if (frame === totalFrames) clearInterval(counter);
  }, frameDuration);
}

/**
 * Rooms slider
 */
function initRoomsSlider() {
  const slider = document.getElementById('roomsSlider');
  if (!slider) return;

  const track = slider.querySelector('.rooms-track');
  const cards = slider.querySelectorAll('.room-card');
  const prevBtn = document.getElementById('roomsPrev');
  const nextBtn = document.getElementById('roomsNext');

  let currentIndex = 0;

  function getVisibleCards() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    if (window.innerWidth < 1280) return 3;
    return 4;
  }

  function updateSlider() {
    const cardWidth = cards[0]?.offsetWidth || 300;
    const gap = 32;
    const visibleCards = getVisibleCards();
    const offset = currentIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    if (prevBtn) prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
    if (nextBtn) nextBtn.style.opacity = currentIndex >= cards.length - visibleCards ? '0.5' : '1';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; updateSlider(); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < cards.length - getVisibleCards()) { currentIndex++; updateSlider(); }
    });
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => { currentIndex = 0; updateSlider(); }, 250);
  });

  // Touch support
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (diff > 50 && currentIndex < cards.length - getVisibleCards()) { currentIndex++; updateSlider(); }
    else if (diff < -50 && currentIndex > 0) { currentIndex--; updateSlider(); }
  }, { passive: true });

  updateSlider();
}

/**
 * Tab navigation
 */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById('tab-' + tabId);
      if (panel) panel.classList.add('active');
    });
  });
}

/**
 * Contact form
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const checkinInput = document.getElementById('checkin');
  if (checkinInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    checkinInput.min = tomorrow.toISOString().split('T')[0];
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    storeInquiry(data);
    showModal();
    form.reset();
  });

  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length > 7) value = value.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
      else if (value.length > 3) value = value.replace(/(\d{3})(\d{0,4})/, '$1-$2');
      e.target.value = value;
    });
  }
}

function validateForm(form) {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    removeError(field);
    if (!field.value.trim()) {
      showError(field, '필수 입력 항목입니다.');
      isValid = false;
    } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
      showError(field, '올바른 이메일 형식을 입력해주세요.');
      isValid = false;
    } else if (field.type === 'checkbox' && !field.checked) {
      showError(field, '개인정보 수집에 동의해주세요.');
      isValid = false;
    }
  });

  return isValid;
}

function showError(field, message) {
  field.classList.add('error');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.textContent = message;
  field.parentElement.appendChild(errorDiv);
}

function removeError(field) {
  field.classList.remove('error');
  const err = field.parentElement.querySelector('.form-error');
  if (err) err.remove();
}

function storeInquiry(data) {
  data.timestamp = new Date().toISOString();
  data.id = Date.now();
  data.status = 'pending';

  const inquiries = JSON.parse(localStorage.getItem('workationInquiries') || '[]');
  inquiries.push(data);
  localStorage.setItem('workationInquiries', JSON.stringify(inquiries));

  const SCRIPT_URL = window.GOOGLE_SCRIPT_URL || '';
  if (SCRIPT_URL) {
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.error('Google Sheets 전송 실패:', err));
  }
}

function showModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  const modal = document.getElementById('successModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

window.closeModal = closeModal;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('successModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});
