// js/state.js
import { LS } from "./config.js";

/**
 * ✅ Single source of truth + "compat exports"
 * - live bindings (currentShelf, library, filterState, etc.)
 * - `state` object (state.library / state.currentShelf style)
 * - Drive/sync flags + setters that drive.js expects
 *
 * IMPORTANT: No DOM access and no i18n here (prevents circular imports).
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
export let appStatus = "idle"; // "idle" | "working" | "synced" | "error"

export let driveSignedIn = false;

// -------------------- state object (compat for modules using state.*) --------------------
export const state = {
  get currentShelf() { return currentShelf; },
  set currentShelf(v) { currentShelf = String(v || "read"); },

  get library() { return library; },
  set library(v) { library = sanitizeLibrary(v); },

  get filterState() { return filterState; },
  set filterState(v) { filterState = sanitizeFilterState(v); },

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

// -------------------- helpers --------------------
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

function emit(name, detail) {
  // light-weight notification system (no imports)
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// -------------------- Library persistence --------------------
export function setLibrary(next) {
  library = sanitizeLibrary(next);
  emit("library-changed", library);
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

// -------------------- Shelf & filter setters --------------------
export function setCurrentShelf(shelf) {
  currentShelf = String(shelf || "read");
  emit("shelf-changed", currentShelf);
}

export function setFilterState(next) {
  filterState = sanitizeFilterState(next);
  emit("filter-changed", filterState);
}

// -------------------- Drive / sync setters (these stop the “missing export” errors) --------------------
export function setCloudFileId(id) {
  cloudFileId = id || null;
  try {
    localStorage.setItem(LS.CLOUD_FILE_ID, cloudFileId || "");
  } catch {}
  emit("cloudfile-changed", cloudFileId);
}

// some modules import this name specifically
export function requireSignedInDrive() {
  return !!driveSignedIn;
}

// drive.js often wants to update sync status
export function setSyncStatus(nextStatus) {
  appStatus = String(nextStatus || "idle");

  // convenience: keep isSyncing consistent if you want
  if (appStatus === "working") isSyncing = true;
  if (appStatus === "synced" || appStatus === "idle" || appStatus === "error") isSyncing = false;

  emit("sync-status", appStatus);
}

// optional helpers (harmless if unused)
export function setIsSyncing(v) {
  isSyncing = !!v;
  emit("syncing-changed", isSyncing);
}

export function setSyncPending(v) {
  syncPending = !!v;
  emit("syncpending-changed", syncPending);
}

export function incUploadFailCount() {
  uploadFailCount = Number(uploadFailCount || 0) + 1;
  emit("uploadfail-changed", uploadFailCount);
}

export function resetUploadFailCount() {
  uploadFailCount = 0;
  emit("uploadfail-changed", uploadFailCount);
}
