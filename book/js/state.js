//# App state (pure state only)
import { LS } from "./config.js";

export const state = {
  currentShelf: "read",
  library: { read: [], wishlist: [], loans: [] },
  filterState: { text: "", year: "", month: "", rating: "" },

  // cloud / auth
  cloudFileId: localStorage.getItem(LS.CLOUD_FILE_ID) || null,
  appStatus: "idle",

  // camera
  html5QrCode: null,
  scanLocked: false,

  // modal
  pendingBook: null,

  // sync
  isSyncing: false,
  syncPending: false,
  uploadFailCount: 0
};

export function loadLibrary() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.LIB));
    if (raw && typeof raw === "object") {
      return {
        read: Array.isArray(raw.read) ? raw.read : [],
        wishlist: Array.isArray(raw.wishlist) ? raw.wishlist : [],
        loans: Array.isArray(raw.loans) ? raw.loans : []
      };
    }
  } catch {}
  return { read: [], wishlist: [], loans: [] };
}

export function persistLibrary() {
  localStorage.setItem(LS.LIB, JSON.stringify(state.library));
}
