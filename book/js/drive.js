// js/drive.js
import { $ , toast } from "./dom-utils.js";
import { t } from "./i18n.js";
import { driveSignedIn, setDriveSignedIn } from "./state.js"; // if you don't have these, see state.js note below
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, DRIVE_SCOPES } from "./config.js";

let tokenClient = null;
let accessToken = null;

// Called by <script ... onload="gapiLoaded()">
export function gapiLoaded() {
  if (!window.gapi) return;
  window.gapi.load("client", async () => {
    try {
      if (!GOOGLE_API_KEY) return; // allow app without Drive
      await window.gapi.client.init({ apiKey: GOOGLE_API_KEY });
      // Optional: load Drive API if you actually use it later:
      // await window.gapi.client.load("drive", "v3");
    } catch (e) {
      console.error("gapi init failed", e);
    }
  });
}

// Called by <script ... onload="gisLoaded()">
export function gisLoaded(btn) {
  if (!btn) return;

  if (!GOOGLE_CLIENT_ID) {
    btn.disabled = true;
    btn.textContent = t("signIn");
    btn.title = "Google Client ID missing in config.js";
    return;
  }

  tokenClient = window.google?.accounts?.oauth2?.initTokenClient?.({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPES,
    callback: (resp) => {
      if (resp?.access_token) {
        accessToken = resp.access_token;
        setDriveSignedIn(true);
        btn.textContent = t("synced");
      } else {
        setDriveSignedIn(false);
        btn.textContent = t("signIn");
      }
    }
  });

  btn.disabled = false;
  btn.textContent = t("signIn");
  btn.title = "";
}

export function signInDrive(btn) {
  if (!btn) return;

  if (!tokenClient) {
    toast(t("sessionExpired"));
    btn.disabled = false;
    return;
  }

  try {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } catch (e) {
    console.error("signInDrive failed", e);
    toast(t("sessionExpired"));
  }
}

export function isDriveSignedIn() {
  return !!accessToken;
}
