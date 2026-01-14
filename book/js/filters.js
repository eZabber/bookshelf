import { $ } from './dom-utils.js';
import { getBooks } from './storage.js';
import { renderList } from './render.js';
import { STATE } from './state.js';

let filters = {
    title: '',
    author: '',
    year: '',
    readYear: '',
    rating: '',
    month: '',
    genre: '',
    sort: 'added-desc'
};

// Persistance
const loadFilters = () => {
    try {
        const saved = localStorage.getItem('mybookshelf_filters');
        if (saved) filters = { ...filters, ...JSON.parse(saved) };
    } catch (e) { }
};

const saveFilters = () => {
    localStorage.setItem('mybookshelf_filters', JSON.stringify(filters));
};

// Pure logic for filtering
const filterBooksLogic = (books) => {
    let visible = books;

    if (filters.title) {
        visible = visible.filter(b => b.title && b.title.toLowerCase().includes(filters.title));
    }
    if (filters.author) {
        visible = visible.filter(b => b.author && b.author.toLowerCase().includes(filters.author));
    }
    if (filters.year) {
        visible = visible.filter(b => b.year == filters.year);
    }
    if (filters.readYear) {
        visible = visible.filter(b => {
            if (!b.dateRead) return false;
            return new Date(b.dateRead).getFullYear() == parseInt(filters.readYear);
        });
    }
    if (filters.rating) {
        visible = visible.filter(b => (b.rating || 0) == parseInt(filters.rating));
    }
    if (filters.month) {
        visible = visible.filter(b => {
            const dateStr = b.dateRead || b.addedAt;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getMonth() == parseInt(filters.month);
        });
    }
    if (filters.keyword) { // Changed from genre
        visible = visible.filter(b => b.genres && b.genres.some(g => g.toLowerCase().includes(filters.keyword)));
    }
    return visible;
};

// Pure logic for sorting
const sortBooksLogic = (books) => {
    // Clone to sort
    const sorted = [...books];
    const s = filters.sort || 'added-desc';

    sorted.sort((a, b) => {
        if (s === 'title-asc') return (b.title || '').localeCompare(a.title || '');
        if (s === 'title-desc') return (a.title || '').localeCompare(b.title || '');
        if (s === 'author-asc') return (b.author || '').localeCompare(a.author || '');
        if (s === 'author-desc') return (a.author || '').localeCompare(b.author || '');
        if (s === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
        // Default: added-desc (newest first)
        const dateA = new Date(a.addedAt || 0);
        const dateB = new Date(b.addedAt || 0);
        return dateB - dateA; // Descending (Newest first)
    });

    return sorted;
};

export const filterBooks = (books) => {
    let res = filterBooksLogic(books);
    res = sortBooksLogic(res);
    return res;
};

export const initFiltersWiring = (onEdit) => {
    loadFilters();

    const titleInput = $('#filter-title');
    const authorInput = $('#filter-author');
    const yearSelect = $('#filter-year');
    const readYearSelect = $('#filter-read-year');
    const ratingSelect = $('#filter-rating');
    const monthSelect = $('#filter-month');
    const keywordInput = $('#filter-keyword');
    const sortSelect = $('#filter-sort');
    const clearBtn = $('#clear-filters-btn');

    // Populate Dymanic Filters (Years)
    const populateDynamic = () => {
        const books = getBooks();

        // Pub Years
        const years = [...new Set(books.map(b => b.year).filter(y => y))].sort((a, b) => b - a);
        const currYear = yearSelect.value;
        yearSelect.innerHTML = '<option value="">Pub. Year</option>';
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        });
        if (currYear) yearSelect.value = currYear;

        // Read Years
        if (readYearSelect) {
            const readYears = [...new Set(books
                .filter(b => b.dateRead)
                .map(b => new Date(b.dateRead).getFullYear())
            )].sort((a, b) => b - a);

            const currReadYear = readYearSelect.value;
            readYearSelect.innerHTML = '<option value="">Read Year</option>';
            readYears.forEach(y => {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                readYearSelect.appendChild(opt);
            });
            if (currReadYear) readYearSelect.value = currReadYear;
        }
    };

    populateDynamic();
    document.addEventListener('bookshelf-updated', populateDynamic);

    // Restore UI
    if (titleInput) titleInput.value = filters.title || '';
    if (authorInput) authorInput.value = filters.author || '';
    if (yearSelect) yearSelect.value = filters.year;
    if (readYearSelect) readYearSelect.value = filters.readYear;
    if (ratingSelect) ratingSelect.value = filters.rating;
    if (monthSelect) monthSelect.value = filters.month;
    if (keywordInput) keywordInput.value = filters.keyword || '';
    if (sortSelect) sortSelect.value = filters.sort;

    const apply = () => {
        if (titleInput) filters.title = titleInput.value.toLowerCase();
        if (authorInput) filters.author = authorInput.value.toLowerCase();
        filters.year = yearSelect.value;
        if (readYearSelect) filters.readYear = readYearSelect.value;
        filters.rating = ratingSelect.value;
        filters.month = monthSelect.value;
        if (keywordInput) filters.keyword = keywordInput.value.toLowerCase();
        if (sortSelect) filters.sort = sortSelect.value;

        saveFilters();

        const allBooks = getBooks();
        let visible = allBooks.filter(b => b.status === STATE.currentTab);

        visible = filterBooksLogic(visible);
        visible = sortBooksLogic(visible);

        renderList($('#main-content'), visible, onEdit, allBooks.filter(b => b.status === STATE.currentTab).length);
    };

    // Events
    [titleInput, authorInput, yearSelect, readYearSelect, ratingSelect, monthSelect, keywordInput, sortSelect].forEach(el => {
        if (el) el.addEventListener('input', apply);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (titleInput) titleInput.value = '';
            if (authorInput) authorInput.value = '';
            yearSelect.value = '';
            if (readYearSelect) readYearSelect.value = '';
            ratingSelect.value = '';
            monthSelect.value = '';
            if (keywordInput) keywordInput.value = '';
            if (sortSelect) sortSelect.value = 'added-desc';
            apply();
        });
    }

    return apply;
};

export const applyCurrentFilters = () => {
    // Legacy helper
};
