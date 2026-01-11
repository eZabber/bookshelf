//# $(), setText, addClick, toast, normalizeStr, safeUrl, etc.
export const $ = (id) => document.getElementById(id);

export function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = String(text ?? "");
}

export function addClick(id, handler) {
  const el = $(id);
  if (el) el.addEventListener("click", handler);
}

export function toast(msg, ms = 2500) {
  const el = $("debug-log");
  const text = String(msg ?? "");
  if (!el) return alert(text);
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), ms);
}

export function logError(msg, err) {
  console.error(msg, err);
}

export function normalizeStr(s) {
  return String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function safeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function fetchWithTimeout(url, opts = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const tId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } catch (e) {
    if (e?.name === "AbortError") throw new Error("timeout");
    throw e;
  } finally {
    clearTimeout(tId);
  }
}
