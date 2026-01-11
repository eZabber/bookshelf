//# Entry point: imports everything, wires events
import { $ } from './dom-utils.js';
import { t } from './i18n.js';
import { library, loadLibrary } from './state.js';
import { setLanguage } from './i18n.js';
import { renderBooks } from './render.js';
import { injectCloudControls } from './init.js'; // if separate
import { gapiLoaded, gisLoaded } from './drive.js';

// Expose for Google
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;

// Init
window.addEventListener("DOMContentLoaded", () => {
  library = loadLibrary();
  injectCloudControls();
  setLanguage(currentLang);
  renderBooks();
  // All other wiring...
});
