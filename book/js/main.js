// js/main.js
import { $, setText, addClick, toast } from "./dom-utils.js";
import { setLanguage, currentLang } from "./i18n.js";
import { loadLibrary, setLibrary, setCurrentShelf } from "./state.js";
import { renderBooks, updateShelfCounts } from "./render.js";
import { openMenu, closeMenu, initMenuWiring } from "./init.js";
import { gapiLoaded, gisLoaded, signInDrive } from "./drive.js";
import { applyFilters, clearFilters } from "./filters.js";
import { handleManualAdd } from "./lookups.js";
import { startCamera, stopCamera } from "./camera.js";
import { showModal, closeModal, confirmAdd } from "./modal.js";

// ✅ expose Google callback hooks globally
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;

window.addEventListener("DOMContentLoaded", () => {
  // Load local data safely
  const loaded = loadLibrary();
  setLibrary(loaded);

  // Menu open/close
  addClick("menu-btn", openMenu);
  addClick("menu-overlay", closeMenu);

  // Language
  $("language-select")?.addEventListener("change", (e) => setLanguage(e.target.value));

  // Filters
  addClick("btn-clear-filters", clearFilters);
  $("filter-text")?.addEventListener("input", applyFilters);
  $("filter-year")?.addEventListener("input", applyFilters);
  $("filter-month")?.addEventListener("change", applyFilters);
  $("filter-rating")?.addEventListener("change", applyFilters);

  // Tabs
  document.querySelector(".tabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    const shelf = tab.id.replace("tab-", "");
    setCurrentShelf(shelf);
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    tab.classList.add("active");
    renderBooks();
  });

  // Add/Search
  addClick("btn-add", handleManualAdd);
  $("isbn-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleManualAdd();
  });

  // Camera
  addClick("btn-scan", startCamera);
  addClick("btn-stop-camera", stopCamera);

  // Modal
  addClick("modal-cancel", closeModal);
  addClick("modal-add-read", () => confirmAdd("read"));
  addClick("modal-add-wish", () => confirmAdd("wishlist"));
  addClick("modal-add-loan", () => confirmAdd("loans"));
  addClick("modal-overlay", (e) => {
    if (e.target?.id === "modal-overlay") closeModal();
  });

  // Auth
  addClick("auth-btn", signInDrive);

  // Footer year
  setText("year", new Date().getFullYear());

  // Initial UI
  setLanguage(currentLang);
  updateShelfCounts();
  renderBooks();
});
