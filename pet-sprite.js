// Original Pearlfin artwork, animated from lossless sprite strips. No WebGL.
const CELL = { width: 192, height: 208 };
const TIMING = {
  idle: { frames: [0, 1, 2, 3, 4, 5], delays: [1100, 390, 100, 110, 450, 850] },
  wave: { frames: [0, 1, 2, 1, 2, 1, 3], delays: [180, 130, 130, 130, 130, 150, 350] },
  jump: { frames: [0, 1, 2, 3, 4], delays: [130, 140, 190, 160, 220] },
};
const NEUTRAL_LOOK = 2;
const LOOK_DELAY = 150;
const LOOK_STEP = 80;
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
  let lookDebounce = null;
  let pendingLook = -1;
  let lookPosition = NEUTRAL_LOOK;
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
    if (lookDebounce !== null) win.clearTimeout(lookDebounce);
    lookDebounce = null;
    pendingLook = -1;
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
    lookPosition = NEUTRAL_LOOK;
    if (!allowed()) { neutral(); return; }
    const ticket = epoch;
    kind = name;
    load(name).then(image => {
      if (ticket !== epoch || !allowed()) return;
      let frame = 0;
      const timeline = TIMING[name];
      const step = () => {
        if (ticket !== epoch || !allowed()) return;
        draw(image, timeline.frames[frame], name);
        const delay = timeline.delays[frame];
        frame += 1;
        timer = win.setTimeout(() => {
          timer = null;
          if (frame < timeline.frames.length) step();
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
    dock.dataset.motion = allowed() ? 'allowed' : 'stopped';
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
    // Let an in-flight hop finish instead of stuttering on repeated clicks.
    if (allowed() && kind !== 'jump') sequence(jump ? 'jump' : 'wave');
  }
  on(play, 'click', hello); // Native button supports Enter, Space, and touch.
  on(play, 'keydown', event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); });
  on(hide, 'click', () => { setHidden(true); show.focus({ preventScroll: true }); });
  on(show, 'click', () => { setHidden(false); play.focus(); });
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
  // Debounce passing pointers, then step only through existing adjacent poses.
  function startLook(target, returnToIdle = false) {
    cancel();
    if (!allowed()) return;
    const ticket = epoch;
    kind = 'look';
    const step = () => {
      if (ticket !== epoch || !allowed()) return;
      const distance = (target - lookPosition + 16) % 16;
      const next = distance === 0 ? target : (lookPosition + (distance <= 8 ? 1 : 15)) % 16;
      const name = next < 8 ? 'look-up' : 'look-down';
      load(name).then(image => {
        if (ticket !== epoch || !allowed()) return;
        lookPosition = next;
        draw(image, next % 8, 'look');
        if (next !== target || returnToIdle) {
          timer = win.setTimeout(() => {
            timer = null;
            if (ticket !== epoch || !allowed()) return;
            if (next === target) sequence('idle');
            else step();
          }, next === target ? 120 : LOOK_STEP);
        }
      }).catch(() => { if (ticket === epoch) sequence('idle'); });
    };
    step();
  }
  function stopLooking() {
    if (lookDebounce !== null) win.clearTimeout(lookDebounce);
    lookDebounce = null;
    pendingLook = -1;
    if (kind === 'look') startLook(NEUTRAL_LOOK, true);
  }
  on(play, 'pointermove', event => {
    if (event.pointerType !== 'mouse' || !allowed() || kind === 'wave' || kind === 'jump') return;
    const rect = play.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    if (Math.hypot(dx, dy) < rect.width * .16) { stopLooking(); return; }
    const target = lookDirection(dx, dy);
    if (target === pendingLook || (kind === 'look' && target === lookPosition)) return;
    if (lookDebounce !== null) win.clearTimeout(lookDebounce);
    pendingLook = target;
    lookDebounce = win.setTimeout(() => {
      lookDebounce = null;
      startLook(target);
    }, LOOK_DELAY);
  });
  on(play, 'pointerleave', stopLooking);
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
      dock.dataset.motion = 'stopped';
      canvas.remove();
    },
  };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') createSpritePet();
