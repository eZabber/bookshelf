// =======================
// CONFIG
// =======================
const CLIENT_ID = "579369345257-sqq02cnitlhcf54o5ptad36fm19jcha7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events";
const DISCOVERY = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];

const SHEET_NAME = "Sheet1";
const HEADER_RANGE = `${SHEET_NAME}!A1:J1`;
const DATA_RANGE = `${SHEET_NAME}!A2:J999`;
const HEADER = ["ID", "Title", "Author", "Shelf", "Rating", "Cover", "Date", "ReturnDate", "Audio", "ISBN"];

// =======================
// STATE & DOM
// =======================
let tokenClient = null;
let gapiInited = false, gisInited = false;
let spreadsheetId = localStorage.getItem("sheetId") || null;
let currentShelf = "read"; 
let library = { read: [], wishlist: [], loans: [] }; 
let html5QrCode = null, scanLocked = false, pendingBook = null;
let isSyncing = false, syncPending = false;
let filterState = { text: "", year: "", month: "" };

const $ = (id) => document.getElementById(id);
// Note: 'list', 'sideMenu', 'menuOverlay' are found inside init to ensure DOM is ready

// =======================
// HELPERS & CORE
// =======================
function logError(msg, err) {
    const log = $("debug-log");
    if(log) {
        log.style.display = "block";
        log.textContent = "ERROR: " + msg + "\nDETAILS: " + safeStringify(err);
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

// UPDATE COUNTERS (Only in Menu now)
function updateShelfCounts() {
    const r = library.read?.length || 0;
    const w = library.wishlist?.length || 0;
    const l = library.loans?.length || 0;

    // Clean Tabs
    const tRead = document.getElementById("tab-read");
    const tWish = document.getElementById("tab-wishlist");
    const tLoans = document.getElementById("tab-loans");
    if(tRead) tRead.textContent = "Read";
    if(tWish) tWish.textContent = "Wishlist";
    if(tLoans) tLoans.textContent = "Loans";

    // Update Menu Stats
    const cRead = document.getElementById("count-read");
    const cWish = document.getElementById("count-wishlist");
    const cLoans = document.getElementById("count-loans");
    if(cRead) cRead.textContent = `Read: ${r}`;
    if(cWish) cWish.textContent = `Wish: ${w}`;
    if(cLoans) cLoans.textContent = `Loans: ${l}`;
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

// =======================
// LOGIC & UI FUNCTIONS
// =======================
function openMenu() { 
    $("side-menu").classList.add("open"); 
    $("menu-overlay").classList.add("open"); 
    document.body.style.overflow = "hidden"; 
}
function closeMenu() { 
    $("side-menu").classList.remove("open"); 
    $("menu-overlay").classList.remove("open"); 
    document.body.style.overflow = ""; 
}

function clearFilters() {
    $("filter-text").value = "";
    $("filter-year").value = "";
    $("filter-month").value = "";
    filterState = { text: "", year: "", month: "" };
    applyFilters();
}

function renderBooks() {
    const list = $("book-list");
    if(!list) return;

    list.innerHTML = "";
    let items = library[currentShelf] || [];
    
    const term = (filterState.text || "").toLowerCase();
    const cleanTerm = term.replace(/[\s-]/g, "");

    if (term || filterState.year || filterState.month) {
        items = items.filter(b => {
            const matchText = !term || 
                b.title.toLowerCase().includes(term) || 
                getAuthorName(b).toLowerCase().includes(term) ||
                (b.isbn && b.isbn.replace(/[\s-]/g, "").toLowerCase().includes(cleanTerm));
            
            let dateStr = currentShelf === 'read' ? b.dateRead : (currentShelf === 'loans' ? b.returnDate : "");
            const matchYear = !filterState.year || (dateStr && dateStr.startsWith(filterState.year));
            const matchMonth = !filterState.month || (dateStr && dateStr.substring(5,7) === filterState.month);
            return matchText && matchYear && matchMonth;
        });
    }

    items.slice().reverse().forEach(b => {
        const li = document.createElement("li"); li.className = "book-card";
        const info = document.createElement("div"); info.className = "book-info";
        
        // --- BADGES ROW ---
        const badges = document.createElement("div");
        badges.className = "badges-row";
        
        if(b.returnDate && currentShelf === 'loans') {
            const loanBadge = document.createElement("div"); 
            loanBadge.className = "loan-badge"; 
            loanBadge.textContent = "Due: " + b.returnDate;
            badges.appendChild(loanBadge);
        }

        if(b.isAudio) {
            const audioBadge = document.createElement("div"); 
            audioBadge.className = "audio-badge"; 
            audioBadge.textContent = "🎧 Audio"; 
            badges.appendChild(audioBadge);
        }
        if(badges.children.length > 0) info.appendChild(badges);

        const img = document.createElement(b.cover ? "img" : "div"); img.className = "book-thumb";
        if(b.cover) { img.src = b.cover; img.onerror = () => { img.style.display='none'; }; } 
        else { img.style.background = "#ddd"; }
        li.appendChild(img);

        const title = document.createElement("div"); title.className = "book-title"; title.textContent = b.title;
        const meta = document.createElement("div"); meta.className = "book-meta";
        let metaText = getAuthorName(b);
        if(currentShelf==='read' && b.dateRead) metaText += ` • Finished: ${b.dateRead}`;
        meta.textContent = metaText;
        
        info.appendChild(title); 
        info.appendChild(meta);
        
        if(b.isbn) {
            const isbnPill = document.createElement("div"); 
            isbnPill.className = "isbn-pill"; 
            isbnPill.textContent = `ISBN: ${b.isbn}`; 
            info.appendChild(isbnPill);
        }

        const actions = document.createElement("div"); actions.className = "actions";
        
        if (currentShelf === 'read') {
            const sel = document.createElement("select"); sel.className = "rating";
            sel.innerHTML = `<option value="0">Rate...</option>` + [1,2,3,4,5].map(n => `<option value="${n}" ${b.rating===n?'selected':''}>${'⭐'.repeat(n)}</option>`).join('');
            sel.onchange = (e) => updateRating(b.id, e.target.value);
            info.appendChild(sel);

            const unreadBtn = document.createElement("button"); 
            unreadBtn.className = "btn-sm btn-unread"; 
            unreadBtn.textContent = "↩︎ Unread"; 
            unreadBtn.onclick = () => moveToWishlist(b.id);
            actions.appendChild(unreadBtn);

        } else {
            const moveBtn = document.createElement("button"); 
            moveBtn.className = "move-btn"; 
            moveBtn.textContent = "Mark Read"; 
            moveBtn.onclick = () => moveToRead(b.id);
            actions.appendChild(moveBtn);
        }

        const delBtn = document.createElement("button"); 
        delBtn.className = "btn-del"; 
        delBtn.textContent = "🗑️"; // ICON ONLY
        delBtn.onclick = () => deleteBook(b.id);
        actions.appendChild(delBtn);

        if(currentShelf === 'loans' && b.returnDate) {
            const calBtn = document.createElement("button"); calBtn.className = "btn-cal"; calBtn.textContent = "📅 Reminder"; 
            calBtn.onclick = () => addToCalendar(b);
            actions.appendChild(calBtn);
        }

        info.appendChild(actions); li.appendChild(info); list.appendChild(li);
    });
    updateShelfCounts();
}

const debouncedRender = debounce(renderBooks, 300);

function applyFilters() {
    filterState.text = $("filter-text").value.toLowerCase();
    filterState.year = $("filter-year").value;
    filterState.month = $("filter-month").value;
    debouncedRender();
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
    $("modal-overlay").style.display = "none"; 
    $("loan-date-row").style.display = "none";
    pendingBook = null; scanLocked = false; 
}

function hardReset() {
    if (!confirm("Reset App? This deletes local data and disconnects the Sheet.")) return;
    localStorage.removeItem("sheetId");
    localStorage.removeItem("myLibrary");
    localStorage.removeItem("darkMode");
    location.reload();
}

// =======================
// ACTION FUNCTIONS
// =======================
function confirmAdd(targetShelf) {
    if (!pendingBook) return;
    const key = normKey(pendingBook);
    const exists = library[targetShelf].some(b => normKey(b) === key);
    if (exists && !confirm("Book exists in shelf. Add duplicate?")) { closeModal(); return; }

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
        if(!retDate) return alert("Please pick a return date.");
    }

    const newBook = {
        id: makeId(),
        title: pendingBook.title || "Unknown",
        authors: pendingBook.authors || [{name:"Unknown"}],
        rating: 0,
        cover: safeUrl(pendingBook.cover) || null,
        dateRead: targetShelf === 'read' ? todayISO() : "",
        returnDate: retDate,
        isAudio: $("modal-audio-check").checked,
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
    if (!confirm("Delete?")) return;
    library[currentShelf] = library[currentShelf].filter(b => b.id !== id);
    saveLibrary(true);
}

function updateRating(id, val) {
    const book = library.read.find(b => b.id === id);
    if (book) { book.rating = Number(val); saveLibrary(true); }
}

// =======================
// AUTH & SYNC (Global)
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
            $("auth-btn").textContent = "Working...";
            await doSync();
        }
    });
    gisInited = true; maybeEnableAuth();
}
function maybeEnableAuth() { if (gapiInited && gisInited) $("auth-btn").disabled = false; }

async function ensureSheet() {
    if (spreadsheetId) return;
    $("auth-btn").textContent = "Creating Sheet...";
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
        $("auth-btn").textContent = "Downloading...";
        const resp = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: DATA_RANGE });
        const rows = resp.result.values || [];

        if (rows.length > 0) {
            const newLib = { read: [], wishlist: [], loans: [] };
            rows.forEach(row => {
                if (!row?.[0]) return;
                let shelf = (row[3] || "read").toLowerCase();
                if(!['read','wishlist','loans'].includes(shelf)) shelf = 'read';
                newLib[shelf].push({
                    id: String(row[0]), 
                    title: row[1] || "Unknown",
                    authors: [{ name: row[2] || "Unknown" }],
                    shelf: shelf,
                    rating: Number(row[4] || 0),
                    cover: row[5] === "null" ? null : (row[5] || null),
                    dateRead: row[6] || "",
                    returnDate: row[7] || "",
                    isAudio: String(row[8]).toUpperCase() === "TRUE",
                    isbn: row[9] || ""
                });
            });
            library = newLib;
            saveLibrary(false);
        } else { await queueUpload(); }
        $("auth-btn").textContent = "Synced ✅";
        setSyncStatus("ok");
    } catch (e) {
        logError("Sync Error", e);
        setSyncStatus("error");
        if (getErrCode(e) === 404) {
            spreadsheetId = null; localStorage.removeItem("sheetId");
            updateSheetLink(); $("auth-btn").textContent = "Sign In"; $("auth-btn").disabled = false;
            alert("Sheet deleted. Please Sign In again.");
        }
    }
}

async function queueUpload() {
    if (isSyncing) { syncPending = true; return; }
    isSyncing = true;
    setSyncStatus("working");
    $("auth-btn").textContent = "Saving...";
    try {
        try { await uploadData(); }
        catch (err) {
            if (err.status === 429 || err.status >= 500) { await sleep(2000); await uploadData(); }
            else throw err;
        }
        $("auth-btn").textContent = "Synced ✅";
        setSyncStatus("ok");
    } catch (e) {
        logError("Upload Error", e);
        setSyncStatus("error");
        if ([401, 403].includes(getErrCode(e))) {
            $("auth-btn").textContent = "Sign In"; $("auth-btn").disabled = false;
            gapi.client.setToken(null);
            alert("Session expired. Please sign in.");
        } else { $("auth-btn").textContent = "Error ❌"; }
    } finally {
        isSyncing = false;
        if (syncPending) { syncPending = false; setTimeout(queueUpload, 0); }
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

function showModal(book, scannedIsbn = "") {
    pendingBook = book;
    if(scannedIsbn) pendingBook.isbn = scannedIsbn;
    $("modal-title").textContent = book.title;
    $("modal-author").textContent = getAuthorName(book);
    $("modal-isbn").textContent = pendingBook.isbn ? `ISBN: ${pendingBook.isbn}` : "";
    $("modal-audio-check").checked = false;
    $("loan-date-row").style.display = "none";
    $("modal-return-date").value = "";
    const cover = safeUrl(book.cover);
    const img = $("modal-img");
    if (cover) { img.src = cover; img.style.display = "block"; }
    else { img.removeAttribute("src"); img.style.display = "none"; }
    $("modal-overlay").style.display = "flex";
}

async function handleManualAdd() {
    const val = $("isbn-input").value.trim();
    if (!val) return;
    $("isbn-input").value = "";
    const isNum = /^[\d-]+$/.test(val) && val.replace(/-/g,"").length >= 9;
    if(isNum) await fetchAndPrompt(val); else await searchAndPrompt(val);
}

async function searchAndPrompt(query) {
    try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data?.docs?.length) {
            const d = data.docs[0];
            showModal({
                title: d.title, authors: [{name: d.author_name?.[0] || "Unknown"}],
                cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
                isbn: d.isbn?.[0] || ""
            });
        } else {
            if(confirm("No match. Add manual?")) showModal({ title: query, authors:[{name:"Manual"}] });
            else scanLocked = false;
        }
    } catch { scanLocked = false; alert("Search Error"); }
}

async function fetchAndPrompt(rawIsbn) {
    const clean = rawIsbn.replace(/\D/g, "");
    if(clean.length!==10 && clean.length!==13) { scanLocked=false; return alert("Invalid ISBN"); }
    try {
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&jscmd=data&format=json`);
        const data = await res.json();
        const key = `ISBN:${clean}`;
        if (!data[key]) {
            if(confirm("ISBN not found. Search text?")) await searchAndPrompt("ISBN " + clean);
            else scanLocked = false;
            return;
        }
        const b = data[key];
        showModal({
            title: b.title, authors: b.authors || [{name:"Unknown"}],
            cover: b.cover?.medium || null
        }, clean); 
    } catch { scanLocked=false; alert("Fetch Error"); }
}

async function startCamera() {
    $("reader-container").style.display = "block";
    if(html5QrCode) try{await html5QrCode.stop();}catch{}
    html5QrCode = new Html5Qrcode("reader");
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const onSuccess = async (txt) => {
        if(scanLocked) return;
        scanLocked = true;
        await stopCamera();
        await fetchAndPrompt(txt);
    };

    try {
        await html5QrCode.start({ facingMode: "environment" }, config, onSuccess);
    } catch (err) { 
        try {
            await html5QrCode.start({ facingMode: "user" }, config, onSuccess);
        } catch (err2) {
            console.warn("Camera Error", err2);
            $("reader-container").style.display="none"; 
            alert("Camera Error (Check Permissions)");
        }
    }
}
async function stopCamera() {
    $("reader-container").style.display = "none";
    if(html5QrCode) { try{await html5QrCode.stop();}catch{}; try{html5QrCode.clear();}catch{}; html5QrCode=null; }
}

function updateSheetLink() {
    const el = $("sheet-link");
    if(spreadsheetId) { el.href=`https://docs.google.com/spreadsheets/d/${spreadsheetId}`; el.style.display='inline'; } else { el.style.display='none'; }
}

function setSmartPlaceholder() {
    const el = $("isbn-input");
    if (!el) return;
    el.placeholder = window.matchMedia("(max-width: 420px)").matches
        ? "Search ISBN, Title, Author…"
        : "Scan or type an ISBN… or just name the book";
}

// =======================
// SAFE INITIALIZATION (Wait for DOM)
// =======================
window.addEventListener("DOMContentLoaded", () => {
    try {
        library = loadLibrary();
        
        // Listeners
        $("menu-btn").onclick = openMenu;
        $("menu-overlay").onclick = closeMenu; 
        $("modal-overlay").onclick = (e) => { if (e.target.id === "modal-overlay") closeModal(); };

        const debouncedApplyFilters = debounce(applyFilters, 200);
        $("filter-text").oninput = debouncedApplyFilters;
        $("filter-year").oninput = (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
            debouncedApplyFilters();
        };
        $("filter-month").onchange = applyFilters;

        $("btn-add").onclick = handleManualAdd;
        $("isbn-input").onkeydown = (e) => { if(e.key==="Enter") handleManualAdd(); };
        $("btn-scan").onclick = startCamera;
        $("btn-stop-camera").onclick = stopCamera;

        $("modal-add-read").onclick = () => confirmAdd("read");
        $("modal-add-wish").onclick = () => confirmAdd("wishlist");
        $("modal-add-loan").onclick = () => confirmAdd("loans");
        $("modal-cancel").onclick = closeModal;

        $("auth-btn").onclick = () => {
            if(!tokenClient) return alert("Auth is still loading, try again in a moment.");
            tokenClient.requestAccessToken({ prompt: "consent" });
        };
        $("reset-btn").onclick = hardReset;

        document.querySelector(".tabs").addEventListener("click", (e) => {
            const tab = e.target.closest(".tab");
            if (!tab) return;
            const shelf = tab.id.replace("tab-", "");
            setActiveTab(shelf);
        });

        // UI Init
        const darkModeToggle = $("dark-mode-toggle");
        if(localStorage.getItem("darkMode") === "true") { document.body.classList.add("dark-mode"); darkModeToggle.checked = true; }
        darkModeToggle.onchange = (e) => {
            if(e.target.checked) { document.body.classList.add("dark-mode"); localStorage.setItem("darkMode", "true"); }
            else { document.body.classList.remove("dark-mode"); localStorage.setItem("darkMode", "false"); }
        };

        $("year").textContent = new Date().getFullYear();
        setSyncStatus("idle");
        renderBooks();
        updateShelfCounts();
        updateSheetLink();
        setSmartPlaceholder();
        window.addEventListener("resize", setSmartPlaceholder);
        window.addEventListener("orientationchange", setSmartPlaceholder);
        
        console.log("Cloud Library Loaded OK");

    } catch (err) {
        logError("App Start Failed", err);
        alert("App failed to start. Check debug log.");
    }
});
