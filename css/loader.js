// js/loader.js
(() => {
  const cfg = {
    minShowMs: 600,       // minimum visible time (ms) so the animation isn't a blink
    maxShowMs: 6000,      // fail-safe: auto-hide after this many ms
    autoHideOnLoad: true, // hide when window 'load' fires
    skipButton: true      // enable Skip button
  };

  const loaderRoot = document.getElementById('site-loader');
  const canvas = document.getElementById('loader-canvas');
  const bar = document.getElementById('loader-bar');
  const skipBtn = document.getElementById('loader-skip');

  if (!loaderRoot || !canvas) return;

  // allow hiding by skip
  if (skipBtn) {
    if (!cfg.skipButton) skipBtn.style.display = 'none';
    else skipBtn.addEventListener('click', () => hideLoader(true));
  }

  // canvas setup
  const ctx = canvas.getContext('2d');
  let w = canvas.width = Math.max(300, window.innerWidth);
  let h = canvas.height = Math.max(200, window.innerHeight);

  // columns for "rain"
  const fontSize = Math.floor(Math.max(10, Math.min(18, w / 80)));
  const columns = Math.floor(w / fontSize);
  const drops = new Array(columns).fill(0).map(() => Math.random() * h);

  ctx.font = `${fontSize}px monospace`;

  // draw binary rain frame
  function draw() {
    // translucent black to create trailing effect
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < columns; i++) {
      const x = i * fontSize;
      // choose 0/1 randomly, add occasional letters to look cooler
      const char = Math.random() > 0.08 ? (Math.random() > 0.5 ? '0' : '1') : String.fromCharCode(65 + Math.floor(Math.random() * 26));
      // glow style
      ctx.fillStyle = 'rgba(120,100,255,0.96)'; // main color
      ctx.fillText(char, x, drops[i]);
      // faint lighter head
      ctx.fillStyle = 'rgba(180,220,255,0.75)';
      ctx.fillText(char, x, drops[i] - fontSize / 3);

      drops[i] += fontSize + (Math.random() * 6);
      if (drops[i] > h + Math.random() * 1000) drops[i] = -Math.random() * h;
    }
  }

  // resize handler
  function onResize() {
    w = canvas.width = Math.max(300, window.innerWidth);
    h = canvas.height = Math.max(200, window.innerHeight);
    const newFont = Math.floor(Math.max(10, Math.min(18, w / 80)));
    ctx.font = `${newFont}px monospace`;
    // recalcul columns
    const newColumns = Math.floor(w / newFont) || 1;
    while (drops.length < newColumns) drops.push(Math.random() * h);
    while (drops.length > newColumns) drops.pop();
  }
  window.addEventListener('resize', onResize);

  let rafId = null;
  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }
  loop();

  // progress simulation: uses window load event to finish quick, otherwise is time-based
  let startTime = Date.now();
  let loaded = false;
  let finished = false;

  function updateProgress(p) {
    if (!bar) return;
    const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
    bar.style.width = pct + '%';
  }

  // listen for real load
  if (cfg.autoHideOnLoad) {
    window.addEventListener('load', () => {
      loaded = true;
      // ramp progress to 100 smoothly
      const rampStart = Date.now();
      const ramp = setInterval(() => {
        const t = (Date.now() - rampStart) / 350;
        const cur = Math.min(1, (Date.now() - startTime) / cfg.maxShowMs);
        updateProgress( Math.min(1, cur + t * (1 - cur)) );
        if (t >= 1) {
          clearInterval(ramp);
          hideLoader(false);
        }
      }, 40);
    }, { passive: true });
  }

  // fallback: if nothing else happens, hide after maxShowMs
  const fallbackTimer = setTimeout(() => {
    if (!finished) hideLoader(false);
  }, cfg.maxShowMs);

  // ensure minimum show time and then remove
  function hideLoader(forceSkip) {
    if (finished) return;
    finished = true;
    // stop animation
    if (rafId) cancelAnimationFrame(rafId);
    // set progress to full
    updateProgress(1);
    // wait for minShowMs if necessary
    const elapsed = Date.now() - startTime;
    const wait = Math.max(0, cfg.minShowMs - elapsed);
    setTimeout(() => {
      loaderRoot.classList.add('hidden');
      // wait for the css fade
      setTimeout(() => {
        // fully remove from DOM after fade
        try {
          loaderRoot.style.display = 'none';
          // cleanup listeners
          window.removeEventListener('resize', onResize);
        } catch (e) {}
      }, 480);
    }, wait);
  }

  // also allow double-click on overlay to skip (power user)
  loaderRoot.addEventListener('dblclick', () => hideLoader(true));

  // initial progress ramp while loading
  (function progressTick() {
    if (finished) return;
    const elapsed = Date.now() - startTime;
    const t = Math.min(1, elapsed / cfg.maxShowMs);
    // ease-out progression so it starts quick then slows until real 'load' finishes
    const progress = Math.pow(t, 0.6);
    updateProgress(progress);
    setTimeout(progressTick, 120);
  })();
})();
