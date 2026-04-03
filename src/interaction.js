import * as THREE from 'three';
import { renderer, camera, controls } from './setup.js';
import { glassOuter } from './sphere.js';
import { attractState } from './arcs.js';
import { SPHERE_Y } from './constants.js';

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
  const hits = raycaster.intersectObject(glassOuter);
  if (hits.length > 0) {
    // Direction from sphere center to hit point
    attractState.dir = hits[0].point.clone().sub(new THREE.Vector3(0, SPHERE_Y, 0)).normalize();
    return true;
  }
  return false;
}

function releaseHold() {
  isHolding        = false;
  attractState.dir = null;
  controls.enabled = true;
}

renderer.domElement.addEventListener('mousedown', (e) => {
  if (castToSphere(e)) {
    isHolding        = true;
    controls.enabled = false;
  }
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (isHolding) castToSphere(e);
});

renderer.domElement.addEventListener('mouseup', releaseHold);

renderer.domElement.addEventListener('touchstart', (e) => {
  if (castToSphere(e.touches[0])) {
    isHolding        = true;
    controls.enabled = false;
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
  if (isHolding) castToSphere(e.touches[0]);
}, { passive: true });

renderer.domElement.addEventListener('touchend', releaseHold);
