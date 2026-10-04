# Homepage fish-cat

An original, procedural 3D interpretation of the supplied white-and-pink fish-cat reference. It is loaded only by `index.html`.

- `pet.js`: deferred loading, session-level hide/show, pause and reduced-motion handling.
- `fish-cat.js`: Three.js sculpture, painted facial textures, lighting and interactions. Click or press Enter/Space to greet; drag horizontally to turn.
- `fish-cat-canvas.js`: a small software renderer for the same 3D scene if WebGL is unavailable. Uses smooth vertex lighting, curved UV mapping and a depth buffer.
- `fish-cat.svg`: final static fallback when neither rendering path can initialize.
- `pet.css`: reserved profile-column placement on small and medium screens; fixed in the empty page margin from 1420px up.

All assets are served by this site. Three.js r169 is vendored from the official npm `three@0.169.0` package; its MIT license is in `vendor/THREE-LICENSE.txt`. No runtime CDN, analytics, remote model request or build step is needed. The original supplied reference photograph is not published.

Performance: WebGL is capped near 30 fps and DPR 1.75; software rendering is capped at 8 fps and DPR 1.25. Both stop ongoing animation when the companion is hidden, outside the viewport, or the tab is backgrounded. Reduced-motion starts paused, with an explicit resume control. Geometry is intentionally small and self-contained. Private browsing or unavailable sessionStorage is supported.

Verification: real browser rendering of the software 3D path, greeting, drag, keyboard controls, pause, hide/restore/session persistence, repeated responsive resize, and 336px/404px/desktop layouts; deterministic reduced-motion, offscreen/background, and context-loss/restoration lifecycle tests. WebGL could not be rendered on the test cloud browser because that browser disables GL; it uses the same geometry and textures through Three.js's standard renderer.

To remove the companion, remove the `pet.css` and `pet.js` references, `.pet-dock` markup, and `.pet-show` footer button from `index.html`. The site's content does not depend on JavaScript.
