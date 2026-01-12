// js/state.js
import { LS } from "./config.js";

/** Live bindings */
export let currentShelf = "read";
export let library = { read: [], wishlist: [], loans: [] };
export let filterState = { text: "", year: "", month: "", rating: "" };

/** Drive sync flags (drive.js imports these) */
export let isSyncing = false;
export let syncPending = false;

/** Optional flags some modules may use */
export let scanLocked = false;
export let pendingBook = null;

/** Compat wrapper */
export const state = {
  get currentShelf() { return currentShelf; },
  set currentShelf(v) { currentShelf = sanitizeShelf(v); },

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

/** API */
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

/** Drive setters (drive.js may call these) */
export function setIsSyncing(v) {
  isSyncing = !!v;
}

export function setSyncPending(v) {
  syncPending = !!v;
}

/** Optional helpers */
export function setScanLocked(v) {
  scanLocked = !!v;
}

export function setPendingBook(v) {
  pendingBook = v ?? null;
}
