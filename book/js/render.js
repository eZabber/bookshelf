import { createElement, escapeHtml } from './dom-utils.js';
import { deleteBook, updateBook } from './storage.js';
import { t } from './i18n.js';

export const renderBookCard = (book, onEdit) => {
    const card = createElement('div', 'book-card');

    // Cover
    let coverHtml = '';
    if (book.coverUrl) {
        let secureUrl = book.coverUrl;
        if (secureUrl.startsWith('http:')) secureUrl = secureUrl.replace('http:', 'https:');
        coverHtml = `<img src="${escapeHtml(secureUrl)}" alt="Cover" loading="lazy">`;
    } else {
        coverHtml = `<div style="width:60px;height:90px;background:#eee;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:0.8rem;">No Cover</div>`;
    }

    const year = book.year ? `(${book.year})` : '';

    // Badges
    let badgesHtml = '<div class="badges-row">';
    if (book.isAudiobook) badgesHtml += `<span class="badge badge-audio">${t('badge.audio')}</span>`;
    if (book.status === 'read') badgesHtml += `<span class="badge badge-read">${t('stats.read')}</span>`;
    if (book.status === 'wishlist') badgesHtml += `<span class="badge badge-wish">${t('badge.wish')}</span>`;
    if (book.status === 'loan') badgesHtml += `<span class="badge badge-loan">${t('stats.loan')}</span>`;
    if (book.status === 'toread') badgesHtml += `<span class="badge badge-toread">${t('badge.toread')}</span>`;
    badgesHtml += '</div>';

    const html = `
        <div class="book-card-main">
            ${coverHtml}
            <div class="book-details">
                <h4>${escapeHtml(book.title)}</h4>
                <p>${escapeHtml(book.author)} ${year}</p>
                ${book.isbn ? `<p style="font-size:0.7rem;color:#aaa;font-family:monospace; margin-bottom: 4px;">${escapeHtml(book.isbn)}</p>` : ''}
                
                ${book.genres && book.genres.length > 0 ?
            `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">
                        ${book.genres.slice(0, 3).map(g => `<span style="font-size:0.65rem;background:#f0f0f0;padding:2px 6px;border-radius:4px;color:#666;">${escapeHtml(g)}</span>`).join('')}
                    </div>`
            : ''}

                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                    <select class="rating-select rounded-input small" style="width: auto; min-width: 90px; padding: 2px 24px 2px 8px; height: 28px; font-size: 0.75rem; border: 1px solid transparent; background-color: #f7f7f7;">
                        <option value="0" ${!book.rating ? 'selected' : ''}>${t('form.rate_placeholder')}</option>
                        <option value="5" ${book.rating == 5 ? 'selected' : ''}>★★★★★</option>
                        <option value="4" ${book.rating == 4 ? 'selected' : ''}>★★★★</option>
                        <option value="3" ${book.rating == 3 ? 'selected' : ''}>★★★</option>
                        <option value="2" ${book.rating == 2 ? 'selected' : ''}>★★</option>
                        <option value="1" ${book.rating == 1 ? 'selected' : ''}>★</option>
                    </select>

                    ${book.status === 'read' ? `
                        <span class="date-badge">
                            ${book.dateRead ? new Date(book.dateRead).toLocaleDateString('en-GB') : 'No Date'}
                        </span>
                    ` : ''}
                </div>

                ${badgesHtml}
                
                ${(book.status === 'loan' || (book.loanType && book.loanType !== 'none')) ? (() => {
            let loanInfo = '';
            const isOverdue = book.reminderDate && new Date(book.reminderDate) < new Date();
            const returnDateStr = book.reminderDate ? new Date(book.reminderDate).toLocaleDateString('en-GB') : '';
            const overdueStyle = isOverdue ? 'color:#C53030;font-weight:bold;' : 'color:var(--text-light);';

            if (book.loanType === 'loanedOut') {
                loanInfo = `<div style="font-size:0.75rem;margin-top:4px;color:var(--text-light);">
                            Loaned to: <span style="font-weight:600;color:var(--text-color);">${escapeHtml(book.loanedToName || 'Unknown')}</span>
                         </div>`;
            } else if (book.loanType === 'borrowed' || (!book.loanType && book.status === 'loan')) {
                // Default to borrowed behavior if undefined but status is loan (or just show nothing if we want strict existing behavior?)
                // User said "Existing Loan books ... show normally". Normally means just badge.
                // But if we have borrowedFrom details we should show them.
                const from = book.borrowedFromName || book.borrowedFromType;
                if (from) {
                    loanInfo = `<div style="font-size:0.75rem;margin-top:4px;color:var(--text-light);">
                                Borrowed from: <span style="font-weight:600;color:var(--text-color);">${escapeHtml(from)}</span>
                             </div>`;
                }
            }

            if (returnDateStr) {
                loanInfo += `<div style="font-size:0.75rem;margin-top:2px;${overdueStyle}">
                            ${isOverdue ? 'Overdue!' : 'Return by:'} ${returnDateStr}
                        </div>`;
            }
            return loanInfo;
        })() : ''}
            </div>
        </div>
        <div class="book-actions">
            <button class="action-link ax-toggle-own" style="background:${book.own ? 'var(--accent-green)' : 'var(--pill-bg)'}; color:${book.own ? 'white' : 'var(--text-color)'}; border:1px solid ${book.own ? 'transparent' : 'var(--divider-color)'}; opacity:${book.own ? '1' : '0.8'};">
                ${book.own ? t('card.own_yes') : t('card.own_no')}
            </button>
            <button class="action-link ax-edit">${t('btn.edit_card')}</button>
            ${(book.status === 'wishlist' || book.status === 'loan') ? `<button class="action-link ax-mark-read" style="color:var(--accent-green);border:1px solid var(--accent-green);background:white;">${t('btn.mark_read')}</button>` : ''}
            <button class="action-link ax-bin" style="color:#C53030;">${t('btn.bin')}</button>
        </div>
    `;

    card.innerHTML = html;

    // Wire Rating Change
    const ratingSelect = card.querySelector('.rating-select');
    if (ratingSelect) {
        ratingSelect.addEventListener('change', async (e) => {
            e.stopPropagation();
            const newRating = parseInt(e.target.value);
            await updateBook(book.id, { ...book, rating: newRating });
        });
        ratingSelect.addEventListener('click', e => e.stopPropagation());
    }

    // Wire Actions
    const editBtn = card.querySelector('.ax-edit');
    const binBtn = card.querySelector('.ax-bin');
    const markReadBtn = card.querySelector('.ax-mark-read');
    const toggleOwnBtn = card.querySelector('.ax-toggle-own');

    if (toggleOwnBtn) {
        toggleOwnBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // prevent card click?? (if card is clickable later)
            const newOwn = !book.own;
            // Optimistic update of button UI? Or just wait for re-render
            // Re-render is safer for state consistency
            await updateBook(book.id, { ...book, own: newOwn });
        });
    }

    if (editBtn && onEdit) {
        editBtn.addEventListener('click', () => onEdit(book.id));
    }

    if (markReadBtn) {
        markReadBtn.addEventListener('click', async () => {
            // Optimistic UI or wait?
            // Update status to read, set dateRead to today
            await updateBook(book.id, {
                ...book,
                status: 'read',
                dateRead: new Date().toISOString()
            });
            // storage.js should trigger refresh
        });
    }

    if (binBtn) {
        binBtn.addEventListener('click', async () => {
            if (confirm(`Move "${book.title}" to Bin?`)) {
                await deleteBook(book.id);
            }
        });
    }

    return card;
};

export const renderList = (container, books, onEdit, totalCount = null) => {
    container.innerHTML = '';

    // Update Stats
    const statsEl = document.getElementById('filter-stats');
    if (statsEl) {
        if (totalCount !== null && totalCount !== books.length) {
            statsEl.textContent = `${books.length} of ${totalCount} books found`;
            statsEl.classList.remove('hidden');
        } else {
            statsEl.classList.add('hidden');
        }
    }

    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-state">No books match your filters.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    books.slice().forEach(book => {
        fragment.appendChild(renderBookCard(book, onEdit));
    });
    container.appendChild(fragment);
};
