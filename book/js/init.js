// js/init.js
import { $, addClick } from "./dom-utils.js";
import { setCurrentLang } from "./i18n.js";
import { renderBooks } from "./render.js";

/**
 * Menu open/close lives here (NOT in filters.js)
 */
export function openMenu() {
  const menu = $("side-menu");
  const overlay = $("menu-overlay");
  if (menu) menu.classList.add("open");
  if (overlay) overlay.classList.add("open");
}

export function closeMenu() {
  const menu = $("side-menu");
  const overlay = $("menu-overlay");
  if (menu) menu.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

export function initMenuWiring() {
  addClick("menu-btn", openMenu);
  addClick("menu-overlay", closeMenu);
}

/**
 * Theme toggle
 */
export function initThemeWiring() {
  const toggle = $("dark-mode-toggle");
  if (!toggle) return;

  // initial from localStorage
  const saved = localStorage.getItem("MBS_DARK") === "1";
  document.body.classList.toggle("dark-mode", saved);
  toggle.checked = saved;

  toggle.addEventListener("change", () => {
    const on = !!toggle.checked;
    document.body.classList.toggle("dark-mode", on);
    localStorage.setItem("MBS_DARK", on ? "1" : "0");
  });
}

/**
 * Language dropdown
 */
export function initLanguageWiring() {
  const sel = $("language-select");
  if (!sel) return;

  sel.addEventListener("change", () => {
    setCurrentLang(sel.value);
    renderBooks(); // rerender list + filter status strings etc.
  });
}

/**
 * Footer year
 */
export function initFooterYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
}

/**
 * If you inject Drive buttons etc. later, keep this as a safe hook.
 */
export function injectCloudControls() {
  // Optional placeholder – doesn’t break anything
}
