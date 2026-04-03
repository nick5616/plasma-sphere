import * as THREE from 'three';
import { scene } from './setup.js';
import { SPHERE_Y, BASE_RINGS, BASE_RING_H_BOT, BASE_RING_H_TOP } from './constants.js';

const metalMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.95, roughness: 0.08 });

// Stem — runs from inside the base up to the electrode at sphere center
const baseTopY   = ((BASE_RING_H_BOT + BASE_RING_H_TOP) / 2) * BASE_RINGS; // ≈ 0.78
const stemBottom = baseTopY - 0.08; // sink slightly into base so there's no gap
const stemHeight = SPHERE_Y - stemBottom;
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.05, stemHeight, 40), metalMat);
stem.position.set(0, stemBottom + stemHeight / 2, 0);
scene.add(stem);

// Tip ball — the actual electrode at center
const electrode = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), metalMat);
electrode.position.set(0, SPHERE_Y, 0);
scene.add(electrode);

// Bright core glow around electrode
export const coreGlow = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 16, 16),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
coreGlow.position.set(0, SPHERE_Y, 0);
scene.add(coreGlow);
