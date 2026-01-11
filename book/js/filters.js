//# applyFilters, clearFilters, getVisibleBooks
import { $ } from './dom-utils.js';
import { library, currentShelf, filterState } from './state.js';
import { normalizeStr, setText } from './dom-utils.js';
import { getAuthorName } from './utils.js'; // we'll create this

export function applyFilters() {
  const textEl = $("filter-text");
  const yEl = $("filter-year");
  const mEl = $("filter-month");
  const rEl = $("filter-rating");

  if (textEl) filterState.text = normalizeStr(textEl.value);
  if (yEl) filterState.year = String(yEl.value || "").replace(/[^\d]/g, "").slice(0, 4);
  if (mEl) filterState.month = mEl.value || "";
  if (rEl) filterState.rating = rEl.value || "";

  if (yEl) yEl.value = filterState.year;
}

export function clearFilters() {
  if ($("filter-text")) $("filter-text").value = "";
  if ($("filter-year")) $("filter-year").value = "";
  if ($("filter-month")) $("filter-month").value = "";
  if ($("filter-rating")) $("filter-rating").value = "";
  filterState = { text: "", year: "", month: "", rating: "" };
}

export function getVisibleBooks() {
  const allItems = Array.isArray(library[currentShelf]) ? library[currentShelf] : [];
  const term = normalizeStr(filterState.text);
  const cleanTerm = term.replace(/[\s-]/g, "");

  if (!term && !filterState.year && !filterState.month && !filterState.rating) {
    return { allItems, visibleItems: allItems };
  }

  const visibleItems = allItems.filter((b) => {
    const titleLc = normalizeStr(b.title);
    const authorLc = normalizeStr(getAuthorName(b));
    const isbnLc = String(b.isbn || "").replace(/[\s-]/g, "").toLowerCase();
    const matchText = !term || titleLc.includes(term) || authorLc.includes(term) || isbnLc.includes(cleanTerm);
    const dateStr = currentShelf === "read" ? String(b.dateRead || "") :
                    currentShelf === "loans" ? String(b.returnDate || "") : "";
    const matchYear = !filterState.year || dateStr.startsWith(filterState.year);
    const matchMonth = !filterState.month || (dateStr.length >= 7 && dateStr.substring(5, 7) === filterState.month);
    const matchRating = !filterState.rating || Number(b.rating || 0) === Number(filterState.rating);
    return matchText && matchYear && matchMonth && matchRating;
  });

  return { allItems, visibleItems };
}
