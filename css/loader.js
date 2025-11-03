// js/loader.js (robust)
(() => {
  const cfg = {
    minShowMs: 500,
    maxShowMs: 6000,
    autoHideOnLoad: true,
    rings: [
      { radius: 60, count: 28, speed: 0.9, charProb: 0.92 },
      { radius: 110, count: 40, speed: -0.6, charProb: 0.95 },
      { radius: 170, count: 56, speed: 0.4, charProb: 0.88 }
    ],
    accentColor: 'rgba(124,92,255,0.98)'
  };

  // Wait until DOM exists (safe even if script is deferred)
  function onDomReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onDomReady(() => {
    const root = document.getElementById('site-loader');
    const canvas = document.getElementById('loader-canvas');
    const bar = document.getElementById('loader-bar');
    const skip = document.getElementById('loader-skip');
    if (!root || !canvas) {
      console.warn('Loader: missing DOM nodes.');
      return;
    }

    // ensure root styles trump other CSS
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '2147483000';
    root.style.pointerEvents = 'auto';

    const ctx = canvas.getContext('2d');
    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = Math.max(320, window.innerWidth);
    let H = Math.max(240, window.innerHeight);

    function setSize() {
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
    setSize();
    window.addEventListener('resize', setSize);

    // prepare rings
    const rings = cfg.rings.map(r => {
      const items = [];
      for (let i = 0; i < r.count; i++) {
        items.push({ angle: (i / r.count) * Math.PI * 2, char: Math.random() > 0.5 ? '0' : '1' });
      }
      return { radius: r.radius, speed: r.speed, items, charProb: r.charProb };
    });

    // draw frame
    let raf = null;
    let startTs = performance.now();
    function frame(now) {
      const t = now - startTs;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(0,0,W,DPR ? H : H); // background trail
      const cx = W / (2 * DPR);
      const cy = H / (2 * DPR) - 20;

      for (let ri = 0; ri < rings.length; ri++) {
        const ring = rings[ri];
        const fontSize = Math.max(10, Math.min(22, ring.radius / 7));
        ctx.font = `bold ${fontSize}px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < ring.items.length; i++) {
          const it = ring.items[i];
          it.angle += (ring.speed * 0.002) * (1 + Math.sin(t / 1200 + i));
          if (Math.random() > 0.987) it.char = Math.random() < ring.charProb ? (Math.random() > 0.5 ? '0' : '1') : String.fromCharCode(65 + Math.floor(Math.random() * 26));
          const x = cx + Math.cos(it.angle + t * 0.0006 * ring.speed) * ring.radius;
          const y = cy + Math.sin(it.angle + t * 0.0006 * ring.speed) * ring.radius;
          ctx.fillStyle = cfg.accentColor;
          ctx.shadowColor = 'rgba(90,180,255,0.12)';
          ctx.shadowBlur = 6;
          ctx.globalAlpha = 0.95 - (ri * 0.18);
          ctx.fillText(it.char, x, y);
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = '#fff';
          ctx.fillText(it.char, x + Math.cos(it.angle + 1.57) * (fontSize * 0.12), y + Math.sin(it.angle + 1.57) * (fontSize * 0.12));
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // progress & hide logic
    let finished = false;
    const startTime = Date.now();
    function setProgress(p) {
      if (bar) bar.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + '%';
    }

    function hideLoader() {
      if (finished) return;
      finished = true;
      setProgress(1);
      if (raf) cancelAnimationFrame(raf);
      root.classList.add('hidden');
      setTimeout(() => {
        try { root.style.display = 'none'; } catch(e){}
      }, 520);
    }

    // skip button
    if (skip) {
      skip.addEventListener('click', hideLoader);
    }

    // auto hide on window load
    if (cfg.autoHideOnLoad) {
      window.addEventListener('load', () => {
        // small ramp to 100
        const startRamp = Date.now();
        const rampDur = 280;
        const rI = setInterval(() => {
          const t = (Date.now() - startRamp) / rampDur;
          setProgress(Math.min(1, t));
          if (t >= 1) {
            clearInterval(rI);
            // minimum show time
            const elapsed = Date.now() - startTime;
            const wait = Math.max(0, cfg.minShowMs - elapsed);
            setTimeout(hideLoader, wait);
          }
        }, 30);
      }, { once: true });
    }

    // ensure fallback hide
    setTimeout(() => { hideLoader(); }, cfg.maxShowMs);

    // expose manual hide
    window.__siteLoader = { hide: hideLoader };
  });
})();
