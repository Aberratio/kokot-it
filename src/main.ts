import './styles/main.css';
import { alternatePath, isLocale, localeFromPath, messages } from './i18n/index.ts';
import { mountScene } from './scene/index.ts';

// Shared entry for every page. The page's own HTML carries its content;
// this wires up the parts that are common to all locales.
const locale = localeFromPath(window.location.pathname);
const t = messages(locale);

const switcher = document.querySelector<HTMLAnchorElement>('[data-lang-switch]');
const target = t.langSwitch.target;
if (switcher && isLocale(target)) {
  switcher.href = alternatePath(window.location.pathname, target);
  switcher.textContent = t.langSwitch.label;
  switcher.hreflang = target;
}

const canvas = document.querySelector<HTMLCanvasElement>('[data-scene]');
if (canvas) mountScene(canvas);
