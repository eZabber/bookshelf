//# Entry point: imports everything, wires events

import { $, addClick, setText, logError } from "./dom-utils.js";
import { setLanguage, getCurrentLang } from "./i18n.js";
import { loadLibrary, setLibrary } from "./state.js";
import { renderBooks } from "./render.js";
import { injectCloudControls } from "./init.js";
import { gapiLoaded, gisLoaded, isDriveSignedIn } from "./drive.js";
import { setSyncStatus } from "./ui.js"; // wherever you keep it

// Expose ONLY what Google scripts call
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;

window.addEventListener("DOMContentLoaded", () => {
  try {
    // Load local data into state
    const lib = loadLibrary();
    setLibrary(lib);              // <-- IMPORTANT (no "library =" assignment)

    // Build cloud buttons
    injectCloudControls();

    // Apply language to UI
    setLanguage(getCurrentLang()); // <-- IMPORTANT (no "currentLang" free var)

    // Sync dot/button initial state
    setSyncStatus(isDriveSignedIn() ? "synced" : "idle");

    // Render initial list
    renderBooks();

    // TODO: wire the rest of your events here...
    // addClick("btn-add", handleManualAdd), etc.

    setText("year", new Date().getFullYear());
  } catch (e) {
    logError("Init failed", e);
  }
});
