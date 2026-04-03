import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SPHERE_Y } from './constants.js';

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0f2e);
scene.fog = new THREE.Fog(0x1a0f2e, 10, 22);

export const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.01, 50);
camera.position.set(0, SPHERE_Y + 0.6, 4.8);

export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

export const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.8,  // strength
  0.5,  // radius
  0.1   // threshold — low so electricity glows
);
composer.addPass(bloomPass);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, SPHERE_Y, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2.5;
controls.maxDistance = 14;
controls.update();
