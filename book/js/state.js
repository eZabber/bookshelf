// js/state.js
import { LS } from "./config.js";

export let currentShelf = "read";
export let library = { read: [], wishlist: [], loans: [] };
export let filterState = { text: "", year: "", month: "", rating: "" };

export function setLibrary(next) {
  // main.js will call this
  library = {
    read: Array.isArray(next?.read) ? next.read : [],
    wishlist: Array.isArray(next?.wishlist) ? next.wishlist : [],
    loans: Array.isArray(next?.loans) ? next.loans : []
  };
}

export function loadLibrary() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.LIB));
    if (raw && typeof raw === "object") return raw;
  } catch {}
  return { read: [], wishlist: [], loans: [] };
}

export function persistLibrary() {
  localStorage.setItem(LS.LIB, JSON.stringify(library));
}

export function setCurrentShelf(shelf) {
  currentShelf = shelf;
}
