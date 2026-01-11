// Pure state only: no DOM, no render, no drive imports
import { LS } from "./config.js";

export const state = {
  currentShelf: "read",
  library: { read: [], wishlist: [], loans: [] },
  filterState: { text: "", year: "", month: "", rating: "" },

  // drive-related state values can still live here as data
  cloudFileId: localStorage.getItem(LS.CLOUD_FILE_ID) || null,

  // camera / modal
  html5QrCode: null,
  scanLocked: false,
  pendingBook: null,

  // sync flags
  isSyncing: false,
  syncPending: false,
  uploadFailCount: 0,
  appStatus: "idle"
};

// --------- Persistence ---------

export function loadLibraryFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.LIB));
    if (raw && typeof raw === "object") {
      state.library = {
        read: Array.isArray(raw.read) ? raw.read : [],
        wishlist: Array.isArray(raw.wishlist) ? raw.wishlist : [],
        loans: Array.isArray(raw.loans) ? raw.loans : []
      };
      return state.library;
    }
  } catch {}
  state.library = { read: [], wishlist: [], loans: [] };
  return state.library;
}

export function persistLibraryToStorage() {
  localStorage.setItem(LS.LIB, JSON.stringify(state.library));
}

// --------- Small setters (still pure) ---------

export function setShelf(shelf) {
  state.currentShelf = shelf;
}

export function setFilter(patch) {
  state.filterState = { ...state.filterState, ...patch };
}

export function setCloudFileId(id) {
  state.cloudFileId = id || null;
  if (id) localStorage.setItem(LS.CLOUD_FILE_ID, id);
  else localStorage.removeItem(LS.CLOUD_FILE_ID);
}
// state.js
export let library = { read: [], wishlist: [], loans: [] };

export function setLibrary(next) {
  library = next;
}
