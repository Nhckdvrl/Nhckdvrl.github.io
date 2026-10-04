// The reading experience is independent of the optional companion.
const dock = document.querySelector('.pet-dock');
const show = document.querySelector('.pet-show');
const play = document.querySelector('.pet-play');
const motion = document.querySelector('.pet-motion');
const status = document.querySelector('.pet-status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let companion, loading, hidden = false, paused = reduced.matches;
try { hidden = sessionStorage.getItem('fishcat-hidden') === '1'; } catch {}
function announce(text) { status.textContent = text; }
function updateMotion() {
  motion.textContent = paused ? '▷' : 'Ⅱ';
  motion.setAttribute('aria-label', paused ? 'Resume fish-cat animation' : 'Pause fish-cat animation');
  motion.title = paused ? 'Resume animation' : 'Pause animation';
  companion?.setPaused(paused || hidden);
}
async function load() {
  if (loading || companion || hidden) return;
  loading = true;
  try {
    const { createFishCat } = await import('./fish-cat.js?v=fishcat1');
    companion = createFishCat(play, { paused: paused || hidden, onHello: () => announce('The fish-cat says hello!') });
    dock.dataset.ready = 'true';
    updateMotion();
  } catch (error) {
    // WebGL unavailable, disabled, or lost: keep the lightweight illustration.
    dock.dataset.ready = 'false';
    motion.hidden = true;
    play.title = 'Say hello to the fish-cat';
    play.addEventListener('click', () => announce('The fish-cat says hello!'));
    console.info('Fish-cat: showing the static companion.', error.message);
  }
}
function setHidden(value) {
  hidden = value;
  dock.hidden = value;
  show.hidden = !value;
  try { sessionStorage.setItem('fishcat-hidden', value ? '1' : '0'); } catch {}
  updateMotion();
  if (!value) load();
}
dock.querySelector('.pet-hide').addEventListener('click', () => { setHidden(true); show.focus({ preventScroll: true }); });
show.addEventListener('click', () => { setHidden(false); play.focus({ preventScroll: true }); });
motion.addEventListener('click', () => { paused = !paused; updateMotion(); });
reduced.addEventListener('change', event => { paused = event.matches; updateMotion(); });
document.addEventListener('visibilitychange', () => companion?.setPaused(paused || hidden || document.hidden));
dock.hidden = hidden;
show.hidden = !hidden;
updateMotion();
if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 2000 });
else setTimeout(load, 350);
