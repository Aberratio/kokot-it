import './styles/main.css';
import './styles/content.css';
import { mountDemos } from './demo.ts';
import { mountScene } from './scene/index.ts';

// Shared entry for every page. The copy, navigation and language switch are rendered
// into static HTML at build time (src/content/), so everything here is enhancement.

const canvas = document.querySelector<HTMLCanvasElement>('[data-scene]');
if (canvas) mountScene(canvas);

mountDemos(document);
