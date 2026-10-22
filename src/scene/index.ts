import { Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { sceneTokensFromDocument } from '../styles/tokens.ts';

/**
 * Placeholder for the 3D background scene. It only sets up a renderer that
 * follows the canvas size; the actual scene is a separate task.
 */
export function mountScene(canvas: HTMLCanvasElement): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    // No WebGL: the page stays readable without the scene.
    canvas.hidden = true;
    return () => {};
  }

  const scene = new Scene();
  // Colours come from the brand tokens (src/styles/tokens.css), never from literals here.
  scene.background = new Color(sceneTokensFromDocument().colors.bg);
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5;

  const resize = (): void => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  resize();
  window.addEventListener('resize', resize);
  return () => {
    window.removeEventListener('resize', resize);
    renderer.dispose();
  };
}
