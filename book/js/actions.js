//# moveToRead, moveToWishlist, deleteBook, updateRating, updateReadDate, hardReset, magicLinkCalendar
import { t } from './i18n.js';
import { library, currentShelf, saveLibrary, setActiveTab } from './state.js';
import { todayISO } from './dom-utils.js';

export function moveToRead(id) {
  const fromShelf = library.wishlist.find((b) => b.id === id) ? "wishlist" : "loans";
  const idx = library[fromShelf].findIndex((b) => b.id === id);
  if (idx === -1) return;
  const book = library[fromShelf][idx];
  library[fromShelf].splice(idx, 1);
  book.dateRead = todayISO();
  book.returnDate = "";
  book.rating = 0;
  library.read.push(book);
  setActiveTab("read");
  saveLibrary({ shouldSync: true, skipRender: true });
}

export function moveToWishlist(id) {
  const idx = library.read.findIndex((b) => b.id === id);
  if (idx === -1) return;
  const book = library.read[idx];
  library.read.splice(idx, 1);
  book.dateRead = "";
  book.rating = 0;
  library.wishlist.push(book);
  setActiveTab("wishlist");
  saveLibrary({ shouldSync: true, skipRender: true });
}

export function deleteBook(id) {
  if (!confirm(t("delete"))) return;
  library[currentShelf] = library[currentShelf].filter((b) => b.id !== id);
  saveLibrary({ shouldSync: true });
}

export function updateRating(id, val) {
  const book = library.read.find((b) => b.id === id);
  if (!book) return;
  book.rating = Number(val);
  saveLibrary({ shouldSync: true });
}

export function updateReadDate(id, newDate) {
  const book = library.read.find((b) => b.id === id);
  if (!book) return;
  book.dateRead = newDate;
  saveLibrary({ shouldSync: true });
}

export function hardReset() {
  if (!confirm("Reset?")) return;
  localStorage.clear();
  location.reload();
}
