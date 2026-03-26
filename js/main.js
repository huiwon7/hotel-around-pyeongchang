/**
 * Hotel Around Pyeongchang - Main JavaScript
 * Premium Workation Website (Redesigned)
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollEffects();
  initStatsCounter();
  initRoomsSlider();
  initContactForm();
  initTabs();
  initLightbox();
  initGallery();
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
  const mobileFixedCta = document.getElementById('mobileFixedCta');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('nav--scrolled');
    } else {
      navbar.classList.remove('nav--scrolled');
    }
    // Show mobile fixed CTA after scrolling past hero
    if (mobileFixedCta) {
      if (window.scrollY > 300) {
        mobileFixedCta.classList.add('visible');
      } else {
        mobileFixedCta.classList.remove('visible');
      }
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

  document.querySelectorAll('.fade-in, .icon-card, .workspace-item, .pricing-card, .room-card, .facility-item, .food-card, .pkg-detail, .gallery-item').forEach(el => {
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
    const sliderWidth = slider.offsetWidth;
    const cardWidth = cards[0]?.offsetWidth || 300;
    const gap = 32;
    return Math.floor((sliderWidth + gap) / (cardWidth + gap)) || 1;
  }

  function getMaxIndex() {
    const visibleCards = getVisibleCards();
    return Math.max(0, cards.length - visibleCards);
  }

  function updateSlider() {
    const cardWidth = cards[0]?.offsetWidth || 300;
    const gap = 32;
    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = maxIdx;
    const offset = currentIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    if (prevBtn) prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
    if (nextBtn) nextBtn.style.opacity = currentIndex >= maxIdx ? '0.5' : '1';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; updateSlider(); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < getMaxIndex()) { currentIndex++; updateSlider(); }
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
    if (diff > 50 && currentIndex < getMaxIndex()) { currentIndex++; updateSlider(); }
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

  // Package detail tabs
  const pkgBtns = document.querySelectorAll('.pkg-tabs .tab-btn');
  const pkgPanels = document.querySelectorAll('.pkg-panel');

  pkgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.pkg;

      pkgBtns.forEach(b => b.classList.remove('active'));
      pkgPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById('pkg-' + pkgId);
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

  // === OTP 인증 ===
  let phoneVerificationToken = null;
  let otpTimerInterval = null;

  const btnSendOtp = document.getElementById('btnSendOtp');
  const btnVerifyOtp = document.getElementById('btnVerifyOtp');
  const otpRow = document.getElementById('otpRow');
  const otpCodeInput = document.getElementById('otpCode');
  const otpTimerEl = document.getElementById('otpTimer');
  const otpMessage = document.getElementById('otpMessage');
  const phoneVerifiedEl = document.getElementById('phoneVerified');
  const phoneInput = document.getElementById('phone');

  function setOtpMessage(text, color) {
    otpMessage.textContent = text;
    otpMessage.style.color = color;
  }

  function startOtpTimer(seconds) {
    clearInterval(otpTimerInterval);
    let remaining = seconds;
    otpTimerEl.textContent = formatTime(remaining);
    otpTimerInterval = setInterval(() => {
      remaining--;
      otpTimerEl.textContent = formatTime(remaining);
      if (remaining <= 0) {
        clearInterval(otpTimerInterval);
        setOtpMessage('인증번호가 만료되었습니다. 다시 요청해주세요.', '#ef4444');
        btnVerifyOtp.disabled = true;
      }
    }, 1000);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function resetPhoneVerification() {
    phoneVerificationToken = null;
    clearInterval(otpTimerInterval);
    otpRow.style.display = 'none';
    phoneVerifiedEl.style.display = 'none';
    otpCodeInput.value = '';
    otpMessage.textContent = '';
    btnSendOtp.disabled = false;
    btnSendOtp.textContent = '인증요청';
    phoneInput.readOnly = false;
  }

  // 전화번호 변경 시 인증 초기화
  phoneInput.addEventListener('input', () => {
    if (phoneVerificationToken) {
      resetPhoneVerification();
    }
  });

  btnSendOtp.addEventListener('click', async () => {
    const phone = phoneInput.value.replace(/\D/g, '');
    if (!/^01[016789]\d{7,8}$/.test(phone)) {
      alert('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    btnSendOtp.disabled = true;
    btnSendOtp.textContent = '발송중...';

    try {
      const res = await fetch(`${FUNCTIONS_BASE}/sendOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const result = await res.json();

      if (result.success) {
        otpRow.style.display = 'block';
        otpCodeInput.value = '';
        otpCodeInput.focus();
        btnVerifyOtp.disabled = false;
        setOtpMessage('인증번호가 발송되었습니다.', '#22c55e');
        startOtpTimer(180);
        btnSendOtp.textContent = '재전송';
        btnSendOtp.disabled = false;
      } else {
        alert(result.message || '인증번호 발송에 실패했습니다.');
        btnSendOtp.disabled = false;
        btnSendOtp.textContent = '인증요청';
      }
    } catch (err) {
      alert('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
      btnSendOtp.disabled = false;
      btnSendOtp.textContent = '인증요청';
    }
  });

  btnVerifyOtp.addEventListener('click', async () => {
    const phone = phoneInput.value.replace(/\D/g, '');
    const code = otpCodeInput.value.trim();

    if (!code || code.length !== 6) {
      setOtpMessage('인증번호 6자리를 입력해주세요.', '#ef4444');
      return;
    }

    btnVerifyOtp.disabled = true;

    try {
      const res = await fetch(`${FUNCTIONS_BASE}/verifyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const result = await res.json();

      if (result.success) {
        phoneVerificationToken = result.token;
        clearInterval(otpTimerInterval);
        otpRow.style.display = 'none';
        phoneVerifiedEl.style.display = 'block';
        phoneInput.readOnly = true;
        btnSendOtp.style.display = 'none';
      } else {
        setOtpMessage(result.message || '인증번호가 올바르지 않습니다.', '#ef4444');
        btnVerifyOtp.disabled = false;
      }
    } catch (err) {
      setOtpMessage('인증에 실패했습니다. 다시 시도해주세요.', '#ef4444');
      btnVerifyOtp.disabled = false;
    }
  });

  // === 폼 제출 ===
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    // 휴대폰 인증 확인
    if (!phoneVerificationToken) {
      alert('휴대폰 인증을 완료해주세요.');
      return;
    }

    // Turnstile 토큰 확인
    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!turnstileToken) {
      alert('보안 인증을 완료해주세요. 잠시 후 다시 시도해주세요.');
      return;
    }

    const btn = document.getElementById('btnSubmitInquiry');
    btn.disabled = true;
    btn.textContent = '전송중...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    delete data['cf-turnstile-response'];
    delete data.privacy;
    data.turnstileToken = turnstileToken;
    data.verificationToken = phoneVerificationToken;

    try {
      await storeInquiry(data);
      showModal();
      form.reset();
      resetPhoneVerification();
      btnSendOtp.style.display = '';
      if (typeof turnstile !== 'undefined') turnstile.reset();
    } catch (err) {
      alert(err.message || '문의 전송에 실패했습니다. 다시 시도해주세요.');
      if (typeof turnstile !== 'undefined') turnstile.reset();
    } finally {
      btn.disabled = false;
      btn.textContent = '문의 보내기';
    }
  });

  // Phone input formatting
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

const FUNCTIONS_BASE = 'https://asia-northeast3-hotel-around-pyeongchang.cloudfunctions.net';

async function storeInquiry(data) {
  const res = await fetch(`${FUNCTIONS_BASE}/submitInquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!result.success) {
    throw new Error(result.message);
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

/**
 * Lightbox - image viewer for rooms, facilities, gallery
 */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lbImage = document.getElementById('lightboxImage');
  const lbCaption = document.getElementById('lightboxCaption');
  const lbCounter = document.getElementById('lightboxCounter');
  const lbThumbs = document.getElementById('lightboxThumbs');
  const lbPrev = document.getElementById('lightboxPrev');
  const lbNext = document.getElementById('lightboxNext');
  const lbClose = document.getElementById('lightboxClose');

  let currentImages = [];
  let currentIndex = 0;

  // Image data for room/facility galleries
  const galleryData = {
    'hotel-standard': {
      title: '스탠다드 룸',
      images: Array.from({length: 6}, (_, i) => ({
        src: `images/gallery/rooms/hotel-standard-${i+1}.jpg`,
        caption: `스탠다드 룸 ${i+1}`
      }))
    },
    'hotel-deluxe': {
      title: '디럭스 룸',
      images: Array.from({length: 6}, (_, i) => ({
        src: `images/gallery/rooms/hotel-deluxe-${i+1}.jpg`,
        caption: `디럭스 룸 ${i+1}`
      }))
    },
    'hotel-suite': {
      title: '스위트 룸',
      images: Array.from({length: 6}, (_, i) => ({
        src: `images/gallery/rooms/hotel-suite-${i+1}.jpg`,
        caption: `스위트 룸 ${i+1}`
      }))
    },
    'hotel-ondol': {
      title: '온돌 룸',
      images: Array.from({length: 6}, (_, i) => ({
        src: `images/gallery/rooms/hotel-ondol-${i+1}.jpg`,
        caption: `온돌 룸 ${i+1}`
      }))
    },
    'terrace': {
      title: '테라스 룸',
      images: Array.from({length: 6}, (_, i) => ({
        src: `images/gallery/rooms/terrace-${i+1}.jpg`,
        caption: `테라스 룸 ${i+1}`
      }))
    },
    'terrace-pet': {
      title: '테라스 펫룸',
      images: Array.from({length: 6}, (_, i) => ({
        src: `images/gallery/rooms/terrace-pet-${i+1}.jpg`,
        caption: `테라스 펫룸 ${i+1}`
      }))
    },
    'villa': {
      title: '빌라',
      images: Array.from({length: 6}, (_, i) => ({
        src: `images/gallery/rooms/villa-${i+1}.jpg`,
        caption: `빌라 ${i+1}`
      }))
    },
    'fitness': {
      title: '피트니스 센터',
      images: Array.from({length: 4}, (_, i) => ({
        src: `images/gallery/facilities/fitness-${i+1}.jpg`,
        caption: `피트니스 센터 ${i+1}`
      }))
    },
    'breakfast': {
      title: '레스토랑 & 조식',
      images: Array.from({length: 8}, (_, i) => ({
        src: `images/gallery/dining/breakfast-${i+1}.jpg`,
        caption: `조식 & 다이닝 ${i+1}`
      }))
    },
    'bbq': {
      title: 'BBQ 가든',
      images: Array.from({length: 5}, (_, i) => ({
        src: `images/gallery/facilities/bbq-${i+1}.jpg`,
        caption: `BBQ 가든 ${i+1}`
      }))
    },
    'banquet': {
      title: '연회장',
      images: Array.from({length: 5}, (_, i) => ({
        src: `images/gallery/facilities/banquet-${i+1}.jpg`,
        caption: `연회장 ${i+1}`
      }))
    },
    'shuttle': {
      title: '셔틀버스',
      images: Array.from({length: 3}, (_, i) => ({
        src: `images/gallery/facilities/shuttle-${i+1}.jpg`,
        caption: `셔틀버스 ${i+1}`
      }))
    },
    'lobby': {
      title: '로비 & 라운지',
      images: Array.from({length: 5}, (_, i) => ({
        src: `images/gallery/facilities/lobby-${i+1}.jpg`,
        caption: `로비 & 라운지 ${i+1}`
      }))
    }
  };

  function openLightbox(images, startIndex) {
    currentImages = images;
    currentIndex = startIndex || 0;
    showImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showImage() {
    if (!currentImages.length) return;
    const img = currentImages[currentIndex];
    lbImage.src = img.src;
    lbImage.alt = img.caption || '';
    lbCaption.textContent = img.caption || '';
    lbCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;

    // Update thumbnails
    lbThumbs.innerHTML = '';
    currentImages.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'lightbox-thumb' + (i === currentIndex ? ' active' : '');
      thumb.innerHTML = `<img src="${img.src}" alt="">`;
      thumb.addEventListener('click', () => { currentIndex = i; showImage(); });
      lbThumbs.appendChild(thumb);
    });

    // Scroll active thumb into view
    const activeThumb = lbThumbs.querySelector('.active');
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    showImage();
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % currentImages.length;
    showImage();
  }

  // Events
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', prevImage);
  lbNext.addEventListener('click', nextImage);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // Touch swipe on lightbox
  let lbTouchStartX = 0;
  lbImage.addEventListener('touchstart', (e) => { lbTouchStartX = e.changedTouches[0].screenX; }, { passive: true });
  lbImage.addEventListener('touchend', (e) => {
    const diff = lbTouchStartX - e.changedTouches[0].screenX;
    if (diff > 50) nextImage();
    else if (diff < -50) prevImage();
  }, { passive: true });

  // Room cards click -> open lightbox
  document.querySelectorAll('[data-gallery]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      const key = card.dataset.gallery;
      const data = galleryData[key];
      if (data) openLightbox(data.images, 0);
    });
  });

  // Gallery items click -> open lightbox with single image
  document.querySelectorAll('.gallery-item').forEach((item, index, items) => {
    item.addEventListener('click', () => {
      // Get all currently visible gallery items
      const visibleItems = Array.from(document.querySelectorAll('.gallery-item:not(.hidden)'));
      const images = visibleItems.map(el => ({
        src: el.querySelector('img').src,
        caption: el.querySelector('.gallery-label')?.textContent || ''
      }));
      const idx = visibleItems.indexOf(item);
      openLightbox(images, idx >= 0 ? idx : 0);
    });
  });
}

/**
 * Gallery filters
 */
function initGallery() {
  const filters = document.querySelectorAll('.gallery-filter');
  const items = document.querySelectorAll('.gallery-item');

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');

      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
}
