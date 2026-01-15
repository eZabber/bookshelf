import { $, showToast } from './dom-utils.js';
import { fetchByIsbn } from './isbn.js';
import { ISBNScanner } from './scanner.js';
import { addBook } from './storage.js';
import { STATE } from './state.js';

export const initAddWiring = () => {
    const addBtn = $('#add-btn');
    const scanBtn = $('#scan-btn');
    const input = $('#add-input');
    const scannerContainer = $('#scanner-container');

    // Scanner
    const scanner = new ISBNScanner('reader', (isbn) => {
        showToast(`Scanned: ${isbn}`);
        input.value = isbn;
        stopScanner();
        handleAdd();
    }, (err) => {
        // quiet
    });

    const startScanner = async () => {
        scannerContainer.classList.remove('hidden');
        try {
            await scanner.start();
            scanBtn.classList.add('active');
        } catch (e) {
            showToast('Camera Error: ' + e.message, 5000);
            scannerContainer.classList.add('hidden');
        }
    };

    const stopScanner = async () => {
        await scanner.stop();
        scannerContainer.classList.add('hidden');
        scanBtn.classList.remove('active');
    };

    const toggleScanner = () => {
        if (scannerContainer.classList.contains('hidden')) {
            startScanner();
        } else {
            stopScanner();
        }
    };

    // Search Results Modal Logic
    const showSearchModal = (results, onSelect) => {
        const modal = document.getElementById('search-modal-overlay');
        const list = document.getElementById('search-results-list');
        const cancelBtn = document.getElementById('search-cancel-btn');

        if (!modal || !list) return;

        list.innerHTML = '';

        results.forEach(book => {
            const el = document.createElement('div');
            el.className = 'book-card';
            el.style.padding = '10px';
            el.style.cursor = 'pointer';
            el.style.marginBottom = '8px';

            // Minimal render
            const img = book.coverUrl
                ? `<img src="${book.coverUrl}" style="width:40px;height:60px;object-fit:cover;margin-right:10px;border-radius:4px;">`
                : `<div style="width:40px;height:60px;background:#eee;margin-right:10px;border-radius:4px;display:inline-block;"></div>`;

            el.innerHTML = `
                <div style="display:flex; align-items:center;">
                    ${img}
                    <div>
                        <div style="font-weight:600;font-size:0.9rem;">${book.title}</div>
                        <div style="font-size:0.8rem;color:#666;">${book.author} (${book.year || '?'})</div>
                    </div>
                </div>
            `;

            el.onclick = () => {
                onSelect(book);
                close();
            };

            list.appendChild(el);
        });

        const close = () => {
            modal.classList.remove('visible');
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
        };

        if (cancelBtn) cancelBtn.onclick = close;

        modal.classList.add('visible');
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    };

    // Add Logic
    const handleAdd = async () => {
        const val = input.value.trim();
        if (!val) {
            showToast('Please enter an ISBN or Title');
            return;
        }

        const originalText = addBtn.textContent;
        addBtn.textContent = '...';
        addBtn.disabled = true;

        try {
            // 1. Analyze Input
            const cleanIsbn = val.replace(/[^0-9X]/gi, '');
            const isIsbn = (cleanIsbn.length === 10 || cleanIsbn.length === 13);

            let bookData = null;

            if (isIsbn) {
                // Strict ISBN Lookup
                bookData = await fetchByIsbn(cleanIsbn);
                if (!bookData) {
                    showToast('ISBN not found. Added manually.');
                    bookData = {
                        title: val,
                        author: 'Unknown',
                        isbn: cleanIsbn,
                        source: 'Manual'
                    };
                }
                proceedToSave(bookData);
            } else {
                // Search Query
                import('./isbn.js').then(async ({ searchBooks }) => {
                    const results = await searchBooks(val);
                    if (results && results.length > 0) {
                        if (results.length === 1) {
                            bookData = results[0];
                            proceedToSave(bookData);
                        } else {
                            // Show Selection
                            showSearchModal(results, (selected) => {
                                proceedToSave(selected);
                            });
                        }
                    } else {
                        showToast('No books found. Added manually.');
                        // Fallback to manual
                        bookData = { title: val, author: 'Unknown' };
                        proceedToSave(bookData);
                    }
                }).finally(() => {
                    addBtn.textContent = originalText;
                    addBtn.disabled = false;
                });
                return; // Async flow handled in then
            }

            // Helper
            function proceedToSave(data) {
                if (window._openSaveModal) {
                    window._openSaveModal(data, async (finalBook) => {
                        finalBook.source = 'Home';
                        finalBook.addedAt = new Date().toISOString();
                        const result = await addBook(finalBook);
                        if (result) {
                            // Success
                            input.value = '';
                            // Toast handled in addBook
                        }
                    });
                } else {
                    addBook(data).then(res => {
                        if (res) input.value = '';
                    });
                }
                addBtn.textContent = originalText;
                addBtn.disabled = false;
            }

        } catch (err) {
            showToast('Error: ' + err.message);
            addBtn.textContent = originalText;
            addBtn.disabled = false;
        }
    };

    addBtn.addEventListener('click', handleAdd);
    scanBtn.addEventListener('click', toggleScanner);

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdd();
    });
};
