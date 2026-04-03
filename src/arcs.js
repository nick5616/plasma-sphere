import * as THREE from 'three';
import { scene } from './setup.js';
import {
  SPHERE_R, SPHERE_Y,
  NUM_ARCS, TOTAL_ARCS, ATTRACTED_COUNT, ARC_PTS,
} from './constants.js';

// Mutable state shared with interaction.js — set to a normalized Vector3 when
// the user holds a click/touch on the sphere, null otherwise.
export const attractState = { dir: null };

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

  // Two perpendicular axes for transverse jitter
  const tmp = Math.abs(d.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const p1 = new THREE.Vector3().crossVectors(d, tmp).normalize();
  const p2 = new THREE.Vector3().crossVectors(d, p1).normalize();

  const NUM_CTRL = 11;
  const pts = [new THREE.Vector3(0, 0, 0)];
  for (let i = 1; i < NUM_CTRL; i++) {
    const t        = i / NUM_CTRL;
    const base     = d.clone().multiplyScalar(t * SPHERE_R);
    const envelope = 0.28 * Math.sin(t * Math.PI); // 0 at start/end, peak in middle
    base.addScaledVector(p1, (Math.random() * 2 - 1) * envelope);
    base.addScaledVector(p2, (Math.random() * 2 - 1) * envelope);
    pts.push(base);
  }
  pts.push(d.clone().multiplyScalar(SPHERE_R)); // exact surface point
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

/**
 * Map t ∈ [0,1] along arc → color.
 * 0 = white (core), ~0.4 = red, 1.0 = purple (surface)
 */
function arcColor(t) {
  if (t < 0.12) {
    return new THREE.Color(1, 1, 1);
  } else if (t < 0.45) {
    const s = (t - 0.12) / 0.33;
    return new THREE.Color(1, 1 - s, 1 - s * 0.95);
  } else {
    const s = (t - 0.45) / 0.55;
    return new THREE.Color(1 - s * 0.25, 0, s * 0.9 + 0.1);
  }
}

/** Return a direction within a cone of half-angle `spread` (radians) around `base`. */
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

// Pre-allocate all arc Lines once — buffers reused every frame, no runtime allocation
export const arcPool = Array.from({ length: TOTAL_ARCS }, () => {
  const geo     = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(new Float32Array(ARC_PTS * 3), 3);
  const colAttr = new THREE.BufferAttribute(new Float32Array(ARC_PTS * 3), 3);
  posAttr.usage = THREE.DynamicDrawUsage;
  colAttr.usage = THREE.DynamicDrawUsage;
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color',    colAttr);

  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  line.position.set(0, SPHERE_Y, 0);
  line.frustumCulled = false; // always inside view — skip bounding check
  scene.add(line);
  return line;
});

/**
 * Rewrite one arc's buffers in-place — zero allocation.
 * First ATTRACTED_COUNT indices are the "attracted" slots when holding.
 */
export function refreshArc(i) {
  const isThick     = i < NUM_ARCS;
  const isAttracted = attractState.dir && i < ATTRACTED_COUNT;
  const isDimmed    = attractState.dir && !isAttracted;
  const spread      = isThick ? 0.13 : 0.22;
  const brightMult  = isDimmed ? 0.28 : (isThick ? 1.0 : 0.65);

  const dir    = isAttracted ? jitteredDir(attractState.dir, spread) : randomDir();
  const pts    = buildArcCurve(dir).getPoints(ARC_PTS - 1);
  const posArr = arcPool[i].geometry.attributes.position.array;
  const colArr = arcPool[i].geometry.attributes.color.array;

  for (let j = 0; j < ARC_PTS; j++) {
    const t = j / (ARC_PTS - 1);
    const c = arcColor(t);
    const k = j * 3;
    posArr[k]     = pts[j].x;
    posArr[k + 1] = pts[j].y;
    posArr[k + 2] = pts[j].z;
    colArr[k]     = c.r * brightMult;
    colArr[k + 1] = c.g * brightMult;
    colArr[k + 2] = c.b * brightMult;
  }

  arcPool[i].geometry.attributes.position.needsUpdate = true;
  arcPool[i].geometry.attributes.color.needsUpdate    = true;
}

// Seed all arcs before first render
for (let i = 0; i < TOTAL_ARCS; i++) refreshArc(i);
