import { normalizeStr } from './dom-utils.js';

export function getAuthorName(book) {
  return String(book?.authors?.[0]?.name || "Unknown");
}

export function normKey(book) {
  const title = normalizeStr(book?.title);
  const author = normalizeStr(getAuthorName(book));
  return `${title}|${author}`;
}
