//# startCamera, stopCamera
import { $ } from './dom-utils.js';
import { t } from './i18n.js';
import { toast } from './dom-utils.js';
import { fetchAndPrompt } from './lookups.js';

export let html5QrCode = null;
export let scanLocked = false;

export async function startCamera() {
  if (html5QrCode) return;
  const c = $("reader-container");
  if (c) c.style.display = "block";
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
  } catch {
    try {
      await html5QrCode.start({ facingMode: "user" }, { fps: 10, qrbox: { width: 250, height: 250 } }, () => {});
    } catch {
      if (c) c.style.display = "none";
      toast(t("cameraError"));
      try { html5QrCode.clear(); } catch {}
      html5QrCode = null;
    }
  }
}

export async function stopCamera() {
  const c = $("reader-container");
  if (c) c.style.display = "none";
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch {}
    html5QrCode = null;
  }
}
