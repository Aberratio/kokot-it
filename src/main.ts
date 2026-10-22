import './styles/main.css';
import './styles/content.css';
import { mountDemos } from './demo.ts';
import { mountScene } from './scene/index.ts';

// Shared entry for every page. The copy, navigation and language switch are rendered
// into static HTML at build time (src/content/), so everything here is enhancement.

// The hero's #scene-root is an empty container in the static HTML. The scene loads itself
// lazily (three.js in its own chunk, after the page is idle) and adds its canvas, or its SVG
// still when WebGL is missing, so pages without JavaScript carry no blank canvas.
const sceneRoot = document.getElementById('scene-root');
if (sceneRoot) mountScene(sceneRoot);

mountDemos(document);
