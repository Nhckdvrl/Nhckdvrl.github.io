# Magic UI Particles

Original component: https://magicui.design/docs/components/particles
Source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/particles.tsx
Retrieved 2026-10-26. Original source and MIT license retained here.

The root starfield.js adapts its canvas particle generation, edge opacity, RGB
conversion and rendering for this static website. React hooks, mouse magnetism
and the continuous animation loop were removed. Particle size/density and the
night palette are adjusted for quiet academic reading. No runtime dependencies.

2026-10-26 compatibility repair: assets/backgrounds/magicui-stars-v1.png is a
960×720 CSS-pixel, 2× pre-render of the adapted particle renderer, using
1.0–1.9 px radii and 0.6–0.95 alpha. It is the first CSS body background layer,
so the visible stars no longer require JavaScript, canvas, masks or compositing.
The source adaptation remains in starfield.js for provenance; it is not loaded.
