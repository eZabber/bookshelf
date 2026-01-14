import { CONFIG } from './config.js';

// Metadata normalization helper
const normalize = (data) => {
    let cover = data.imageLinks?.thumbnail || data.cover?.medium || data.cover?.small || null;
    if (cover && cover.startsWith('http:')) cover = cover.replace('http:', 'https:');

    return {
        title: data.title || '',
        author: Array.isArray(data.authors) ? data.authors.join(', ') : (data.authors || ''),
        publisher: data.publisher || '',
        year: data.publishedDate ? parseInt(data.publishedDate.substring(0, 4)) : null,
        coverUrl: cover,
        isbn: data.isbn || null,
        genres: data.categories || data.subjects || []
    };
};

// Open Library Search Fallback
const searchOpenLibrary = async (query) => {
    try {
        const q = encodeURIComponent(query);
        const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=10`);
        const data = await res.json();

        if (data.docs && data.docs.length > 0) {
            return data.docs.map(doc => {
                // Normalize OL search result
                let cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;
                return {
                    title: doc.title || '',
                    author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : (doc.author_name || ''),
                    publisher: Array.isArray(doc.publisher) ? doc.publisher[0] : (doc.publisher || ''),
                    year: doc.first_publish_year || (doc.publish_year ? doc.publish_year[0] : null),
                    coverUrl: cover,
                    isbn: doc.isbn ? doc.isbn[0] : null,
                    genres: doc.subject ? doc.subject.slice(0, 5) : []
                };
            });
        }
    } catch (e) { console.warn('OL Search failed', e); }
    return [];
};

/* --- 1. Search (Query) --- */
export const searchBooks = async (query) => {
    let results = [];

    // 1. Try Google Books
    try {
        const q = encodeURIComponent(query);
        const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=10&key=${CONFIG.API_KEY}`;
        const res = await fetch(url);

        if (res.status === 403) {
            console.error('Google Books API 403. Falling back to OpenLibrary.');
        } else {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                results = data.items.map(item => {
                    const info = item.volumeInfo;
                    const isbn13 = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
                    const isbn10 = info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
                    return normalize({ ...info, isbn: isbn13 || isbn10 });
                });
            }
        }
    } catch (e) {
        console.warn('Google Books search failed', e);
    }

    // 2. If no results or 403, try OpenLibrary
    if (results.length === 0) {
        const olResults = await searchOpenLibrary(query);
        if (olResults.length > 0) {
            results = olResults;
        }
    }

    return results;
};

/* --- 2. ISBN Lookup (Single) --- */

// Google Books API (ISBN)
const fetchGoogleBooks = async (isbn) => {
    try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${CONFIG.API_KEY}`;
        const res = await fetch(url);

        if (res.status === 403) {
            console.warn(`Google Books API 403 for ISBN ${isbn}. Check Key.`);
            return null;
        }

        const data = await res.json();
        if (data.totalItems > 0 && data.items[0].volumeInfo) {
            const info = data.items[0].volumeInfo;
            const isbn13 = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || isbn;
            return normalize({ ...info, isbn: isbn13 });
        }
    } catch (e) { console.warn('Google Books lookup failed', e); }
    return null;
};

// Open Library
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
                isbn: isbn
            });
        }
    } catch (e) { console.warn('OpenLibrary lookup failed', e); }
    return null;
};

export const fetchByIsbn = async (isbn) => {
    isbn = isbn.replace(/[^0-9X]/gi, '');
    let meta = await fetchGoogleBooks(isbn);

    if (!meta || !meta.coverUrl) {
        const olMeta = await fetchOpenLibrary(isbn);
        if (olMeta) {
            if (!meta) {
                meta = olMeta;
            } else if (!meta.coverUrl && olMeta.coverUrl) {
                meta.coverUrl = olMeta.coverUrl;
            }
        }
    }
    return meta;
};
