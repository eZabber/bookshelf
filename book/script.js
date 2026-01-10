// =======================
// CONFIG & TRANSLATIONS
// =======================
const CLIENT_ID = "579369345257-sqq02cnitlhcf54o5ptad36fm19jcha7.apps.googleusercontent.com";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/drive.file";
const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const DISCOVERY = [ 
    "https://sheets.googleapis.com/$discovery/rest?version=v4", 
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];
const SPREADSHEET_TITLE = "My Book App Data";
const HEADER_RANGE = `Sheet1!A1:J1`;
const WRITE_RANGE = `Sheet1!A2`;
const DATA_RANGE = `Sheet1!A2:J999`;
const HEADER = ["ID", "Title", "Author", "Shelf", "Rating", "Cover", "Date", "ReturnDate", "Audio", "ISBN"];

const TRANSLATIONS = {
    en: {
        read: "Read", wishlist: "Wishlist", loans: "Loans",
        settings: "Settings & Filters", shelves: "Shelves", display: "Display",
        filter: "Filter Books", year: "Year", month: "Month", rating: "Rating",
        clear: "Clear Filters", reset: "Reset App Data",
        integrations: "Integrations", calConn: "Connect Calendar", calDesc: "Enable for background syncing. Disable for web link.",
        data: "Data & Backup", export: "Download Backup (JSON)", import: "Restore Backup",
        dark: "Dark Mode", lang: "Language",
        search: "Search ISBN, Title, Author...", add: "Add",
        signIn: "Sign In", working: "...", synced: "Synced", 
        downloading: "Loading...", saving: "Saving...", error: "Error",
        markRead: "Mark Read", unread: "↩︎ Unread", delete: "Delete?",
        finished: "Finished:", due: "Due:", audio: "🎧 Audio", reminder: "📅 Reminder",
        modalAudio: "🎧 Audio?", modalReturn: "📅 Return", cancel: "Cancel",
        changeDate: "📅 Change Date", copyTitle: "📋 Copy Title",
        importSuccess: "Backup restored successfully! ✅",
        calAdded: "Event added to Calendar! 📅"
    },
    fi: {
        read: "Luetut", wishlist: "Toivelista", loans: "Lainassa",
        settings: "Asetukset", shelves: "Hyllyt", display: "Näkymä",
        filter: "Suodata", year: "Vuosi", month: "Kuukausi", rating: "Arvosana",
        clear: "Tyhjennä", reset: "Nollaa tiedot",
        integrations: "Integraatiot", calConn: "Yhdistä kalenteri", calDesc: "Käytä taustasynkronointia. Poista käytöstä verkkolinkille.",
        data: "Tiedot & Varmuuskopio", export: "Lataa varmuuskopio (JSON)", import: "Palauta varmuuskopio",
        dark: "Tumma tila", lang: "Kieli",
        search: "Etsi ISBN, Nimi, Kirjailija...", add: "Lisää",
        signIn: "Kirjaudu", working: "...", synced: "Synkattu", 
        downloading: "Ladataan...", saving: "Tallennetaan...", error: "Virhe",
        markRead: "Merkitse luetuksi", unread: "↩︎ Lukematon", delete: "Poista?",
        finished: "Luettu:", due: "Eräpäivä:", audio: "🎧 Ääni", reminder: "📅 Muistutus",
        modalAudio: "🎧 Äänikirja?", modalReturn: "📅 Palautus", cancel: "Peruuta",
        changeDate: "📅 Muuta päivää", copyTitle: "📋 Kopioi nimi",
        importSuccess: "Varmuuskopio palautettu! ✅",
        calAdded: "Tapahtuma lisätty kalenteriin! 📅"
    },
    et: {
        read: "Loetud", wishlist: "Soovinimekiri", loans: "Laenatud",
        settings: "Sätted", shelves: "Riiulid", display: "Kuva",
        filter: "Filtreeri", year: "Aasta", month: "Kuu", rating: "Hinne",
        clear: "Tühjenda", reset: "Lähtesta andmed",
        integrations: "Integratsioonid", calConn: "Ühenda kalender", calDesc: "Luba taustal sünkroonimine. Keela veebilingi jaoks.",
        data: "Andmed ja varukoopia", export: "Lae alla varukoopia (JSON)", import: "Taasta varukoopia",
        dark: "Tume režiim", lang: "Keel",
        search: "Otsi ISBN, Pealkiri, Autor...", add: "Lisa",
        signIn: "Logi sisse", working: "...", synced: "Sünkroonitud", 
        downloading: "Laadin...", saving: "Salvestan...", error: "Viga",
        markRead: "Märgi loetuks", unread: "↩︎ Lugemata", delete: "Kustuta?",
        finished: "Loetud:", due: "Tähtaeg:", audio: "🎧 Audio", reminder: "📅 Meeldetuletus",
        modalAudio: "🎧 Audioraamat?", modalReturn: "📅 Tagastus", cancel: "Loobu",
        changeDate: "📅 Muuda kuupäeva", copyTitle: "📋 Kopeeri pealkiri",
        importSuccess: "Varukoopia taastatud! ✅",
        calAdded: "Sündmus lisatud kalendrisse! 📅"
    }
};

// =======================
// STATE
// =======================
let currentLang = localStorage.getItem("appLang") || "en";
let tokenClient = null;
let gapiInited = false, gisInited = false;
let spreadsheetId = localStorage.getItem("sheetId") || null;
let currentShelf = "read"; 
let library = { read: [], wishlist: [], loans: [] }; 
let html5QrCode = null, scanLocked = false, pendingBook = null;
let isSyncing = false, syncPending = false;
let appStatus = "idle"; 
let filterState = { text: "", year: "", month: "", rating: "" };
let pendingCalendarBook = null;

const $ = (id) => document.getElementById(id);
const t = (key) => TRANSLATIONS[currentLang][key] || key;
// Safe text setter
function setText(id, text) { const el = $(id); if (el) el.textContent = text; }

// --- SCOPE HELPERS ---
function hasScope(scope) {
    const s = (localStorage.getItem("granted_scopes") || "").trim();
    return s.split(/\s+/).includes(scope);
}
function addGrantedScopes(scopeString) {
    if (!scopeString) return;
    const current = (localStorage.getItem("granted_scopes") || "").trim();
    const merged = (current + " " + scopeString).split(/\s+/).filter((v, i, a) => a.indexOf(v) === i && v).join(" ");
    localStorage.setItem("granted_scopes", merged);
}

// --- DATE HELPER ---
function getReminderDates(returnDateStr) {
    const [y, m, d] = returnDateStr.split('-').map(Number);
    const returnObj = new Date(y, m - 1, d, 12, 0, 0); 
    const startObj = new Date(returnObj);
    startObj.setDate(startObj.getDate() - 1); 
    const endObj = new Date(startObj);
    endObj.setDate(endObj.getDate() + 1); 
    
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    return { start: formatDate(startObj), end: formatDate(endObj) };
}

// =======================
// SEARCH LOGIC (Waterfall)
// =======================
async function fetchOpenLibrary(isbn) {
    try {
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
        const data = await res.json();
        const key = `ISBN:${isbn}`;
        if (data[key]) {
            const b = data[key];
            return { title: b.title, authors: b.authors || [{ name: "Unknown" }], cover: b.cover?.medium || b.cover?.small || null, isbn: isbn };
        }
    } catch {}
    return null;
}
async function fetchFinna(isbn) {
    try {
        const res = await fetch(`https://api.finna.fi/v1/search?lookfor=isbn:${isbn}&type=AllFields&field[]=title&field[]=buildings&field[]=images`);
        const data = await res.json();
        if (data.resultCount > 0) {
            const b = data.records[0];
            let coverUrl = b.images?.[0] ? `https://api.finna.fi${b.images[0]}` : null;
            let authorName = b.buildings?.[0]?.translated || "Unknown"; 
            return { title: b.title, authors: [{ name: authorName }], cover: coverUrl, isbn: isbn };
        }
    } catch {}
    return null;
}
async function fetchGoogleBooks(isbn) {
    try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const data = await res.json();
        if (data.totalItems > 0) {
            const b = data.items[0].volumeInfo;
            return { title: b.title, authors: (b.authors || []).map(a => ({ name: a })), cover: b.imageLinks?.thumbnail?.replace('http:', 'https:') || null, isbn: isbn };
        }
    } catch {}
    return null;
}

async function fetchAndPrompt(rawIsbn) {
    const clean = rawIsbn.replace(/\D/g, "");
    if (clean.length !== 10 && clean.length !== 13) { scanLocked = false; return alert("Invalid ISBN"); }
    
    let book = await fetchOpenLibrary(clean);
    if (!book) book = await fetchFinna(clean);
    if (!book) book = await fetchGoogleBooks(clean);

    if (book) { showModal(book, clean); } 
    else {
        if (confirm("Book not found. Search manually?")) await searchAndPrompt("ISBN " + clean);
        else scanLocked = false;
    }
}

async function searchAndPrompt(query) {
    try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data?.docs?.length) {
            const d = data.docs[0];
            showModal({ title: d.title, authors: [{name: d.author_name?.[0] || "Unknown"}], cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null, isbn: d.isbn?.[0] || "" });
        } else { if(confirm("Manual?")) showModal({ title: query, authors:[{name:"Manual"}] }); else scanLocked = false; }
    } catch { scanLocked = false; alert("Search Error"); }
}

async function handleManualAdd() {
    const el = $("isbn-input"); if(!el) return;
    const val = el.value.trim(); if (!val) return;
    el.value = "";
    const isNum = /^[\d-]+$/.test(val) && val.replace(/-/g,"").length >= 9;
    if(isNum) await fetchAndPrompt(val); else await searchAndPrompt(val);
}

// =======================
// UI LOGIC
// =======================
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("appLang", lang);
    if($("language-select")) $("language-select").value = lang;

    setText("tab-read", t("read"));
    setText("tab-wishlist", t("wishlist"));
    setText("tab-loans", t("loans"));
    
    setText("menu-lang", t("lang"));
    setText("menu-settings", t("settings"));
    setText("menu-shelves", t("shelves"));
    setText("menu-display", t("display"));
    setText("menu-filter", t("filter"));
    setText("menu-integrations", t("integrations"));
    setText("label-cal-conn", t("calConn"));
    setText("cal-desc", t("calDesc"));
    setText("menu-data", t("data")); 
    
    setText("label-stat-read", t("read"));
    setText("label-stat-wish", t("wishlist"));
    setText("label-stat-loans", t("loans"));
    
    setText("label-darkmode", t("dark"));
    setText("label-year", t("year"));
    setText("label-month", t("month"));
    setText("label-rating", t("rating"));
    
    setText("btn-clear-filters", t("clear"));
    setText("reset-btn", t("reset"));
    setText("btn-export", t("export")); 
    setText("btn-import", t("import")); 
    
    setText("btn-add", t("add"));
    if($("isbn-input")) $("isbn-input").placeholder = t("search");
    
    const authBtn = $("auth-btn");
    if(authBtn) {
        if (appStatus === "working") authBtn.textContent = t("working");
        else if (appStatus === "synced") authBtn.textContent = t("synced");
        else if (appStatus === "error") authBtn.textContent = t("error");
        else authBtn.textContent = t("signIn");
    }

    setText("modal-add-read", t("add") + " -> " + t("read"));
    setText("modal-add-wish", t("add") + " -> " + t("wishlist"));
    setText("modal-add-loan", t("add") + " -> " + t("loans"));
    setText("modal-cancel", t("cancel"));
    setText("label-audio", t("modalAudio"));
    setText("label-return", t("modalReturn"));

    renderBooks();
}

function updateShelfCounts() {
    const r = library.read?.length || 0;
    const w = library.wishlist?.length || 0;
    const l = library.loans?.length || 0;
    setText("count-read", r);
    setText("count-wishlist", w);
    setText("count-loans", l);
}

function clearFilters() {
    if($("filter-text")) $("filter-text").value = "";
    if($("filter-year")) $("filter-year").value = "";
    if($("filter-month")) $("filter-month").value = "";
    if($("filter-rating")) $("filter-rating").value = "";
    filterState = { text: "", year: "", month: "", rating: "" };
    applyFilters();
    closeMenu(); 
}

function applyFilters() {
    const t = $("filter-text");
    const y = $("filter-year");
    const m = $("filter-month");
    const r = $("filter-rating");
    if(t) filterState.text = t.value.toLowerCase();
    if(y) filterState.year = y.value;
    if(m) filterState.month = m.value;
    if(r) filterState.rating = r.value;
    renderBooks(); 
}

function renderBooks() {
    const list = $("book-list");
    if(!list) return;

    list.innerHTML = "";
    let allItems = library[currentShelf] || [];
    let visibleItems = allItems;
    
    const term = (filterState.text || "").toLowerCase();
    const cleanTerm = term.replace(/[\s-]/g, "");

    if (term || filterState.year || filterState.month || filterState.rating) {
        visibleItems = allItems.filter(b => {
            const matchText = !term || 
                b.title.toLowerCase().includes(term) || 
                getAuthorName(b).toLowerCase().includes(term) ||
                (b.isbn && b.isbn.replace(/[\s-]/g, "").toLowerCase().includes(cleanTerm));
            let dateStr = currentShelf === 'read' ? b.dateRead : (currentShelf === 'loans' ? b.returnDate : "");
            const matchYear = !filterState.year || (dateStr && dateStr.startsWith(filterState.year));
            const matchMonth = !filterState.month || (dateStr && dateStr.substring(5,7) === filterState.month);
            const matchRating = !filterState.rating || (b.rating === Number(filterState.rating));
            return matchText && matchYear && matchMonth && matchRating;
        });
    }

    // UPDATE COUNTS UI
    updateShelfCounts(); 
    const totalCount = allItems.length;
    const filteredCount = visibleItems.length;
    
    if (totalCount !== filteredCount) {
        const activeLabel = $(`count-${currentShelf}`);
        if(activeLabel) activeLabel.textContent = `${filteredCount} / ${totalCount}`;
    }

    const statusEl = $("filter-status");
    if (statusEl) {
        if (totalCount !== filteredCount) {
            statusEl.style.display = "flex";
            statusEl.innerHTML = `<span>Showing <b>${filteredCount}</b> of ${totalCount} books</span> <span class="filter-clear-link" onclick="clearFilters()">Clear</span>`;
        } else {
            statusEl.style.display = "none";
        }
    }

    visibleItems.slice().reverse().forEach(b => {
        const li = document.createElement("li"); li.className = "book-card";
        const menuContainer = document.createElement("div");
        menuContainer.className = "card-menu-container";
        const dotsBtn = document.createElement("button");
        dotsBtn.className = "dots-btn";
        dotsBtn.innerHTML = "⋮";
        dotsBtn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.menu-dropdown.show').forEach(d => d.classList.remove('show'));
            const dropdown = menuContainer.querySelector('.menu-dropdown');
            dropdown.classList.toggle('show');
        };
        const dropdown = document.createElement("div");
        dropdown.className = "menu-dropdown";
        
        if (currentShelf === 'read') {
            const editDateBtn = document.createElement("button");
            editDateBtn.className = "menu-item";
            editDateBtn.innerHTML = t("changeDate");
            editDateBtn.onclick = () => {
                const dateSpan = document.getElementById(`date-display-${b.id}`);
                const dateInput = document.getElementById(`date-input-${b.id}`);
                if(dateSpan && dateInput) {
                    dateSpan.style.display = "none"; dateInput.style.display = "inline-block"; dateInput.focus(); dateInput.showPicker(); 
                }
            };
            dropdown.appendChild(editDateBtn);
        }
        const copyBtn = document.createElement("button");
        copyBtn.className = "menu-item";
        copyBtn.innerHTML = t("copyTitle");
        copyBtn.onclick = () => { navigator.clipboard.writeText(b.title); };
        dropdown.appendChild(copyBtn);
        menuContainer.appendChild(dotsBtn);
        menuContainer.appendChild(dropdown);
        li.appendChild(menuContainer);

        const info = document.createElement("div"); info.className = "book-info";
        const badges = document.createElement("div"); badges.className = "badges-row";
        if(b.returnDate && currentShelf === 'loans') {
            const loanBadge = document.createElement("div"); loanBadge.className = "loan-badge"; loanBadge.textContent = t("due") + " " + b.returnDate; badges.appendChild(loanBadge);
        }
        if(b.isAudio) {
            const audioBadge = document.createElement("div"); audioBadge.className = "audio-badge"; audioBadge.textContent = t("audio"); badges.appendChild(audioBadge);
        }
        if(badges.children.length > 0) info.appendChild(badges);

        const img = document.createElement(b.cover ? "img" : "div"); img.className = "book-thumb";
        if(b.cover) { img.src = b.cover; img.onerror = () => { img.style.display='none'; }; } else { img.style.background = "#ddd"; }
        li.appendChild(img);

        const title = document.createElement("div"); title.className = "book-title"; title.textContent = b.title;
        const meta = document.createElement("div"); meta.className = "book-meta";
        const authorDiv = document.createElement("div"); authorDiv.textContent = getAuthorName(b);
        meta.appendChild(authorDiv);

        if(currentShelf==='read' && b.dateRead) {
            const dateDiv = document.createElement("div");
            const dateSpan = document.createElement("span");
            dateSpan.id = `date-display-${b.id}`;
            dateSpan.textContent = `${t("finished")} ${b.dateRead}`;
            const dateInput = document.createElement("input");
            dateInput.type = "date"; dateInput.id = `date-input-${b.id}`; dateInput.className = "date-edit-input"; dateInput.value = b.dateRead;
            dateInput.onchange = (e) => { updateReadDate(b.id, e.target.value); };
            dateInput.onblur = () => { setTimeout(() => { dateInput.style.display = "none"; dateSpan.style.display = "inline"; }, 200); };
            dateDiv.appendChild(dateSpan); dateDiv.appendChild(dateInput); meta.appendChild(dateDiv);
        }
        info.appendChild(title); info.appendChild(meta);
        if(b.isbn) {
            const isbnPill = document.createElement("div"); isbnPill.className = "isbn-pill"; isbnPill.textContent = `ISBN: ${b.isbn}`; info.appendChild(isbnPill);
        }

        const actions = document.createElement("div"); actions.className = "actions";
        if (currentShelf === 'read') {
            const sel = document.createElement("select"); sel.className = "rating";
            sel.innerHTML = `<option value="0">...</option>` + [1,2,3,4,5].map(n => `<option value="${n}" ${b.rating===n?'selected':''}>${'⭐'.repeat(n)}</option>`).join('');
            sel.onchange = (e) => updateRating(b.id, e.target.value);
            info.appendChild(sel);
            const unreadBtn = document.createElement("button"); unreadBtn.className = "btn-sm btn-unread"; unreadBtn.textContent = t("unread");
            unreadBtn.onclick = () => moveToWishlist(b.id); actions.appendChild(unreadBtn);
        } else {
            const moveBtn = document.createElement("button"); moveBtn.className = "move-btn"; moveBtn.textContent = t("markRead");
            moveBtn.onclick = () => moveToRead(b.id); actions.appendChild(moveBtn);
        }
        const delBtn = document.createElement("button"); delBtn.className = "btn-del"; delBtn.textContent = "🗑️";
        delBtn.onclick = () => deleteBook(b.id); actions.appendChild(delBtn);

        if(currentShelf === 'loans' && b.returnDate) {
            const calBtn = document.createElement("button"); calBtn.className = "btn-cal"; calBtn.textContent = t("reminder");
            calBtn.onclick = () => processCalendar(b);
            actions.appendChild(calBtn);
        }
        info.appendChild(actions); li.appendChild(info); list.appendChild(li);
    });
}

// =======================
// CLOUD SYNC & CALENDAR
// =======================
function gapiLoaded() {
    gapi.load("client", async () => {
        try { await gapi.client.init({ discoveryDocs: DISCOVERY }); gapiInited = true; maybeEnableAuth(); } 
        catch (e) { logError("GAPI Init Fail", e); }
    });
}
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SHEETS_SCOPE,
        callback: async (resp) => {
            if (resp.error) return logError("Auth Fail", resp);
            addGrantedScopes(resp.scope);
            gapi.client.setToken(resp);
            if (pendingCalendarBook) {
                if (hasScope(CAL_SCOPE)) await apiAddCalendar(pendingCalendarBook);
                pendingCalendarBook = null;
                return;
            }
            setSyncStatus("working");
            await doSync();
        }
    });
    gisInited = true; maybeEnableAuth();
}

async function ensureSheet() {
    if (spreadsheetId) return;
    setSyncStatus("working");
    try {
        const createResp = await gapi.client.sheets.spreadsheets.create({ properties: { title: SPREADSHEET_TITLE } });
        spreadsheetId = createResp.result.spreadsheetId;
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId, range: HEADER_RANGE, valueInputOption: "RAW", resource: { values: [HEADER] }
        });
        localStorage.setItem("sheetId", spreadsheetId);
        updateSheetLink();
    } catch (e) { logError("Sheet Init Error", e); setSyncStatus("error"); }
}

async function doSync() {
    setSyncStatus("working");
    try {
        await ensureSheet();
        updateSheetLink();
        const resp = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: DATA_RANGE });
        const rows = resp.result.values || [];
        if (rows.length > 0) {
            const newLib = { read: [], wishlist: [], loans: [] };
            rows.forEach(row => {
                if (!row?.[0]) return;
                let shelf = (row[3] || "read").toLowerCase();
                if(!['read','wishlist','loans'].includes(shelf)) shelf = 'read';
                newLib[shelf].push({
                    id: String(row[0]), title: row[1] || "Unknown", authors: [{ name: row[2] || "Unknown" }], shelf: shelf,
                    rating: Number(row[4] || 0), cover: row[5] === "null" ? null : (row[5] || null),
                    dateRead: row[6] || "", returnDate: row[7] || "",
                    isAudio: String(row[8]).toUpperCase() === "TRUE", isbn: row[9] || ""
                });
            });
            library = newLib; saveLibrary(false);
        } else { await queueUpload(); }
        setSyncStatus("synced");
    } catch (e) {
        logError("Sync Error", e); setSyncStatus("error");
        if (getErrCode(e) === 404) {
            spreadsheetId = null; localStorage.removeItem("sheetId"); updateSheetLink(); 
            setSyncStatus("idle");
            alert("Sheet deleted/missing. Will recreate on next sync.");
        }
    }
}

async function queueUpload() {
    if (isSyncing) { syncPending = true; return; }
    isSyncing = true; setSyncStatus("working");
    try {
        try { await uploadData(); }
        catch (err) { if (err.status === 429 || err.status >= 500) { await sleep(2000); await uploadData(); } else throw err; }
        setSyncStatus("synced");
    } catch (e) {
        logError("Upload Error", e); setSyncStatus("error");
        if ([401, 403].includes(getErrCode(e))) { gapi.client.setToken(null); alert("Session expired."); setSyncStatus("idle"); }
    } finally {
        isSyncing = false; if (syncPending) { syncPending = false; setTimeout(queueUpload, 0); }
    }
}

async function uploadData() {
    if (!spreadsheetId) return;
    let rows = [];
    ['read', 'wishlist', 'loans'].forEach(shelf => {
        library[shelf].forEach(b => {
            rows.push([
                b.id, b.title, getAuthorName(b), shelf, Number(b.rating||0),
                b.cover ? String(b.cover) : "null", b.dateRead || "", b.returnDate || "",
                b.isAudio ? "TRUE" : "FALSE", b.isbn || ""
            ]);
        });
    });
    await gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId, range: DATA_RANGE });
    if (rows.length > 0) {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId, range: WRITE_RANGE, valueInputOption: "RAW", resource: { values: rows }
        });
    }
}

function updateSheetLink() {
    const el = $("sheet-link"); if(el) { if(spreadsheetId) { el.href=`https://docs.google.com/spreadsheets/d/${spreadsheetId}`; el.style.display='inline'; } else { el.style.display='none'; } }
}
function setSmartPlaceholder() {
    const el = $("isbn-input"); if (!el) return;
    el.placeholder = window.matchMedia("(max-width: 420px)").matches ? "..." : t("search");
}

// =======================
// ACTION FUNCTIONS (RESTORED)
// =======================
function closeModal() { 
    if($("modal-overlay")) $("modal-overlay").style.display = "none"; 
    if($("loan-date-row")) $("loan-date-row").style.display = "none";
    pendingBook = null; scanLocked = false; 
}

function hardReset() {
    if (!confirm("Reset?")) return;
    localStorage.clear();
    location.reload();
}

function confirmAdd(targetShelf) {
    if (!pendingBook) return;
    const key = normKey(pendingBook);
    const exists = library[targetShelf].some(b => normKey(b) === key);
    if (exists && !confirm("Duplicate?")) { closeModal(); return; }

    let retDate = "";
    if (targetShelf === 'loans') {
        const row = $("loan-date-row");
        const input = $("modal-return-date");
        if (row.style.display === "none") {
            row.style.display = "flex";
            const d = new Date(); d.setDate(d.getDate() + 14);
            input.value = d.toISOString().split('T')[0];
            return; 
        } 
        retDate = input.value;
        if(!retDate) return alert("Date?");
    }

    const newBook = {
        id: makeId(),
        title: pendingBook.title || "Unknown",
        authors: pendingBook.authors || [{name:"Unknown"}],
        rating: 0,
        cover: safeUrl(pendingBook.cover) || null,
        dateRead: targetShelf === 'read' ? todayISO() : "",
        returnDate: retDate,
        isAudio: $("modal-audio-check") ? $("modal-audio-check").checked : false,
        isbn: pendingBook.isbn || ""
    };

    library[targetShelf].push(newBook);
    closeModal();
    setActiveTab(targetShelf);
    if(targetShelf === 'loans' && retDate) processCalendar(newBook);
    saveLibrary(true, true); 
}

function moveToRead(id) {
    let fromShelf = library.wishlist.find(b => b.id === id) ? 'wishlist' : 'loans';
    const idx = library[fromShelf].findIndex(b => b.id === id);
    if (idx === -1) return;
    const book = library[fromShelf][idx];
    library[fromShelf].splice(idx, 1);
    book.dateRead = todayISO(); book.returnDate = ""; book.rating = 0;
    library.read.push(book);
    setActiveTab('read'); saveLibrary(true, true);
}

function moveToWishlist(id) {
    const idx = library.read.findIndex(b => b.id === id);
    if (idx === -1) return;
    const book = library.read[idx];
    library.read.splice(idx, 1);
    book.dateRead = ""; book.rating = 0; 
    library.wishlist.push(book);
    setActiveTab('wishlist'); saveLibrary(true, true);
}

function deleteBook(id) {
    if (!confirm(t("delete"))) return;
    library[currentShelf] = library[currentShelf].filter(b => b.id !== id);
    saveLibrary(true);
}

function updateRating(id, val) {
    const book = library.read.find(b => b.id === id);
    if (book) { book.rating = Number(val); saveLibrary(true); }
}

function updateReadDate(id, newDate) {
    const book = library.read.find(b => b.id === id);
    if (book) { book.dateRead = newDate; saveLibrary(true); }
}

function processCalendar(book) {
    const calToggle = $('cal-connect-toggle');
    const isConnected = calToggle ? calToggle.checked : false; // Safe check
    
    if (isConnected) {
        if (!gapi?.client?.getToken?.()) return alert("Please Sign In first.");
        if (!hasScope(CAL_SCOPE)) {
            pendingCalendarBook = book;
            tokenClient.requestAccessToken({ prompt: '', scope: SHEETS_SCOPE + " " + CAL_SCOPE });
        } else {
            apiAddCalendar(book);
        }
    } else {
        magicLinkCalendar(book);
    }
}

async function apiAddCalendar(book) {
    if (!book.returnDate) return alert("No date set");
    const { start, end } = getReminderDates(book.returnDate);

    try {
        await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': {
                'summary': `Return: ${book.title}`, 
                'description': `Book by ${getAuthorName(book)}.`,
                'start': { 'date': start }, 
                'end': { 'date': end }, 
                'reminders': { 'useDefault': false, 'overrides': [ {'method': 'popup', 'minutes': 9 * 60} ] }
            }
        });
        alert(t("calAdded"));
    } catch(e) { logError("Cal API", e); alert("Error adding to Calendar"); }
}

function magicLinkCalendar(book) {
    if (!book.returnDate) return alert("No date set");
    const { start, end } = getReminderDates(book.returnDate);
    const sStr = start.replace(/-/g, "");
    const eStr = end.replace(/-/g, "");
    const title = encodeURIComponent("Return: " + book.title);
    const details = encodeURIComponent("Book by " + getAuthorName(book) + "\n\n(Added via My BookShelf App)");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${sStr}/${eStr}`;
    window.open(url, '_blank');
}

async function startCamera() {
    const container = $("reader-container"); if(container) container.style.display = "block";
    if(html5QrCode) try{await html5QrCode.stop();}catch{}
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const onSuccess = async (txt) => { if(scanLocked) return; scanLocked = true; await stopCamera(); await fetchAndPrompt(txt); };
    try { await html5QrCode.start({ facingMode: "environment" }, config, onSuccess); } catch (err) { try { await html5QrCode.start({ facingMode: "user" }, config, onSuccess); } catch (err2) { if(container) container.style.display="none"; alert("Camera Error"); } }
}

async function stopCamera() {
    if($("reader-container")) $("reader-container").style.display = "none";
    if(html5QrCode) { try{await html5QrCode.stop();}catch{}; try{html5QrCode.clear();}catch{}; html5QrCode=null; }
}

// =======================
// INITIALIZATION
// =======================
window.addEventListener("DOMContentLoaded", () => {
    try {
        library = loadLibrary();
        
        if($("menu-btn")) $("menu-btn").onclick = openMenu;
        if($("menu-overlay")) $("menu-overlay").onclick = closeMenu; 
        if($("modal-overlay")) $("modal-overlay").onclick = (e) => { if (e.target.id === "modal-overlay") closeModal(); };
        
        document.addEventListener('click', (e) => {
            const isDropdown = e.target.closest('.menu-dropdown');
            const isBtn = e.target.closest('.dots-btn');
            if (!isDropdown && !isBtn) { document.querySelectorAll('.menu-dropdown.show').forEach(d => d.classList.remove('show')); }
        });

        // SAFE: These element IDs must match index.html
        if($("language-select")) $("language-select").onchange = (e) => setLanguage(e.target.value);

        const debouncedApply = debounce(applyFilters, 200);
        if($("filter-text")) $("filter-text").oninput = debouncedApply;
        if($("filter-year")) $("filter-year").oninput = (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); debouncedApply(); };
        if($("filter-month")) $("filter-month").onchange = applyFilters;
        if($("filter-rating")) $("filter-rating").onchange = applyFilters;
        
        // SAFE: Check if buttons exist before adding listeners
        if($("btn-clear-filters")) $("btn-clear-filters").onclick = clearFilters;
        if($("btn-add")) $("btn-add").onclick = handleManualAdd;
        if($("isbn-input")) $("isbn-input").onkeydown = (e) => { if(e.key==="Enter") handleManualAdd(); };
        if($("btn-scan")) $("btn-scan").onclick = startCamera;
        if($("btn-stop-camera")) $("btn-stop-camera").onclick = stopCamera;
        if($("modal-add-read")) $("modal-add-read").onclick = () => confirmAdd("read");
        if($("modal-add-wish")) $("modal-add-wish").onclick = () => confirmAdd("wishlist");
        if($("modal-add-loan")) $("modal-add-loan").onclick = () => confirmAdd("loans");
        if($("modal-cancel")) $("modal-cancel").onclick = closeModal;
        
        if($("auth-btn")) { 
            $("auth-btn").onclick = () => { 
                if(!tokenClient) return alert("Loading..."); 
                tokenClient.requestAccessToken({ prompt: "" }); 
            }; 
        }
        
        if($("reset-btn")) $("reset-btn").onclick = hardReset;
        
        // SAFE: These new buttons might be missing in old HTML
        if($("btn-export")) $("btn-export").onclick = exportData;
        if($("btn-import")) $("btn-import").onclick = triggerImport;
        if($("import-file")) $("import-file").onchange = importData;
        
        // CALENDAR TOGGLE LOCALSTORAGE
        const calToggle = $("cal-connect-toggle");
        if(calToggle) {
            calToggle.checked = localStorage.getItem("calSync") === "true";
            calToggle.onchange = (e) => localStorage.setItem("calSync", e.target.checked);
        }

        const tabsContainer = document.querySelector(".tabs");
        if(tabsContainer) { tabsContainer.addEventListener("click", (e) => { const tab = e.target.closest(".tab"); if (!tab) return; const shelf = tab.id.replace("tab-", ""); setActiveTab(shelf); }); }
        
        const darkModeToggle = $("dark-mode-toggle");
        if(darkModeToggle) {
            if(localStorage.getItem("darkMode") === "true") { document.body.classList.add("dark-mode"); darkModeToggle.checked = true; }
            darkModeToggle.onchange = (e) => { if(e.target.checked) { document.body.classList.add("dark-mode"); localStorage.setItem("darkMode", "true"); } else { document.body.classList.remove("dark-mode"); localStorage.setItem("darkMode", "false"); } };
        }
        
        const yearSpan = $("year"); if(yearSpan) yearSpan.textContent = new Date().getFullYear();
        
        setSyncStatus("idle");
        setLanguage(currentLang);
        updateShelfCounts();
        updateSheetLink();
        setSmartPlaceholder();
        window.addEventListener("resize", setSmartPlaceholder);
        window.addEventListener("orientationchange", setSmartPlaceholder);
        console.log("Cloud Library Loaded OK");
    } catch (err) { logError("App Start Failed", err); alert("App failed to start."); }
});
