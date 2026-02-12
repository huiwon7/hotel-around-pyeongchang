/**
 * Season Selector - Theme Switching
 */
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('seasonSelector');
  if (!selector) return;

  const pills = selector.querySelectorAll('.season-pill');

  // Restore saved season
  const saved = sessionStorage.getItem('selectedSeason');
  if (saved) {
    document.body.setAttribute('data-season', saved);
    pills.forEach(p => {
      p.classList.toggle('active', p.dataset.season === saved);
    });
  }

  // Handle pill clicks
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const season = pill.dataset.season;
      document.body.setAttribute('data-season', season);
      sessionStorage.setItem('selectedSeason', season);

      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
});
