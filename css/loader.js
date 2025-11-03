// js/loader.js
(() => {
  const cfg = {
    minShowMs: 500,      // don't vanish immediately
    maxShowMs: 6000,     // force-hide after this
    autoHideOnLoad: true,
    rings: [
      { radius: 60, count: 28, speed: 0.9, charProb: 0.92 },   // inner ring
      { radius: 110, count: 40, speed: -0.6, charProb: 0.95 }, // middle ring
      { radius: 170, count: 56, speed: 0.4, charProb: 0.88 }   // outer ring
    ],
    accentColor: 'rgba(124,92,255,0.98)'
  };

  const root = document.getElementById('site-loader');
  const canvas = document.getElementById('loader-canvas');
  const bar = document.getElementById('loader-bar');
  const skip = document.getElementById('loader-skip');
  if (!root || !canvas) return;

  // Canvas setup
  const ctx = canvas.getContext('2d');
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = Math.max(320, window.innerWidth);
  let H = Math.max(240, window.innerHeight);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(DPR, DPR);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // ring data: for each ring create items with angle and char
  const rings = cfg.rings.map(r => {
    const items = [];
    for (let i = 0; i < r.count; i++) {
      const angle = (i / r.count) * Math.PI * 2;
      // initial char is 0 or 1; charProb controls chance of binary vs letter
      items.push({
        angle,
        char: Math.random() > 0.5 ? '0' : '1',
        flicker: Math.random() * 1000
      });
    }
    return {
      radius: r.radius,
      speed: r.speed,
      items,
      charProb: r.charProb
    };
  });

  // drawing parameters
  function updateCanvasSize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, window.innerWidth);
    H = Math.max(240, window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);
  }
  window.addEventListener('resize', () => {
    updateCanvasSize();
  });

  // char drawing style
  function drawRing(cx, cy, ring, time) {
    const fontSize = Math.max(10, Math.min(22, ring.radius / 7));
    ctx.font = `bold ${fontSize}px ui-monospace, monospace`;

    for (let i = 0; i < ring.items.length; i++) {
      const it = ring.items[i];
      // rotate item
      it.angle += (ring.speed * 0.002) * (1 + Math.sin(time / 1200 + i));
      // occasional char flip
      if (Math.random() > 0.985) {
        it.char = Math.random() < ring.charProb ? (Math.random() > 0.5 ? '0' : '1') : String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
      // position
      const x = cx + Math.cos(it.angle + time * 0.0006 * ring.speed) * ring.radius;
      const y = cy + Math.sin(it.angle + time * 0.0006 * ring.speed) * ring.radius;

      // depth effect: outer rings dimmer
      const depth = ring.radius / (cfg.rings[cfg.rings.length - 1].radius);
      const alpha = 0.55 + (0.6 * (1 - depth));
      // glow
      ctx.fillStyle = cfg.accentColor;
      ctx.shadowColor = 'rgba(90,180,255,0.18)';
      ctx.shadowBlur = 6 * (1 - depth) + 2;
      ctx.globalAlpha = alpha;
      ctx.fillText(it.char, x, y);

      // tiny brighter head for motion
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.globalAlpha = alpha * 0.17;
      ctx.fillText(it.char, x + Math.cos(it.angle + 1.57) * (fontSize * 0.15), y + Math.sin(it.angle + 1.57) * (fontSize * 0.15));

      ctx.shadowBlur = 0;
    }
  }

  // animate
  let raf = null;
  let start = performance.now();
  function frame(now) {
    const t = now - start;
    // clear
    ctx.clearRect(0, 0, W, H);
    // subtle background vignette
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, W, H);

    // center
    const cx = W / (2 * DPR);
    const cy = H / (2 * DPR) - 20;

    // draw rings - inner to outer
    for (let i = 0; i < rings.length; i++) drawRing(cx, cy, rings[i], now);

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // progress logic
  let startTime = Date.now();
  let finished = false;
  function setProgress(p) {
    const pct = Math.max(0, Math.min(1, p));
    if (bar) bar.style.width = Math.round(pct * 100) + '%';
  }

  // handle window load
  if (cfg.autoHideOnLoad) {
    window.addEventListener('load', () => {
      // speed progress quickly to 100, then hide
      const rampStart = Date.now();
      const rampDur = 320;
      const ramp = setInterval(() => {
        const r = (Date.now() - rampStart) / rampDur;
        setProgress(Math.min(1, r));
        if (r >= 1) {
          clearInterval(ramp);
          hideLoader();
        }
      }, 30);
    }, { once: true });
  }

  // fallback hide after maxShowMs
  const fallback = setTimeout(() => { if (!finished) hideLoader(); }, cfg.maxShowMs);

  // Skip button
  if (skip) {
    skip.addEventListener('click', () => hideLoader(true));
    skip.addEventListener('keydown', (e) => { if (e.key === 'Enter') hideLoader(true); });
  }

  // Hide loader function
  function hideLoader(force) {
    if (finished) return;
    finished = true;
    // ensure progress shows full
    setProgress(1);
    // stop animation loop
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(fallback);

    const elapsed = Date.now() - startTime;
    const wait = Math.max(0, cfg.minShowMs - elapsed);
    setTimeout(() => {
      root.classList.add('hidden');
      // leave DOM for safety; remove after animation
      setTimeout(() => {
        try {
          root.style.display = 'none';
        } catch (e) {}
      }, 520);
    }, wait);
  }

  // also allow double-click to skip
  root.addEventListener('dblclick', () => hideLoader(true));

  // initial gentle progress tick
  (function tick() {
    if (finished) return;
    // progress grows slowly until load -> gives feeling of work
    const elapsed = Date.now() - startTime;
    const p = Math.min(0.92, Math.pow(elapsed / cfg.maxShowMs, 0.7));
    setProgress(p);
    setTimeout(tick, 120);
  })();

  // expose a manual hide hook if you want to hide from other scripts:
  window.__siteLoader = {
    hide: () => hideLoader(true)
  };
})();
