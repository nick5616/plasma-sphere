import { controls, composer, bloomPass, renderer, camera } from './src/setup.js';
import { coreLight } from './src/lights.js';
import { coreGlow } from './src/teslaCoil.js';
import { refreshArc } from './src/arcs.js';
import { TOTAL_ARCS, ARCS_PER_FRAME } from './src/constants.js';

// Side-effect imports — build geometry and register event handlers
import './src/base.js';
import './src/interaction.js';

let arcCursor = 0;

function animate(ms) {
  requestAnimationFrame(animate);

  controls.update();

  // Stagger arc updates — ARCS_PER_FRAME per frame, round-robin, zero allocation
  for (let k = 0; k < ARCS_PER_FRAME; k++) {
    refreshArc(arcCursor % TOTAL_ARCS);
    arcCursor++;
  }

  // Pulse inner light and core glow
  const wave = Math.sin(ms * 0.0031) * 0.4 + Math.sin(ms * 0.0079) * 0.25;
  coreLight.intensity       = 4.5 + wave;
  coreGlow.material.opacity = 0.75 + wave * 0.25;
  bloomPass.strength        = 1.6 + wave * 0.3;

  composer.render();
}

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
