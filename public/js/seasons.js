/**
 * Season Selector - Enhanced Theme Switching
 * Handles: season pill UI, hero crossfade, smooth transitions
 */
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('seasonSelector');
  const mobileSelector = document.getElementById('navSeasonMobile');
  const pills = selector ? selector.querySelectorAll('.season-pill') : [];
  const mobileBtns = mobileSelector ? mobileSelector.querySelectorAll('.nav-season-btn') : [];
  const allBtns = [...pills, ...mobileBtns];
  const body = document.body;
  let isTransitioning = false;

  // Restore saved season or auto-detect for mobile
  const saved = sessionStorage.getItem('selectedSeason');
  if (saved) {
    applySeason(saved, false);
    allBtns.forEach(p => {
      p.classList.toggle('active', p.dataset.season === saved);
    });
  } else if (window.innerWidth <= 768) {
    const autoSeason = getSeasonFromMonth();
    applySeason(autoSeason, false);
    allBtns.forEach(p => {
      p.classList.toggle('active', p.dataset.season === autoSeason);
    });
  }

  // Handle clicks on both desktop pills and mobile buttons
  allBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isTransitioning) return;
      const season = btn.dataset.season;
      if (season === body.getAttribute('data-season')) return;

      allBtns.forEach(p => p.classList.remove('active'));
      allBtns.forEach(p => {
        if (p.dataset.season === season) p.classList.add('active');
      });

      applySeason(season, true);
      sessionStorage.setItem('selectedSeason', season);
    });
  });

  /**
   * Apply season change
   * @param {string} season - spring|summer|fall|winter
   * @param {boolean} animate - whether to use crossfade transition
   */
  function applySeason(season, animate) {
    body.setAttribute('data-season', season);
    if (animate) {
      isTransitioning = true;
      setTimeout(() => { isTransitioning = false; }, 800);
    }
  }

  /**
   * Auto-detect season from current month
   */
  function getSeasonFromMonth() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

});
