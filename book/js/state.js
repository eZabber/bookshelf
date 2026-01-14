// State Management
export const STATE = {
    currentTab: localStorage.getItem('active_tab') || 'read', // read | wishlist | loans
    currentUser: null,
    isScanning: false
};

// Observers
const listeners = [];

export const subscribe = (listener) => {
    listeners.push(listener);
};

export const notify = () => {
    listeners.forEach(fn => fn(STATE));
};

export const setTab = (tab) => {
    STATE.currentTab = tab;
    localStorage.setItem('active_tab', tab);
    notify();
};

export const setUser = (user) => {
    STATE.currentUser = user;
    notify();
};

export const setScanning = (scanning) => {
    STATE.isScanning = scanning;
    notify();
};
