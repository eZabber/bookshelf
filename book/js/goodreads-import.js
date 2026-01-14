import { showToast } from './dom-utils.js';
import { addBook, addBooks, getBooks, updateBook } from './storage.js';
import { fetchByIsbn } from './isbn.js';

// ... (Papa check unchanged)

// ...

const processImport = async (rows, onProgress) => {
    let added = 0;
    let skipped = 0;
    const existingBooks = getBooks();
    const dedupSet = new Set(existingBooks.map(b => b.isbn).filter(x => x));
    let processed = 0;
    const booksToAdd = [];
    const trigger = document.getElementById('import-csv-trigger');

    for (const row of rows) {
        processed++;
        if (onProgress) onProgress(processed, rows.length);

        const title = row['Title'];
        if (!title) continue;
        let isbn = (row['ISBN13'] || row['ISBN'] || '').replace(/[^0-9X]/gi, '');

        if (isbn && dedupSet.has(isbn)) { skipped++; continue; }

        const grShelf = row['Exclusive Shelf'];
        let status = 'read';
        if (grShelf === 'to-read') status = 'wishlist';
        else if (grShelf === 'current-reading') status = 'read';
        else if (grShelf === 'on-deck') status = 'wishlist';

        const book = {
            id: crypto.randomUUID(),
            title: title,
            author: row['Author'] || 'Unknown',
            isbn: isbn || null,
            coverUrl: null,
            status: status,
            rating: parseInt(row['My Rating']) || 0,
            dateRead: row['Date Read'] ? new Date(row['Date Read']).toISOString() : null,
            year: row['Year Published'] ? parseInt(row['Year Published']) : null,
            publisher: row['Publisher'],
            genres: [],
            isAudiobook: false,
            addedAt: new Date().toISOString(),
            source: 'Import'
        };

        if (isbn) {
            try {
                await new Promise(r => setTimeout(r, 100)); // Rate limit
                const meta = await fetchByIsbn(isbn);
                if (meta) {
                    if (meta.coverUrl) book.coverUrl = meta.coverUrl;
                    if (!book.year && meta.year) book.year = meta.year;
                    if (!book.publisher && meta.publisher) book.publisher = meta.publisher;
                    if (meta.genres) book.genres = meta.genres;
                }
            } catch (e) { }
        }

        // Collect for batch save
        booksToAdd.push(book);
        if (isbn) dedupSet.add(isbn);
        added++;

        // Optional: Batch save every 50 to prevent memory bloom or huge final payload delay?
        // For now, save all at end is safer for atomic sync.
    }

    if (booksToAdd.length > 0) {
        onProgress && onProgress(rows.length, rows.length); // Finalize progress
        trigger.textContent = 'Saving to Database...';
        await addBooks(booksToAdd);
    }
    showToast(`Imported ${added} books.`);
};

export const fetchMissingCovers = async (onProgress) => {
    // Kept as helper if needed later, but unlinked from UI
    const books = getBooks();
    const missing = books.filter(b => b.isbn && (!b.coverUrl || !b.genres || b.genres.length === 0) && b.status !== 'bin');

    if (!missing.length) return;

    let count = 0;
    for (const book of missing) {
        count++;
        if (onProgress) onProgress(count, missing.length);
        try {
            await new Promise(r => setTimeout(r, 200));
            const meta = await fetchByIsbn(book.isbn);
            if (meta) {
                const updates = {};
                if (meta.coverUrl && !book.coverUrl) updates.coverUrl = meta.coverUrl;
                if (meta.genres && meta.genres.length > 0 && (!book.genres || book.genres.length === 0)) updates.genres = meta.genres;

                if (Object.keys(updates).length > 0) {
                    await updateBook(book.id, updates);
                }
            }
        } catch (e) { }
    }
    if (onProgress) showToast('Metadata updated');
};

export const startBackgroundCoverFetch = async () => {
    const books = getBooks();
    const missing = books.filter(b => b.isbn && (!b.coverUrl || !b.genres) && b.status !== 'bin');
    if (missing.length === 0) return;

    const batch = missing.slice(0, 5);
    console.log(`Auto-fetching data for ${batch.length} books...`);

    for (const book of batch) {
        try {
            await new Promise(r => setTimeout(r, 500));
            const meta = await fetchByIsbn(book.isbn);
            if (meta) {
                const updates = {};
                if (meta.coverUrl && !book.coverUrl) updates.coverUrl = meta.coverUrl;
                if (meta.genres) updates.genres = meta.genres;
                if (Object.keys(updates).length > 0) await updateBook(book.id, updates);
            }
        } catch (e) { console.warn(e); }
    }
};
