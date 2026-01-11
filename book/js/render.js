//# Rendering
import { $ } from "./dom-utils.js";
import { t } from "./i18n.js";
import { state, persistLibrary } from "./state.js";
import { normalizeStr, safeUrl, getAuthorName } from "./utils.js";
import { setActiveTab } from "./ui.js";

export function updateShelfCounts() {
  const lib = state.library;
  $("count-read") && ($("count-read").textContent = String(lib.read?.length || 0));
  $("count-wishlist") && ($("count-wishlist").textContent = String(lib.wishlist?.length || 0));
  $("count-loans") && ($("count-loans").textContent = String(lib.loans?.length || 0));
}

function getVisibleBooks() {
  const allItems = Array.isArray(state.library[state.currentShelf])
    ? state.library[state.currentShelf]
    : [];

  const term = normalizeStr(state.filterState.text);
  const cleanTerm = term.replace(/[\s-]/g, "");

  if (!term && !state.filterState.year && !state.filterState.month && !state.filterState.rating) {
    return { allItems, visibleItems: allItems };
  }

  const visibleItems = allItems.filter((b) => {
    const titleLc = normalizeStr(b.title);
    const authorLc = normalizeStr(getAuthorName(b));
    const isbnLc = String(b.isbn || "").replace(/[\s-]/g, "").toLowerCase();

    const matchText =
      !term || titleLc.includes(term) || authorLc.includes(term) || isbnLc.includes(cleanTerm);

    const dateStr =
      state.currentShelf === "read" ? String(b.dateRead || "") :
      state.currentShelf === "loans" ? String(b.returnDate || "") : "";

    const matchYear = !state.filterState.year || dateStr.startsWith(state.filterState.year);
    const matchMonth =
      !state.filterState.month ||
      (dateStr.length >= 7 && dateStr.substring(5, 7) === state.filterState.month);

    const matchRating =
      !state.filterState.rating ||
      Number(b.rating || 0) === Number(state.filterState.rating);

    return matchText && matchYear && matchMonth && matchRating;
  });

  return { allItems, visibleItems };
}

function renderFilterStatus(allCount, visibleCount) {
  const statusEl = $("filter-status");
  if (!statusEl) return;

  if (allCount !== visibleCount) {
    statusEl.style.display = "flex";
    statusEl.textContent = "";

    const msg = t("filterStats")
      .replace("{0}", String(visibleCount))
      .replace("{1}", String(allCount));

    const left = document.createElement("span");
    left.textContent = msg;

    const right = document.createElement("span");
    right.className = "filter-clear-link";
    right.textContent = t("clearBtn");
    right.addEventListener("click", () => {
      state.filterState = { text: "", year: "", month: "", rating: "" };
      const ft = $("filter-text"); if (ft) ft.value = "";
      const fy = $("filter-year"); if (fy) fy.value = "";
      const fm = $("filter-month"); if (fm) fm.value = "";
      const fr = $("filter-rating"); if (fr) fr.value = "";
      renderBooks();
    });

    statusEl.append(left, right);
  } else {
    statusEl.style.display = "none";
  }
}

function createBookCard(book) {
  const li = document.createElement("li");
  li.className = "book-card";

  // thumb
  const coverUrl = safeUrl(book?.cover);
  if (coverUrl) {
    const img = document.createElement("img");
    img.className = "book-thumb";
    img.src = coverUrl;
    img.alt = "";
    img.onerror = () => (img.style.display = "none");
    li.appendChild(img);
  } else {
    const div = document.createElement("div");
    div.className = "book-thumb";
    div.style.background = "#ddd";
    li.appendChild(div);
  }

  const info = document.createElement("div");
  info.className = "book-info";

  const title = document.createElement("div");
  title.className = "book-title";
  title.textContent = book?.title || "Unknown";
  info.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "book-meta";
  meta.textContent = getAuthorName(book);
  info.appendChild(meta);

  li.appendChild(info);
  return li;
}

export function renderBooks() {
  const list = $("book-list");
  if (!list) return;

  list.textContent = "";

  const { allItems, visibleItems } = getVisibleBooks();
  updateShelfCounts();
  renderFilterStatus(allItems.length, visibleItems.length);

  visibleItems
    .slice()
    .reverse()
    .forEach((b) => list.appendChild(createBookCard(b)));
}
