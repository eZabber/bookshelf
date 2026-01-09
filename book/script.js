// =======================
// CONFIG & TRANSLATIONS
// =======================
const CLIENT_ID = "579369345257-sqq02cnitlhcf54o5ptad36fm19jcha7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events";
const DISCOVERY = [ "https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest" ];
const SHEET_NAME = "Sheet1";
const HEADER_RANGE = `${SHEET_NAME}!A1:J1`;
const DATA_RANGE = `${SHEET_NAME}!A2:J999`;
const HEADER = ["ID", "Title", "Author", "Shelf", "Rating", "Cover", "Date", "ReturnDate", "Audio", "ISBN"];

const TRANSLATIONS = {
    en: {
        read: "Read", wishlist: "Wishlist", loans: "Loans",
        settings: "Settings & Filters", shelves: "Shelves", display: "Display",
        filter: "Filter Books", year: "Year", month: "Month", rating: "Rating",
        apply: "Apply Filters", clear: "Clear Filters", reset: "Reset App Data",
        dark: "Dark Mode", lang: "Language",
        search: "Search ISBN, Title, Author...", add: "Add",
        signIn: "Sign In with Google", working: "Working...", synced: "Synced ✅", 
        downloading: "Downloading...", saving: "Saving...", error: "Error ❌",
        markRead: "Mark Read", unread: "↩︎ Unread", delete: "Delete?",
        finished: "Finished:", due: "Due:", audio: "🎧 Audio", reminder: "📅 Reminder",
        modalAudio: "🎧 Audio?", modalReturn: "📅 Return", cancel: "Cancel",
        changeDate: "📅 Change Date", copyTitle: "📋 Copy Title"
    },
    fi: {
        read: "Luetut", wishlist: "Toivelista", loans: "Lainassa",
        settings: "Asetukset", shelves: "Hyllyt", display: "Näkymä",
        filter: "Suodata", year: "Vuosi", month: "Kuukausi", rating: "Arvosana",
        apply: "Käytä suodattimia", clear: "Tyhjennä", reset: "Nollaa tiedot",
        dark: "Tumma tila", lang: "Kieli",
        search: "Etsi ISBN, Nimi, Kirjailija...", add: "Lisää",
        signIn: "Kirjaudu Googlella", working: "Työskennellään...", synced: "Synkattu ✅", 
        downloading: "Ladataan...", saving: "Tallennetaan...", error: "Virhe ❌",
        markRead: "Merkitse luetuksi", unread: "↩︎ Lukematon", delete: "Poista?",
        finished: "Luettu:", due: "Eräpäivä:", audio: "🎧 Ääni", reminder: "📅 Muistutus",
        modalAudio: "🎧 Äänikirja?", modalReturn: "📅 Palautus", cancel: "Peruuta",
        changeDate: "📅 Muuta päivää", copyTitle: "📋 Kopioi nimi"
    },
    et: {
        read: "Loetud", wishlist: "Soovinimekiri", loans: "Laenatud",
        settings: "Sätted", shelves: "Riiulid", display: "Kuva",
        filter: "Filtreeri", year: "Aasta", month: "Kuu", rating: "Hinne",
        apply: "Rakenda filtreid", clear: "Tühjenda", reset: "Lähtesta andmed",
        dark: "Tume režiim", lang: "Keel",
        search: "Otsi ISBN, Pealkiri, Autor...", add: "Lisa",
        signIn: "Logi sisse Google'iga", working: "Töötan...", synced: "Sünkroonitud ✅", 
        downloading: "Laadin...", saving: "Salvestan...", error: "Viga ❌",
        markRead: "Märgi loetuks", unread: "↩︎ Lugemata", delete: "Kustuta?",
        finished: "Loetud:", due: "Tähtaeg:", audio: "🎧 Audio", reminder: "📅 Meeldetuletus",
        modalAudio: "🎧 Audioraamat?", modalReturn: "📅 Tagastus", cancel: "Loobu",
        changeDate: "📅 Muuda kuupäeva", copyTitle: "📋 Kopeeri pealkiri"
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
let filterState = { text: "", year: "", month: "", rating: "" };

const $ = (id) => document.getElementById(id);
const t = (key) => TRANSLATIONS[currentLang][key] || key;

// =======================
// LANGUAGE LOGIC
// =======================
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("appLang", lang);
    $("language-select").value = lang;

    // Static UI
    $("tab-read").textContent = t("read");
    $("tab-wishlist").textContent = t("wishlist");
    $("tab-loans").textContent = t("loans");
    
    $("menu-lang").textContent = t("lang");
    $("menu-settings").textContent = t("settings");
    $("menu-shelves").textContent = t("shelves");
    $("menu-display").textContent = t("display");
    $("menu-filter").textContent = t("filter");
    
    $("label-stat-read").textContent = t("read");
    $("label-stat-wish").textContent = t("wishlist");
    $("label-stat-loans").textContent = t("loans");
    
    $("label-darkmode").textContent = t("dark");
    $("label-year").textContent = t("year");
    $("label-month").textContent = t("month");
    $("label-rating").textContent = t("rating");
    
    $("btn-clear-filters").textContent = t("clear");
    $("reset-btn").textContent = t("reset");
    
    $("btn-add").textContent = t("add");
    $("isbn-input").placeholder = t("search");
    
    // Auth Button
    const authBtn = $("auth-btn");
    if(authBtn && !authBtn.disabled && authBtn.textContent.includes("Sign In")) {
        authBtn.textContent = t("signIn");
    }

    // Modal
    $("modal-add-read").textContent = t("add") + " -> " + t("read");
    $("modal-add-wish").textContent = t("add") + " -> " + t("wishlist");
    $("modal-add-loan").textContent = t("add") + " -> " + t("loans");
    $("modal-cancel").textContent = t("cancel");
    $("label-audio").textContent = t("modalAudio");
    $("label-return").textContent = t("modalReturn");

    renderBooks();
}

// =======================
// AUTH FUNCTIONS
// =======================
function gapiLoaded() {
    gapi.load("client", async () => {
        try { await gapi.client.init({ discoveryDocs: DISCOVERY }); gapiInited = true; maybeEnableAuth(); } 
        catch (e) { logError("GAPI Init Fail", e); }
    });
}
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES,
        callback: async (resp) => {
            if (resp.error) return logError("Auth Fail", resp);
            gapi.client.setToken(resp);
            const btn = $("auth-btn");
            if(btn) btn.textContent = t("working");
            await doSync();
        }
    });
    gisInited = true; maybeEnableAuth();
}
function maybeEnableAuth() { 
    if (gapiInited && gisInited) {
        const btn = $("auth-btn");
        if(btn) {
            btn.disabled = false;
            if(!isSyncing) btn.textContent = t("signIn");
        }
    }
}

// =======================
// HELPERS
// =======================
function logError(msg, err) {
    const log = $("debug-log");
    if(log) {
        log.style.display = "block";
        const details = err.message || (typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err));
        log.textContent = "ERROR: " + msg + "\nDETAILS: " + details;
    }
    console.error(msg, err);
}
function safeStringify(x) { try { return JSON.stringify(x, null, 2); } catch { return String(x); } }
function makeId() { 
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function todayISO() { return new Date().toISOString().split("T")[0]; }
function getAuthorName(b) { return (b?.authors?.[0]?.name || "Unknown").toString(); }
function normKey(b) { return ((b?.title || "") + "|" + getAuthorName(b)).toLowerCase().trim(); }
function safeUrl(url) {
    if(!url) return "";
    try { const u = new URL(url); return (u.protocol === "http:" || u.protocol === "https:") ? u.href : ""; }
    catch { return ""; }
}
function getErrCode(e) { return e?.status ?? e?.result?.error?.code ?? null; }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function debounce(fn, ms = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function setSyncStatus(state) {
    const dot = $("sync-dot");
    if (!dot) return;
    if (state === "working") dot.style.background = "#f1c40f"; 
    else if (state === "ok") dot.style.background = "#2ecc71"; 
    else if (state === "error") dot.style.background = "#e74c3c"; 
    else dot.style.background = "#bbb"; 
}

// =======================
// CORE LOGIC
// =======================
function updateShelfCounts() {
    const r = library.read?.length || 0;
    const w = library.wishlist?.length || 0;
    const l = library.loans?.length || 0;
    if($("count-read")) $("count-read").textContent = r;
    if($("count-wishlist")) $("count-wishlist").textContent = w;
    if($("count-loans")) $("count-loans").textContent = l;
}

function loadLibrary() {
    try {
        const raw = JSON.parse(localStorage.getItem("myLibrary"));
        if (raw && typeof raw === "object") {
            return {
                read: Array.isArray(raw.read) ? raw.read : [],
                wishlist: Array.isArray(raw.wishlist) ? raw.wishlist : [],
                loans: Array.isArray(raw.loans) ? raw.loans : []
            };
        }
    } catch {}
    return { read: [], wishlist: [], loans: [] };
}

function saveLibrary(shouldSync, skipRender = false) {
    localStorage.setItem("myLibrary", JSON.stringify(library));
    updateShelfCounts();
    if (!skipRender) renderBooks();
    if (shouldSync && gapi?.client?.getToken?.()) queueUpload();
}

function openMenu() { 
    if($("side-menu")) $("side-menu").classList.add("open"); 
    if($("menu-overlay")) $("menu-overlay").classList.add("open"); 
    document.body.style.overflow = "hidden"; 
}
function closeMenu() { 
    if($("side-menu")) $("side-menu").classList.remove("open"); 
    if($("menu-overlay")) $("menu-overlay").classList.remove("open"); 
    document.body.style.overflow = ""; 
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
    let items = library[currentShelf] || [];
    
    const term = (filterState.text || "").toLowerCase();
    const cleanTerm = term.replace(/[\s-]/g, "");

    if (term || filterState.year || filterState.month || filterState.rating) {
        items = items.filter(b => {
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

    items.slice().reverse().forEach(b => {
        const li = document.createElement("li"); li.className = "book-card";
        
        // --- MENU ---
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
                    dateSpan.style.display = "none";
                    dateInput.style.display = "inline-block";
                    dateInput.focus();
                    dateInput.showPicker(); 
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
        
        // BADGES
        const badges = document.createElement("div");
        badges.className = "badges-row";
        if(b.returnDate && currentShelf === 'loans') {
            const loanBadge = document.createElement("div"); 
            loanBadge.className = "loan-badge"; 
            loanBadge.textContent = t("due") + " " + b.returnDate;
            badges.appendChild(loanBadge);
        }
        if(b.isAudio) {
            const audioBadge = document.createElement("div"); 
            audioBadge.className = "audio-badge"; 
            audioBadge.textContent = t("audio"); 
            badges.appendChild(audioBadge);
        }
        if(badges.children.length > 0) info.appendChild(badges);

        const img = document.createElement(b.cover ? "img" : "div"); img.className = "book-thumb";
        if(b.cover) { img.src = b.cover; img.onerror = () => { img.style.display='none'; }; } 
        else { img.style.background = "#ddd"; }
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
            dateInput.type = "date";
            dateInput.id = `date-input-${b.id}`;
            dateInput.className = "date-edit-input";
            dateInput.value = b.dateRead;
            dateInput.onchange = (e) => { updateReadDate(b.id, e.target.value); };
            dateInput.onblur = () => {
                setTimeout(() => {
                    dateInput.style.display = "none";
                    dateSpan.style.display = "inline";
                }, 200);
            };
            dateDiv.appendChild(dateSpan);
            dateDiv.appendChild(dateInput);
            meta.appendChild(dateDiv);
        }
        info.appendChild(title); 
        info.appendChild(meta);
        if(b.isbn) {
            const isbnPill = document.createElement("div"); 
            isbnPill.className = "isbn-pill"; 
            isbnPill.textContent = `ISBN: ${b.isbn}`; 
            info.appendChild(isbnPill);
        }

        // ACTIONS
        const actions = document.createElement("div"); actions.className = "actions";
        if (currentShelf === 'read') {
            const sel = document.createElement("select"); sel.className = "rating";
            sel.innerHTML = `<option value="0">...</option>` + [1,2,3,4,5].map(n => `<option value="${n}" ${b.rating===n?'selected':''}>${'⭐'.repeat(n)}</option>`).join('');
            sel.onchange = (e) => updateRating(b.id, e.target.value);
            info.appendChild(sel);
            const unreadBtn = document.createElement("button"); 
            unreadBtn.className = "btn-sm btn-unread"; 
            unreadBtn.textContent = t("unread");
            unreadBtn.onclick = () => moveToWishlist(b.id);
            actions.appendChild(unreadBtn);
        } else {
            const moveBtn = document.createElement("button"); 
            moveBtn.className = "move-btn"; 
            moveBtn.textContent = t("markRead");
            moveBtn.onclick = () => moveToRead(b.id);
            actions.appendChild(moveBtn);
        }
        const delBtn = document.createElement("button"); 
        delBtn.className = "btn-del"; 
        delBtn.textContent = "🗑️";
        delBtn.onclick = () => deleteBook(b.id);
        actions.appendChild(delBtn);

        if(currentShelf === 'loans' && b.returnDate) {
            const calBtn = document.createElement("button"); calBtn.className = "btn-cal"; calBtn.textContent = t("reminder");
            calBtn.onclick = () => addToCalendar(b);
            actions.appendChild(calBtn);
        }
        info.appendChild(actions); li.appendChild(info); list.appendChild(li);
    });
    updateShelfCounts();
}

function setActiveTab(shelf) {
    currentShelf = shelf;
    ["read", "wishlist", "loans"].forEach(s => {
        const el = $(`tab-${s}`);
        if(el) el.classList.toggle("active", s === shelf);
    });
    closeMenu();
    renderBooks();
}
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

// =======================
// ACTION FUNCTIONS
// =======================
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
    if(targetShelf === 'loans' && retDate) addToCalendar(newBook);
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

async function ensureSheet() {
    if (spreadsheetId) return;
    const btn = $("auth-btn");
    if(btn) btn.textContent = "Creating...";
    const createResp = await gapi.client.sheets.spreadsheets.create({ properties: { title: "My Book App Data" } });
    spreadsheetId = createResp.result.spreadsheetId;
    localStorage.setItem("sheetId", spreadsheetId);
    updateSheetLink();
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId, range: HEADER_RANGE, valueInputOption: "RAW", resource: { values: [HEADER] }
    });
}
async function doSync() {
    setSyncStatus("working");
    try {
        await ensureSheet();
        updateSheetLink();
        const btn = $("auth-btn");
        if(btn) btn.textContent = t("downloading");
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
        if(btn) btn.textContent = t("synced");
        setSyncStatus("ok");
    } catch (e) {
        logError("Sync Error", e); setSyncStatus("error");
        if (getErrCode(e) === 404) {
            spreadsheetId = null; localStorage.removeItem("sheetId"); updateSheetLink(); 
            const btn = $("auth-btn"); if(btn) { btn.textContent = t("signIn"); btn.disabled = false; }
            alert("Sheet deleted.");
        }
    }
}
async function queueUpload() {
    if (isSyncing) { syncPending = true; return; }
    isSyncing = true; setSyncStatus("working");
    const btn = $("auth-btn"); if(btn) btn.textContent = t("saving");
    try {
        try { await uploadData(); }
        catch (err) { if (err.status === 429 || err.status >= 500) { await sleep(2000); await uploadData(); } else throw err; }
        if(btn) btn.textContent = t("synced"); setSyncStatus("ok");
    } catch (e) {
        logError("Upload Error", e); setSyncStatus("error");
        if ([401, 403].includes(getErrCode(e))) {
            if(btn) { btn.textContent = t("signIn"); btn.disabled = false; }
            gapi.client.setToken(null); alert("Session expired.");
        } else { if(btn) btn.textContent = t("error"); }
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
            spreadsheetId, range: `${SHEET_NAME}!A2`, valueInputOption: "RAW", resource: { values: rows }
        });
    }
}
async function addToCalendar(book) {
    if (!gapi?.client?.getToken?.()) return alert("Sign In first.");
    const dateObj = new Date(book.returnDate); dateObj.setDate(dateObj.getDate() - 1);
    const reminderDate = dateObj.toISOString().split('T')[0];
    try {
        await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': {
                'summary': `Return: ${book.title}`, 'description': `Book by ${getAuthorName(book)}.`,
                'start': { 'date': reminderDate }, 'end': { 'date': reminderDate },
                'reminders': { 'useDefault': false, 'overrides': [ {'method': 'popup', 'minutes': 9 * 60} ] }
            }
        });
        alert(t("reminder") + " ✅");
    } catch (e) { logError("Calendar", e); alert("Calendar Error"); }
}
function showModal(book, scannedIsbn = "") {
    pendingBook = book; if(scannedIsbn) pendingBook.isbn = scannedIsbn;
    $("modal-title").textContent = book.title; $("modal-author").textContent = getAuthorName(book);
    $("modal-isbn").textContent = pendingBook.isbn ? `ISBN: ${pendingBook.isbn}` : "";
    const audioCheck = $("modal-audio-check"); if(audioCheck) audioCheck.checked = false;
    if($("loan-date-row")) $("loan-date-row").style.display = "none";
    if($("modal-return-date")) $("modal-return-date").value = "";
    const cover = safeUrl(book.cover); const img = $("modal-img");
    if(img) { if (cover) { img.src = cover; img.style.display = "block"; } else { img.removeAttribute("src"); img.style.display = "none"; } }
    if($("modal-overlay")) $("modal-overlay").style.display = "flex";
}
async function handleManualAdd() {
    const el = $("isbn-input"); if(!el) return;
    const val = el.value.trim(); if (!val) return;
    el.value = "";
    const isNum = /^[\d-]+$/.test(val) && val.replace(/-/g,"").length >= 9;
    if(isNum) await fetchAndPrompt(val); else await searchAndPrompt(val);
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
async function fetchAndPrompt(rawIsbn) {
    const clean = rawIsbn.replace(/\D/g, "");
    if(clean.length!==10 && clean.length!==13) { scanLocked=false; return alert("Invalid ISBN"); }
    try {
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&jscmd=data&format=json`);
        const data = await res.json();
        if (!data[`ISBN:${clean}`]) { if(confirm("Search text?")) await searchAndPrompt("ISBN " + clean); else scanLocked = false; return; }
        const b = data[`ISBN:${clean}`];
        showModal({ title: b.title, authors: b.authors || [{name:"Unknown"}], cover: b.cover?.medium || null }, clean); 
    } catch { scanLocked=false; alert("Fetch Error"); }
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
function updateSheetLink() {
    const el = $("sheet-link"); if(el) { if(spreadsheetId) { el.href=`https://docs.google.com/spreadsheets/d/${spreadsheetId}`; el.style.display='inline'; } else { el.style.display='none'; } }
}
function setSmartPlaceholder() {
    const el = $("isbn-input"); if (!el) return;
    el.placeholder = window.matchMedia("(max-width: 420px)").matches ? "..." : t("search");
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

        // LANGUAGE
        if($("language-select")) $("language-select").onchange = (e) => setLanguage(e.target.value);

        // FILTERS (Instant)
        const debouncedApply = debounce(applyFilters, 200);
        if($("filter-text")) $("filter-text").oninput = debouncedApply;
        if($("filter-year")) $("filter-year").oninput = (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
            debouncedApply();
        };
        if($("filter-month")) $("filter-month").onchange = applyFilters;
        if($("filter-rating")) $("filter-rating").onchange = applyFilters;
        if($("btn-clear-filters")) $("btn-clear-filters").onclick = clearFilters;

        // ACTIONS
        if($("btn-add")) $("btn-add").onclick = handleManualAdd;
        if($("isbn-input")) $("isbn-input").onkeydown = (e) => { if(e.key==="Enter") handleManualAdd(); };
        if($("btn-scan")) $("btn-scan").onclick = startCamera;
        if($("btn-stop-camera")) $("btn-stop-camera").onclick = stopCamera;
        if($("modal-add-read")) $("modal-add-read").onclick = () => confirmAdd("read");
        if($("modal-add-wish")) $("modal-add-wish").onclick = () => confirmAdd("wishlist");
        if($("modal-add-loan")) $("modal-add-loan").onclick = () => confirmAdd("loans");
        if($("modal-cancel")) $("modal-cancel").onclick = closeModal;
        if($("auth-btn")) { $("auth-btn").onclick = () => { if(!tokenClient) return alert("Loading..."); tokenClient.requestAccessToken({ prompt: "consent" }); }; }
        if($("reset-btn")) $("reset-btn").onclick = hardReset;
        
        const tabsContainer = document.querySelector(".tabs");
        if(tabsContainer) { tabsContainer.addEventListener("click", (e) => { const tab = e.target.closest(".tab"); if (!tab) return; const shelf = tab.id.replace("tab-", ""); setActiveTab(shelf); }); }
        
        const darkModeToggle = $("dark-mode-toggle");
        if(darkModeToggle) {
            if(localStorage.getItem("darkMode") === "true") { document.body.classList.add("dark-mode"); darkModeToggle.checked = true; }
            darkModeToggle.onchange = (e) => { if(e.target.checked) { document.body.classList.add("dark-mode"); localStorage.setItem("darkMode", "true"); } else { document.body.classList.remove("dark-mode"); localStorage.setItem("darkMode", "false"); } };
        }
        
        const yearSpan = $("year"); if(yearSpan) yearSpan.textContent = new Date().getFullYear();
        
        setSyncStatus("idle");
        // INIT LANGUAGE & RENDER
        setLanguage(currentLang);
        updateShelfCounts();
        updateSheetLink();
        setSmartPlaceholder();
        window.addEventListener("resize", setSmartPlaceholder);
        window.addEventListener("orientationchange", setSmartPlaceholder);
        console.log("Cloud Library Loaded OK");
    } catch (err) { logError("App Start Failed", err); alert("App failed to start."); }
});
