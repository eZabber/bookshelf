// js/utils.js
import { normalizeStr } from "./dom-utils.js";

export function getAuthorName(book) {
  // If you later store multiple authors, you can join them here.
  return String(book?.authors?.[0]?.name || "Unknown");
}

export function safeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";

  try {
    const u = new URL(s, window.location.href);

    // Only allow http(s) image URLs
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";

    return u.href;
  } catch {
    return "";
  }
}

export function normKey(book) {
  const title = normalizeStr(book?.title);
  const author = normalizeStr(getAuthorName(book));

  // Prefer ISBN if present (best duplicate key)
  const isbn = String(book?.isbn || "")
    .replace(/[^0-9X]/gi, "")
    .toLowerCase();

  return isbn ? `${isbn}|${title}|${author}` : `${title}|${author}`;
}
