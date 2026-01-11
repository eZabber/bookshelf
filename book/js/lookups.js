//# fetchOpenLibrary, fetchFinna, fetchGoogleBooks, searchAndPrompt, fetchAndPrompt, handleManualAdd
import { fetchWithTimeout } from './dom-utils.js';
import { t } from './i18n.js';
import { toast } from './dom-utils.js';
import { showModal } from './modal.js';

export async function fetchOpenLibrary(isbn) {
  try {
    const res = await fetchWithTimeout(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`
    );
    const data = await res.json();
    const key = `ISBN:${isbn}`;
    if (data?.[key]) {
      const b = data[key];
      return {
        title: b.title,
        authors: b.authors || [{ name: "Unknown" }],
        cover: b.cover?.medium || b.cover?.small || null,
        isbn
      };
    }
  } catch {}
  return null;
}

// ... similarly for fetchFinna and fetchGoogleBooks (copy your code)

export async function searchAndPrompt(query) {
  try {
    const res = await fetchWithTimeout(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`
    );
    const data = await res.json();
    if (data?.docs?.length) {
      const d = data.docs[0];
      showModal({
        title: d.title,
        authors: [{ name: d.author_name?.[0] || "?" }],
        cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
        isbn: d.isbn?.[0] || ""
      });
    } else {
      if (confirm(t("addManualQ"))) {
        const manual = promptManualBook({ seedTitle: query });
        if (manual) showModal(manual, manual.isbn || "");
      } else {
        toast(t("notFound"));
      }
    }
  } catch {
    toast(t("searchFailed"));
  }
}

export function promptManualBook({ isbn = "", seedTitle = "", seedAuthor = "" } = {}) {
  const title = window.prompt(t("enterTitle"), seedTitle || "")?.trim();
  if (!title) return null;
  const author = window.prompt(t("enterAuthor"), seedAuthor || "")?.trim() || "Unknown";
  return {
    title,
    authors: [{ name: author }],
    cover: null,
    isbn
  };
}

export async function fetchAndPrompt(rawIsbn) {
  const clean = String(rawIsbn).replace(/\D/g, "");
  if (![10, 13].includes(clean.length)) return toast(t("invalidIsbn"));
  const book = await fetchOpenLibrary(clean) || await fetchFinna(clean) || await fetchGoogleBooks(clean);
  if (book) {
    showModal(book, clean);
    return;
  }
  if (confirm(t("addManualQ"))) {
    const manual = promptManualBook({ isbn: clean });
    if (manual) showModal(manual, clean);
    else toast(t("notFound"));
  } else {
    toast(t("notFound"));
  }
}

export async function handleManualAdd() {
  const el = $("isbn-input");
  if (!el?.value) return;
  const val = el.value.trim();
  el.value = "";
  const isNum = /^[\d-]+$/.test(val);
  if (isNum) await fetchAndPrompt(val);
  else await searchAndPrompt(val);
}
