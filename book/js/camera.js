//# startCamera, stopCamera, getCameraState
import { $ } from "./dom-utils.js";
import { t } from "./i18n.js";
import { toast } from "./dom-utils.js";
import { fetchAndPrompt } from "./lookups.js";

export let html5QrCode = null;
export let scanLocked = false;

export function getCameraState() {
  return { html5QrCode, scanLocked };
}

export async function startCamera() {
  if (html5QrCode) return;

  const c = $("reader-container");
  if (c) c.style.display = "block";

  // Important: library must be available on window as Html5Qrcode
  if (!window.Html5Qrcode) {
    toast(t("cameraError"));
    if (c) c.style.display = "none";
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

  try {
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
  } catch (e1) {
    // fallback to front camera
    try {
      await html5QrCode.start(
        { facingMode: "user" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        () => {}
      );
    } catch (e2) {
      toast(t("cameraError"));
      try { await html5QrCode.clear(); } catch {}
      html5QrCode = null;
      if (c) c.style.display = "none";
    }
  }
}

export async function stopCamera() {
  const c = $("reader-container");

  if (!html5QrCode) {
    if (c) c.style.display = "none";
    scanLocked = false;
    return;
  }

  try { await html5QrCode.stop(); } catch {}
  try { await html5QrCode.clear(); } catch {}

  html5QrCode = null;
  scanLocked = false;

  if (c) c.style.display = "none";
}
