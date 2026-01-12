// js/main.js
import { $, setText, addClick } from "./dom-utils.js";
import { currentLang, setCurrentLang, applyLanguageToUI } from "./i18n.js";
import { loadLibrary, setLibrary, setCurrentShelf } from "./state.js";
import { renderBooks, updateShelfCounts } from "./render.js";
import { openMenu, closeMenu } from "./init.js";
import { gapiLoaded, gisLoaded, signInDrive } from "./drive.js";
import { applyFilters, clearFilters } from "./filters.js";
import { handleManualAdd } from "./lookups.js";
import { startCamera, stopCamera } from "./camera.js";
import { closeModal, confirmAdd } from "./modal.js";

// ✅ expose Google callback hooks globally
window.gapiLoaded = gapiLoaded;
window.gisLoaded = () => gisLoaded($("auth-btn"));

window.addEventListener("DOMContentLoaded", () => {
  // Load local data safely
  const loaded = loadLibrary();
  setLibrary(loaded);

  // Menu open/close
  addClick("menu-btn", openMenu);
  addClick("menu-overlay", closeMenu);

  // Language
  $("language-select")?.addEventListener("change", (e) => {
    setCurrentLang(e.target.value);
    applyLanguageToUI();
    renderBooks();
  });

  // Filters
  addClick("btn-clear-filters", () => {
    clearFilters();
    renderBooks();
  });
  $("filter-text")?.addEventListener("input", () => { applyFilters(); renderBooks(); });
  $("filter-year")?.addEventListener("input", () => { applyFilters(); renderBooks(); });
  $("filter-month")?.addEventListener("change", () => { applyFilters(); renderBooks(); });
  $("filter-rating")?.addEventListener("change", () => { applyFilters(); renderBooks(); });

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
  addClick("auth-btn", (e) => signInDrive(e.target));

  // Footer year
  setText("year", new Date().getFullYear());

  // Initial UI
  setCurrentLang(currentLang);
  applyLanguageToUI();
  updateShelfCounts();
  renderBooks();
});
