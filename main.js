import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPHERE_R = 1.0;
const SPHERE_Y = 1.72; // Center of glass sphere in world space

// Base dimensions
const BASE_RINGS      = 8;
const BASE_BOTTOM_R   = 1.48;
const BASE_TOP_R      = 0.54;
const BASE_RING_H_BOT = 0.13; // height of bottom ring
const BASE_RING_H_TOP = 0.065; // height of top ring

// Arc settings
const NUM_ARCS        = 7;   // main arcs
const NUM_THIN_ARCS   = 4;   // accent arcs
const REGEN_MS        = 85;  // arc flicker interval
const TUBULAR_SEGS    = 55;
const RADIAL_SEGS     = 5;

// ─── Renderer ─────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// ─── Scene & Camera ───────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005);
scene.fog = new THREE.Fog(0x000005, 12, 25);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.01, 50);
camera.position.set(0, SPHERE_Y + 0.6, 4.8);

// ─── Post-processing (bloom) ──────────────────────────────────────────────────

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.8,   // strength
  0.5,   // radius
  0.1    // threshold — low so electricity glows
);
composer.addPass(bloomPass);

// ─── Orbit Controls ───────────────────────────────────────────────────────────

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, SPHERE_Y, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2.5;
controls.maxDistance = 14;
controls.update();

// ─── Lighting ─────────────────────────────────────────────────────────────────

scene.add(new THREE.AmbientLight(0x110022, 2));

// Core light inside sphere — pulses with electricity
const coreLight = new THREE.PointLight(0xaa55ff, 5, 3.5);
coreLight.position.set(0, SPHERE_Y, 0);
scene.add(coreLight);

// Subtle rim fill
const rimLight = new THREE.PointLight(0x330066, 1.2, 10);
rimLight.position.set(2, SPHERE_Y + 2, 2);
scene.add(rimLight);

// ─── Base ─────────────────────────────────────────────────────────────────────

const baseMat = new THREE.MeshStandardMaterial({
  color: 0x111114,
  roughness: 0.55,
  metalness: 0.45,
});

// Stacked flat cylinders — staircase that narrows toward sphere
let stackY = 0;
for (let i = 0; i < BASE_RINGS; i++) {
  const t = i / (BASE_RINGS - 1);
  const r = THREE.MathUtils.lerp(BASE_BOTTOM_R, BASE_TOP_R, t);
  const h = THREE.MathUtils.lerp(BASE_RING_H_BOT, BASE_RING_H_TOP, t);

  const geo = new THREE.CylinderGeometry(r, r, h, 80, 1);
  const mesh = new THREE.Mesh(geo, baseMat);
  mesh.position.y = stackY + h / 2;
  scene.add(mesh);
  stackY += h;
}

// Flat bottom disc
{
  const geo = new THREE.CylinderGeometry(BASE_BOTTOM_R, BASE_BOTTOM_R, 0.025, 80);
  const mesh = new THREE.Mesh(geo, baseMat);
  mesh.position.y = 0.0125;
  scene.add(mesh);
}

// ─── Glass Sphere ─────────────────────────────────────────────────────────────

const sphereGeo = new THREE.SphereGeometry(SPHERE_R, 80, 80);

// Back face — interior depth tint
const glassInner = new THREE.Mesh(
  sphereGeo,
  new THREE.MeshPhysicalMaterial({
    color: 0x223366,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
    depthWrite: false,
  })
);
glassInner.position.y = SPHERE_Y;
scene.add(glassInner);

// Outer glass shell — refractive look
const glassOuter = new THREE.Mesh(
  sphereGeo,
  new THREE.MeshPhysicalMaterial({
    color: 0x8899ee,
    transparent: true,
    opacity: 0.1,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.88,
    thickness: 0.15,
    ior: 1.52,
    side: THREE.FrontSide,
    depthWrite: false,
  })
);
glassOuter.position.y = SPHERE_Y;
scene.add(glassOuter);

// Rim halo — BackSide slightly oversized sphere gives Fresnel-ish edge glow
const haloMesh = new THREE.Mesh(
  new THREE.SphereGeometry(SPHERE_R * 1.018, 64, 64),
  new THREE.MeshBasicMaterial({
    color: 0x5533cc,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
haloMesh.position.y = SPHERE_Y;
scene.add(haloMesh);

// ─── Tesla Coil ───────────────────────────────────────────────────────────────

const metalMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.95, roughness: 0.08 });

// Stem — runs from base top up through interior
{
  const geo = new THREE.CylinderGeometry(0.022, 0.038, 0.6, 20);
  const mesh = new THREE.Mesh(geo, metalMat);
  mesh.position.set(0, SPHERE_Y - 0.32, 0);
  scene.add(mesh);
}

// Tip ball — the actual electrode at center
const electrodeMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.055, 20, 20),
  metalMat
);
electrodeMesh.position.set(0, SPHERE_Y, 0);
scene.add(electrodeMesh);

// Bright core glow around electrode
const coreGlow = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 16, 16),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
coreGlow.position.set(0, SPHERE_Y, 0);
scene.add(coreGlow);

// ─── Arc Utilities ────────────────────────────────────────────────────────────

/** Uniform random direction on the unit sphere */
function randomDir() {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi   = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  );
}

/**
 * Build a jittered CatmullRom path from (0,0,0) to dir * SPHERE_R.
 * Jitter is perpendicular to the main direction, peaks in the middle.
 */
function buildArcCurve(dir) {
  const d = dir.clone().normalize();

  // Build two perpendicular axes so we can jitter in any transverse direction
  const tmp = Math.abs(d.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const p1 = new THREE.Vector3().crossVectors(d, tmp).normalize();
  const p2 = new THREE.Vector3().crossVectors(d, p1).normalize();

  const NUM_CTRL = 11;
  const pts = [new THREE.Vector3(0, 0, 0)];

  for (let i = 1; i < NUM_CTRL; i++) {
    const t    = i / NUM_CTRL;
    const base = d.clone().multiplyScalar(t * SPHERE_R);

    // Jitter envelope: 0 at start, peak ~middle, 0 at end
    const envelope = 0.28 * Math.sin(t * Math.PI);
    base.addScaledVector(p1, (Math.random() * 2 - 1) * envelope);
    base.addScaledVector(p2, (Math.random() * 2 - 1) * envelope);

    pts.push(base);
  }

  // Exact surface point at end
  pts.push(d.clone().multiplyScalar(SPHERE_R));

  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

/**
 * Map t ∈ [0,1] along arc → color.
 * 0 = white (core), ~0.4 = red, 1.0 = purple (surface)
 */
function arcColor(t) {
  if (t < 0.12) {
    // White core
    return new THREE.Color(1, 1, 1);
  } else if (t < 0.45) {
    // White → red
    const s = (t - 0.12) / 0.33;
    return new THREE.Color(1, 1 - s, 1 - s * 0.95);
  } else {
    // Red → purple
    const s = (t - 0.45) / 0.55;
    return new THREE.Color(1 - s * 0.25, 0, s * 0.9 + 0.1);
  }
}

/**
 * Create a TubeGeometry arc mesh with vertex color gradient.
 * The mesh is positioned so its local origin is the sphere center.
 */
function makeArcMesh(dir, tubeR = 0.008) {
  const curve = buildArcCurve(dir);
  const geo   = new THREE.TubeGeometry(curve, TUBULAR_SEGS, tubeR, RADIAL_SEGS, false);

  const posAttr = geo.attributes.position;
  const stride  = RADIAL_SEGS + 1;
  const cols    = new Float32Array(posAttr.count * 3);

  for (let i = 0; i < posAttr.count; i++) {
    const seg = Math.floor(i / stride);
    const t   = seg / TUBULAR_SEGS;
    const c   = arcColor(t);
    cols[i * 3]     = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));

  mesh.position.set(0, SPHERE_Y, 0);
  return mesh;
}

// ─── Arc Group ────────────────────────────────────────────────────────────────

const arcGroup = new THREE.Group();
scene.add(arcGroup);

let attractDir = null; // normalized direction when user holds click

/**
 * Return a direction within a cone of half-angle `spread` (radians) around `base`.
 * spread=0 → exact direction. Used to bundle attracted arcs without making them identical.
 */
function jitteredDir(base, spread) {
  const d = base.clone().normalize();
  if (spread === 0) return d;
  const tmp = Math.abs(d.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const p1 = new THREE.Vector3().crossVectors(d, tmp).normalize();
  const p2 = new THREE.Vector3().crossVectors(d, p1).normalize();
  d.addScaledVector(p1, (Math.random() * 2 - 1) * spread);
  d.addScaledVector(p2, (Math.random() * 2 - 1) * spread);
  return d.normalize();
}

function regenerateArcs() {
  arcGroup.clear();

  for (let i = 0; i < NUM_ARCS; i++) {
    // All thick arcs converge on attract point; without it they spread randomly.
    // Slight angular spread (0.13 rad ≈ 7°) keeps the bundle from looking copy-pasted.
    const dir = attractDir ? jitteredDir(attractDir, 0.13) : randomDir();
    arcGroup.add(makeArcMesh(dir, 0.009));
  }

  for (let i = 0; i < NUM_THIN_ARCS; i++) {
    // Thin accent arcs fan out a little more for a realistic fringe
    const dir = attractDir ? jitteredDir(attractDir, 0.22) : randomDir();
    arcGroup.add(makeArcMesh(dir, 0.003));
  }
}

regenerateArcs();

// ─── Mouse Interaction ────────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();
let isHolding   = false;

function readMouse(e) {
  mouse.x =  (e.clientX / innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
}

function castToSphere(e) {
  readMouse(e);
  raycaster.setFromCamera(mouse, camera);
  // Cast against the outer glass mesh
  const hits = raycaster.intersectObject(glassOuter);
  if (hits.length > 0) {
    // Direction from sphere center to hit point
    const hitLocal = hits[0].point.clone().sub(new THREE.Vector3(0, SPHERE_Y, 0));
    attractDir = hitLocal.normalize();
    return true;
  }
  return false;
}

renderer.domElement.addEventListener('mousedown', (e) => {
  if (castToSphere(e)) {
    isHolding = true;
    controls.enabled = false; // Freeze camera while finger on sphere
  }
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isHolding) return;
  castToSphere(e); // Update attract dir as mouse moves across sphere
});

renderer.domElement.addEventListener('mouseup', () => {
  isHolding  = false;
  attractDir = null;
  controls.enabled = true;
});

// Touch equivalents
renderer.domElement.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  if (castToSphere(t)) {
    isHolding = true;
    controls.enabled = false;
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
  if (!isHolding) return;
  castToSphere(e.touches[0]);
}, { passive: true });

renderer.domElement.addEventListener('touchend', () => {
  isHolding  = false;
  attractDir = null;
  controls.enabled = true;
});

// ─── Animation ────────────────────────────────────────────────────────────────

const sphereCenter = new THREE.Vector3(0, SPHERE_Y, 0);
let lastRegen = 0;

function animate(ms) {
  requestAnimationFrame(animate);

  controls.update();

  // Regen arcs on interval
  if (ms - lastRegen > REGEN_MS) {
    lastRegen = ms;
    regenerateArcs();
  }

  // Pulse inner light and core glow
  const wave  = Math.sin(ms * 0.0031) * 0.4 + Math.sin(ms * 0.0079) * 0.25;
  coreLight.intensity      = 4.5 + wave;
  coreGlow.material.opacity = 0.75 + wave * 0.25;

  // Slightly vary bloom strength for extra flicker feel
  bloomPass.strength = 1.6 + wave * 0.3;

  composer.render();
}

requestAnimationFrame(animate);

// ─── Resize ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
