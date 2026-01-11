//# createBookCard + all small builders + renderBooks + renderFilterStatus
import { $ } from './dom-utils.js';
import { t } from './i18n.js';
import { currentShelf } from './state.js';
import { getAuthorName, normKey } from './utils.js';
import { closeAnyDropdowns } from './render.js'; // self-reference for dropdowns

// All your create* functions here (createDotsMenu, createThumb, createBadges, createMeta, createIsbnPill, createRatingSelect, createActions, createInfo, createBookCard)

export function renderFilterStatus(allCount, visibleCount) {
  const statusEl = $("filter-status");
  if (!statusEl) return;
  if (allCount !== visibleCount) {
    statusEl.style.display = "flex";
    statusEl.textContent = "";
    const msg = t("filterStats").replace("{0}", String(visibleCount)).replace("{1}", String(allCount));
    const left = document.createElement("span");
    left.textContent = msg;
    const right = document.createElement("span");
    right.className = "filter-clear-link";
    right.textContent = t("clearBtn");
    right.addEventListener("click", clearFilters);
    statusEl.append(left, right);
  } else {
    statusEl.style.display = "none";
  }
}

export function renderBooks() {
  const list = $("book-list");
  if (!list) return;
  list.textContent = "";
  const { allItems, visibleItems } = getVisibleBooks();
  updateShelfCounts();
  renderFilterStatus(allItems.length, visibleItems.length);
  visibleItems.slice().reverse().forEach((b) => list.appendChild(createBookCard(b)));
}
