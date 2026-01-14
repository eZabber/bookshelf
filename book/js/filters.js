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

// ... (load/save unchanged if compatible, but I need to replace the whole logic block or serve targeted chunks? replace_file_content works on chunks.)
// I will use replace_file_content on specific blocks or the whole file if easier.
// The file is small enough to be careful.

// Logic Block Update
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
    // ...

    // Init Block Update
    const titleInput = $('#filter-title');
    const authorInput = $('#filter-author');
    const yearSelect = $('#filter-year');
    const readYearSelect = $('#filter-read-year');
    const ratingSelect = $('#filter-rating');
    const monthSelect = $('#filter-month');
    const genreSelect = $('#filter-genre');
    const sortSelect = $('#filter-sort');
    const clearBtn = $('#clear-filters-btn');

    // Populate Dymanic Filters (Years & Genres)
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

        // Genres ...
        // ...

        // Restore UI
        if (titleInput) titleInput.value = filters.title || '';
        if (authorInput) authorInput.value = filters.author || '';
        if (yearSelect) yearSelect.value = filters.year;
        if (readYearSelect) readYearSelect.value = filters.readYear;
        // ...

        const apply = () => {
            if (titleInput) filters.title = titleInput.value.toLowerCase();
            if (authorInput) filters.author = authorInput.value.toLowerCase();
            filters.year = yearSelect.value;
            if (readYearSelect) filters.readYear = readYearSelect.value;
            filters.rating = ratingSelect.value;
            // ...

            // Events
            [titleInput, authorInput, yearSelect, readYearSelect, ratingSelect, monthSelect, genreSelect, sortSelect].forEach(el => {
                if (el) el.addEventListener('input', apply);
            });

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (titleInput) titleInput.value = '';
                    if (authorInput) authorInput.value = '';
                    yearSelect.value = '';
                    if (readYearSelect) readYearSelect.value = '';
                    ratingSelect.value = '';
                    // ...

                    export const applyCurrentFilters = () => {
                        // Legacy helper
                    };
