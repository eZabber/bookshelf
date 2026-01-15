import { CONFIG } from './config.js';
import { showToast } from './dom-utils.js';

// --- Data Model ---
let appData = {
    meta: { schemaVersion: 2, lastSyncAt: null },
    books: [],
    imports: []
};

const CACHE_KEY = 'mybookshelf_local_cache';
const FILE_ID_KEY = 'mybookshelf_file_id';

// --- Getters ---
export const getBooks = () => appData.books || [];
export const getBook = (id) => (appData.books || []).find(b => b.id === id);

// --- Initialization ---
export const initStorage = async () => {
    console.log('Storage: Initializing...');
    try {
        // 1. Load from Local Cache immediate
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                appData = JSON.parse(cached);
                migrateData();
                broadcastUpdate(); // Show cached data immediately
                console.log('Storage: Loaded from cache', appData);
            } catch (e) {
                console.error('Storage: Cache parse error', e);
            }
        }

        // 2. If signed in, try to Sync
        if (window.gapi && window.gapi.client && window.gapi.client.getToken()) {
            await syncWithDrive();
        }
    } catch (e) {
        console.error('Storage Init Error:', e);
    }
};

// --- Migration ---
const migrateData = () => {
    if (!appData.books) appData.books = [];
    appData.books.forEach(b => {
        // Migrate old 'list' to 'status'
        if (!b.status && b.list) {
            if (b.list === 'library') b.status = 'read';
            else if (b.list === 'reading') b.status = 'read';
            else if (b.list === 'future') b.status = 'wishlist';
            else b.status = 'wishlist';
        }
        // Ensure defaults
        if (b.isAudiobook === undefined) b.isAudiobook = false;
        if (!b.rating) b.rating = 0;
    });
};

// --- CRUD Operations ---

export const addBook = async (book) => {
    // DUPLICATE CHECK
    if (book.isbn) {
        const exists = (appData.books || []).some(b => b.isbn === book.isbn);
        if (exists) {
            showToast('Book with this ISBN already exists!');
            return null; // Return null to indicate failure
        }
    }

    if (!book.id) book.id = crypto.randomUUID();
    if (!book.addedAt) book.addedAt = new Date().toISOString();

    // Defaults
    book.status = book.status || 'read';
    book.isAudiobook = !!book.isAudiobook;
    book.rating = book.rating || 0;

    if (!appData.books) appData.books = [];
    appData.books.unshift(book); // Add to top

    await saveLocally();
    showToast('Book added');
    return book;
};

export const addBooks = async (newBooks) => {
    if (!newBooks || !newBooks.length) return;

    const existingIsbns = new Set(
        (appData.books || []).filter(b => b.isbn).map(b => b.isbn)
    );

    let skippedCount = 0;

    // Filter duplicates
    const uniqueBooks = newBooks.filter(book => {
        if (book.isbn && existingIsbns.has(book.isbn)) {
            skippedCount++;
            return false;
        }
        // If unique ISBN (or internal duplicate in batch), add to set to catch subsequent dupes in same batch
        if (book.isbn) existingIsbns.add(book.isbn);
        return true;
    });

    if (uniqueBooks.length === 0) {
        showToast(`All ${newBooks.length} books were duplicates.`);
        return [];
    }

    // Prepare all books
    const processed = uniqueBooks.map(book => {
        if (!book.id) book.id = crypto.randomUUID();
        if (!book.addedAt) book.addedAt = new Date().toISOString();

        book.status = book.status || 'read';
        book.isAudiobook = !!book.isAudiobook;
        book.rating = book.rating || 0;
        return book;
    });

    if (!appData.books) appData.books = [];
    appData.books.unshift(...processed);

    await saveLocally();

    let msg = `${processed.length} books imported`;
    if (skippedCount > 0) msg += `, ${skippedCount} duplicates skipped`;

    showToast(msg);
    return processed;
};

export const updateBook = async (id, changes) => {
    if (!appData.books) return;
    const idx = appData.books.findIndex(b => b.id === id);
    if (idx !== -1) {
        appData.books[idx] = {
            ...appData.books[idx],
            ...changes,
            updatedAt: new Date().toISOString()
        };
        await saveLocally();
    }
};

export const deleteBook = async (id) => {
    await updateBook(id, { status: 'bin', deletedAt: new Date().toISOString() });
};

export const hardDeleteBook = async (id) => {
    if (!appData.books) return;
    appData.books = appData.books.filter(b => b.id !== id);
    await saveLocally();
};

export const wipeAllData = async () => {
    appData.books = [];
    await saveLocally();
    showToast('All data deleted');
};

// --- Storage Logic ---

const broadcastUpdate = () => {
    document.dispatchEvent(new CustomEvent('bookshelf-updated', { detail: appData }));
};

const saveLocally = async () => {
    appData.meta.lastSyncAt = new Date().toISOString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(appData));
    broadcastUpdate();

    // Trigger Cloud Sync
    if (gapi && gapi.client && gapi.client.getToken()) {
        await saveToDrive();
    }
};

// --- Google Drive API ---

let isSyncing = false;

const syncWithDrive = async () => {
    if (isSyncing) return;
    isSyncing = true;
    dispatchSyncEvent('start');
    try {
        const fileId = await findFile();
        if (fileId) {
            localStorage.setItem(FILE_ID_KEY, fileId);
            await loadFromDrive(fileId);
        } else {
            console.log('Storage: No remote file found. Creating new...');
            // Create new if we have local data, or just empty?
            // If local data exists (and is meaningful), upload it. Else create empty.
            await saveToDrive(true);
        }
    } catch (e) {
        console.warn('Sync Error:', e);
        if (e.status === 401 || e.status === 403) {
            // Token invalid
        }
        dispatchSyncEvent('error', e.message);
    } finally {
        isSyncing = false;
        // If no error thrown, assume success (or at least completion)
        // ideally we'd track specific success paths, but 'end of try' is good proxy if no catch
        // But we are in finally, so we don't know if it erred easily unless we flagged it.
        // Actually, let's just dispatch 'success' inside the try block at end of logic.
    }
};

const findFile = async () => {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name = '${CONFIG.DATA_FILENAME}' and '${CONFIG.SCOPES.includes('appdata') ? 'appDataFolder' : 'root'}' in parents andtrashed = false`,
            spaces: CONFIG.SCOPES.includes('appdata') ? 'appDataFolder' : 'drive',
            fields: 'files(id, name)'
        });
        const files = response.result.files;
        if (files && files.length > 0) return files[0].id;
        return null;
    } catch (e) {
        console.error('Find File Error:', e);
        return null;
    }
};

const loadFromDrive = async (fileId) => {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        const remoteData = response.result;

        if (remoteData && remoteData.books) {
            console.log('Storage: Remote data loaded. Merging...');

            // MERGE LOGIC
            const localBooks = appData.books || [];
            const remoteBooks = remoteData.books || [];
            const mergedMap = new Map();

            // 1. Start with Remote (Baseline)
            remoteBooks.forEach(b => mergedMap.set(b.id, b));

            // 2. Merge Local (Overwrites if newer, Adds if new)
            let hasLocalChanges = false;
            localBooks.forEach(localBook => {
                if (mergedMap.has(localBook.id)) {
                    const remoteBook = mergedMap.get(localBook.id);
                    const localTime = new Date(localBook.updatedAt || localBook.addedAt || 0).getTime();
                    const remoteTime = new Date(remoteBook.updatedAt || remoteBook.addedAt || 0).getTime();

                    // If local is significantly newer (allow 1s drift), keep local
                    if (localTime > remoteTime + 1000) {
                        mergedMap.set(localBook.id, localBook);
                        hasLocalChanges = true;
                    }
                } else {
                    // Local book not in remote -> Add it
                    mergedMap.set(localBook.id, localBook);
                    hasLocalChanges = true;
                }
            });

            // 3. Update App Data
            appData = {
                ...remoteData,
                books: Array.from(mergedMap.values())
            };

            // 4. Save & Sync Back if needed
            migrateData();
            localStorage.setItem(CACHE_KEY, JSON.stringify(appData));
            broadcastUpdate();
            showToast('Synced with Cloud');

            // If we merged in local changes, push back to cloud immediately
            if (hasLocalChanges) {
                console.log('Storage: Local changes merged. Pushing back to Cloud...');
                await saveToDrive();
            } else {
                dispatchSyncEvent('success');
            }
        }
    } catch (e) {
        console.error('Load Drive Error:', e);
    }
};

// --- Cloud Sync Events ---
const dispatchSyncEvent = (status, detail = null) => {
    document.dispatchEvent(new CustomEvent(`cloud-sync-${status}`, { detail }));
};

const saveToDrive = async (isNew = false) => {
    dispatchSyncEvent('start');
    try {
        const fileContent = JSON.stringify(appData);
        const fileId = localStorage.getItem(FILE_ID_KEY);

        const metadata = {
            name: CONFIG.DATA_FILENAME,
            mimeType: 'application/json'
        };

        if (isNew || !fileId) {
            metadata.parents = CONFIG.SCOPES.includes('appdata') ? ['appDataFolder'] : [];
        }

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        let response;
        if (isNew || !fileId) {
            // Create
            response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
                body: form
            });
        } else {
            // Update
            response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
                body: form
            });
        }

        if (response.ok) {
            const json = await response.json();
            if (json.id) localStorage.setItem(FILE_ID_KEY, json.id);
            console.log('Storage: Saved to Drive');
            dispatchSyncEvent('success');
        } else {
            console.error('Storage: Save Failed', await response.text());
            dispatchSyncEvent('error', 'Save Failed');
        }

    } catch (e) {
        console.error('Save Drive Error:', e);
        showToast('Sync Failed (Check Console)');
        dispatchSyncEvent('error', e.message);
    }
};
