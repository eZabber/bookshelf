// js/render.js
//# Rendering
import { $ } from "./dom-utils.js";
import { t } from "./i18n.js";
import { library, currentShelf, filterState } from "./state.js";
import { normalizeStr } from "./dom-utils.js";
import { safeUrl, getAuthorName } from "./utils.js";

export function updateShelfCounts() {
  $("count-read") && ($("count-read").textContent = String(library.read?.length || 0));
  $("count-wishlist") && ($("count-wishlist").textContent = String(library.wishlist?.length || 0));
  $("count-loans") && ($("count-loans").textContent = String(library.loans?.length || 0));
}

function getVisibleBooks() {
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

    const matchText =
      !term || titleLc.includes(term) || authorLc.includes(term) || isbnLc.includes(cleanTerm);

    const dateStr =
      currentShelf === "read" ? String(b.dateRead || "") :
      currentShelf === "loans" ? String(b.returnDate || "") : "";

    const matchYear = !filterState.year || dateStr.startsWith(filterState.year);

    const matchMonth =
      !filterState.month ||
      (dateStr.length >= 7 && dateStr.substring(5, 7) === filterState.month);

    const matchRating =
      !filterState.rating || Number(b.rating || 0) === Number(filterState.rating);

    return matchText && matchYear && matchMonth && matchRating;
  });

  return { allItems, visibleItems };
}

function clearFiltersAndInputs() {
  // IMPORTANT: do not reassign filterState object — mutate fields
  filterState.text = "";
  filterState.year = "";
  filterState.month = "";
  filterState.rating = "";

  const ft = $("filter-text"); if (ft) ft.value = "";
  const fy = $("filter-year"); if (fy) fy.value = "";
  const fm = $("filter-month"); if (fm) fm.value = "";
  const fr = $("filter-rating"); if (fr) fr.value = "";
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
      clearFiltersAndInputs();
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
