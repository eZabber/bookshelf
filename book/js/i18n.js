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
        'filter.sort': 'Sort',
        'sort.newest': 'Recently Added',
        'sort.az': 'Title (A-Z)',
        'sort.za': 'Title (Z-A)',
        'sort.author_az': 'Author (A-Z)',
        'sort.author_za': 'Author (Z-A)',
        'sort.rating_hl': 'Rating (High-Low)',
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
        'filter.title': 'Suodata otsikolla...',
        'filter.author': 'Suodata kirjailijalla...',
        'filter.keyword': 'Suodata avainsanalla...',
        'filter.year': 'Julk. Vuosi',
        'filter.readYear': 'Luettu Vuonna',
        'filter.rating': 'Kaikki Arviot',
        'filter.sort': 'Järjestä',
        'sort.newest': 'Viimeksi Lisätty',
        'sort.az': 'Otsikko (A-Ö)',
        'sort.za': 'Otsikko (Ö-A)',
        'sort.author_az': 'Kirjailija (A-Ö)',
        'sort.author_za': 'Kirjailija (Ö-A)',
        'sort.rating_hl': 'Arvio (Korkein)',
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
        'filter.title': 'Filtreeri pealkirjaga...',
        'filter.author': 'Filtreeri autoriga...',
        'filter.keyword': 'Filtreeri märksõnaga...',
        'filter.year': 'Ilmumisaasta',
        'filter.readYear': 'Loetud Aastal',
        'filter.rating': 'Kõik Hinnangud',
        'filter.sort': 'Sorteeri',
        'sort.newest': 'Hiljuti Lisatud',
        'sort.az': 'Pealkiri (A-Ü)',
        'sort.za': 'Pealkiri (Ü-A)',
        'sort.author_az': 'Autor (A-Ü)',
        'sort.author_za': 'Autor (Ü-A)',
        'sort.rating_hl': 'Hinnang (Kõrgeim)',
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
