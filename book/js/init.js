import { $, $$, showToast } from './dom-utils.js';
import { STATE, setTab } from './state.js';
import { getBooks, updateBook, initStorage } from './storage.js'; // Added initStorage
import { renderList } from './render.js';
import { handleAuthClick, handleSignoutClick } from './auth.js'; // Added handleSignoutClick
import { initFiltersWiring, filterBooks, isFiltersActive } from './filters.js';
import { createCalendarUrl } from './calendar-link.js';
import { t } from './i18n.js';

/* --- Image Helper --- */

const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                const scale = MAX_WIDTH / img.width;
                const width = Math.min(img.width, MAX_WIDTH);
                const height = img.height * (scale < 1 ? scale : 1);

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/* --- Modal Logic --- */
let currentModalBook = null;
let onSaveCallback = null;

const openSaveModal = (book, onSave) => {
    currentModalBook = { ...book };
    onSaveCallback = onSave;

    const modal = $('#save-modal-overlay');
    const title = $('#modal-title');

    if (!modal) return;

    title.textContent = book.id ? t('modal.edit_title') : t('modal.save_title');
    title.setAttribute('data-i18n', book.id ? 'modal.edit_title' : 'modal.save_title');

    // Fields
    const titleInput = $('#modal-book-title');
    const authorInput = $('#modal-book-author');
    const alertBox = $('#modal-alert');
    const coverInput = $('#modal-cover');

    if (titleInput) titleInput.value = book.title || '';
    if (authorInput) authorInput.value = book.author || '';
    if (coverInput) coverInput.value = book.coverUrl || '';

    // Show alert (DEPRECATED/REMOVED per request - kept hidden)
    if (alertBox) alertBox.classList.add('hidden');

    $('#modal-notes').value = book.notes || '';
    $('#modal-audiobook').checked = !!book.isAudiobook;
    $('#modal-own').checked = !!book.own;

    // Source Info Populating (Localized + Subtle)
    const sourceInfo = $('#modal-source-info');
    if (sourceInfo) {
        let srcRaw = book.source || 'Manual';
        let srcDisplay = srcRaw;

        // Localize common sources
        if (srcRaw === 'Manual') srcDisplay = t('source.manual');
        else if (srcRaw === 'Import' || srcRaw === 'Goodreads Import') srcDisplay = t('source.import');

        // Construct Text
        let sourceText = `${t('source.label')}${srcDisplay}`;

        if (book.addedAt || book.importedAt) {
            const date = new Date(book.addedAt || book.importedAt);
            sourceText += ` • ${date.toLocaleDateString()}`;
        }
        sourceInfo.textContent = sourceText;
    }

    const fileInput = $('#modal-cover-file');
    if (fileInput) fileInput.value = '';

    // Show Existing Cover
    const coverPreview = $('#modal-cover-preview');
    if (coverPreview) {
        if (book.coverUrl) {
            coverPreview.src = book.coverUrl;
            coverPreview.classList.remove('hidden');
        } else {
            coverPreview.src = '';
            coverPreview.classList.add('hidden');
        }
    }

    // Explicit Translation for Change Cover Button (Sync)
    // We do this here (on open) to ensure it's always correct language
    // Explicit Translation for Change Cover Button (Sync) with Fallback
    const changeCoverLabel = $('label[for="modal-cover-file"]');
    if (changeCoverLabel) {
        const val = t('btn.change_cover');
        changeCoverLabel.textContent = (val && val !== 'btn.change_cover') ? val : 'Change Cover';
    }

    // Reset Tab to Details
    const detailsTab = $('.modal-tab-btn[data-tab="details"]');
    if (detailsTab) detailsTab.click();

    // Status Buttons
    const statusBtns = $$('.status-btn');
    const initialStatus = book.status || STATE.currentTab || 'read';
    currentModalBook.status = initialStatus;

    // Loan Type Logic
    const loanTypeBtns = $$('.loan-type-btn');
    const loanBorrowedSection = $('#loan-borrowed-section');
    const loanLoanedSection = $('#loan-loaned-section');
    const modalType = $('#modal-borrowed-type');
    const modalName = $('#modal-borrowed-name');
    const modalLoanedTo = $('#modal-loaned-to');

    // Default to 'borrowed' ONLY if it exists, otherwise null
    currentModalBook.loanType = book.loanType || null;

    // Init values
    if (modalType) modalType.value = book.borrowedFromType || 'library';
    if (modalName) modalName.value = book.borrowedFromName || '';
    if (modalLoanedTo) modalLoanedTo.value = book.loanedToName || '';

    const updateLoanTypeUI = (type) => {
        loanTypeBtns.forEach(b => {
            if (b.dataset.value === type) b.classList.add('active');
            else b.classList.remove('active');
        });
        if (type === 'borrowed') {
            if (loanBorrowedSection) loanBorrowedSection.classList.remove('hidden');
            if (loanLoanedSection) loanLoanedSection.classList.add('hidden');
        } else if (type === 'loanedOut') { // Strict check
            if (loanBorrowedSection) loanBorrowedSection.classList.add('hidden');
            if (loanLoanedSection) loanLoanedSection.classList.remove('hidden');
        } else {
            // None active
            if (loanBorrowedSection) loanBorrowedSection.classList.add('hidden');
            if (loanLoanedSection) loanLoanedSection.classList.add('hidden');
        }

        // Dynamic Date Label
        const dateLabel = document.querySelector('label[data-i18n="loan.return_date"], label[data-i18n="loan.date_loaned"]');
        if (dateLabel) {
            const key = (type === 'loanedOut') ? 'loan.date_loaned' : 'loan.return_date';
            dateLabel.setAttribute('data-i18n', key);
            dateLabel.textContent = t(key);
        }
    };

    loanTypeBtns.forEach(btn => {
        btn.onclick = () => {
            currentModalBook.loanType = btn.dataset.value;
            updateLoanTypeUI(currentModalBook.loanType);
        };
    });
    // If null, this hides sections, which is correct for non-loan books
    updateLoanTypeUI(currentModalBook.loanType || 'borrowed'); // UI default preview only?
    // Actually, if it's null, we probably don't want to show either section?
    // But updateLoanTypeUI needs a type. 
    // Let's pass the current value. If null, updateLoanTypeUI handles it (added 'else' block above).
    updateLoanTypeUI(currentModalBook.loanType);


    const updateStatusUI = (status) => {
        statusBtns.forEach(b => {
            if (b.dataset.value === status) b.classList.add('active');
            else b.classList.remove('active');
        });

        // Toggle Loan fields only
        const loanFields = $('#modal-loan-fields');
        if (loanFields) {
            if (status === 'loan') {
                loanFields.classList.remove('hidden');
                // If switching TO loan and no type set, default to borrowed
                if (!currentModalBook.loanType) {
                    currentModalBook.loanType = 'borrowed';
                    updateLoanTypeUI('borrowed');
                }
            } else {
                loanFields.classList.add('hidden');
            }
        }
    };

    statusBtns.forEach(btn => {
        btn.onclick = () => {
            currentModalBook.status = btn.dataset.value;
            updateStatusUI(currentModalBook.status);
        };
    });
    updateStatusUI(initialStatus);

    $('#modal-rating').value = book.rating || 0;
    $('#modal-date-read').value = book.dateRead ? book.dateRead.split('T')[0] : '';
    $('#modal-reminder-date').value = book.reminderDate ? book.reminderDate.split('T')[0] : '';

    const calLink = $('#modal-calendar-link');
    const updateCalLink = () => {
        const date = $('#modal-reminder-date').value;
        if (date) {
            const url = createCalendarUrl(currentModalBook, date, book.notes);
            calLink.href = url;
            calLink.classList.remove('disabled');
        } else {
            calLink.removeAttribute('href'); // or href="#" with preventDefault, but removing href is cleaner for styling
            calLink.classList.add('disabled');
        }
    };
    $('#modal-reminder-date').onchange = updateCalLink;
    updateCalLink();

    modal.classList.add('visible');
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
};

const closeSaveModal = () => {
    const modal = $('#save-modal-overlay');
    if (!modal) return;
    modal.classList.remove('visible');
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    currentModalBook = null;
    onSaveCallback = null;
};

export const initModalWiring = () => {
    const cancelBtn = $('#modal-cancel-btn');
    const saveBtn = $('#modal-save-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeSaveModal);

    // File Upload Wiring
    const fileInput = $('#modal-cover-file');
    const coverUrlInput = $('#modal-cover');
    const previewContainer = $('#cover-preview-container');
    let coverPreview = $('#modal-cover-preview');

    if (!coverPreview && previewContainer) {
        coverPreview = document.createElement('img');
        coverPreview.id = 'modal-cover-preview';
        coverPreview.className = 'hidden';
        coverPreview.style.height = '100px'; // Increased from 40px
        coverPreview.style.marginLeft = '10px';
        coverPreview.style.borderRadius = '4px';
        coverPreview.style.objectFit = 'cover';
        previewContainer.appendChild(coverPreview);
    }



    // Explicit Translation for Change Cover Button (Sync)
    // Explicit Translation with Strict Fallback
    const fixBtn = (sel, key, fallback) => {
        const el = $(sel);
        if (el) {
            const val = t(key);
            el.textContent = (val && val !== key) ? val : fallback;
        }
    };
    fixBtn('label[for="modal-cover-file"]', 'btn.change_cover', 'Change Cover');
    fixBtn('#btn-end-loan span', 'btn.mark_returned', 'Mark as returned');

    // Modal Tabs Logic
    const modalTabBtns = $$('.modal-tab-btn');
    if (modalTabBtns) {
        modalTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modalTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.dataset.tab;
                const details = $('#modal-tab-details');
                const notes = $('#modal-tab-notes');

                if (tab === 'details') {
                    if (details) details.classList.remove('hidden');
                    if (notes) notes.classList.add('hidden');
                } else {
                    if (details) details.classList.add('hidden');
                    if (notes) notes.classList.remove('hidden');
                }
            });
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (file) {
                try {
                    const { processImageFile } = await import('./dom-utils.js');
                    const dataUrl = await processImageFile(file);
                    coverUrlInput.value = dataUrl;
                    coverPreview.src = dataUrl;
                    coverPreview.classList.remove('hidden');
                } catch (e) {
                    console.error(e);
                    showToast('Error processing image');
                }
            }
        });
    }

    // Mark Returned Logic
    const markReturnedBtnEl = $('#btn-end-loan');
    if (markReturnedBtnEl) {
        markReturnedBtnEl.addEventListener('click', () => {
            if (!currentModalBook) return;

            // 1. Determine Target Status (Heuristic)
            // If rating exists or dateRead exists -> Read. Else -> Wishlist.
            // Or default to 'read' as returned items are usually "done".
            const newStatus = (currentModalBook.rating > 0 || currentModalBook.dateRead) ? 'read' : 'wishlist';

            // 2. Switch Status UI & State
            const statusBtns = Array.from($$('.status-btn'));
            const targetBtn = statusBtns.find(b => b.dataset.value === newStatus);
            if (targetBtn) targetBtn.click(); // Triggers existing logic to hide loan fields

            // 3. Clear Loan Data in Model
            currentModalBook.loanType = null;
            currentModalBook.borrowedFromType = null;
            currentModalBook.borrowedFromName = null;
            currentModalBook.loanedToName = null;
            currentModalBook.reminderDate = null;

            // 4. Clear Inputs (Visual)
            if ($('#modal-borrowed-name')) $('#modal-borrowed-name').value = '';
            if ($('#modal-loaned-to')) $('#modal-loaned-to').value = '';

            showToast('Marked as returned');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!currentModalBook) return;

            currentModalBook.title = $('#modal-book-title').value;
            currentModalBook.author = $('#modal-book-author').value;
            currentModalBook.coverUrl = $('#modal-cover').value;
            currentModalBook.notes = $('#modal-notes').value;
            currentModalBook.isAudiobook = $('#modal-audiobook').checked;
            currentModalBook.own = $('#modal-own').checked;

            if (!currentModalBook.title) {
                showToast('Title is required');
                return;
            }

            // Always save Rating & Date
            currentModalBook.rating = parseInt($('#modal-rating').value);
            const dr = $('#modal-date-read').value;
            currentModalBook.dateRead = dr ? new Date(dr).toISOString() : null;

            if (currentModalBook.status === 'loan') {
                const rd = $('#modal-reminder-date').value;
                currentModalBook.reminderDate = rd ? new Date(rd).toISOString() : null;
                // Save extra fields
                const bType = $('#modal-borrowed-type');
                const bName = $('#modal-borrowed-name');
                const lTo = $('#modal-loaned-to');

                if (bType) currentModalBook.borrowedFromType = bType.value;
                if (bName) currentModalBook.borrowedFromName = bName.value;
                if (lTo) currentModalBook.loanedToName = lTo.value;
            }

            if (onSaveCallback) {
                await onSaveCallback(currentModalBook);
            }
            closeSaveModal();
        });
    }
};

/* --- Main Logic --- */
export const initMenuWiring = () => {
    const menuBtn = $('#hamburger-btn');
    const closeBtn = $('#close-menu-btn');
    const overlay = $('#menu-overlay');
    const menu = $('#side-menu');

    const toggleMenu = (forceOpen = null) => {
        const isOpen = menu.classList.contains('visible');
        const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;
        if (shouldOpen) {
            updateMenuStats();
            menu.classList.add('visible');
            overlay.classList.add('visible');
        } else {
            menu.classList.remove('visible');
            overlay.classList.remove('visible');
        }
    };

    // Stats Logic
    // Stats Logic
    // Stats Logic
    const updateMenuStats = async () => {
        const { getBooks } = await import('./storage.js');
        const { t } = await import('./i18n.js');
        const books = getBooks();
        const container = document.getElementById('menu-library-stats');
        if (!container) return;

        const stats = {
            read: books.filter(b => b.status === 'read').length,
            wishlist: books.filter(b => b.status === 'wishlist').length,
            loan: books.filter(b => b.status === 'loan' || (b.loanType && b.loanType !== 'none')).length
        };

        container.innerHTML = `
            <div class="stats-box">
                <div class="stats-label">${t('stats.read')}</div>
                <div class="stats-number">${stats.read}</div>
            </div>
            <div class="stats-box">
                <div class="stats-label">${t('stats.wishlist')}</div>
                <div class="stats-number">${stats.wishlist}</div>
            </div>
            <div class="stats-box">
                <div class="stats-label">${t('stats.loan')}</div>
                <div class="stats-number">${stats.loan}</div>
            </div>
        `;
    };

    document.addEventListener('language-changed', () => {
        updateMenuStats();

        // Fix Button Translations Helper
        const fixBtn = (sel, key, fallback) => {
            const el = $(sel);
            if (el) {
                const val = t(key);
                el.textContent = (val && val !== key) ? val : fallback;
            }
        };
        fixBtn('label[for="modal-cover-file"]', 'btn.change_cover', 'Change Cover');
        fixBtn('#btn-end-loan span', 'btn.mark_returned', 'Mark as returned');
    });

    if (menuBtn) menuBtn.addEventListener('click', () => toggleMenu(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleMenu(false));
    if (overlay) overlay.addEventListener('click', () => toggleMenu(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

    const deleteBtn = $('#delete-data-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            // Red confirm box or just standard confirm? Standard is fine per request "popup" (native is safest)
            if (confirm('Are you definitely sure? This will delete ALL books properly and cannot be undone.')) {
                const { wipeAllData } = await import('./storage.js');
                await wipeAllData();
                toggleMenu(false);
            }
        });
    }

    // Theme Logic
    const themeBtn = $('#theme-toggle-btn');
    const updateThemeUI = () => {
        const isDark = document.body.classList.contains('dark-mode');
        if (themeBtn) {
            const key = isDark ? 'nav.mode_light' : 'nav.mode_dark';
            themeBtn.textContent = t(key);
            themeBtn.setAttribute('data-i18n', key);
        }
    };

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeUI();
        });
    }

    // Init Theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeUI();
    }
};

export const initTabWiring = () => {
    const tabs = $$('.tab-btn');
    const updateUI = () => {
        tabs.forEach(btn => {
            if (btn.dataset.tab === STATE.currentTab) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        refreshLibraryList();
    };
    tabs.forEach(btn => {
        btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });
    import('./state.js').then(({ subscribe }) => subscribe(updateUI));
    document.addEventListener('bookshelf-updated', refreshLibraryList);
    updateUI();
};

export const refreshLibraryList = () => {
    const books = getBooks();
    let filtered;

    // Helper: Enforce Loan Precedence
    // If a book has ANY active loan info, it belongs ONLY in the Loan tab.
    const isInLoanState = (b) => {
        return b.status === 'loan' ||
            (b.loanType && b.loanType !== 'none') ||
            !!b.reminderDate ||
            !!b.borrowedFromName ||
            !!b.loanedToName;
    };

    // Get Tab Books
    if (STATE.currentTab === 'loan') {
        filtered = books.filter(b => isInLoanState(b));
    } else {
        // For Read/Wishlist/ToRead, EXCLUDE any book that belongs in Loans
        filtered = books.filter(b => b.status === STATE.currentTab && !isInLoanState(b));
    }
    const totalForTab = filtered.length;

    filtered = filterBooks(filtered);
    const active = isFiltersActive();
    renderList($('#main-content'), filtered, handleEditValues, totalForTab, active);
};

const initManualWiring = () => {
    const manualBtn = $('#user-manual-btn');
    const manualModal = $('#user-manual-modal');
    const closeX = $('#manual-close-x');
    const closeBtn = $('#manual-close-btn');

    if (manualBtn && manualModal) {
        manualBtn.addEventListener('click', () => {
            manualModal.classList.remove('hidden');
            requestAnimationFrame(() => manualModal.classList.add('visible'));
        });

        const close = () => {
            manualModal.classList.remove('visible');
            setTimeout(() => manualModal.classList.add('hidden'), 300);
        };
        if (closeX) closeX.addEventListener('click', close);
        if (closeBtn) closeBtn.addEventListener('click', close);

        // Close on overlay click
        manualModal.addEventListener('click', (e) => {
            if (e.target === manualModal) close();
        });

        // Use hidden class by default
        manualModal.classList.add('hidden');
        manualModal.classList.remove('visible');
    }
};

const handleEditValues = (bookId) => {
    const book = getBooks().find(b => b.id === bookId);
    if (!book) return;
    openSaveModal(book, async (updatedBook) => {
        await updateBook(book.id, updatedBook);
        showToast('Book updated');
        refreshLibraryList();
    });
};

/* --- Boot --- */
document.addEventListener('DOMContentLoaded', () => {
    initStorage(); // Immediate Local Init

    initMenuWiring();
    initTabWiring();
    initFiltersWiring(handleEditValues);
    initModalWiring();
    initManualWiring(); // Added missing call

    // Import Wiring
    import('./goodreads-import.js').then(({ initImportWiring, startBackgroundCoverFetch }) => {
        initImportWiring();
        // Delay auto-fetch slightly to let UI settle
        setTimeout(() => startBackgroundCoverFetch(), 3000);
    });

    // I18n
    import('./i18n.js').then(({ initI18n }) => initI18n());

    // Auth Wire
    const signInBtn = $('#sign-in-btn');
    if (signInBtn) signInBtn.onclick = handleAuthClick;

    // Add Book & Modal Helper
    import('./add-book.js').then(({ initAddWiring }) => {
        window._openSaveModal = openSaveModal;
        initAddWiring();
    });

    // Backup Wiring
    import('./backup.js').then(({ initBackupWiring }) => initBackupWiring());

    // Dynamic Footer Year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});
