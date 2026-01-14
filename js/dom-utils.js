
// DOM Utilities
export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const createElement = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
};

// Toast Notification
export const showToast = (message, duration = 3000) => {
    let container = $('.toast-container');
    if (!container) {
        container = createElement('div', 'toast-container');
        document.body.appendChild(container);
    }

    const toast = createElement('div', 'toast', message);
    if (message.toLowerCase().includes('error')) {
        toast.classList.add('error');
    }
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

export const escapeHtml = (str) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
