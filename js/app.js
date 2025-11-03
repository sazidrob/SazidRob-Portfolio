// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  // 1) Link nav anchors to three-scene navigation when available
  function safeNavigate(href) {
    if (window.__threeNav && typeof window.__threeNav.navigateToSection === 'function') {
      window.__threeNav.navigateToSection(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      safeNavigate(href);
    });
  });

  // 2) Theme toggle (simple)
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const body = document.getElementById('site');
      const cur = body.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      body.setAttribute('data-theme', next);
      // store preference
      try { localStorage.setItem('site-theme', next); } catch (e) {}
    });
    // restore
    try {
      const saved = localStorage.getItem('site-theme');
      if (saved) document.getElementById('site').setAttribute('data-theme', saved);
    } catch(e) {}
  }

  // 3) IntersectionObserver to add .visible to .card when in view
  const cards = document.querySelectorAll('.card');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) ent.target.classList.add('visible');
    });
  }, { threshold: 0.18 });
  cards.forEach(c => obs.observe(c));

});
