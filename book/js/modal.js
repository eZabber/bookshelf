// js/modal.js
import { $, setText, toast, safeUrl, makeId, todayISO } from "./dom-utils.js";
import { t } from "./i18n.js";
import { library, persistLibrary } from "./state.js";
import { normKey, getAuthorName } from "./utils.js";
import { stopCamera, getCameraState, setScanLocked } from "./camera.js";
import { renderBooks, updateShelfCounts } from "./render.js";

export let pendingBook = null;

export function showModal(book, scannedIsbn = "") {
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
  setScanLocked(false);

  const cam = getCameraState();
  if (cam.html5QrCode) stopCamera();
}

export function confirmAdd(targetShelf) {
  if (!pendingBook) return;

  const key = normKey(pendingBook);
  const allBooks = [...library.read, ...library.wishlist, ...library.loans];

  if (allBooks.some((b) => normKey(b) === key)) {
    toast(t("alreadyExists"));
    closeModal();
    return;
  }

  let retDate = "";
  if (targetShelf === "loans") {
    const row = $("loan-date-row");
    const input = $("modal-return-date");
    if (!row || !input) return toast("Missing loan fields.");

    // first click shows date row
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
    authors: Array.isArray(pendingBook.authors) && pendingBook.authors.length
      ? pendingBook.authors
      : [{ name: "Unknown" }],
    rating: 0,
    cover: safeUrl(pendingBook.cover) || null,
    dateRead: targetShelf === "read" ? todayISO() : "",
    returnDate: retDate,
    isAudio: !!$("modal-audio-check")?.checked,
    isbn: pendingBook.isbn || ""
  };

  library[targetShelf].push(newBook);

  persistLibrary();
  updateShelfCounts();
  closeModal();
  renderBooks();
}
