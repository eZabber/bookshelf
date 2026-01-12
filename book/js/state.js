// js/state.js
import { LS } from "./config.js";

/**
 * ✅ Single source of truth + "compat exports"
 * This file exports BOTH:
 *  - live bindings (library/currentShelf/filterState etc.)
 *  - a `state` object (for modules that use state.library / state.currentShelf)
 *  - drive/sync flags that some modules import directly
 */

// -------------------- Core app state --------------------
export let currentShelf = "read";
export let library = { read: [], wishlist: [], loans: [] };
export let filterState = { text: "", year: "", month: "", rating: "" };

// -------------------- Drive / sync related (compat) --------------------
export let cloudFileId = localStorage.getItem(LS.CLOUD_FILE_ID) || null;

export let isSyncing = false;
export let syncPending = false;
export let uploadFailCount = 0;
export let appStatus = "idle";

// "signed in" flag for modules that want to gate Drive actions
export let driveSignedIn = false;

/**
 * Some modules import `requireSignedInDrive` from state.js.
 * Make it exist and behave sensibly:
 * - returns true if signed in
 * - false if not
 * drive.js should set driveSignedIn=true when auth succeeds.
 */
export function requireSignedInDrive() {
  return !!driveSignedIn;
}

// -------------------- `state` object compatibility --------------------
export const state = {
  get currentShelf() { return currentShelf; },
  set currentShelf(v) { currentShelf = String(v || "read"); },

  get library() { return library; },
  set library(v) { library = sanitizeLibrary(v); },

  get filterState() { return filterState; },
  set filterState(v) { filterState = sanitizeFilterState(v); },

  // drive/sync
  get cloudFileId() { return cloudFileId; },
  set cloudFileId(v) { cloudFileId = v || null; },

  get isSyncing() { return isSyncing; },
  set isSyncing(v) { isSyncing = !!v; },

  get syncPending() { return syncPending; },
  set syncPending(v) { syncPending = !!v; },

  get uploadFailCount() { return uploadFailCount; },
  set uploadFailCount(v) { uploadFailCount = Number(v || 0); },

  get appStatus() { return appStatus; },
  set appStatus(v) { appStatus = String(v || "idle"); },

  get driveSignedIn() { return driveSignedIn; },
  set driveSignedIn(v) { driveSignedIn = !!v; }
};

// -------------------- Helpers --------------------
function sanitizeLibrary(raw) {
  return {
    read: Array.isArray(raw?.read) ? raw.read : [],
    wishlist: Array.isArray(raw?.wishlist) ? raw.wishlist : [],
    loans: Array.isArray(raw?.loans) ? raw.loans : []
  };
}

function sanitizeFilterState(next) {
  return {
    text: String(next?.text ?? ""),
    year: String(next?.year ?? ""),
    month: String(next?.month ?? ""),
    rating: String(next?.rating ?? "")
  };
}

// -------------------- Public API --------------------
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
  currentShelf = String(shelf || "read");
}

export function setFilterState(next) {
  filterState = sanitizeFilterState(next);
}

export function setCloudFileId(id) {
  cloudFileId = id || null;
  if (cloudFileId) localStorage.setItem(LS.CLOUD_FILE_ID, cloudFileId);
  else localStorage.removeItem(LS.CLOUD_FILE_ID);
}

export function setIsSyncing(v) {
  isSyncing = !!v;
}

export function setSyncPending(v) {
  syncPending = !!v;
}

export function setDriveSignedIn(v) {
  driveSignedIn = !!v;
}

export function bumpUploadFailCount() {
  uploadFailCount += 1;
}

export function setAppStatus(v) {
  appStatus = String(v || "idle");
}
