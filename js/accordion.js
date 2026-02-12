/**
 * Accordion (FAQ) functionality
 */
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.accordion-item');

  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all items
      items.forEach(i => i.classList.remove('active'));

      // Open clicked item if it wasn't already open
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
});
