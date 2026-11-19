// build-world.mjs — v1.5 world generator (Builder BU, original code).
// Emits TWO files from ONE layout so the Roblox place and the Three.js
// screenshots show the same world:
//   - ../src/workspace/world.model.json  (Rojo JSON model, static world)
//   - ../render/world-scene.json        (Three.js render scene)
// Deterministic: seeded RNG, so re-running reproduces the same world.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_MODEL = join(here, '..', 'src', 'workspace', 'World.model.json');
const OUT_SCENE = join(here, '..', 'render', 'world-scene.json');

// ---------------- seeded RNG ----------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261119);
const rr = (a, b) => a + rng() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------- palette (RGB 0-255) ----------------
const C = {
  grassDeep: [34, 68, 34], grassMid: [70, 130, 50], grassSun: [140, 185, 50],
  dirt: [115, 85, 55], dirtEdge: [90, 85, 75], groundBase: [80, 65, 45],
  groundPatch1: [88, 110, 52], groundPatch2: [96, 92, 48], groundPatch3: [62, 96, 44],
  slate: [90, 95, 100], cliffRock: [75, 80, 85], cobble: [110, 115, 120],
  lakeWater: [35, 95, 140], fountainWater: [50, 120, 170], fallWater: [200, 220, 240],
  woodCabin: [95, 55, 35], woodPlank: [120, 80, 50], woodBench: [110, 70, 45],
  woodDark: [60, 45, 30], mortar: [45, 25, 15], trunk: [65, 45, 30],
  foliageDeep: [20, 50, 30], foliageMid: [45, 95, 50], foliageSun: [90, 140, 60],
  neonWindow: [255, 170, 60], metal: [40, 40, 40],
  flowerWhite: [240, 240, 240], flowerPink: [230, 140, 160], flowerYellow: [240, 210, 80],
  fabricRed: [210, 70, 70], fabricWhite: [240, 240, 240],
  rainbow: [[255, 60, 60], [255, 140, 40], [255, 230, 60], [90, 220, 90], [70, 140, 255], [140, 90, 220], [220, 90, 200]],
};
const f01 = (c) => [+(c[0] / 255).toFixed(4), +(c[1] / 255).toFixed(4), +(c[2] / 255).toFixed(4)];

// ---------------- rotation matrices ----------------
// R = Ry(ry) * Rx(rx) * Rz(rz); returns row-major 9 numbers.
function mat3(rx, ry, rz) {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  // Rx * Rz
  const axx = cz, axy = -sz, axz = 0;
  const ayx = cx * sz, ayy = cx * cz, ayz = -sx;
  const azx = sx * sz, azy = sx * cz, azz = cx;
  // Ry * (Rx*Rz)
  return [
    cy * axx + sy * azx, cy * axy + sy * azy, cy * axz + sy * azz,
    ayx, ayy, ayz,
    -sy * axx + cy * azx, -sy * axy + cy * azy, -sy * axz + cy * azz,
  ];
}
const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];
// Rotation taking +Y to +X (for X-axis cylinders), +Y to +Z (for Z-axis cylinders).
const ROT_Y_TO_X = mat3(0, 0, -Math.PI / 2);
const ROT_Y_TO_Z = mat3(Math.PI / 2, 0, 0);
// Accepts a 3-number Euler [rx, ry, rz] or a 9-number rotation matrix.
function normRot(rot) {
  return rot.length === 3 ? mat3(rot[0], rot[1], rot[2]) : rot;
}
function cframe(pos, rot) {
  return [pos[0], pos[1], pos[2], ...normRot(rot)];
}

// ---------------- dual emitters ----------------
const rojoChildren = [];   // Rojo JSON model children
const renderPrims = [];    // Three.js render primitives
const grassBlades = [];    // {pos, h, tilt:[rx,ry,rz], color}
const particles = [];      // {type, pos, count, color, size}

function rojoPart(name, className, props, children) {
  const node = { className, name, properties: props };
  if (children && children.length) node.children = children;
  rojoChildren.push(node);
  return node;
}
function renderPrim(shape, pos, size, rot, color, material, extra) {
  renderPrims.push({ shape, pos, size, rot, color, material, ...(extra || {}) });
}
function part(name, pos, size, rot, color, material, opts) {
  const o = opts || {};
  rojoPart(name, 'Part', {
    Anchored: true, CanCollide: o.canCollide !== false,
    Size: size, CFrame: cframe(pos, rot),
    Color: f01(color), Material: material,
    ...(o.transparency !== undefined ? { Transparency: o.transparency } : {}),
    ...(o.reflectance !== undefined ? { Reflectance: o.reflectance } : {}),
  });
  renderPrim('box', pos, size, normRot(rot), color, material, {
    ...(o.transparency !== undefined ? { opacity: 1 - o.transparency } : {}),
    ...(o.reflectance !== undefined ? { reflectance: o.reflectance } : {}),
  });
}
function ball(name, pos, dia, color, material, opts) {
  const o = opts || {};
  const size = [dia, dia, dia];
  rojoPart(name, 'Part', {
    Anchored: true, CanCollide: false, Shape: 'Ball',
    Size: size, CFrame: cframe(pos, IDENTITY),
    Color: f01(color), Material: material,
    ...(o.transparency !== undefined ? { Transparency: o.transparency } : {}),
  });
  renderPrim('sphere', pos, size, IDENTITY, color, material, {
    ...(o.transparency !== undefined ? { opacity: 1 - o.transparency } : {}),
  });
}
function cyl(name, pos, axis, length, dia, color, material, opts) {
  const o = opts || {};
  // Rojo: a Cylinder Part's length runs along its local X axis.
  // Render: a Three.js cylinder runs along Y. Different rotations needed.
  const rojoRot = axis === 'x' ? IDENTITY
    : axis === 'z' ? mat3(0, -Math.PI / 2, 0)
    : mat3(0, 0, Math.PI / 2); // 'y'
  const renderRot = axis === 'x' ? mat3(0, 0, -Math.PI / 2)
    : axis === 'z' ? mat3(Math.PI / 2, 0, 0)
    : IDENTITY; // 'y'
  rojoPart(name, 'Part', {
    Anchored: true, CanCollide: o.canCollide !== false, Shape: 'Cylinder',
    Size: [length, dia, dia], CFrame: cframe(pos, rojoRot),
    Color: f01(color), Material: material,
    ...(o.transparency !== undefined ? { Transparency: o.transparency } : {}),
  });
  // Render: unit cylinder is Y-axis, height 1, radius 0.5 -> scale [dia, length, dia].
  renderPrim('cylinder', pos, [dia, length, dia], renderRot, color, material, {
    ...(o.transparency !== undefined ? { opacity: 1 - o.transparency } : {}),
  });
}

// ---------------- exclusion zones (keep clear of grass/trees) ----------------
const clearCircles = []; // {x, z, r}
const clearRects = [];   // {x0, z0, x1, z1}
function clearCircle(x, z, r) { clearCircles.push({ x, z, r }); }
function clearRect(x0, z0, x1, z1) { clearRects.push({ x0, z0, x1, z1 }); }
function isClear(x, z) {
  for (const c of clearCircles) {
    const dx = x - c.x, dz = z - c.z;
    if (dx * dx + dz * dz < c.r * c.r) return false;
  }
  for (const r of clearRects) {
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return false;
  }
  return true;
}
// Path segments (for grass clearance + path building): {ax, az, bx, bz}
const pathSegs = [];
function distToSeg(px, pz, s) {
  const dx = s.bx - s.ax, dz = s.bz - s.az;
  const len2 = dx * dx + dz * dz;
  let t = len2 === 0 ? 0 : ((px - s.ax) * dx + (pz - s.az) * dz) / len2;
  t = clamp(t, 0, 1);
  const cx = s.ax + t * dx, cz = s.az + t * dz;
  return Math.hypot(px - cx, pz - cz);
}
function nearPath(x, z, d) {
  for (const s of pathSegs) if (distToSeg(x, z, s) < d) return true;
  return false;
}

// ---------------- GROUND ----------------
part('GroundBase', [0, -2, 0], [420, 4, 420], IDENTITY, C.groundBase, 'Ground');
// Rolling hills (flattened balls) around the edges.
const hills = [
  [-120, -70, 110, 9], [120, -60, 100, 8], [-110, 70, 90, 7], [110, 80, 120, 10],
  [-60, -105, 90, 8], [70, -100, 80, 6], [-140, 10, 100, 9], [140, 0, 95, 7],
];
for (const [hx, hz, w, h] of hills) {
  ball('Hill', [hx, -1, hz], 1, C.groundPatch2, 'Ground');
  // Replace the ball's uniform size with a flattened one: rebuild as scaled ball.
  const last = rojoChildren[rojoChildren.length - 1];
  last.properties.Size = [w, h, w];
  last.properties.CFrame = cframe([hx, h / 2 - 2, hz], IDENTITY);
  const rp = renderPrims[renderPrims.length - 1];
  rp.size = [w, h, w]; rp.pos = [hx, h / 2 - 2, hz];
}
// Colour patches on the ground (break the flat look).
for (let i = 0; i < 36; i++) {
  const x = rr(-100, 100), z = rr(-85, 95);
  if (!isClear(x, z) || nearPath(x, z, 4)) continue;
  const w = rr(10, 26), d = rr(10, 26);
  part('GroundPatch', [x, 0.08, z], [w, 0.15, d], [0, rr(0, Math.PI), 0],
    pick([C.groundPatch1, C.groundPatch2, C.groundPatch3]), 'Grass', { canCollide: false });
}

// ---------------- DIRT PATHS ----------------
function buildPath(ax, az, bx, bz) {
  pathSegs.push({ ax, az, bx, bz });
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz); // rotation about Y so the box's Z runs along the path
  const steps = Math.max(2, Math.round(len / 4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = ax + dx * t + rr(-0.7, 0.7);
    const z = az + dz * t + rr(-0.7, 0.7);
    part('DirtPath', [x, 0.12, z], [rr(5.5, 6.5), 0.25, rr(4.2, 4.8)],
      [0, ang + rr(-0.12, 0.12), 0], C.dirt, 'Slate', { canCollide: false });
  }
  // Stone edge markers along both sides.
  const nStones = Math.round(len / 3);
  for (let i = 0; i < nStones; i++) {
    const t = rng();
    const x = ax + dx * t, z = az + dz * t;
    const side = rng() < 0.5 ? -1 : 1;
    const nx = -dz / len * side * rr(3.4, 4.2), nz = dx / len * side * rr(3.4, 4.2);
    cyl('PathStone', [x + nx, 0.35, z + nz], 'y', rr(0.5, 0.9), rr(1.0, 1.8), C.dirtEdge, 'Rock', { canCollide: false });
  }
}
buildPath(0, 15, 0, 0);        // spawn -> fountain
buildPath(0, 0, 15, -40);      // fountain -> karaoke deck
buildPath(0, 0, 35, -10);      // fountain -> cabin
buildPath(0, 0, 24, 13);       // fountain -> market stalls
buildPath(15, -40, -10, -20);  // karaoke -> rope bridge south end
buildPath(-10, -45, -30, -55); // bridge north end -> waterfall viewpoint

// Spawn pad + SpawnLocation.
part('SpawnPad', [0, 0.25, 15], [10, 0.5, 10], IDENTITY, C.cobble, 'Slate');
rojoPart('SpawnLocation', 'SpawnLocation', {
  Anchored: true, Size: [6, 1, 6], CFrame: cframe([0, 2, 15], IDENTITY),
  Color: f01(C.cobble), Material: 'Slate', Neutral: true, Duration: 0,
});
renderPrim('box', [0, 2, 15], [6, 1, 6], IDENTITY, C.cobble, 'Slate');
clearCircle(0, 15, 7); clearCircle(0, 0, 9);
clearRect(-32, -62, 12, -28); // lake
clearRect(6, -50, 24, -30);   // karaoke deck
clearRect(26, -18, 44, -2);   // cabin
clearRect(16, 6, 32, 19);     // stalls
clearRect(-52, -82, -28, -58); // waterfall cliff

// ---------------- GRASS (dense blades, never a flat field) ----------------
const GRASS_COLORS = [C.grassDeep, C.grassMid, C.grassSun];
const GRASS_W = [0.45, 0.35, 0.20]; // weight by noise band
function grassColor(noise) {
  if (noise < 0.45) return C.grassDeep;
  if (noise < 0.8) return C.grassMid;
  return C.grassSun;
}
let bladesMade = 0;
let tufts = 0;
while (tufts < 320 && bladesMade < 1500) {
  const x = rr(-100, 100), z = rr(-85, 95);
  if (!isClear(x, z) || nearPath(x, z, 4.2)) continue;
  tufts++;
  const n = ri(3, 5);
  for (let i = 0; i < n && bladesMade < 1500; i++) {
    const bx = x + rr(-0.7, 0.7), bz = z + rr(-0.7, 0.7);
    const h = rr(0.8, 2.2);
    const tilt = [rr(-0.26, 0.26), rr(0, Math.PI), rr(-0.26, 0.26)];
    const col = grassColor(rng());
    const w = rr(0.15, 0.2);
    grassBlades.push({ pos: [bx, h / 2, bz], h, tilt, color: col, w });
    // Static Rojo part for the blade.
    rojoPart('GrassBlade', 'Part', {
      Anchored: true, CanCollide: false,
      Size: [w, h, w], CFrame: cframe([bx, h / 2, bz], mat3(tilt[0], tilt[1], tilt[2])),
      Color: f01(col), Material: rng() < 0.5 ? 'LeafyGrass' : 'Grass',
    });
    bladesMade++;
  }
}
// Wildflowers near paths + scattered.
const FLOWER_COLORS = [C.flowerWhite, C.flowerPink, C.flowerYellow];
for (let i = 0; i < 120; i++) {
  let x, z, tries = 0;
  do { x = rr(-70, 70); z = rr(-70, 70); tries++; } while (tries < 8 && (!isClear(x, z) || nearPath(x, z, 5.5)));
  if (tries >= 8) continue;
  const col = pick(FLOWER_COLORS);
  cyl('FlowerStem', [x, 0.4, z], 'y', 0.8, 0.12, C.grassMid, 'Grass', { canCollide: false });
  ball('FlowerHead', [x, 0.9, z], 0.32, col, 'SmoothPlastic', {});
}

// ---------------- TREES (layered volumetric, never flat cones) ----------------
function makeTree(x, z, h, spread) {
  const trunkDia = rr(1.5, 3.0);
  cyl('TreeTrunk', [x, h / 2, z], 'y', h, trunkDia, C.trunk, 'Wood');
  const layers = ri(5, 8);
  for (let i = 0; i < layers; i++) {
    const t = i / Math.max(1, layers - 1); // 0 bottom -> 1 top
    const y = h * (0.45 + 0.55 * t) + rr(-1, 1);
    const dia = spread * (1.05 - 0.55 * t) * rr(0.75, 1.1);
    const col = t < 0.35 ? C.foliageDeep : t < 0.75 ? C.foliageMid : C.foliageSun;
    const ox = rr(-spread * 0.22, spread * 0.22), oz = rr(-spread * 0.22, spread * 0.22);
    ball('TreeFoliage', [x + ox, y, z + oz], dia, col, rng() < 0.5 ? 'LeafyGrass' : 'SmoothPlastic', {});
  }
}
const treeSpots = [];
// North-west forest cluster (dense).
for (let i = 0; i < 14; i++) treeSpots.push([rr(-70, -25), rr(-65, 5)]);
// East edge.
for (let i = 0; i < 8; i++) treeSpots.push([rr(55, 95), rr(-60, 60)]);
// South edge.
for (let i = 0; i < 10; i++) treeSpots.push([rr(-80, 80), rr(55, 90)]);
// Scattered.
for (let i = 0; i < 10; i++) treeSpots.push([rr(-95, 95), rr(-80, 90)]);
for (const [tx, tz] of treeSpots) {
  // Keep a clearing in front of the waterfall + rainbow so the cover shot
  // can actually see them from the south-east.
  if (!isClear(tx, tz) || nearPath(tx, tz, 5) || Math.hypot(tx + 36, tz + 58) < 22) continue;
  makeTree(tx, tz, rr(18, 32), rr(10, 20));
  clearCircle(tx, tz, 4);
}
// Treehouse pine (tall, with platform).
makeTree(-40, 25, 32, 14);
part('TreehousePlatform', [-40, 22, 25], [10, 0.6, 10], IDENTITY, C.woodPlank, 'WoodPlanks');
part('TreehouseRail', [-40, 23.2, 20.2], [10, 1.2, 0.4], IDENTITY, C.woodDark, 'Wood');
part('TreehouseRail', [-40, 23.2, 29.8], [10, 1.2, 0.4], IDENTITY, C.woodDark, 'Wood');
part('TreehouseRoof', [-40, 26.5, 25], [12, 0.5, 12], [0, 0.3, 0], C.woodCabin, 'Wood');
for (let i = 0; i < 7; i++) {
  part('TreehouseLadder', [-36.5, 3 + i * 3, 25], [0.5, 3, 0.3], IDENTITY, C.woodDark, 'Wood');
}
// Grove positions for runtime-cloned TreeForest models (kept empty here).
// The three spots nearest the waterfall/rainbow are left out so the falls
// stay visible from the south-east (cover shot).
const GROVE = [[-55, -30], [-48, -15], [-58, -5], [-38, -25], [-62, -20]];
for (const [gx, gz] of GROVE) clearCircle(gx, gz, 5);

// ---------------- LAKE ----------------
part('LakeWater', [-10, -1.5, -45], [40, 1, 30], IDENTITY, C.lakeWater, 'Glass',
  { transparency: 0.4, reflectance: 0.5, canCollide: false });
// Lake edge rocks (half-submerged).
for (let i = 0; i < 24; i++) {
  const a = (i / 24) * Math.PI * 2 + rr(-0.1, 0.1);
  const x = -10 + Math.cos(a) * rr(19, 21), z = -45 + Math.sin(a) * rr(14, 16);
  ball('LakeRock', [x, -0.6, z], rr(2, 4), C.slate, 'Slate', {});
}
// Dock planks at the lake edge near the karaoke deck.
for (let i = 0; i < 5; i++) {
  part('DockPlank', [8 + i * 1.6, 0.3, -31], [1.4, 0.3, 5], IDENTITY, C.woodPlank, 'WoodPlanks');
}

// ---------------- WATERFALL ----------------
for (let i = 0; i < 12; i++) {
  const y = 2 + i * 2.2;
  part('CliffRock', [-40 + rr(-3, 3), y, -70 + rr(-2, 2)],
    [rr(14, 22), rr(3, 5), rr(6, 10)], [0, rr(-0.2, 0.2), 0], C.cliffRock, 'Slate');
}
part('WaterfallPool', [-38, -1, -62], [16, 1, 12], IDENTITY, C.lakeWater, 'Glass',
  { transparency: 0.4, reflectance: 0.4, canCollide: false });
for (let i = 0; i < 3; i++) {
  part('WaterfallSheet', [-42 + i * 4, 14, -65.5], [3.6, 24, 0.5], IDENTITY, C.fallWater, 'Glass',
    { transparency: 0.3, canCollide: false });
}
// Rainbow arc (7 segments) in the mist zone — VISIBLE in the cover shot.
for (let i = 0; i < 7; i++) {
  const a = Math.PI * (0.15 + 0.7 * (i / 6)); // arc over the mist
  const x = -36 + Math.cos(a) * 6, y = 4 + Math.sin(a) * 6;
  part('RainbowArc', [x, y, -60], [1.6, 1.6, 5.5], [0, 0, a - Math.PI / 2],
    C.rainbow[i], 'Neon', { transparency: 0.35, canCollide: false });
}
particles.push({ type: 'mist', pos: [-38, 2, -62], count: 60, color: [240, 244, 248], size: 3 });

// ---------------- FOUNTAIN ----------------
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const x = Math.cos(a) * 6, z = Math.sin(a) * 6;
  part('FountainRing', [x, 1.5, z], [2.4, 3, 1.2], [0, -a + Math.PI / 2, 0], C.cobble, 'Cobblestone');
}
cyl('FountainBasin', [0, 0.8, 0], 'y', 1.5, 11, C.fountainWater, 'Glass',
  { transparency: 0.2, canCollide: false });
cyl('FountainColumn', [0, 3, 0], 'y', 4, 2, C.cobble, 'Cobblestone');
particles.push({ type: 'spray', pos: [0, 5, 0], count: 40, color: [220, 235, 245], size: 1.2 });

// ---------------- LOG CABIN (Rumah Kayu) ----------------
(function buildCabin() {
  const cx = 35, cz = -10;
  part('CabinFloor', [cx, 0.3, cz], [16, 0.6, 14], IDENTITY, C.woodPlank, 'WoodPlanks');
  // Log walls: horizontal cylinders stacked.
  for (let r = 0; r < 9; r++) {
    const y = 1 + r * 1.25;
    cyl('CabinLog', [cx, y, cz - 6.5], 'x', 16, 1.2, C.woodCabin, 'Wood');
    cyl('CabinLog', [cx, y, cz + 6.5], 'x', 16, 1.2, C.woodCabin, 'Wood');
    cyl('CabinLog', [cx - 7.5, y, cz], 'z', 14, 1.2, C.woodCabin, 'Wood');
    cyl('CabinLog', [cx + 7.5, y, cz], 'z', 14, 1.2, C.woodCabin, 'Wood');
  }
  // Gable roof: two slanted slabs + ridge beam (seated on the wall tops).
  part('CabinRoof', [cx, 12.6, cz - 3.8], [17, 0.5, 9], [0.55, 0, 0], C.woodDark, 'Wood');
  part('CabinRoof', [cx, 12.6, cz + 3.8], [17, 0.5, 9], [-0.55, 0, 0], C.woodDark, 'Wood');
  cyl('CabinRidge', [cx, 14.8, cz], 'x', 17, 0.8, C.woodDark, 'Wood');
  // Porch.
  part('CabinPorch', [cx, 0.4, cz + 9], [18, 0.5, 6], IDENTITY, C.woodPlank, 'WoodPlanks');
  part('CabinPorchPost', [cx - 8, 2.5, cz + 11.5], [0.8, 4.5, 0.8], IDENTITY, C.woodDark, 'Wood');
  part('CabinPorchPost', [cx + 8, 2.5, cz + 11.5], [0.8, 4.5, 0.8], IDENTITY, C.woodDark, 'Wood');
  // Warm glowing windows (front + sides).
  part('CabinWindow', [cx - 4, 6, cz - 7.2], [3, 3, 0.3], IDENTITY, C.neonWindow, 'Neon', { canCollide: false });
  part('CabinWindow', [cx + 4, 6, cz - 7.2], [3, 3, 0.3], IDENTITY, C.neonWindow, 'Neon', { canCollide: false });
  part('CabinWindow', [cx - 8.2, 6, cz], [0.3, 3, 3], IDENTITY, C.neonWindow, 'Neon', { canCollide: false });
  // Door.
  part('CabinDoor', [cx, 4.5, cz + 7.2], [3.5, 7, 0.4], IDENTITY, C.woodDark, 'Wood');
})();

// ---------------- MARKET STALLS ----------------
function buildStall(x, z, ry) {
  const cos = Math.cos(ry), sin = Math.sin(ry);
  const L = (dx, dz) => [x + dx * cos - dz * sin, z + dx * sin + dz * cos];
  const [cx, cz] = L(0, 0);
  part('StallCounter', [cx, 1, cz], [6, 2, 3], [0, ry, 0], C.woodPlank, 'WoodPlanks');
  for (const [px, pz] of [[-2.8, -1.2], [2.8, -1.2], [-2.8, 1.2], [2.8, 1.2]]) {
    const [wx, wz] = L(px, pz);
    part('StallPost', [wx, 3.5, wz], [0.5, 5, 0.5], [0, ry, 0], C.woodDark, 'Wood');
  }
  for (let i = 0; i < 6; i++) {
    const [sx, sz] = L(-3 + i * 1.2, 0);
    part('StallAwning', [sx, 6.2, sz], [1.2, 0.2, 4], [0.25, ry, 0],
      i % 2 === 0 ? C.fabricRed : C.fabricWhite, 'Fabric');
  }
  part('StallSign', [cx, 7.2, cz], [5, 1.2, 0.3], [0, ry, 0], C.woodDark, 'Wood');
}
buildStall(20, 10, 0.5);
buildStall(28, 15, -0.4);

// ---------------- BENCHES + SEATS ----------------
function buildBench(x, z, ry) {
  const cos = Math.cos(ry), sin = Math.sin(ry);
  const L = (dx, dz) => [x + dx * cos - dz * sin, z + dx * sin + dz * cos];
  for (const dz of [-0.8, 0, 0.8]) {
    const [sx, sz] = L(0, dz);
    part('BenchSlat', [sx, 1.2, sz], [5, 0.25, 0.9], [0, ry, 0], C.woodBench, 'WoodPlanks');
  }
  for (const dz of [-0.6, 0.6]) {
    const [sx, sz] = L(0, dz);
    part('BenchBack', [sx, 2.2, sz], [5, 0.9, 0.25], [0.25, ry, 0], C.woodBench, 'WoodPlanks');
  }
  for (const dx of [-2.2, 2.2]) {
    const [lx, lz] = L(dx, 0);
    part('BenchLeg', [lx, 0.6, lz], [0.4, 1.2, 1.8], [0, ry, 0], C.metal, 'Metal');
  }
  const [sex, sez] = L(0, 0);
  rojoPart('BenchSeat', 'Seat', {
    Anchored: true, Size: [4.5, 0.5, 2], CFrame: cframe([sex, 1.5, sez], mat3(0, ry, 0)),
    Color: f01(C.woodBench), Material: 'WoodPlanks',
  });
  renderPrim('box', [sex, 1.5, sez], [4.5, 0.5, 2], mat3(0, ry, 0), C.woodBench, 'WoodPlanks');
}
buildBench(-8, 6, 0.4);
buildBench(5, -35, 2.6);
buildBench(30, -4, -1.2);

// ---------------- SIGNPOST ----------------
(function buildSignpost() {
  const x = 4, z = 8;
  cyl('SignPost', [x, 3, z], 'y', 6, 0.8, C.woodDark, 'Wood');
  const boards = [
    { text: 'AIR TERJUN <-', y: 5.6, ry: 0.3 },
    { text: 'AIR MANCUR <-', y: 4.4, ry: -0.2 },
    { text: 'RUMAH KAYU ->', y: 3.2, ry: 0.9 },
  ];
  for (const b of boards) {
    part('SignBoard', [x, b.y, z], [5, 1.1, 0.3], mat3(0, b.ry, 0), C.woodBench, 'WoodPlanks');
    // Label text is drawn by the renderer (canvas texture) and by the runtime
    // world script (SurfaceGui) — see render/render.mjs + src/workspace/init.server.luau.
    renderPrims[renderPrims.length - 1].label = b.text;
  }
})();

// ---------------- KARAOKE DECK ----------------
(function buildKaraoke() {
  part('KaraokeDeck', [15, 1, -40], [18, 1, 18], IDENTITY, C.woodPlank, 'WoodPlanks');
  for (const [px, pz] of [[6, -49], [24, -49], [6, -31], [24, -31]]) {
    part('KaraokePost', [px, 5, pz], [0.8, 8, 0.8], IDENTITY, C.woodDark, 'Wood');
  }
  part('KaraokeRoof', [15, 9.5, -40], [20, 0.5, 20], IDENTITY, C.woodCabin, 'Wood');
  // Stage screen (label drawn by renderer + runtime world script).
  part('KaraokeScreen', [15, 5, -48.5], [9, 5, 0.5], IDENTITY, [25, 25, 35], 'SmoothPlastic');
  renderPrims[renderPrims.length - 1].label = '♪ KARAOKE ♪';
  // Microphone stand.
  cyl('MicStand', [12, 3, -44], 'y', 4, 0.25, C.metal, 'Metal');
  ball('MicHead', [12, 5.2, -44], 0.7, [30, 30, 30], 'Metal', {});
  // Speakers.
  part('Speaker', [8, 2.5, -48], [3, 4, 2], IDENTITY, [25, 25, 25], 'Metal');
  part('Speaker', [22, 2.5, -48], [3, 4, 2], IDENTITY, [25, 25, 25], 'Metal');
  // Audience benches facing the screen.
  buildBench(12, -36, Math.PI);
  buildBench(18, -36, Math.PI);
})();

// ---------------- ROPE BRIDGE ----------------
for (let i = 0; i < 12; i++) {
  const z = -20 - i * 2.1;
  part('BridgePlank', [-10 + rr(-0.15, 0.15), 2 + Math.sin(i * 0.5) * 0.25, z],
    [4, 0.4, 1.6], [rr(-0.05, 0.05), 0, rr(-0.08, 0.08)], C.woodPlank, 'WoodPlanks');
}
for (const sx of [-12.2, -7.8]) {
  cyl('BridgeRope', [sx, 3.4, -32.5], 'z', 26, 0.3, C.woodDark, 'SmoothPlastic', { canCollide: false });
}
for (const [px, pz] of [[-12.2, -20], [-7.8, -20], [-12.2, -45], [-7.8, -45]]) {
  part('BridgePost', [px, 2.5, pz], [0.6, 3, 0.6], IDENTITY, C.woodDark, 'Wood');
}

// ---------------- GOD-RAY SHAFTS (translucent white wedges of light) ----------------
for (const [sx, sz, ry] of [[-20, -10, 0.4], [-5, -30, -0.3], [-30, 20, 0.2], [10, -15, 0.6]]) {
  part('GodRay', [sx, 14, sz], [2, 28, 0.6], [0.35, ry, 0.12], [255, 240, 210], 'SmoothPlastic',
    { transparency: 0.94, canCollide: false });
}
particles.push({ type: 'fireflies', pos: [-8, 2, -38], count: 50, color: [255, 230, 100], size: 0.35 });
particles.push({ type: 'fireflies', pos: [-30, 3, 10], count: 40, color: [255, 230, 100], size: 0.35 });
particles.push({ type: 'lanterns', pos: [0, 8, -20], count: 14, color: [255, 140, 50], size: 0.8 });
particles.push({ type: 'lanterns', pos: [25, 10, 5], count: 10, color: [255, 140, 50], size: 0.8 });

// ---------------- EMIT ----------------
const model = {
  className: 'Model', name: 'World',
  children: rojoChildren,
};
mkdirSync(dirname(OUT_MODEL), { recursive: true });
mkdirSync(dirname(OUT_SCENE), { recursive: true });
writeFileSync(OUT_MODEL, JSON.stringify(model));
const scene = {
  sky: {
    top: [88, 108, 178], horizon: [255, 158, 108], bottom: [92, 56, 96],
    fog: [150, 110, 140], fogNear: 40, fogFar: 350,
    sunDir: [-0.45, 0.55, 0.35], sunColor: [255, 210, 150],
    hemiSky: [255, 200, 160], hemiGround: [70, 80, 60],
  },
  prims: renderPrims,
  grass: grassBlades,
  particles,
  grove: [[-55, -30], [-48, -15], [-58, -5], [-45, -45], [-38, -25], [-52, -55], [-62, -20], [-42, -58]],
  cameras: [
    { name: '1-hub', pos: [14, 35, 32], lookAt: [-30, 8, -48], fov: 55 },
    { name: '2-bazaar', pos: [2, 14, 38], lookAt: [26, 4, -2], fov: 50 },
    { name: '3-boss', pos: [10, 45, -5], lookAt: [-38, 8, -62], fov: 55 },
  ],
};
writeFileSync(OUT_SCENE, JSON.stringify(scene));
console.log(`world model: ${rojoChildren.length} instances -> ${OUT_MODEL}`);
console.log(`render scene: ${renderPrims.length} prims, ${grassBlades.length} grass blades -> ${OUT_SCENE}`);
