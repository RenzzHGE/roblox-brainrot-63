// render.mjs — renders the 3 v1.5 screenshots with headless Chromium + Three.js.
// Usage: node render.mjs [--no-shadows]
// Outputs 2560x1440 PNGs to render/full/<cam>.png
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';

const CHROME = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
const BASE = 'http://127.0.0.1:8901';
const OUT = new URL('./full/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const shadows = process.argv.includes('--no-shadows') ? '0' : '1';
const scene = JSON.parse(readFileSync(new URL('./world-scene.json', import.meta.url), 'utf-8'));

for (const cam of scene.cameras) {
  const url = `${BASE}/render.html?cam=${cam.name}&shadows=${shadows}`;
  const out = `${OUT}${cam.name}.png`;
  console.log(`rendering ${cam.name} (shadows=${shadows}) ...`);
  const t0 = Date.now();
  try {
    execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--window-size=2560,1440', '--virtual-time-budget=60000',
      `--screenshot=${out}`, url,
    ], { timeout: 300000, stdio: 'pipe' });
  } catch (e) {
    console.log(`  chrome failed for ${cam.name}: ${String(e.message).slice(0, 200)}`);
    continue;
  }
  const ok = existsSync(out);
  console.log(`  ${cam.name}: ${ok ? 'OK' : 'MISSING'} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
console.log('done');
