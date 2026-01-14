import { CONFIG } from './config.js';
import { initStorage } from './storage.js';
import { showToast, $ } from './dom-utils.js';

const updateAuthUI = (user, isSignedIn) => {
    const dot = $('#status-dot');
    const btn = $('#sign-in-btn');
    if (!dot || !btn) return;

    if (isSignedIn) {
        dot.classList.add('connected');
        btn.textContent = 'Sign Out';
        btn.onclick = handleSignoutClick;
    } else {
        dot.classList.remove('connected');
        btn.textContent = 'Sign In';
        btn.onclick = handleAuthClick;
    }
};

let tokenClient;
let gapiInited = false;
let gisInited = false;

export const gapiLoaded = async () => {
    try {
        if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE' || CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
            console.warn('API Keys not configured.');
            showToast('Setup Required: Update js/config.js with API Keys', 8000);
            return;
        }

        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: CONFIG.API_KEY,
                    discoveryDocs: CONFIG.DISCOVERY_DOCS,
                });
                gapiInited = true;
                checkAuth();
            } catch (err) {
                console.error('GAPI Init Error:', err);
                showToast('Google API Error: Check Console');
            }
        });
    } catch (e) {
        console.error(e);
    }
};

export const gisLoaded = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: CONFIG.SCOPES,
        callback: async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            await handleAuthSuccess();
        },
    });
    gisInited = true;
    checkAuth();
};

const checkAuth = () => {
    if (gapiInited && gisInited) {
        // Check if we have a token (weak check) or wait for user interaction
        // But initStorage tries to load locally first anyway.
    }
};

export const handleAuthClick = () => {
    if (!tokenClient) {
        showToast('Auth not initialized. Check Client ID.');
        return;
    }
    // Check if client ID is default
    if (CONFIG.API_KEY.startsWith('YOUR') || CONFIG.CLIENT_ID.startsWith('YOUR')) {
        console.warn('Google API Keys not configured. App running in Offline/Local Mode.');
        // Update UI to reflect offline status if needed
        const dot = document.getElementById('status-dot');
        if (dot) dot.style.backgroundColor = '#ccc'; // Grey for offline
        return;
    }
    tokenClient.requestAccessToken({ prompt: 'consent' });
};

export const handleSignoutClick = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        updateAuthUI(null, false);
        showToast('Signed out.');
    }
};

const handleAuthSuccess = async () => {
    updateAuthUI({ name: 'User' }, true);
    showToast('Signed in successfully!');
    await initStorage();
};

// Bootstrap
if (!window.gapi) {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = gapiLoaded;
    document.body.appendChild(script);
}

// GIS script is in HTML, but we need to hook onto its load? 
// Or just let the inline script in auth.js run. 
// Actually since we are module based, we can't easily rely on global callbacks from the library 
// unless we assign them to window.
window.initGIS = gisLoaded; // The HTML script calls this if configured? No, we used manual loader.
// Let's just run gisLoaded immediately since the script tag in HTML is async defer.
// We might race. Better to check window.google
const checkGoogle = setInterval(() => {
    if (window.google) {
        clearInterval(checkGoogle);
        gisLoaded();
    }
}, 100);
