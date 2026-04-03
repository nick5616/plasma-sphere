import * as THREE from 'three';
import { scene } from './setup.js';
import { BASE_RINGS, BASE_BOTTOM_R, BASE_TOP_R, BASE_RING_H_BOT, BASE_RING_H_TOP } from './constants.js';

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

  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1), baseMat);
  mesh.position.y = stackY + h / 2;
  scene.add(mesh);
  stackY += h;
}

// Flat bottom disc
const bottomDisc = new THREE.Mesh(
  new THREE.CylinderGeometry(BASE_BOTTOM_R, BASE_BOTTOM_R, 0.025, 48),
  baseMat
);
bottomDisc.position.y = 0.0125;
scene.add(bottomDisc);
