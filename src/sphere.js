import * as THREE from 'three';
import { scene } from './setup.js';
import { SPHERE_R, SPHERE_Y } from './constants.js';

const sphereGeo = new THREE.SphereGeometry(SPHERE_R, 48, 32);

// Back face — interior depth tint
const glassInner = new THREE.Mesh(
  sphereGeo,
  new THREE.MeshPhysicalMaterial({
    color: 0x223366,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide,
    depthWrite: false,
  })
);
glassInner.position.y = SPHERE_Y;
scene.add(glassInner);

// Outer glass shell — refractive look; also the raycasting target for interaction
export const glassOuter = new THREE.Mesh(
  sphereGeo,
  new THREE.MeshPhysicalMaterial({
    color: 0x8899ee,
    transparent: true,
    opacity: 0.28,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.82,
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
  new THREE.SphereGeometry(SPHERE_R * 1.018, 48, 32),
  new THREE.MeshBasicMaterial({
    color: 0x5533cc,
    transparent: true,
    opacity: 0.28,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
haloMesh.position.y = SPHERE_Y;
scene.add(haloMesh);
