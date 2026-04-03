import * as THREE from 'three';
import { scene } from './setup.js';
import { SPHERE_Y } from './constants.js';

scene.add(new THREE.AmbientLight(0x6655aa, 6));

// Core light inside sphere — pulses with electricity
export const coreLight = new THREE.PointLight(0xaa55ff, 5, 3.5);
coreLight.position.set(0, SPHERE_Y, 0);
scene.add(coreLight);

// Off-axis key light — gives the glass sphere a visible specular highlight
const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(3, SPHERE_Y + 3, 4);
scene.add(keyLight);

// Rim/fill from opposite side
const rimLight = new THREE.PointLight(0x9966ff, 3, 12);
rimLight.position.set(-3, SPHERE_Y + 1.5, -2);
scene.add(rimLight);
