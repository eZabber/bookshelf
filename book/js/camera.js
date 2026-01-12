// js/camera.js
import { $ } from "./dom-utils.js";
import { toast } from "./dom-utils.js";
import { t } from "./i18n.js";
import { fetchAndPrompt } from "./lookups.js";

export let html5QrCode = null;
export let scanLocked = false;

export function getCameraState() {
  return { html5QrCode, scanLocked };
}

export function setScanLocked(val) {
  scanLocked = !!val;
}

export async function startCamera() {
  const c = $("reader-container");
  if (c) c.style.display = "block";

  try {
    if (!window.Html5Qrcode) {
      toast(t("cameraError") || "Camera library not loaded.");
      if (c) c.style.display = "none";
      return;
    }

    if (html5QrCode) return;

    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (txt) => {
        if (scanLocked) return;
        scanLocked = true;
        await stopCamera();
        await fetchAndPrompt(txt);
      }
    );
  } catch (err) {
    // fallback
    try {
      await html5QrCode.start(
        { facingMode: "user" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (txt) => {
          if (scanLocked) return;
          scanLocked = true;
          await stopCamera();
          await fetchAndPrompt(txt);
        }
      );
    } catch (e2) {
      toast(t("cameraError") || "Camera error.");
      if (c) c.style.display = "none";
      try { await html5QrCode?.clear(); } catch {}
      html5QrCode = null;
      scanLocked = false;
    }
  }
}

export async function stopCamera() {
  const c = $("reader-container");
  try {
    if (html5QrCode) {
      try { await html5QrCode.stop(); } catch {}
      try { await html5QrCode.clear(); } catch {}
    }
  } finally {
    html5QrCode = null;
    scanLocked = false;
    if (c) c.style.display = "none";
  }
}
