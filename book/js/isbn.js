
// Metadata normalization helper
const normalize = (data) => {
    return {
        title: data.title || '',
        author: Array.isArray(data.authors) ? data.authors.join(', ') : (data.authors || ''),
        publisher: data.publisher || '',
        year: data.publishedDate ? parseInt(data.publishedDate.substring(0, 4)) : null,
        coverUrl: data.imageLinks?.thumbnail || data.cover?.medium || data.cover?.small || null,
        isbn: data.isbn || null
    };
};

/* --- 1. Search (Query) --- */
export const searchBooks = async (query) => {
    try {
        const q = encodeURIComponent(query);
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=10`);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            return data.items.map(item => {
                const info = item.volumeInfo;
                const isbn13 = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
                const isbn10 = info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
                return normalize({ ...info, isbn: isbn13 || isbn10 });
            });
        }
    } catch (e) {
        console.warn('Google Books search failed', e);
    }
    return [];
};

/* --- 2. ISBN Lookup (Single) --- */

// Google Books API (ISBN)
const fetchGoogleBooks = async (isbn) => {
    try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
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
