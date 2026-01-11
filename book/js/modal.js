// modal.js — showModal, closeModal, confirmAdd
import { $, setText, toast, makeId, todayISO, safeUrl } from "./dom-utils.js";
import { t } from "./i18n.js";
import { state } from "./state.js";
import { normKey, getAuthorName } from "./utils.js";
import { setActiveTab } from "./ui.js";
import { stopCamera } from "./camera.js";
import { saveLibrary } from "./storage.js"; // <-- see note below

let pendingBook = null;

export function showModal(book = {}, scannedIsbn = "") {
  pendingBook = { ...book };
  if (scannedIsbn) pendingBook.isbn = scannedIsbn;

  setText("modal-title", pendingBook.title || "Unknown");
  setText("modal-author", getAuthorName(pendingBook));
  setText("modal-isbn", pendingBook.isbn ? `ISBN: ${pendingBook.isbn}` : "");

  const audioCheck = $("modal-audio-check");
  if (audioCheck) audioCheck.checked = false;

  const loanRow = $("loan-date-row");
  if (loanRow) loanRow.style.display = "none";

  const returnInput = $("modal-return-date");
  if (returnInput) returnInput.value = "";

  const img = $("modal-img");
  const cover = safeUrl(pendingBook.cover);
  if (img) {
    if (cover) {
      img.src = cover;
      img.style.display = "block";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
    }
  }

  const overlay = $("modal-overlay");
  if (overlay) overlay.style.display = "flex";
}

export function closeModal() {
  const overlay = $("modal-overlay");
  if (overlay) overlay.style.display = "none";

  const loanRow = $("loan-date-row");
  if (loanRow) loanRow.style.display = "none";

  pendingBook = null;

  // release scan lock
  state.scanLocked = false;

  // stop camera safely
  stopCamera();
}

export function confirmAdd(targetShelf) {
  if (!pendingBook) return;

  // Duplicate detection across all shelves
  const key = normKey(pendingBook);
  const allBooks = [
    ...(state.library.read || []),
    ...(state.library.wishlist || []),
    ...(state.library.loans || [])
  ];

  if (allBooks.some((b) => normKey(b) === key)) {
    toast(t("alreadyExists"));
    closeModal();
    return;
  }

  // Loans: 2-step UX for picking return date
  let retDate = "";
  if (targetShelf === "loans") {
    const row = $("loan-date-row");
    const input = $("modal-return-date");
    if (!row || !input) return toast("Missing loan fields.");

    if (row.style.display === "none") {
      row.style.display = "flex";
      const d = new Date();
      d.setDate(d.getDate() + 14);
      input.value = d.toISOString().split("T")[0];
      return;
    }

    retDate = input.value;
    if (!retDate) return toast(t("dateRequired"));
  }

  const newBook = {
    id: makeId(),
    title: pendingBook.title || "Unknown",
    authors:
      Array.isArray(pendingBook.authors) && pendingBook.authors.length
        ? pendingBook.authors
        : [{ name: "Unknown" }],
    rating: 0,
    cover: safeUrl(pendingBook.cover) || null,
    dateRead: targetShelf === "read" ? todayISO() : "",
    returnDate: retDate,
    isAudio: !!$("modal-audio-check")?.checked,
    isbn: pendingBook.isbn || ""
  };

  state.library[targetShelf].push(newBook);

  closeModal();
  setActiveTab(targetShelf);

  // Persist + optional cloud sync
  saveLibrary({ shouldSync: true, skipRender: true });
}
