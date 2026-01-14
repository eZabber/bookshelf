import { $ } from './dom-utils.js';
import { getBooks } from './storage.js';
import { renderList } from './render.js';
import { STATE } from './state.js';

let filters = {
    search: '',
    year: '',
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

export const initFiltersWiring = () => {
    loadFilters();

    const searchInput = $('#filter-search');
    const yearSelect = $('#filter-year');
    const ratingSelect = $('#filter-rating');
    const monthSelect = $('#filter-month');
    const genreSelect = $('#filter-genre');
    const sortSelect = $('#filter-sort');
    const clearBtn = $('#clear-filters-btn');

    // Populate Dymanic Filters (Years & Genres)
    const populateDynamic = () => {
        const books = getBooks();

        // Years
        const years = [...new Set(books.map(b => b.year).filter(y => y))].sort((a, b) => b - a);
        const currYear = yearSelect.value;
        yearSelect.innerHTML = '<option value="">All Years</option>';
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        });
        if (currYear) yearSelect.value = currYear;

        // Genres
        // Flatten all genres from all books
        const allGenres = books.flatMap(b => b.genres || []);
        // Count frequency? Or just unique?
        const uniqueGenres = [...new Set(allGenres)].sort();

        const currGenre = genreSelect ? genreSelect.value : '';
        if (genreSelect) {
            genreSelect.innerHTML = '<option value="">All Genres</option>';
            uniqueGenres.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g;
                opt.textContent = g;
                genreSelect.appendChild(opt);
            });
            if (currGenre) genreSelect.value = currGenre;
        }
    };

    populateDynamic();
    document.addEventListener('bookshelf-updated', populateDynamic);

    // Restore UI
    if (searchInput) searchInput.value = filters.search;
    if (yearSelect) yearSelect.value = filters.year;
    if (ratingSelect) ratingSelect.value = filters.rating;
    if (monthSelect) monthSelect.value = filters.month;
    if (genreSelect) genreSelect.value = filters.genre;
    if (sortSelect) sortSelect.value = filters.sort;

    const apply = () => {
        filters.search = searchInput.value.toLowerCase();
        filters.year = yearSelect.value;
        filters.rating = ratingSelect.value;
        filters.month = monthSelect.value;
        if (genreSelect) filters.genre = genreSelect.value;
        if (sortSelect) filters.sort = sortSelect.value;

        saveFilters();

        const allBooks = getBooks();
        let visible = allBooks.filter(b => b.status === STATE.currentTab);

        // Filter
        visible = filterBooksLogic(visible);

        // Sort
        visible = sortBooksLogic(visible);

        renderList($('#main-content'), visible, null, allBooks.filter(b => b.status === STATE.currentTab).length);
    };

    // Events
    [searchInput, yearSelect, ratingSelect, monthSelect, genreSelect, sortSelect].forEach(el => {
        if (el) el.addEventListener('input', apply);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            yearSelect.value = '';
            ratingSelect.value = '';
            monthSelect.value = '';
            if (genreSelect) genreSelect.value = '';
            if (sortSelect) sortSelect.value = 'added-desc';
            apply();
        });
    }

    return apply;
};

// Pure logic for filtering
const filterBooksLogic = (books) => {
    let visible = books;

    if (filters.search) {
        visible = visible.filter(b =>
            (b.title && b.title.toLowerCase().includes(filters.search)) ||
            (b.author && b.author.toLowerCase().includes(filters.search))
        );
    }
    if (filters.year) {
        visible = visible.filter(b => b.year == filters.year);
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
    if (filters.genre) {
        visible = visible.filter(b => b.genres && b.genres.includes(filters.genre));
    }
    return visible;
};

// Pure logic for sorting
const sortBooksLogic = (books) => {
    // Clone to sort
    const sorted = [...books];
    const s = filters.sort || 'added-desc';

    sorted.sort((a, b) => {
        if (s === 'title-asc') return (a.title || '').localeCompare(b.title || '');
        if (s === 'title-desc') return (b.title || '').localeCompare(a.title || '');
        if (s === 'author-asc') return (a.author || '').localeCompare(b.author || '');
        if (s === 'author-desc') return (b.author || '').localeCompare(a.author || '');
        if (s === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
        // Default: added-desc (newest first)
        // Parse dates to handle ISO strings correct
        const dateA = new Date(a.addedAt || 0);
        const dateB = new Date(b.addedAt || 0);
        return dateB - dateA;
    });

    return sorted;
};

// Export for init reference if needed, but internally used
export const filterBooks = (books) => {
    // This function signature is being used in init.js: filterBooks(books) -> filteredBooks
    // It assumes sorting happens here too? 
    // Init.js calls: filtered = filterBooks(filtered)
    // So distinct Logic functions are good, but we need to respect the public API `filterBooks`.

    let res = filterBooksLogic(books);
    res = sortBooksLogic(res);
    return res;
};

// Persistance
const loadFilters = () => {
    try {
        const saved = localStorage.getItem('mybookshelf_filters');
        if (saved) filters = JSON.parse(saved);
    } catch (e) { }
};

const saveFilters = () => {
    localStorage.setItem('mybookshelf_filters', JSON.stringify(filters));
};

export const initFiltersWiring = () => {
    loadFilters();

    const searchInput = $('#filter-search');
    const yearSelect = $('#filter-year');
    const ratingSelect = $('#filter-rating');
    const monthSelect = $('#filter-month');
    const clearBtn = $('#clear-filters-btn');

    // Populate years (dynamic)
    const populateYears = () => {
        const books = getBooks();
        const years = [...new Set(books.map(b => b.year).filter(y => y))].sort((a, b) => b - a);
        const currentVal = yearSelect.value;

        yearSelect.innerHTML = '<option value="">All Years</option>';
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        });
        yearSelect.value = currentVal; // Restore selection if valid
    };

    populateYears();
    document.addEventListener('bookshelf-updated', populateYears);

    // Restore UI values
    if (searchInput) searchInput.value = filters.search;
    if (yearSelect) yearSelect.value = filters.year;
    if (ratingSelect) ratingSelect.value = filters.rating;
    if (monthSelect) monthSelect.value = filters.month;

    const apply = () => {
        filters.search = searchInput.value.toLowerCase();
        filters.year = yearSelect.value;
        filters.rating = ratingSelect.value;
        filters.month = monthSelect.value;

        saveFilters();

        // Re-render current tab with new filters
        const allBooks = getBooks();
        // First filter by Tab (STATUS)
        let visible = allBooks.filter(b => b.status === STATE.currentTab);

        // Then apply extra filters
        if (filters.search) {
            visible = visible.filter(b =>
                (b.title && b.title.toLowerCase().includes(filters.search)) ||
                (b.author && b.author.toLowerCase().includes(filters.search))
            );
        }

        if (filters.year) {
            visible = visible.filter(b => b.year == filters.year);
        }

        if (filters.rating) {
            visible = visible.filter(b => (b.rating || 0) == parseInt(filters.rating));
        }

        if (filters.month) {
            // Month filter on dateRead or addedAt? Not specified, dateRead implies Read tab.
            // Let's assume dateRead if present, else addedAt? 
            // Valid requirement: "Month filter".
            // Implementation: Check dateRead month.
            visible = visible.filter(b => {
                const dateStr = b.dateRead || b.addedAt;
                if (!dateStr) return false;
                const d = new Date(dateStr);
                return d.getMonth() == parseInt(filters.month);
            });
        }

        renderList($('#main-content'), visible, null, allBooks.filter(b => b.status === STATE.currentTab).length);
    };

    // Events
    [searchInput, yearSelect, ratingSelect, monthSelect].forEach(el => {
        if (el) el.addEventListener('input', apply);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            yearSelect.value = '';
            ratingSelect.value = '';
            monthSelect.value = '';
            apply();
        });
    }

    // Export apply function if init needs to call it on tab switch
    // Actually init.js calls renderList directly. We should probably expose `getFilteredBooks`?
    // Or better: subscribe to state in filters.js and handle render here?
    // For now, let's export a function `applyFilters` that init can call.
    return apply;
};

// Helper for external re-render
export const applyCurrentFilters = () => {
    // This duplicates logic in apply(), refactor ideally.
    // Quick fix: re-call the event handler logic if possible or just duplicate the filter chain.
    // Since initFiltersWiring returns apply, the caller (init.js) can store it.

    // Actually, simpler: init.js calls renderList manually on tab switch. 
    // It SHOULD call something that respects filters.
    // Let's export `filterBooks(books)`
};

export const filterBooks = (books) => {
    // Expects books already filtered by TAB/STATUS
    let visible = books;
    if (filters.search) {
        visible = visible.filter(b =>
            (b.title && b.title.toLowerCase().includes(filters.search)) ||
            (b.author && b.author.toLowerCase().includes(filters.search))
        );
    }
    if (filters.year) {
        visible = visible.filter(b => b.year == filters.year);
    }
    if (filters.rating) {
        visible = visible.filter(b => (b.rating || 0) == parseInt(filters.rating));
    }
    if (filters.month) {
        visible = visible.filter(b => {
            const dateStr = b.dateRead || b.addedAt; // Fallback to addedAt for non-read items
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getMonth() == parseInt(filters.month);
        });
    }
    return visible;
};
