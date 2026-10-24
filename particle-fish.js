/* An original procedural point study. All geometry and pigments are generated here.
   No image tracing, external artwork, libraries, tracking, or network requests. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const PALETTE = ['#0968b4', '#1689cd', '#5badd6', '#a7cedf', '#d6e6e9', '#e6b38d', '#f2c9a6', '#b7c6cb'];
  const SHAPES = [
    { kind: 'tail', bounds: [-285, -80, -115, 25], path: 'M-124-8 C-165-25-180-71-232-72 C-211-48-225-35-282-39 C-250-13-213 14-145 15 Z', count: 1450 },
    { kind: 'tail', bounds: [-280, 5, -125, 121], path: 'M-134 10 C-169 30-204 22-242 45 C-233 62-259 99-277 118 C-233 114-184 86-153 48 C-146 32-138 18-134 10 Z', count: 1550 },
    { kind: 'fin', bounds: [-26, -108, 94, -32], path: 'M84-38 C45-46 11-65-21-105 C8-106 49-95 74-73 C87-60 90-48 84-38 Z', count: 900 },
    { kind: 'fin', bounds: [-26, 33, 82, 116], path: 'M79 41 C68 81 23 105-23 112 C0 78 21 55 38 43 C56 38 74 36 79 41 Z', count: 1050 },
    { kind: 'fin', bounds: [-152, 12, -40, 86], path: 'M-43 28 C-70 43-84 71-148 84 C-128 54-104 39-85 24 Z', count: 500 },
    { kind: 'fin', bounds: [-111, -61, 73, -13], path: 'M70-37 C27-49-11-61-49-54 C-72-47-92-28-108-17 C-54-22 10-24 70-37 Z', count: 650 },
    { kind: 'body', bounds: [-145, -53, 187, 60], path: 'M186 0 C179-25 151-48 114-48 C60-50 10-31-42-22 C-85-14-117-7-141-10 L-142 12 C-104 20-75 28-30 37 C35 61 106 53 145 32 C174 20 182 10 186 0 Z', count: 4500 },
  ];
  function random(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  }
  function pigment(x, y, kind, rng) {
    // Continuous, overlapping pigment fields, not random confetti.
    const wave = Math.sin(x * .041 + y * .063) + .56 * Math.sin(x * .093 - y * .071) + .28 * Math.cos(x * .163 + y * .117);
    const spine = Math.abs(y - (7 + 13 * Math.sin((x + 80) * .015)));
    if (kind === 'body' && ((spine < 16 && wave > -.8) || (x > 115 && y < -8 && wave > .15))) return rng() < .7 ? 0 : 1;
    if (wave > .6) return rng() < .55 ? 5 : 6;
    if (wave < -.48) return rng() < .4 ? 1 : 2;
    return rng() < .4 ? 3 : (rng() < .75 ? 4 : 7);
  }
  function buildParticles(ctx, Path, density = 1) {
    const rng = random(20261024);
    const particles = [];
    for (const [part, shape] of SHAPES.entries()) {
      const outline = new Path(shape.path);
      const [x0, y0, x1, y1] = shape.bounds;
      const count = Math.round(shape.count * density);
      for (let i = 0, attempts = 0; i < count && attempts < count * 35; attempts++) {
        const x = x0 + rng() * (x1 - x0), y = y0 + rng() * (y1 - y0);
        if (!ctx.isPointInPath(outline, x, y)) continue;
        i++;
        const color = pigment(x, y, shape.kind, rng);
        particles.push({ x, y, color, part, r: .35 + rng() ** 1.5 * 1.9,
          alpha: (shape.kind === 'body' ? .28 : .16) + rng() * .48,
          flex: shape.kind === 'body' ? .45 : 1, phase: rng() * TAU });
      }
    }
    // A small dark eye, its blue iris, and a light reflection keep the form readable.
    for (let i = 0; i < 55; i++) {
      const angle = rng() * TAU, r = Math.sqrt(rng()) * 3.3;
      particles.push({ x: 151 + Math.cos(angle) * r, y: -22 + Math.sin(angle) * r,
        color: 0, part: 6, r: .45 + rng() * .8, alpha: .75, flex: 0, phase: 0 });
    }
    return particles;
  }
  function drawFish(ctx, particles, width, height, time = 0) {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 570, height / 500);
    ctx.save();
    ctx.translate(width * .56, height * .43);
    ctx.scale(scale, scale);
    ctx.rotate(-.64);
    const breathe = Math.sin(time * .55) * .45;
    for (const p of particles) {
      const tail = Math.max(0, (100 - p.x) / 380);
      const sway = (Math.sin(time * .85 + p.x * .008) - Math.sin(p.x * .008)) * tail * tail * 3;
      const flutter = Math.sin(time * 1.1 + p.phase) * p.flex * .65;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = PALETTE[p.color];
      ctx.beginPath();
      ctx.arc(p.x + flutter * .35, p.y + sway + flutter + breathe, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = .9;
    ctx.fillStyle = '#173f57';
    ctx.beginPath(); ctx.arc(151, -22 + breathe, 1.7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fdfaf4';
    ctx.beginPath(); ctx.arc(151.7, -22.9 + breathe, .65, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function createFishSprites(particles, makeCanvas, ratio = 1) {
    return SHAPES.map((shape, part) => {
      const [left, top, right, bottom] = shape.bounds;
      const x = left - 4, y = top - 4, width = right - left + 8, height = bottom - top + 8;
      const bitmap = makeCanvas(); bitmap.width = Math.ceil(width * ratio); bitmap.height = Math.ceil(height * ratio);
      const paint = bitmap.getContext('2d');
      if (!paint) return null;
      paint.scale(ratio, ratio); paint.translate(-x, -y);
      for (const p of particles) {
        if (p.part !== part) continue;
        paint.globalAlpha = p.alpha; paint.fillStyle = PALETTE[p.color];
        paint.beginPath(); paint.arc(p.x, p.y, p.r, 0, TAU); paint.fill();
      }
      if (part === 6) {
        paint.globalAlpha = .9; paint.fillStyle = '#173f57';
        paint.beginPath(); paint.arc(151, -22, 1.7, 0, TAU); paint.fill();
        paint.fillStyle = '#fdfaf4';
        paint.beginPath(); paint.arc(151.7, -22.9, .65, 0, TAU); paint.fill();
      }
      return { bitmap, x, y, width, height, ratio, part };
    });
  }
  function drawSwimmingFish(ctx, sprites, width, height, time = 0) {
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 590, height / 550);
    ctx.save();
    // The entire fish follows a slow current, while a faster wave travels
    // from its shoulders toward the tail. Fin pivots remain attached.
    ctx.translate(width * .56 + Math.sin(time * .72) * 17 * scale,
      height * .42 + Math.sin(time * .94) * 8 * scale);
    ctx.scale(scale, scale);
    ctx.rotate(-.64 + Math.sin(time * .95) * .045);
    const finPivots = { 2: [84, -38], 3: [79, 41], 4: [-43, 28], 5: [70, -37] };
    for (const sprite of sprites) {
      ctx.save();
      const pivot = finPivots[sprite.part];
      if (pivot) {
        const direction = sprite.part % 2 ? -1 : 1;
        ctx.translate(pivot[0], pivot[1]);
        ctx.rotate(Math.sin(time * 2.4) * .13 * direction);
        ctx.translate(-pivot[0], -pivot[1]);
      }
      for (let x = 0; x < sprite.width; x += 8) {
        const u = sprite.x + x, tail = Math.max(0, (110 - u) / 390);
        const wave = (Math.sin(time * 2.4 - u * .012) - Math.sin(-u * .012)) * tail * tail * 13;
        const slice = Math.min(8.25, sprite.width - x);
        ctx.drawImage(sprite.bitmap, x * sprite.ratio, 0, slice * sprite.ratio, sprite.bitmap.height,
          u, sprite.y + wave, slice, sprite.height);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // Shared by the browser and offline animation/pixel tests.
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildParticles, drawFish, createFishSprites, drawSwimmingFish };
  if (typeof document === 'undefined') return;
  const field = document.querySelector('[data-particle-fish]');
  if (!field) return;
  const canvas = field.querySelector('canvas');
  const button = field.querySelector('.fish-motion');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx || typeof Path2D === 'undefined') return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 680px)');
  const particles = buildParticles(ctx, Path2D, compact.matches ? .62 : 1);
  // Prepaint each anatomical layer once: no per-frame particle generation.
  const sprites = createFishSprites(particles, () => document.createElement('canvas'), Math.min(window.devicePixelRatio || 1, 2));
  if (sprites.some(sprite => !sprite)) return;
  let width = 0, height = 0, time = 0, last = 0, raf = 0;
  let visible = !('IntersectionObserver' in window);
  let userPaused = false;
  try { userPaused = sessionStorage.getItem('particle-fish-paused') === '1'; } catch { /* Storage is optional. */ }
  let motionOptIn = false;
  const paused = () => userPaused || (reduced.matches && !motionOptIn);
  const allowed = () => !paused() && visible && !document.hidden;
  function draw() { drawSwimmingFish(ctx, sprites, width, height, time); }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function frame(now) {
    raf = 0;
    if (!allowed()) return;
    if (!last) last = now;
    const delta = now - last;
    if (delta >= 1000 / 24) {
      time += Math.min(delta, 100) / 1000; last = now; draw();
    }
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; last = 0;
    field.dataset.motion = paused() ? 'paused' : 'playing';
    button.textContent = paused() ? '▶ Play' : 'Ⅱ Pause';
    button.setAttribute('aria-label', paused() ? 'Play particle fish animation' : 'Pause particle fish animation');
    button.setAttribute('aria-pressed', String(!paused()));
    button.disabled = false;
    button.title = reduced.matches && !motionOptIn ? 'Reduced motion is on. Play enables animation for this artwork only.' : 'Toggle particle fish animation';
    if (allowed()) raf = requestAnimationFrame(frame);
  }
  button.addEventListener('click', () => {
    const start = paused();
    userPaused = !start;
    motionOptIn = start;
    try { sessionStorage.setItem('particle-fish-paused', userPaused ? '1' : '0'); } catch { /* Storage is optional. */ }
    sync();
  });
  reduced.addEventListener('change', () => { motionOptIn = false; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { if (raf) cancelAnimationFrame(raf); raf = 0; });
  window.addEventListener('pageshow', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .02 }).observe(field);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
  field.dataset.ready = 'true';
  button.hidden = false;
  sync();
})();
