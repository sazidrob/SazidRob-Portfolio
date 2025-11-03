const site=document.getElementById('site');const btn=document.getElementById('themeToggle');
const saved=localStorage.getItem('theme')||'dark';site.setAttribute('data-theme',saved);
btn.textContent=saved==='light'?'🌞 Theme':'🌙 Theme';
btn.addEventListener('click',()=>{const c=site.getAttribute('data-theme')==='light'?'dark':'light';
site.setAttribute('data-theme',c);localStorage.setItem('theme',c);
btn.textContent=c==='light'?'🌞 Theme':'🌙 Theme';});

document.addEventListener('DOMContentLoaded', () => {
  // If three-scene exposed navigate function, let nav anchors call it
  if (window.__threeNav) {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          window.__threeNav.navigateToSection(href);
        }
      });
    });
  }
});
