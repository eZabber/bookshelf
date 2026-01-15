import { $, $$, showToast } from './dom-utils.js';
import { STATE, setTab } from './state.js';
import { getBooks, updateBook, initStorage } from './storage.js'; // Added initStorage
import { renderList } from './render.js';
import { handleAuthClick, handleSignoutClick } from './auth.js'; // Added handleSignoutClick
import { initFiltersWiring, filterBooks } from './filters.js';
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

    // Show alert if manual/not found
    if (alertBox) {
        if (book.source === 'Manual' || book.author === 'Unknown') {
            alertBox.textContent = '⚠️ Book details not found. Please enter manually.';
            alertBox.classList.remove('hidden');
        } else if (book.source && book.source !== 'Home') {
            // Found via API
            alertBox.textContent = `✓ Found via ${book.source}`;
            alertBox.style.color = '#22543D';
            alertBox.style.background = '#C6F6D5';
            alertBox.style.borderColor = '#9AE6B4';
            alertBox.classList.remove('hidden');
        } else {
            alertBox.classList.add('hidden');
        }
    }

    // Reset Alert Style if reusing
    if (alertBox && (book.source === 'Manual' || book.author === 'Unknown')) {
        alertBox.style.color = '#C53030';
        alertBox.style.background = '#FFF5F5';
        alertBox.style.borderColor = '#FEB2B2';
    }

    $('#modal-notes').value = book.notes || '';
    $('#modal-audiobook').checked = !!book.isAudiobook;
    $('#modal-own').checked = !!book.own;

    const fileInput = $('#modal-cover-file');
    if (fileInput) fileInput.value = '';

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

    // Default to 'borrowed' if not set
    currentModalBook.loanType = book.loanType || 'borrowed';

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
        } else {
            if (loanBorrowedSection) loanBorrowedSection.classList.add('hidden');
            if (loanLoanedSection) loanLoanedSection.classList.remove('hidden');
        }
    };

    loanTypeBtns.forEach(btn => {
        btn.onclick = () => {
            currentModalBook.loanType = btn.dataset.value;
            updateLoanTypeUI(currentModalBook.loanType);
        };
    });
    updateLoanTypeUI(currentModalBook.loanType);

    const updateStatusUI = (status) => {
        statusBtns.forEach(b => {
            if (b.dataset.value === status) b.classList.add('active');
            else b.classList.remove('active');
        });

        // Toggle Loan fields only
        const loanFields = $('#modal-loan-fields');
        if (loanFields) {
            if (status === 'loan') loanFields.classList.remove('hidden');
            else loanFields.classList.add('hidden');
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
        coverPreview.style.height = '40px';
        coverPreview.style.marginLeft = '10px';
        coverPreview.style.borderRadius = '4px';
        coverPreview.style.objectFit = 'cover';
        previewContainer.appendChild(coverPreview);
    }

    if (fileInput) {
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (file) {
                try {
                    const { processImageFile } = await import('./dom-utils.js'); // Ensure imported if needed, or assume global? 
                    // Wait, processImageFile was likely global or imported. Let's assume it's available or import it.
                    // Checking previous file view, it wasn't imported in init.js explicitly at top?
                    // Retaining original logic but wrapping in try/catch.
                    // Actually, let's look at the original code. It called processImageFile(file).
                    // I will import it dynamically to be safe if it's not there.
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

        // Rule: Total = All books - Loaned - Bin
        // (Wishlist and Read are included in Total)
        const total = books.filter(b => b.status !== 'loan' && b.status !== 'bin').length;

        const stats = {
            total: total,
            read: books.filter(b => b.status === 'read').length,
            wishlist: books.filter(b => b.status === 'wishlist').length,
            loan: books.filter(b => b.status === 'loan').length
        };

        container.innerHTML = `
            <div class="stats-box" style="margin-bottom:8px; background-color: var(--primary-color); color: var(--white);">
                <div class="stats-label" style="color:rgba(255,255,255,0.8);">${t('stats.total')}</div>
                <div class="stats-number" style="color:#fff;">${stats.total}</div>
            </div>
            <div style="display:flex; gap:8px;">
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
            </div>
        `;
    };

    document.addEventListener('language-changed', updateMenuStats);

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
        refreshList();
    };
    tabs.forEach(btn => {
        btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });
    import('./state.js').then(({ subscribe }) => subscribe(updateUI));
    document.addEventListener('bookshelf-updated', refreshList);
    updateUI();
};

export const refreshList = () => {
    const books = getBooks();
    let filtered = books.filter(b => b.status === STATE.currentTab);
    filtered = filterBooks(filtered);
    renderList($('#main-content'), filtered, handleEditValues);
};

const handleEditValues = (bookId) => {
    const book = getBooks().find(b => b.id === bookId);
    if (!book) return;
    openSaveModal(book, async (updatedBook) => {
        await updateBook(book.id, updatedBook);
        showToast('Book updated');
        refreshList();
    });
};

/* --- Boot --- */
document.addEventListener('DOMContentLoaded', () => {
    initStorage(); // Immediate Local Init

    initMenuWiring();
    initTabWiring();
    initFiltersWiring(handleEditValues);
    initModalWiring();

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
    // Dynamic Footer Year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});
