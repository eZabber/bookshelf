// js/filters.js
import { $ } from "./dom-utils.js";
import { state, setFilterState } from "./state.js";
import { renderBooks } from "./render.js";

export function applyFilters() {
  const next = {
    text: $("filter-text")?.value ?? "",
    year: $("filter-year")?.value ?? "",
    month: $("filter-month")?.value ?? "",
    rating: $("filter-rating")?.value ?? ""
  };
  setFilterState(next);
  renderBooks();
}

export function clearFilters() {
  setFilterState({ text: "", year: "", month: "", rating: "" });

  if ($("filter-text")) $("filter-text").value = "";
  if ($("filter-year")) $("filter-year").value = "";
  if ($("filter-month")) $("filter-month").value = "";
  if ($("filter-rating")) $("filter-rating").value = "";

  renderBooks();
}

export function initFilterWiring() {
  $("filter-text")?.addEventListener("input", applyFilters);
  $("filter-year")?.addEventListener("input", applyFilters);
  $("filter-month")?.addEventListener("change", applyFilters);
  $("filter-rating")?.addEventListener("change", applyFilters);

  $("btn-clear-filters")?.addEventListener("click", clearFilters);
}
