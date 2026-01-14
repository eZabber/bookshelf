export const translations = {
    en: {
        'app.title': 'MyBookShelf',
        'nav.add': 'Add Book',
        'nav.library': 'Library',
        'nav.reading': 'Read', // Tab name match?
        'nav.future': 'To Read',
        'nav.wishlist': 'Wishlist', // New
        'nav.loans': 'Loans', // New
        'nav.mode': 'Dark Mode',
        'scan.btn': 'Scan ISBN',
        'scan.found': 'ISBN Found',
        'search.placeholder': 'Enter ISBN...',
        'form.title': 'Title',
        'form.author': 'Author',
        'form.save': 'Save Book',
        'filter.title': 'Filter by Title...',
        'filter.author': 'Filter by Author...',
        'filter.keyword': 'Filter by Keyword...',
        'filter.year': 'Pub. Year',
        'filter.readYear': 'Read Year',
        'filter.rating': 'All Ratings',
        'filter.month': 'All Months',
        'filter.language': 'Language',
        'filter.clear': 'Clear Filters',
        'filter.sort': 'Sort',
        'sort.newest': 'Recently Added',
        'sort.az': 'Title (A-Z)',
        'sort.za': 'Title (Z-A)',
        'sort.author_az': 'Author (A-Z)',
        'sort.author_za': 'Author (Z-A)',
        'sort.rating_hl': 'Rating (High-Low)',
        'stats.read': 'Read',
        'stats.wishlist': 'Wishlist',
        'stats.loan': 'Loan',
        'month.0': 'January', 'month.1': 'February', 'month.2': 'March', 'month.3': 'April',
        'month.4': 'May', 'month.5': 'June', 'month.6': 'July', 'month.7': 'August',
        'month.8': 'September', 'month.9': 'October', 'month.10': 'November', 'month.11': 'December',
        'btn.import': 'Import Goodreads CSV',
        'btn.export': 'Export CSV',
        'btn.delete': 'Delete All Data',
        'menu.stats': 'Library Stats',
        'menu.filters': 'Filters',
        'msg.saved': 'Saved!',
        'msg.welcome': 'Welcome'
    },
    fi: {
        'app.title': 'Kirjahyllyni',
        'nav.add': 'Lisää Kirja',
        'nav.library': 'Kirjasto',
        'nav.reading': 'Luettu',
        // ...
        'btn.delete': 'Poista Kaikki Tiedot',
        'menu.stats': 'Kirjaston Tilastot',
        'menu.filters': 'Suodattimet',
        'msg.saved': 'Tallennettu!',
        'msg.welcome': 'Tervetuloa'
    },
    et: {
        'app.title': 'Minu Raamaturiiul',
        'nav.add': 'Lisa Raamat',
        'nav.library': 'Raamatukogu',
        'nav.reading': 'Loetud',
        // ...
        'btn.delete': 'Kustuta Kõik Andmed',
        'menu.stats': 'Raamatukogu Statistika',
        'menu.filters': 'Filtrid',
        'msg.saved': 'Salvestatud!',
        'msg.welcome': 'Tere tulemast'
    }
};

// Default logic
const getBrowserLang = () => {
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith('fi')) return 'fi';
    if (navLang.startsWith('et')) return 'et';
    return 'en';
};

let currentLang = localStorage.getItem('lang') || getBrowserLang();

export const t = (key) => {
    return translations[currentLang][key] || key;
};

export const setLang = (lang) => {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        applyTranslations();
        document.dispatchEvent(new Event('language-changed'));
    }
};

export const applyTranslations = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Update selector UI if exists
    const selector = document.getElementById('lang-select');
    if (selector) selector.value = currentLang;
};

export const initI18n = () => {
    applyTranslations();

    // Wiring handled by init.js if selector exists, or we attach here
    const select = document.getElementById('lang-select');
    if (select) {
        select.value = currentLang;
        select.addEventListener('change', (e) => {
            setLang(e.target.value);
        });
    }
};
