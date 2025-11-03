// js/alert.js
(() => {
  // -------- CONFIGURE THIS --------
  const cfg = {
    message: "Welcome — explore my research, projects, and contact info. Enjoy.",
    showOnce: true,        // true => hide for `hideForDays` after closing
    hideForDays: 7,        // days to hide after user closes (if showOnce)
    type: "modal",         // "modal" or "toast"
    autoClose: 0           // seconds. 0 disables auto-close
  };
  // --------------------------------

  const STORAGE_KEY = 'site_alert_closed_at';

  function daysBetween(ts) {
    return (Date.now() - ts) / (1000 * 60 * 60 * 24);
  }

  if (cfg.showOnce) {
    try {
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev) {
        const t = parseInt(prev, 10);
        if (!isNaN(t) && daysBetween(t) < cfg.hideForDays) return; // don't show
      }
    } catch (e) { /* ignore storage errors */ }
  }

  // Create DOM (modal or toast)
  const root = document.createElement('div');
  root.className = 'site-alert-root ' + (cfg.type === 'toast' ? 'site-alert-toast' : 'site-alert-modal');
  root.innerHTML = `
    <div class="site-alert-overlay" data-role="overlay" hidden></div>
    <div class="site-alert-panel" role="dialog" aria-modal="true" aria-label="Site message" hidden>
      <div class="site-alert-content">
        <div class="site-alert-text">${cfg.message}</div>
        <div class="site-alert-actions">
          <button class="site-alert-btn site-alert-close">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const overlay = root.querySelector('.site-alert-overlay');
  const panel = root.querySelector('.site-alert-panel');
  const closeBtn = root.querySelector('.site-alert-close');

  // Accessibility: keep track of previously focused element to restore focus
  let prevFocus = null;

  function open() {
    prevFocus = document.activeElement;
    if (cfg.type === 'modal') {
      overlay.hidden = false;
      panel.hidden = false;
      overlay.style.opacity = '0';
      panel.style.opacity = '0';
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        panel.style.opacity = '1';
      });
      panel.setAttribute('tabindex', '-1');
      panel.focus();
      trapFocus(panel);
    } else {
      // toast
      panel.hidden = false;
      panel.style.transform = 'translateY(18px)';
      panel.style.opacity = '0';
      requestAnimationFrame(() => {
        panel.style.transform = 'translateY(0)';
        panel.style.opacity = '1';
      });
    }

    if (cfg.autoClose && Number(cfg.autoClose) > 0) {
      setTimeout(close, cfg.autoClose * 1000);
    }
  }

  function close() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
    if (cfg.type === 'modal') {
      overlay.style.opacity = '0';
      panel.style.opacity = '0';
      setTimeout(() => {
        overlay.hidden = true;
        panel.hidden = true;
        cleanup();
      }, 220);
    } else {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(18px)';
      setTimeout(() => {
        panel.hidden = true;
        cleanup();
      }, 220);
    }
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  }

  function cleanup() {
    // optional: remove DOM or keep it for future shows (we leave it)
  }

  // Escape closes modal
  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  // Basic focus trap for modal panel
  function trapFocus(container) {
    const focusable = container.querySelectorAll('a,button,input,textarea,[tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;

    let first = focusable[0];
    let last = focusable[focusable.length - 1];

    function keyHandler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    container.addEventListener('keydown', keyHandler);
    // store so we can remove later if desired (not strictly necessary here)
  }

  // Wire events
  closeBtn.addEventListener('click', () => close());
  if (overlay) overlay.addEventListener('click', () => close());
  document.addEventListener('keydown', onKey);

  // Slight delay so page paint completes
  setTimeout(open, 500);
})();
