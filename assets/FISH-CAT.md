# Pearlfin homepage companion

The homepage uses the owner's original Pearlfin animation artwork. These are pre-rendered animation frames, not a freely rotatable real-time 3D model.

## Files

- `pet-sprite.js`: small timed-frame Canvas2D controller, with no library or WebGL dependency.
- `pet.css`: restrained profile-column placement, switching to the empty page margin on wide screens.
- `assets/pearlfin/neutral.webp`: 32 KB, static fallback that also works without JavaScript.
- `assets/pearlfin/idle.webp`: six-frame breathing/blink strip, loaded only when motion is allowed and the pet is visible.
- `assets/pearlfin/wave.webp`, `jump.webp`: greetings and playful jumps, loaded on demand.
- `assets/pearlfin/look-up.webp`, `look-down.webp`: sixteen directional poses, loaded only on pointer interaction.

Every strip preserves the final source sheet's decoded RGBA pixels exactly, verified after lossless WebP encoding. The source cells are 192 × 208 pixels. `assets/pearlfin/manifest.json` records dimensions and hashes.

Click, Enter, or Space says hello. Click again during the greeting to jump. Moving the mouse over the companion selects its original directional poses. Pause and hide controls are explicit; the hide preference lasts for the browser session. Reduced-motion starts static. Animation stops offscreen and in background tabs, and pending image loads cannot restart it after pause or hide.

Only the neutral image and, when allowed, the idle strip are initially requested (about 221 KB total). Other strips are loaded lazily. No external CDN, tracking, or account connection is used. The former experimental 3D assets are not imported by the current homepage; they remain available for old cached pages.
