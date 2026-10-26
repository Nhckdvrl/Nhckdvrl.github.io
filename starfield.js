/* Static vanilla adaptation of Magic UI Particles (MIT).
 * Copyright (c) Magic UI. See assets/vendor/magicui/LICENSE.md.
 * Source snapshot: assets/vendor/magicui/particles.tsx.
 * Adaptations: no React, animation loop, mouse magnetism, or runtime dependency;
 * responsive density and smaller particles for an unobtrusive reading backdrop.
 */
(() => {
  'use strict';
  const canvas = document.querySelector('[data-starfield]');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  let resizeTimeout;
  const hexToRgb = (hex) => {
    const value = parseInt(hex.replace('#', ''), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };
  const rgb = hexToRgb('#d4e4f6');
  const drawParticles = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, w, h);
    const quantity = Math.min(190, Math.max(48, Math.round(w * h / 6200)));
    for (let i = 0; i < quantity; i++) {
      const x = Math.floor(Math.random() * w);
      const y = Math.floor(Math.random() * h);
      const size = (Math.floor(Math.random() * 2) + 0.4) * 0.65;
      const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
      const closestEdge = Math.min(x - size, w - x - size, y - size, h - y - size);
      const alpha = targetAlpha * Math.max(0, Math.min(1, closestEdge / 20));
      context.beginPath();
      context.arc(x, y, size, 0, 2 * Math.PI);
      context.fillStyle = `rgba(${rgb.join(', ')}, ${alpha})`;
      context.fill();
    }
  };
  drawParticles();
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(drawParticles, 200);
  }, { passive: true });
})();
