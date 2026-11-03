// The site works without JavaScript; this only layers on motion and small details.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sections fade in as they enter the viewport.
  const items = document.querySelectorAll('.reveal');
  if (!reduce && items.length && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((item) => observer.observe(item));
  }

  // Pointer position drives the soft spotlight on cards.
  document.querySelectorAll('.card, .blog-row, .project-case').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });

  // A highlight glides between navigation links and rests on the current page.
  const nav = document.querySelector('.nav-shell nav');
  if (nav) {
    const links = [...nav.querySelectorAll('a')];
    const current = nav.querySelector('a.active');
    const glider = document.createElement('span');
    glider.className = 'nav-glider';
    glider.setAttribute('aria-hidden', 'true');
    nav.prepend(glider);
    nav.classList.add('has-glider');
    const moveTo = (link) => {
      if (!link) { glider.style.opacity = '0'; return; }
      glider.style.opacity = '1';
      glider.style.width = `${link.offsetWidth}px`;
      glider.style.transform = `translate(${link.offsetLeft}px, ${link.offsetTop + (link.offsetHeight - 36) / 2}px)`;
    };
    const rest = () => moveTo(current);
    links.forEach((link) => {
      link.addEventListener('pointerenter', () => moveTo(link));
      link.addEventListener('focus', () => moveTo(link));
    });
    nav.addEventListener('pointerleave', rest);
    nav.addEventListener('focusout', (event) => { if (!nav.contains(event.relatedTarget)) rest(); });
    // On narrow screens the row scrolls; keep the current page in view.
    if (current && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
    }
    // Place without animating, then enable transitions.
    glider.style.transition = 'none';
    rest();
    requestAnimationFrame(() => requestAnimationFrame(() => { glider.style.transition = ''; }));
    window.addEventListener('resize', rest, { passive: true });
    document.fonts?.ready.then(rest);
  }

  // The bar settles into a firmer surface once the page scrolls, and long
  // articles show reading progress.
  const header = document.querySelector('.nav-shell');
  const progress = document.querySelector('.read-progress');
  const article = document.querySelector('.latent-prose');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const scrolled = window.scrollY > 12;
    header?.classList.toggle('is-scrolled', scrolled);
    document.documentElement.classList.toggle('is-scrolled', scrolled);
    if (progress && article) {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const ratio = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      progress.style.setProperty('--progress', ratio.toFixed(4));
    }
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Day / night switch. The choice is remembered; without a choice the site stays at night.
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    const next = theme === 'day' ? 'night' : 'day';
    if (toggle) {
      toggle.setAttribute('aria-label', `Switch to ${next} mode`);
      toggle.title = `Switch to ${next} mode`;
    }
    themeColor?.setAttribute('content', theme === 'day' ? '#f4f1ea' : '#0e1623');
  };
  if (toggle) {
    applyTheme(root.dataset.theme === 'day' ? 'day' : 'night');
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const theme = root.dataset.theme === 'day' ? 'night' : 'day';
      try { localStorage.setItem('xd-theme', theme); } catch (error) { /* private mode: switch for this page only */ }
      if (reduce || !document.startViewTransition) { applyTheme(theme); return; }
      // The new theme spreads out from the button as a widening circle.
      const rect = toggle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('theme-switching');
      const transition = document.startViewTransition(() => applyTheme(theme));
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      }).catch(() => {});
      transition.finished.finally(() => root.classList.remove('theme-switching'));
    });
  }

  // Local time in Nagoya, shown in the footer.
  const clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false });
    const tick = () => clocks.forEach((clock) => { clock.textContent = `${format.format(new Date())} JST`; });
    tick();
    window.setInterval(tick, 30000);
  }
})();
