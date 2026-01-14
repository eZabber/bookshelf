import { fetchByIsbn } from './isbn.js';
import { updateBook } from './storage.js';

// ... (ensurePapa kept) ...

export const initImportWiring = () => {
    const trigger = document.getElementById('import-csv-trigger');
    const fileInput = document.getElementById('import-file');
    const exportBtn = document.getElementById('export-csv-btn');
    const updateCoversBtn = document.getElementById('update-covers-btn');

    if (!trigger || !fileInput) return;

    trigger.addEventListener('click', () => {
        fileInput.click();
    });

    // Valid wiring for missing covers
    if (updateCoversBtn) {
        updateCoversBtn.addEventListener('click', async () => {
            if (confirm('This will search for covers for all books that contain an ISBN but no cover. This may take a while. Continue?')) {
                updateCoversBtn.textContent = 'Updating...';
                updateCoversBtn.style.pointerEvents = 'none';
                await fetchMissingCovers((curr, total) => {
                    updateCoversBtn.textContent = `Updating ${curr}/${total}...`;
                });
                updateCoversBtn.textContent = 'Fetch Missing Covers';
                updateCoversBtn.style.pointerEvents = 'auto';
            }
        });
    }

    // Export Wiring (kept same)
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            // ... existing export logic ... (retained via partial match if possible or assume implied? I must provide full content if replacing block)
            // I will use a separate replace for export block if needed, but here I am replacing the whole initImportWiring + processImport to be safe and clean.
            // Actually, the previous tool call failed because I tried to match a large block and failed.
            // I should replace specific blocks.
        });
    }
    // ...
};

// ... I will use multiple ReplaceChunks to be safer.

export const fetchMissingCovers = async (onProgress) => {
    const books = getBooks();
    const missing = books.filter(b => b.isbn && !b.coverUrl && b.status !== 'bin');
    if (missing.length === 0) {
        showToast('No books need covers.');
        return;
    }

    let processed = 0;
    for (const book of missing) {
        processed++;
        if (onProgress) onProgress(processed, missing.length);

        try {
            await new Promise(r => setTimeout(r, 200)); // Rate limit
            const meta = await fetchByIsbn(book.isbn);
            if (meta && meta.coverUrl) {
                await updateBook(book.id, { coverUrl: meta.coverUrl });
            }
        } catch (e) { console.warn(e); }
    }
    showToast(`Updated ${processed} books.`);
};

// Silent version for auto-start
export const startBackgroundCoverFetch = async () => {
    const books = getBooks();
    const missing = books.filter(b => b.isbn && !b.coverUrl && b.status !== 'bin');
    if (missing.length === 0) return;

    // Limit to 5 per session to avoid rate limits/slowdown
    const batch = missing.slice(0, 5);
    console.log(`Auto-fetching covers for ${batch.length} books...`);

    for (const book of batch) {
        try {
            await new Promise(r => setTimeout(r, 500)); // Conservative delay
            const meta = await fetchByIsbn(book.isbn);
            if (meta && meta.coverUrl) {
                await updateBook(book.id, { coverUrl: meta.coverUrl });
            }
        } catch (e) { console.warn(e); }
    }
};
const Papa = window.Papa;

// Helper to ensure PapaParse is loaded
const ensurePapa = async () => {
    if (window.Papa) return;
    return new Promise((resolve, reject) => {
        if (document.querySelector('#papa-script')) {
            // Already loading?
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

    if (!trigger || !fileInput) return;

    trigger.addEventListener('click', () => {
        fileInput.click();
    });

    // Export Wiring
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await ensurePapa();
            const books = getBooks();
            if (!books || books.length === 0) {
                showToast('No books to export');
                return;
            }

            // Transform for CSV
            const csvData = books.map(b => ({
                Title: b.title,
                Author: b.author,
                ISBN: b.isbn || '',
                Status: b.status,
                Rating: b.rating || 0,
                DateRead: b.dateRead || '',
                Notes: b.notes || '',
                Year: b.year || '',
                Added: b.addedAt
            }));

            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `mybookshelf_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        trigger.textContent = 'Importing...';
        trigger.style.pointerEvents = 'none';

        try {
            await ensurePapa();
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    await processImport(results.data, (current, total) => {
                        trigger.textContent = `Importing ${current}/${total}...`;
                    });
                    trigger.textContent = 'Import Goodreads CSV';
                    trigger.style.pointerEvents = 'auto';
                    fileInput.value = '';
                },
                error: (err) => {
                    console.error(err);
                    showToast('CSV Parsing Error');
                    trigger.textContent = 'Import Goodreads CSV';
                    trigger.style.pointerEvents = 'auto';
                }
            });
        } catch (e) {
            showToast('Failed to load CSV parser');
            console.error(e);
            trigger.textContent = 'Import Goodreads CSV'; // reset
            trigger.style.pointerEvents = 'auto';
        }
    });
};

const processImport = async (rows) => {
    let added = 0;
    let skipped = 0;

    // Cache existing ISBNs to minimize redundant adds
    const existingBooks = getBooks();
    const headers = existingBooks.map(b => b.title); // weak dedupe? Or ISBN?
    // User requested basic dedupe.
    const dedupSet = new Set(existingBooks.map(b => b.isbn).filter(x => x));

    for (const row of rows) {
        // Goodreads fields
        const title = row['Title'];
        if (!title) continue;

        let isbn = row['ISBN13'] || row['ISBN'] || '';
        isbn = isbn.replace(/[^0-9X]/gi, '');

        if (isbn && dedupSet.has(isbn)) {
            skipped++;
            continue;
        }

        // Map Shelf -> Status
        // read -> read
        // to-read -> toread
        // currently-reading -> read (with note?) or wishlist? User asked for 4 statuses.
        // Let's map currently-reading to 'read' (active reading is usually in read tab or separate? Design says "Read | Wishlist | Loans | To-read")
        // "Read" usually means "Finished".
        // Maybe "currently-reading" goes to "toread" but with a note? Or maybe we need a 'reading' status?
        // The user prompted: "Read / Wishlist / Loans / To-read" (4 tabs).
        // Where does "Currently Reading" go?
        // I will map it to 'toread' for now, or 'read' with isRead=false? 
        // Logic: 'read' usually implies past tense. 
        // I'll put it in 'toread' so it's visible as "ToDo".

        const grShelf = row['Exclusive Shelf'];
        let status = 'read';
        if (grShelf === 'to-read') status = 'wishlist'; // Mapped to Wishlist
        else if (grShelf === 'current-reading' || grShelf === 'currently-reading') status = 'read';
        else if (grShelf === 'on-deck') status = 'wishlist';

        // Rating
        const rating = parseInt(row['My Rating']) || 0;

        // Date Read
        const dateRead = row['Date Read'] ? new Date(row['Date Read']).toISOString() : null;

        const book = {
            id: crypto.randomUUID(),
            title: title,
            author: row['Author'] || 'Unknown',
            isbn: isbn || null,
            coverUrl: null, // CSV doesn't have covers
            status: status,
            rating: rating,
            dateRead: dateRead,
            year: row['Year Published'] ? parseInt(row['Year Published']) : null,
            publisher: row['Publisher'],
            isAudiobook: false,
            addedAt: new Date().toISOString(),
            source: 'Import'
        };

        await addBook(book);
        if (isbn) dedupSet.add(isbn);
        added++;
    }

    showToast(`Imported ${added} books. Skipped ${skipped}.`);
    // Refresh list happens via storage event listener in init.js
};
