//# UI helpers: menu + setActiveTab + sync status
import { $ } from "./dom-utils.js";
import { t } from "./i18n.js";
import { state } from "./state.js";
import { renderBooks } from "./render.js";

export function openMenu() {
  $("side-menu")?.classList.add("open");
  $("menu-overlay")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeMenu() {
  $("side-menu")?.classList.remove("open");
  $("menu-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
}

export function setActiveTab(shelf) {
  state.currentShelf = shelf;

  ["read", "wishlist", "loans"].forEach((s) => {
    $(`tab-${s}`)?.classList.toggle("active", s === shelf);
  });

  closeMenu();
  renderBooks();
}

export function setSyncStatus(newState) {
  state.appStatus = newState;
  const dot = $("sync-dot");
  const btn = $("auth-btn");

  if (dot) {
    if (newState === "working") dot.style.background = "#f1c40f";
    else if (newState === "synced") dot.style.background = "#2ecc71";
    else if (newState === "error") dot.style.background = "#e74c3c";
    else dot.style.background = "#bbb";
  }

  if (btn) {
    if (newState === "working") btn.textContent = t("working");
    else if (newState === "synced") btn.textContent = t("synced");
    else btn.textContent = t("signIn");
  }
}
