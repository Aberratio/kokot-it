import './styles/main.css';
import './styles/content.css';
import { mountDemos } from './demo.ts';
import { mountScene } from './scene/index.ts';

// Shared entry for every page. The copy, navigation and language switch are rendered
// into static HTML at build time (src/content/), so everything here is enhancement.

// The hero's #scene-root is an empty container in the static HTML; the scene (T-08)
// adds its own canvas, so pages without JavaScript or WebGL carry no blank canvas.
const sceneRoot = document.getElementById('scene-root');
if (sceneRoot) {
  const canvas = document.createElement('canvas');
  canvas.className = 'scene';
  sceneRoot.append(canvas);
  mountScene(canvas);
}

mountDemos(document);
