//# Entry point
import { $, addClick, setText, logError } from "./dom-utils.js";
import { currentLang, setCurrentLang, applyLanguageToUI } from "./i18n.js";
import { state, loadLibrary } from "./state.js";
import { renderBooks } from "./render.js";
import { openMenu, closeMenu, setActiveTab, setSyncStatus } from "./ui.js";
import { injectCloudControls } from "./init.js";
import { gapiLoaded, gisLoaded, isDriveSignedIn, signInDrive } from "./drive.js";
import { normalizeStr } from "./utils.js";

// expose ONLY these for Google script onload
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;

window.addEventListener("DOMContentLoaded", () => {
  try {
    // load data
    state.library = loadLibrary();

    // year in footer
    setText("year", new Date().getFullYear());

    // inject cloud buttons
    injectCloudControls();

    // language init
    const langSel = $("language-select");
    if (langSel) {
      langSel.value = currentLang;
      langSel.addEventListener("change", (e) => {
        setCurrentLang(e.target.value);
        applyLanguageToUI();
        renderBooks();
      });
    }
    applyLanguageToUI();

    // menu open/close
    addClick("menu-btn", openMenu);
    addClick("menu-overlay", closeMenu);

    // tabs
    document.querySelector(".tabs")?.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (!tab) return;
      setActiveTab(tab.id.replace("tab-", ""));
    });

    // auth
    addClick("auth-btn", signInDrive);

    // sync dot initial
    setSyncStatus(isDriveSignedIn() ? "synced" : "idle");

    // initial render
    renderBooks();

    console.log("App ready (modules)");
  } catch (e) {
    logError("Init failed", e);
    setSyncStatus("error");
  }
});
