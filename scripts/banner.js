let lastScrollTop = 0;
let firstScroll = true;

const banner = document.querySelector('.banner');
const aboutSection = document.querySelector('.about');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;

  if (scrollTop > lastScrollTop) {
    // Scrolling down
    if (firstScroll) {
      firstScroll = false;

      // Fade the banner out and disable pointer events
      banner.style.opacity = '0';
      banner.style.pointerEvents = 'none';

      // Scroll to the about section smoothly
      setTimeout(() => {
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      }, 300); // Wait for banner fade-out animation
    } else {
      // If already scrolled once, ensure the banner remains hidden
      banner.style.opacity = '0';
      banner.style.pointerEvents = 'none';
    }
  } else {
    // Scrolling up: fade the banner back in
    banner.style.opacity = '1';
    banner.style.pointerEvents = 'auto';
  }

  lastScrollTop = scrollTop;
});
