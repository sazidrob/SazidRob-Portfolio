// app.js - theme, nav behavior, and content helpers
(function(){
  const site = document.getElementById('site');
  const themeToggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') || 'dark';
  site.setAttribute('data-theme', saved);
  themeToggle.setAttribute('aria-pressed', saved === 'light');
  themeToggle.textContent = saved === 'light' ? '🌞 Theme' : '🌙 Theme';

  themeToggle.addEventListener('click', ()=>{
    const current = site.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    site.setAttribute('data-theme', current);
    localStorage.setItem('theme', current);
    themeToggle.setAttribute('aria-pressed', current === 'light');
    themeToggle.textContent = current === 'light' ? '🌞 Theme' : '🌙 Theme';
    if (window.app && window.app.onThemeChange) window.app.onThemeChange(current);
  });

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const href = a.getAttribute('href');
      if(href === '#') return;
      e.preventDefault();
      document.querySelector(href).scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  // Small nav hide on scroll (optional nicety)
  let lastY = window.scrollY;
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    if (y > lastY && y > 80) {
      nav.style.transform = 'translateY(-70px)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastY = y;
  });
})();
