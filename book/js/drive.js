//# gapiLoaded, gisLoaded, signInDrive, findCloudFileIfExists, ensureCloudFile, handleCloudSave, handleCloudLoad, queueUpload + multipart helpers
import { $ } from './dom-utils.js';
import { t } from './i18n.js';
import { toast, logError } from './dom-utils.js';
import { requireSignedInDrive, setSyncStatus, isSyncing, syncPending, uploadFailCount } from './state.js';
import { persistLibrary, library } from './state.js';

export function gapiLoaded() {
  if (!window.gapi?.load) {
    toast("Google API failed to load.");
    return;
  }
  window.gapi.load("client", async () => {
    try {
      await window.gapi.client.init({
        apiKey: DEVELOPER_KEY || undefined,
        discoveryDocs: DISCOVERY
      });
      gapiInited = true;
      maybeEnableAuth();
    } catch (e) {
      logError("GAPI Init Fail", e);
      setSyncStatus("error");
      toast("Google API init failed.");
    }
  });
}

export function gisLoaded() {
  if (!window.google?.accounts?.oauth2?.initTokenClient) {
    toast("Google sign-in failed to load.");
    return;
  }
  driveTokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: async (resp) => {
      if (resp?.error) {
        logError("Drive Auth Fail", resp);
        setSyncStatus("error");
        toast("Sign-in failed.");
        return;
      }
      window.gapi.client.setToken(resp);
      setSyncStatus("synced");
      await findCloudFileIfExists();
    }
  });
  gisInited = true;
  maybeEnableAuth();
}

export function signInDrive() {
  if (!driveTokenClient) return;
  setSyncStatus("working");
  driveTokenClient.requestAccessToken({ prompt: "" });
}

// ... rest of drive functions (findCloudFileIfExists, ensureCloudFile, handleCloudSave, handleCloudLoad, queueUpload, buildMultipartBody, driveMultipartCreate, driveMultipartUpdate, driveDownloadFile) - copy them here

export function isDriveSignedIn() {
  try {
    return !!window.gapi?.client?.getToken?.();
  } catch {
    return false;
  }
}

// Expose for Google API onload callbacks (required!)
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;
