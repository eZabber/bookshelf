import { showToast } from './dom-utils.js';
import { addBook, getBooks, updateBook } from './storage.js';
import { fetchByIsbn } from './isbn.js';

// Access global Papa from CDN
// const Papa = window.Papa; 

const ensurePapa = async () => {
    if (window.Papa) return;
    return new Promise((resolve, reject) => {
        if (document.querySelector('#papa-script')) {
            const check = setInterval(() => {
                if (window.Papa) { clearInterval(check); resolve(); }
            }, 100);
            return;
        }
        const script = document.createElement('script');
        script.id = 'papa-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

export const initImportWiring = () => {
    const trigger = document.getElementById('import-csv-trigger');
    const fileInput = document.getElementById('import-file');
    const exportBtn = document.getElementById('export-csv-btn');
    const updateCoversBtn = document.getElementById('update-covers-btn');

    if (trigger && fileInput) {
        trigger.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            trigger.textContent = 'Importing...';
            trigger.style.pointerEvents = 'none';

            try {
                await ensurePapa();
                window.Papa.parse(file, {
                    header: true, skipEmptyLines: true,
                    complete: async (results) => {
                        await processImport(results.data, (c, t) => trigger.textContent = `Importing ${c}/${t}...`);
                        trigger.textContent = 'Import Goodreads CSV';
                        trigger.style.pointerEvents = 'auto';
                        fileInput.value = '';
                    },
                    error: (err) => { console.error(err); showToast('CSV Error'); trigger.textContent = 'Import Goodreads CSV'; trigger.style.pointerEvents = 'auto'; }
                });
            } catch (e) { showToast('Parser Error'); trigger.style.pointerEvents = 'auto'; }
        });
    }

    // Manual update button removed from UI, so listener removed.
    // Kept functionality in startBackgroundCoverFetch.

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await ensurePapa();
            const books = getBooks();
            if (!books.length) { showToast('No books'); return; }
            const csvData = books.map(b => ({
                Title: b.title, Author: b.author, ISBN: b.isbn || '', Status: b.status,
                Rating: b.rating || 0, DateRead: b.dateRead || '', Notes: b.notes || '',
                Year: b.year || '', Added: b.addedAt, Genres: (b.genres || []).join(', ')
            }));
            const csv = window.Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `mybookshelf_export_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
        });
    }
};

const processImport = async (rows, onProgress) => {
    let added = 0;
    let skipped = 0;
    const existingBooks = getBooks();
    const dedupSet = new Set(existingBooks.map(b => b.isbn).filter(x => x));
    let processed = 0;

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
                await new Promise(r => setTimeout(r, 100));
                const meta = await fetchByIsbn(isbn);
                if (meta) {
                    if (meta.coverUrl) book.coverUrl = meta.coverUrl;
                    if (!book.year && meta.year) book.year = meta.year;
                    if (!book.publisher && meta.publisher) book.publisher = meta.publisher;
                    if (meta.genres) book.genres = meta.genres;
                }
            } catch (e) { }
        }

        await addBook(book);
        if (isbn) dedupSet.add(isbn);
        added++;
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
