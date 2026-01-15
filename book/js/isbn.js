import { CONFIG } from './config.js';

// Metadata normalization helper
const normalize = (data) => {
    let cover = data.imageLinks?.thumbnail || data.cover?.medium || data.cover?.small || data.coverUrl || null;
    if (cover && cover.startsWith('http:')) cover = cover.replace('http:', 'https:');

    // Finna specific cover handling
    if (data.finnaImage) {
        cover = `https://api.finna.fi${data.finnaImage}`;
    }

    return {
        title: data.title || '',
        author: Array.isArray(data.authors) ? data.authors.join(', ') : (data.authors || ''),
        publisher: data.publisher || '',
        year: data.year || (data.publishedDate ? parseInt(data.publishedDate.substring(0, 4)) : null),
        coverUrl: cover,
        isbn: data.isbn || null,
        genres: data.genres || data.categories || data.subjects || [],
        source: data.source || 'Unknown'
    };
};

/* --- API Implementations --- */

// 1. Open Library (Primary)
const searchOpenLibrary = async (query) => {
    try {
        const q = encodeURIComponent(query);
        const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=10`);
        const data = await res.json();

        if (data.docs && data.docs.length > 0) {
            return data.docs.map(doc => {
                let cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;
                return normalize({
                    title: doc.title,
                    authors: doc.author_name,
                    publisher: doc.publisher ? doc.publisher[0] : '',
                    year: doc.first_publish_year || (doc.publish_year ? doc.publish_year[0] : null),
                    coverUrl: cover,
                    isbn: doc.isbn ? doc.isbn[0] : null,
                    genres: doc.subject ? doc.subject.slice(0, 5) : [],
                    source: 'OpenLibrary'
                });
            });
        }
    } catch (e) { console.warn('OL Search failed', e); }
    return [];
};

const fetchOpenLibrary = async (isbn) => {
    try {
        const key = `ISBN:${isbn}`;
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=${key}&jscmd=data&format=json`);
        const data = await res.json();
        if (data[key]) {
            const info = data[key];
            return normalize({
                title: info.title,
                authors: info.authors?.map(a => a.name),
                publisher: info.publishers?.[0]?.name,
                publishedDate: info.publish_date,
                cover: info.cover,
                isbn: isbn,
                genres: info.subjects ? info.subjects.map(s => s.name).slice(0, 5) : [],
                source: 'OpenLibrary'
            });
        }
    } catch (e) { console.warn('OpenLibrary lookup failed', e); }
    return null;
};

// 2. Google Books (Secondary)
// 2. Google Books (Secondary)
const searchGoogleBooks = async (query) => {
    if (!CONFIG.API_KEY) return [];
    try {
        const q = encodeURIComponent(query);
        const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=10&key=${CONFIG.API_KEY}`;
        const res = await fetch(url);

        if (res.status === 403) {
            console.warn('Google Books API 403 Forbidden.');
            return [];
        }

        const data = await res.json();
        if (data.items && data.items.length > 0) {
            return data.items.map(item => {
                const info = item.volumeInfo;
                const isbn13 = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
                const isbn10 = info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
                return normalize({
                    ...info,
                    isbn: isbn13 || isbn10,
                    source: 'GoogleBooks'
                });
            });
        }
    } catch (e) { console.warn('Google Books search failed', e); }
    return [];
};

const fetchGoogleBooks = async (isbn) => {
    if (!CONFIG.API_KEY) return null;
    try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${CONFIG.API_KEY}`;
        const res = await fetch(url);
        if (res.status === 403) return null;

        const data = await res.json();
        if (data.totalItems > 0 && data.items[0].volumeInfo) {
            const info = data.items[0].volumeInfo;
            const isbn13 = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || isbn;
            return normalize({
                ...info,
                isbn: isbn13,
                source: 'GoogleBooks'
            });
        }
    } catch (e) { console.warn('Google Books lookup failed', e); }
    return null;
};

// 3. Finna API (Tertiary)
const searchFinna = async (query) => {
    try {
        const q = encodeURIComponent(query);
        const fields = 'title,authors,year,images,isbns,subjects,topic';
        const url = `https://api.finna.fi/v1/search?lookfor=${q}&field[]=${fields.split(',').join('&field[]=')}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.records && data.records.length > 0) {
            return data.records.map(rec => {
                const subjects = rec.subjects ? rec.subjects.flat() : [];
                const topics = rec.topic ? (Array.isArray(rec.topic) ? rec.topic : [rec.topic]) : [];
                return normalize({
                    title: rec.title,
                    authors: Array.isArray(rec.authors) ? rec.authors : (rec.authors ? [rec.authors] : []),
                    year: rec.year,
                    finnaImage: rec.images ? rec.images[0] : null,
                    isbn: rec.isbns ? rec.isbns[0] : null,
                    genres: [...new Set([...subjects, ...topics])],
                    source: 'Finna'
                });
            });
        }
    } catch (e) { console.warn('Finna search failed', e); }
    return [];
};

const fetchFinna = async (isbn) => {
    try {
        const url = `https://api.finna.fi/v1/search?lookfor=${isbn}&type=AllFields&field[]=title&field[]=authors&field[]=year&field[]=images&field[]=isbns&field[]=subjects&field[]=topic`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.records && data.records.length > 0) {
            const rec = data.records[0];
            const subjects = rec.subjects ? rec.subjects.flat() : [];
            const topics = rec.topic ? (Array.isArray(rec.topic) ? rec.topic : [rec.topic]) : [];
            return normalize({
                title: rec.title,
                authors: Array.isArray(rec.authors) ? rec.authors : (rec.authors ? [rec.authors] : []),
                year: rec.year,
                finnaImage: rec.images ? rec.images[0] : null,
                isbn: isbn,
                genres: [...new Set([...subjects, ...topics])],
                source: 'Finna'
            });
        }
    } catch (e) { }
    return null;
};

/* --- Main Exported Functions --- */

export const searchBooks = async (query) => {
    console.log(`Searching for "${query}"...`);

    // 1. Open Library
    let results = await searchOpenLibrary(query);
    if (results.length > 0) return results;

    // 2. Google Books
    results = await searchGoogleBooks(query);
    if (results.length > 0) return results;

    // 3. Finna
    results = await searchFinna(query);
    return results;
};

export const fetchByIsbn = async (isbn) => {
    isbn = isbn.replace(/[^0-9X]/gi, '');

    // 1. Open Library
    let meta = await fetchOpenLibrary(isbn);
    if (meta && meta.coverUrl) return meta;

    // 2. Google Books
    let gMeta = await fetchGoogleBooks(isbn);
    if (gMeta) {
        if (!meta) meta = gMeta;
        else {
            // Merge if OL data was partial
            if (!meta.coverUrl && gMeta.coverUrl) meta.coverUrl = gMeta.coverUrl;
            if (!meta.genres.length && gMeta.genres.length) meta.genres = gMeta.genres;
        }
    }

    if (meta && meta.coverUrl) return meta;

    // 3. Finna
    let fMeta = await fetchFinna(isbn);
    if (fMeta) {
        if (!meta) meta = fMeta;
        else {
            if (!meta.coverUrl && fMeta.coverUrl) meta.coverUrl = fMeta.coverUrl;
            if (!meta.title && fMeta.title) meta.title = fMeta.title; // Ensure title fill
            if (!meta.author && fMeta.author) meta.author = fMeta.author;
        }
    }

    return meta;
};
