/**
 * app.ts
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';

import FPSControls from './objects/FPSControls';
import Game from './Game';

import TWEEN from 'three/examples/jsm/libs/tween.module.js';

// Initialize core ThreeJS components

const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });
const game = new Game();

// Set up camera
camera.position.set(-6, 3, 0);
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement; // draw to canvas
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = '0'; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);
canvas.addEventListener('click', async () => {
    await canvas.requestPointerLock();
});

// Set up controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.enablePan = false;
// controls.minDistance = 4;
// controls.maxDistance = 16;
// controls.update();
export const controls = new FPSControls(camera, game);
// const controls = new PointerLockControls(camera, canvas);

// Render loop
const onAnimationFrameHandler = (timeStamp: number) => {
    controls.update(timeStamp);
    renderer.render(game.getLevel(), camera);
    game.getLevel().update && game.getLevel().update(timeStamp);
    TWEEN.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);
TWEEN.update();

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);
