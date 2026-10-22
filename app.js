/**
 * AgentGuard.io - Interactive UI Logic
 * - Reading Progress Bar
 * - Active ScrollSpy for Header & Sidebar TOC
 * - Mobile Navigation Menu Toggle
 * - Back to Top Button
 */

document.addEventListener('DOMContentLoaded', () => {
  // Enforce dark mode and clean up any legacy theme preference
  try {
    localStorage.removeItem('agentguard-theme');
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
  document.body.classList.remove('light-theme');
  document.body.classList.add('dark-theme');

  initReadingProgressBar();
  initScrollSpy();
  initMobileMenu();
  initBackToTop();
});

/**
 * 1. Reading Progress Bar
 */
function initReadingProgressBar() {
  const progressBar = document.getElementById('reading-progress-bar');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    const progress = (window.scrollY / totalHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

/**
 * 3. ScrollSpy for Top Nav and Sticky TOC
 */
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-desktop .nav-link');
  const tocLinks = document.querySelectorAll('.toc-list a');
  const sections = document.querySelectorAll('article[id], section[id]');

  if (!sections.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-80px 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        // Update Header Main Part Links
        if (id.startsWith('part-') || id === 'post-intro') {
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }

        // Update TOC Links
        tocLinks.forEach(tocLink => {
          if (tocLink.getAttribute('href') === `#${id}`) {
            tocLink.classList.add('active');
          } else {
            // Only remove if it's the specific match
            if (tocLink.getAttribute('href').replace('#', '') === id) {
              tocLink.classList.remove('active');
            }
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/**
 * 4. Mobile Menu Toggle
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('nav-mobile');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuBtn || !mobileNav) return;

  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
    });
  });
}

/**
 * 5. Back to Top Button
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

