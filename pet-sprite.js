// Original Pearlfin artwork, animated from lossless sprite strips. No WebGL.
const CELL = { width: 192, height: 208 };
const TIMING = {
  idle: [1050, 400, 110, 140, 400, 900], // 3-second breathing/blink cycle
  wave: [230, 220, 280, 270],
  jump: [140, 130, 180, 150, 200],
};
const ASSETS = new URL('./assets/pearlfin/', import.meta.url);

export function lookDirection(dx, dy) {
  return Math.round((Math.atan2(dx, -dy) + Math.PI * 2) / (Math.PI / 8)) % 16;
}

export function createSpritePet(doc = document, win = window) {
  const dock = doc.querySelector('.pet-dock');
  const show = doc.querySelector('.pet-show');
  if (!dock || !show) return null;
  const play = dock.querySelector('.pet-play');
  const hide = dock.querySelector('.pet-hide');
  const motion = dock.querySelector('.pet-motion');
  const status = dock.querySelector('.pet-status');
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = doc.createElement('canvas');
  canvas.width = CELL.width;
  canvas.height = CELL.height;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  const cache = new Map();
  const failed = new Set();
  const removers = [];
  let hidden = false;
  let paused = reduced.matches;
  let visible = !win.IntersectionObserver;
  let destroyed = false;
  let timer = null;
  let epoch = 0;
  let kind = 'neutral';
  let lastGesture = -Infinity;
  let lastLook = -Infinity;
  let lastDirection = -1;
  let observer;
  try { hidden = win.sessionStorage.getItem('fishcat-hidden') === '1'; } catch { /* Private browsing. */ }

  const on = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    removers.push(() => target.removeEventListener(event, handler, options));
  };
  const announce = text => { status.textContent = text; };
  const allowed = () => !destroyed && !!ctx && !hidden && !paused && visible && !doc.hidden;
  function cancel() {
    epoch += 1;
    if (timer !== null) win.clearTimeout(timer);
    timer = null;
  }
  function neutral() {
    kind = 'neutral';
    dock.dataset.ready = 'false';
    dock.dataset.state = 'neutral';
  }
  function draw(image, frame, name) {
    ctx.clearRect(0, 0, CELL.width, CELL.height);
    ctx.drawImage(image, frame * CELL.width, 0, CELL.width, CELL.height, 0, 0, CELL.width, CELL.height);
    dock.dataset.ready = 'true';
    dock.dataset.state = name;
    dock.dataset.frame = String(frame);
  }
  function load(name) {
    if (failed.has(name)) return Promise.reject(new Error('Sprite unavailable'));
    if (!cache.has(name)) {
      const image = new win.Image();
      const promise = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => { failed.add(name); reject(new Error('Sprite unavailable')); };
        image.src = new URL(`${name}.webp`, ASSETS).href;
      });
      cache.set(name, promise);
    }
    return cache.get(name);
  }
  function sequence(name) {
    cancel();
    lastDirection = -1;
    if (!allowed()) { neutral(); return; }
    const ticket = epoch;
    kind = name;
    load(name).then(image => {
      if (ticket !== epoch || !allowed()) return;
      let frame = 0;
      const step = () => {
        if (ticket !== epoch || !allowed()) return;
        draw(image, frame, name);
        const delay = TIMING[name][frame];
        frame += 1;
        timer = win.setTimeout(() => {
          timer = null;
          if (frame < TIMING[name].length) step();
          else if (name === 'idle') { frame = 0; step(); }
          else sequence('idle');
        }, delay);
      };
      step();
    }).catch(() => {
      if (ticket !== epoch) return;
      neutral();
      if (name !== 'idle' && allowed()) sequence('idle');
    });
  }
  function reconcile() {
    cancel();
    neutral();
    dock.hidden = hidden;
    show.hidden = !hidden;
    motion.textContent = paused ? '▷' : 'Ⅱ';
    motion.setAttribute('aria-label', paused ? 'Resume Pearlfin animation' : 'Pause Pearlfin animation');
    motion.title = paused ? 'Resume animation' : 'Pause animation';
    play.title = paused ? 'Say hello to Pearlfin · animation paused' : 'Click to say hello · click again to jump';
    if (allowed()) sequence('idle');
  }
  function setHidden(value) {
    hidden = value;
    dock.hidden = value;
    if (!value && !win.IntersectionObserver) visible = inViewport();
    try { win.sessionStorage.setItem('fishcat-hidden', value ? '1' : '0'); } catch { /* Optional preference. */ }
    reconcile();
  }
  function hello() {
    const now = win.performance.now();
    const jump = now - lastGesture < 650 || kind === 'wave';
    lastGesture = now;
    announce(!allowed() ? 'Pearlfin says hello! Animation is paused.' : jump ? 'Pearlfin does a happy little jump!' : 'Pearlfin says hello!');
    if (allowed()) sequence(jump ? 'jump' : 'wave');
  }
  on(play, 'click', hello); // Native button supports Enter, Space, and touch.
  on(play, 'keydown', event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); });
  on(hide, 'click', () => { setHidden(true); show.focus({ preventScroll: true }); });
  on(show, 'click', () => { setHidden(false); play.focus({ preventScroll: true }); });
  on(motion, 'click', () => {
    paused = !paused;
    reconcile();
    announce(paused ? 'Pearlfin animation paused.' : 'Pearlfin animation resumed.');
  });
  on(doc, 'visibilitychange', reconcile);
  on(win, 'pagehide', () => { visible = false; reconcile(); });
  on(win, 'pageshow', () => { visible = inViewport(); reconcile(); });
  const mediaChange = event => { paused = event.matches; reconcile(); };
  if (reduced.addEventListener) on(reduced, 'change', mediaChange);
  else { reduced.addListener(mediaChange); removers.push(() => reduced.removeListener(mediaChange)); }
  function inViewport() {
    const rect = dock.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < win.innerHeight && rect.right > 0 && rect.left < win.innerWidth;
  }
  if (win.IntersectionObserver) {
    observer = new win.IntersectionObserver(entries => {
      const next = entries[0]?.isIntersecting ?? false;
      if (next !== visible) { visible = next; reconcile(); }
    }, { threshold: 0 });
    observer.observe(dock);
  } else {
    visible = inViewport();
    const checkVisible = () => { const next = inViewport(); if (next !== visible) { visible = next; reconcile(); } };
    on(win, 'scroll', checkVisible, { passive: true });
    on(win, 'resize', checkVisible, { passive: true });
  }
  // Look poses load only while a mouse is over the companion, at most 12 times/s.
  on(play, 'pointermove', event => {
    if (event.pointerType !== 'mouse' || !allowed() || kind === 'wave' || kind === 'jump') return;
    const now = win.performance.now();
    if (now - lastLook < 85) return;
    const rect = play.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    if (Math.hypot(dx, dy) < rect.width * .12) return;
    const direction = lookDirection(dx, dy);
    if (direction === lastDirection) return;
    lastLook = now;
    lastDirection = direction;
    cancel();
    kind = 'look';
    const ticket = epoch;
    const name = direction < 8 ? 'look-up' : 'look-down';
    load(name).then(image => {
      if (ticket === epoch && allowed()) draw(image, direction % 8, 'look');
    }).catch(() => { if (ticket === epoch) sequence('idle'); });
  });
  on(play, 'pointerleave', () => { if (kind === 'look') sequence('idle'); });
  if (ctx) play.append(canvas);
  motion.hidden = !ctx;
  hide.hidden = false;
  play.disabled = false;
  dock.dataset.enhanced = 'true';
  reconcile();
  return {
    destroy() {
      destroyed = true;
      cancel();
      observer?.disconnect();
      removers.forEach(remove => remove());
      neutral();
      canvas.remove();
    },
  };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') createSpritePet();
