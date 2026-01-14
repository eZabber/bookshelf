import { $ } from './dom-utils.js';
import { renderList } from './render.js';
import { getBooks } from './storage.js';
import { filterBooks, sortBooks } from './filters.js';

export const initSimpleList = (listType) => {
    const listContainer = $('#book-list');

    const refresh = () => {
        const books = getBooks();
        const filtered = filterBooks(books, { list: listType });
        // Default sort for these lists: Added desc? Or maybe manual order later?
        // Let's stick to added-desc for now.
        const sorted = sortBooks(filtered, 'added-desc');
        renderList(listContainer, sorted);
    };

    document.addEventListener('bookshelf-updated', refresh);
    refresh();
};
