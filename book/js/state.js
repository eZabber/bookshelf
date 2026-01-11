//# library, currentShelf, filterState, cloudFileId + load/persist
import { LS } from './config.js';

export let currentShelf = "read";
export let library = { read: [], wishlist: [], loans: [] };
export let filterState = { text: "", year: "", month: "", rating: "" };
export let cloudFileId = localStorage.getItem(LS.CLOUD_FILE_ID) || null;
export let html5QrCode = null;
export let scanLocked = false;
export let pendingBook = null;
export let isSyncing = false;
export let syncPending = false;
export let uploadFailCount = 0;
export let appStatus = "idle";

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
  localStorage.setItem(LS.LIB, JSON.stringify(library));
}

export function saveLibrary({ shouldSync = false, skipRender = false } = {}) {
  persistLibrary();
  updateShelfCounts();
  if (!skipRender) renderBooks(); // will be imported later
  if (shouldSync && isDriveSignedIn()) queueUpload(); // from drive.js
}

export function updateShelfCounts() {
  setText("count-read", library.read?.length || 0);
  setText("count-wishlist", library.wishlist?.length || 0);
  setText("count-loans", library.loans?.length || 0);
}
