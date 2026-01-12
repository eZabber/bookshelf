// js/state.js
import { LS } from "./config.js";

// Live bindings (other modules can import these)
export let currentShelf = "read";
export let library = { read: [], wishlist: [], loans: [] };
export let filterState = { text: "", year: "", month: "", rating: "" };

// ALSO export a "state" object for modules that expect state.library, state.currentShelf etc.
// Uses getters/setters so it always reflects the live bindings above.
export const state = {
  get currentShelf() { return currentShelf; },
  set currentShelf(v) { currentShelf = v; },

  get library() { return library; },
  set library(v) { library = v; },

  get filterState() { return filterState; },
  set filterState(v) { filterState = v; }
};

function sanitizeLibrary(raw) {
  return {
    read: Array.isArray(raw?.read) ? raw.read : [],
    wishlist: Array.isArray(raw?.wishlist) ? raw.wishlist : [],
    loans: Array.isArray(raw?.loans) ? raw.loans : []
  };
}

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
  currentShelf = shelf;
}

export function setFilterState(next) {
  filterState = {
    text: String(next?.text ?? ""),
    year: String(next?.year ?? ""),
    month: String(next?.month ?? ""),
    rating: String(next?.rating ?? "")
  };
}
