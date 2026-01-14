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
        'filter.placeholder': 'Filter...',
        'msg.saved': 'Saved!',
        'msg.welcome': 'Welcome'
    },
    fi: {
        'app.title': 'Kirjahyllyni',
        'nav.add': 'Lisää Kirja',
        'nav.library': 'Kirjasto',
        'nav.reading': 'Luettu',
        'nav.future': 'Tulossa',
        'nav.wishlist': 'Toivelista',
        'nav.loans': 'Lainat',
        'nav.mode': 'Tumma tila',
        'scan.btn': 'Skannaa ISBN',
        'scan.found': 'ISBN Löytyi',
        'search.placeholder': 'Syötä ISBN...',
        'form.title': 'Otsikko',
        'form.author': 'Kirjailija',
        'form.save': 'Tallenna',
        'filter.placeholder': 'Suodata...',
        'msg.saved': 'Tallennettu!',
        'msg.welcome': 'Tervetuloa'
    },
    et: {
        'app.title': 'Minu Raamaturiiul',
        'nav.add': 'Lisa Raamat',
        'nav.library': 'Raamatukogu',
        'nav.reading': 'Loetud',
        'nav.future': 'Lugemisel',
        'nav.wishlist': 'Soovileht',
        'nav.loans': 'Laenud',
        'nav.mode': 'Tume režiim',
        'scan.btn': 'Skänni ISBN',
        'scan.found': 'ISBN Leitud',
        'search.placeholder': 'Sisesta ISBN...',
        'form.title': 'Pealkiri',
        'form.author': 'Autor',
        'form.save': 'Salvesta',
        'filter.placeholder': 'Filtreeri...',
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
