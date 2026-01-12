// js/camera.js
import { $ } from "./dom-utils.js";
import { toast } from "./dom-utils.js";

let qr = null;
let running = false;

export function getCameraState() {
  return { running };
}

export async function startCamera(onCode) {
  const readerEl = $("reader");
  const container = $("reader-container");
  if (!readerEl || !container) return;

  // html5-qrcode must be loaded globally via the script tag in HTML
  if (typeof Html5Qrcode === "undefined") {
    toast("html5-qrcode not loaded.");
    return;
  }

  if (!qr) qr = new Html5Qrcode("reader");

  container.style.display = "block";

  try {
    running = true;

    await qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (typeof onCode === "function") onCode(decodedText);
      }
    );
  } catch (err) {
    running = false;
    console.error(err);
    toast("Camera failed to start.");
  }
}

export async function stopCamera() {
  const container = $("reader-container");

  try {
    if (qr && running) {
      await qr.stop();
      await qr.clear();
    }
  } catch (err) {
    console.warn("stopCamera error:", err);
  } finally {
    running = false;
    if (container) container.style.display = "none";
  }
}
