// js/state.js
import { LS } from "./config.js";

/**
 * Central app state.
 * IMPORTANT:
 * - Keep both live bindings (export let ...) AND a `state` object wrapper
 *   because different modules in your project expect one or the other.
 * - Also exports sync flags used by drive.js.
 */

// -------------------------
// Live bindings (preferred)
// -------------------------
export let currentShelf = "read";
export let library = { read: [], wishlist: [], loans: [] };
export let filterState = { text: "", year: "", month: "", rating: "" };

// Drive/Cloud sync flags (drive.js expects these)
export let isSyncing = false;
export let syncPending = false;

// Optional scanning/modal flags (some older modules might expect these)
export let scanLocked = false;
export let pendingBook = null;

// -------------------------
// `state` object wrapper (compat)
// -------------------------
// Some modules import { state } and access state.library etc.
// Using getters/setters keeps it always in sync with live bindings.
export const state = {
  get currentShelf() { return currentShelf; },
  set currentShelf(v) { currentShelf = String(v || "read"); },

  get library() { return library; },
  set library(v) { library = sanitizeLibrary(v); },

  get filterState() { return filterState; },
  set filterState(v) { setFilterState(v); },

  get isSyncing() { return isSyncing; },
  set isSyncing(v) { isSyncing = !!v; },

  get syncPending() { return syncPending; },
  set syncPending(v) { syncPending = !!v; },

  get scanLocked() { return scanLocked; },
  set scanLocked(v) { scanLocked = !!v; },

  get pendingBook() { return pendingBook; },
  set pendingBook(v) { pendingBook = v ?? null; }
};

// -------------------------
// Helpers
// -------------------------
function sanitizeLibrary(raw) {
  return {
    read: Array.isArray(raw?.read) ? raw.read : [],
    wishlist: Array.isArray(raw?.wishlist) ? raw.wishlist : [],
    loans: Array.isArray(raw?.loans) ? raw.loans : []
  };
}

function sanitizeShelf(s) {
  const v = String(s || "").toLowerCase();
  if (v === "read" || v === "wishlist" || v === "loans") return v;
  return "read";
}

// -------------------------
// Library persistence
// -------------------------
export function setLibrary(next) {
  library = sanitizeLibrary(next);
}

export function loadLibrary() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.LIB));
    return sanitizeLibrary(raw);
  } catch {
    return { read: [], wishlist: [], loans: [] };
  }
}

export function persistLibrary() {
  localStorage.setItem(LS.LIB, JSON.stringify(library));
}

// -------------------------
// Shelf + filters
// -------------------------
export function setCurrentShelf(shelf) {
  currentShelf = sanitizeShelf(shelf);
}

export function setFilterState(next) {
  filterState = {
    text: String(next?.text ?? ""),
    year: String(next?.year ?? ""),
    month: String(next?.month ?? ""),
    rating: String(next?.rating ?? "")
  };
}

// -------------------------
// Drive sync setters (nice API)
// -------------------------
export function setIsSyncing(v) {
  isSyncing = !!v;
}

export function setSyncPending(v) {
  syncPending = !!v;
}

// -------------------------
// Optional helpers used by other modules
// -------------------------
export function setScanLocked(v) {
  scanLocked = !!v;
}

export function setPendingBook(v) {
  pendingBook = v ?? null;
}
