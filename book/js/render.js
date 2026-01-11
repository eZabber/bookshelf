//# createBookCard + all small builders + renderBooks + renderFilterStatus
import { $ } from './dom-utils.js';
import { t } from './i18n.js';
import { currentShelf } from './state.js';
import { getAuthorName, normKey } from './utils.js';

// No self-import here!

// All your create* functions here (createDotsMenu, createThumb, createBadges, createMeta, createIsbnPill, createRatingSelect, createActions, createInfo, createBookCard)
// ... paste them exactly as they were ...

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

export function closeAnyDropdowns(exceptEl = null) {
  document.querySelectorAll(".menu-dropdown.show").forEach((d) => {
    if (exceptEl && d === exceptEl) return;
    d.classList.remove("show");
  });
}
