/**
 * Hotel Around Pyeongchang - Main JavaScript
 * Premium Workation Website
 */

document.addEventListener('DOMContentLoaded', () => {
  // Load Google Script URL from localStorage
  window.GOOGLE_SCRIPT_URL = localStorage.getItem('adminScriptUrl') || '';

  // Initialize all modules
  initNavigation();
  initScrollEffects();
  initStatsCounter();
  initRoomsSlider();
  initContactForm();
});

/**
 * Navigation functionality
 */
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');

  // Scroll effect for navbar
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
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

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Close mobile menu if open
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
      }
    });
  });
}

/**
 * Scroll-triggered animations
 */
function initScrollEffects() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  document.querySelectorAll('.about-card, .workspace-item, .package-card, .room-card, .facility-item, .target-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Add visible styles
  const style = document.createElement('style');
  style.textContent = `
    .visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Animated statistics counter
 */
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-number');

  const observerOptions = {
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countTo = parseInt(target.getAttribute('data-count'));
        animateCounter(target, countTo);
        observer.unobserve(target);
      }
    });
  }, observerOptions);

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
    const easeProgress = easeOutQuad(progress);
    const currentCount = Math.round(target * easeProgress);

    element.textContent = currentCount.toLocaleString();

    if (frame === totalFrames) {
      clearInterval(counter);
    }
  }, frameDuration);
}

function easeOutQuad(t) {
  return t * (2 - t);
}

/**
 * Rooms slider functionality
 */
function initRoomsSlider() {
  const slider = document.getElementById('roomsSlider');
  if (!slider) return;

  const track = slider.querySelector('.rooms-track');
  const cards = slider.querySelectorAll('.room-card');
  const prevBtn = document.getElementById('roomsPrev');
  const nextBtn = document.getElementById('roomsNext');

  let currentIndex = 0;
  const cardWidth = cards[0]?.offsetWidth || 300;
  const gap = 32; // 2rem gap
  const visibleCards = getVisibleCards();

  function getVisibleCards() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    if (window.innerWidth < 1280) return 3;
    return 4;
  }

  function updateSlider() {
    const offset = currentIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;

    // Update button states
    prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
    nextBtn.style.opacity = currentIndex >= cards.length - visibleCards ? '0.5' : '1';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateSlider();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < cards.length - visibleCards) {
        currentIndex++;
        updateSlider();
      }
    });
  }

  // Handle resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      currentIndex = 0;
      updateSlider();
    }, 250);
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (diff > swipeThreshold && currentIndex < cards.length - visibleCards) {
      currentIndex++;
      updateSlider();
    } else if (diff < -swipeThreshold && currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  }

  // Initial state
  updateSlider();
}

/**
 * Contact form handling
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const modal = document.getElementById('successModal');

  if (!form) return;

  // Set minimum date for check-in
  const checkinInput = document.getElementById('checkin');
  if (checkinInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    checkinInput.min = tomorrow.toISOString().split('T')[0];
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm(form)) {
      return;
    }

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Store inquiry data (in real app, this would be sent to server)
    storeInquiry(data);

    // Show success modal
    showModal();

    // Reset form
    form.reset();
  });

  // Phone number formatting
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
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
    } else if (field.type === 'email' && !isValidEmail(field.value)) {
      showError(field, '올바른 이메일 형식을 입력해주세요.');
      isValid = false;
    } else if (field.type === 'checkbox' && !field.checked) {
      showError(field, '개인정보 수집에 동의해주세요.');
      isValid = false;
    }
  });

  return isValid;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(field, message) {
  field.classList.add('error');

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem;';

  if (field.type === 'checkbox') {
    field.parentElement.appendChild(errorDiv);
  } else {
    field.parentElement.appendChild(errorDiv);
  }
}

function removeError(field) {
  field.classList.remove('error');
  const errorMessage = field.parentElement.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

function storeInquiry(data) {
  // Add metadata
  data.timestamp = new Date().toISOString();
  data.id = Date.now();
  data.status = 'pending';

  // localStorage 백업 저장
  const inquiries = JSON.parse(localStorage.getItem('workationInquiries') || '[]');
  inquiries.push(data);
  localStorage.setItem('workationInquiries', JSON.stringify(inquiries));

  // Google Sheets로 전송
  const SCRIPT_URL = window.GOOGLE_SCRIPT_URL || '';
  if (SCRIPT_URL) {
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.error('Google Sheets 전송 실패:', err));
  }

  console.log('Inquiry stored:', data);
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

// Make closeModal globally accessible
window.closeModal = closeModal;

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Close modal on backdrop click
document.getElementById('successModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    closeModal();
  }
});

/**
 * Parallax effect for hero section
 */
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero-bg');
  if (hero) {
    const scrolled = window.pageYOffset;
    hero.style.transform = `translateY(${scrolled * 0.4}px)`;
  }
});

/**
 * Lazy loading for images
 */
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}
