import { showToast } from './dom-utils.js';
import { addBook, addBooks, getBooks, updateBook } from './storage.js';
import { fetchByIsbn } from './isbn.js';

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

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await ensurePapa();
            const books = getBooks();
            if (!books.length) { showToast('No books'); return; }
            const csvData = books.map(b => ({
                Title: b.title, Author: b.author, ISBN: b.isbn || '', Status: b.status,
                Rating: b.rating || 0, DateRead: b.dateRead || '', Notes: b.notes || '',
                Year: b.year || '', Added: b.addedAt, Genres: (b.genres || []).join(', '),

                // Loan Data
                LoanStatus: b.loanType || '',
                BorrowedFrom: (b.loanType === 'borrowed') ? (b.borrowedFromName || '') : '',
                LoanedTo: (b.loanType === 'loanedOut') ? (b.loanedToName || '') : '',
                DueDate: b.reminderDate || ''
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
    const booksToAdd = [];
    const trigger = document.getElementById('import-csv-trigger');

    for (const row of rows) {
        processed++;
        if (onProgress) onProgress(processed, rows.length);

        const title = row['Title'];
        if (!title) continue;
        let isbn = (row['ISBN13'] || row['ISBN'] || '').replace(/[^0-9X]/gi, '');

        if (isbn && dedupSet.has(isbn)) { skipped++; continue; }

        const book = {
            id: crypto.randomUUID(),
            title: title,
            author: row['Author'] || 'Unknown',
            isbn: isbn || null,
            coverUrl: null,
            status: 'read', // Default
            rating: 0,
            dateRead: null,
            year: null,
            publisher: row['Publisher'],
            genres: [],
            isAudiobook: false,
            addedAt: row['Added'] || new Date().toISOString(), // Use native Added date if exists
            source: 'Import',
            notes: row['Notes'] || ''
        };

        // --- DUAL FORMAT MAPPING ---

        // 1. STATUS
        if (row['Status']) {
            // Native Export
            book.status = row['Status'];
        } else if (row['Exclusive Shelf']) {
            // Goodreads
            const grShelf = row['Exclusive Shelf'];
            if (grShelf === 'to-read') book.status = 'wishlist';
            else if (grShelf === 'current-reading') book.status = 'read';
            else if (grShelf === 'on-deck') book.status = 'wishlist';
            else book.status = 'read';
        }

        // 2. RATING
        if (row['Rating']) book.rating = parseInt(row['Rating']) || 0;
        else if (row['My Rating']) book.rating = parseInt(row['My Rating']) || 0;

        // 3. DATES & YEAR
        const dateReadStr = row['DateRead'] || row['Date Read'];
        if (dateReadStr) book.dateRead = new Date(dateReadStr).toISOString();

        const yearStr = row['Year'] || row['Year Published'];
        if (yearStr) book.year = parseInt(yearStr);

        // 4. LOAN DATA (Native Only)
        if (row['LoanStatus']) {
            book.loanType = row['LoanStatus'];
            if (book.loanType === 'borrowed') {
                book.borrowedFromName = row['BorrowedFrom'];
                book.borrowedFromType = 'friend'; // Default for CSV import
            } else if (book.loanType === 'loanedOut') {
                book.loanedToName = row['LoanedTo'];
            }
            if (row['DueDate']) book.reminderDate = new Date(row['DueDate']).toISOString();

            // Ensure status is loan if loan data exists (backup integrity)
            if (book.loanType) book.status = 'loan';
        }

        // 5. GENRES (Native Only - Goodreads doesn't export them easily)
        if (row['Genres']) {
            book.genres = row['Genres'].split(',').map(s => s.trim()).filter(x => x);
        }

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
