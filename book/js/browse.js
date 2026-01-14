import { $, showToast } from './dom-utils.js';
import { renderList } from './render.js';
import { filterBooks, sortBooks } from './filters.js';
import { getBooks, initStorage } from './storage.js';

import { initImport } from './goodreads-import.js';

export const initBrowse = () => {
    initImport();

    const listContainer = $('#book-list');
    const sortSelect = $('#sort-select');
    const searchInput = $('#filter-search');

    // State
    let currentSort = 'added-desc';
    let currentSearch = '';

    const refresh = () => {
        const books = getBooks();

        // Filter: Only "library" items for browse.html, OR handle all if unified?
        // Requirement: browse.html = Browse "Library"
        let filtered = filterBooks(books, {
            list: 'library',
            search: currentSearch
        });

        const sorted = sortBooks(filtered, currentSort);
        renderList(listContainer, sorted);
    };

    // Events
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            refresh();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            refresh();
        });
    }

    // Listen for global updates (e.g. from sync)
    document.addEventListener('bookshelf-updated', () => {
        refresh();
    });

    // Initial Load
    // initStorage is called by auth.js on success, but if we are already logged in/cached?
    // We can just try refresh immediately if data exists
    refresh();
};
