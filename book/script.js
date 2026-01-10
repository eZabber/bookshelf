/* =========================================================
   MY BOOKSHELF APP — MANUAL CLOUD CONTROLS
   ========================================================= */

const CLIENT_ID = "579369345257-sqq02cnitlhcf54o5ptad36fm19jcha7.apps.googleusercontent.com";
// LISÄÄ TÄHÄN GOOGLE CLOUD CONSOLESTA LUOTU API KEY (Picker vaatii tämän)
const DEVELOPER_KEY = ""; 

// Minimal permissions
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/calendar.events"
];

const DISCOVERY = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];

const SPREADSHEET_TITLE = "My Book App Data";
const SHEET_NAME = "Sheet1";
const HEADER = ["ID", "Title", "Author", "Shelf", "Rating", "Cover", "Date", "ReturnDate", "Audio", "ISBN"];
const HEADER_RANGE = `${SHEET_NAME}!A1:J1`;
const WRITE_RANGE = `${SHEET_NAME}!A2`;
const DATA_RANGE = `${SHEET_NAME}!A2:J999`;

const TRANSLATIONS = {
  en: {
    read: "Read", wishlist: "Wishlist", loans: "Loans",
    settings: "Settings & Filters", shelves: "Shelves", display: "Display",
    filter: "Filter Books", year: "Year", month: "Month", rating: "Rating",
    clear: "Clear Filters", reset: "Reset App Data",
    integrations: "Integrations", calConn: "Connect Calendar", calDesc: "Enable for background syncing.",
    data: "Data & Backup", 
    export: "Export to File (JSON)", import: "Import from File",
    
    // NEW CLOUD BUTTONS
    cloudSection: "Google Drive Sync",
    btnSaveCloud: "Save to Drive (Sync)",
    btnLoadCloud: "Load from Drive (Open)",
    
    dark: "Dark Mode", lang: "Language",
    search: "Search ISBN, Title, Author...", add: "Add",
    signIn: "Sign In", working: "...", synced: "Synced",
    downloading: "Loading...", saving: "Saving...", error: "Error",
    markRead: "Mark Read", unread: "↩︎ Unread", delete: "Delete?",
    finished: "Finished:", due: "Due:", audio: "🎧 Audio", reminder: "📅 Reminder",
    modalAudio: "🎧 Audio?", modalReturn: "📅 Return", cancel: "Cancel",
    changeDate: "📅 Change Date", copyTitle: "📋 Copy Title",
    importSuccess: "Success! ✅",
    calAdded: "Event added! 📅",
    filterStats: "Showing {0} of {1} books",
    clearBtn: "Clear",
    invalidIsbn: "Invalid ISBN",
    sessionExpired: "Session expired.",
    dateRequired: "Date?",
    pickerTitle: "Select your Book Data Sheet",
    signInRequired: "Please Sign In first.",
    confirmLoad: "This will overwrite your local library with data from Drive. Continue?"
  },
  fi: {
    read: "Luetut", wishlist: "Toivelista", loans: "Lainassa",
    settings: "Asetukset", shelves: "Hyllyt", display: "Näkymä",
    filter: "Suodata", year: "Vuosi", month: "Kuukausi", rating: "Arvosana",
    clear: "Tyhjennä", reset: "Nollaa tiedot",
    integrations: "Integraatiot", calConn: "Yhdistä kalenteri", calDesc: "Käytä taustasynkronointia.",
    data: "Tiedot & Varmuuskopio", 
    export: "Lataa tiedostona (JSON)", import: "Palauta tiedostosta",
    
    // UUDET PILVINAPIT
    cloudSection: "Google Drive Tallennus",
    btnSaveCloud: "Tallenna Driveen (Sync)",
    btnLoadCloud: "Lataa Drivestä (Avaa)",

    dark: "Tumma tila", lang: "Kieli",
    search: "Etsi ISBN, Nimi, Kirjailija...", add: "Lisää",
    signIn: "Kirjaudu", working: "...", synced: "Synkattu",
    downloading: "Ladataan...", saving: "Tallennetaan...", error: "Virhe",
    markRead: "Merkitse luetuksi", unread: "↩︎ Lukematon", delete: "Poista?",
    finished: "Luettu:", due: "Eräpäivä:", audio: "🎧 Ääni", reminder: "📅 Muistutus",
    modalAudio: "🎧 Äänikirja?", modalReturn: "📅 Palautus", cancel: "Peruuta",
    changeDate: "📅 Muuta päivää", copyTitle: "📋 Kopioi nimi",
    importSuccess: "Onnistui! ✅",
    calAdded: "Tapahtuma lisätty! 📅",
    filterStats: "Näytetään {0} / {1} kirjaa",
    clearBtn: "Tyhjennä",
    invalidIsbn: "Virheellinen ISBN",
    sessionExpired: "Istunto vanheni.",
    dateRequired: "Päivämäärä?",
    pickerTitle: "Valitse kirjataulukkosi",
    signInRequired: "Kirjaudu ensin.",
    confirmLoad: "Tämä korvaa paikalliset kirjat Drivestä ladatuilla tiedoilla. Jatketaanko?"
  },
  et: {
    read: "Loetud", wishlist: "Soovinimekiri", loans: "Laenatud",
    settings: "Sätted", shelves: "Riiulid", display: "Kuva",
    filter: "Filtreeri", year: "Aasta", month: "Kuu", rating: "Hinne",
    clear: "Tühjenda", reset: "Lähtesta andmed",
    integrations: "Integratsioonid", calConn: "Ühenda kalender", calDesc: "Luba taustal sünkroonimine.",
    data: "Andmed ja varukoopia", 
    export: "Lae alla failina (JSON)", import: "Taasta failist",
    
    // NEW CLOUD BUTTONS
    cloudSection: "Google Drive Sync",
    btnSaveCloud: "Salvesta Drive'i (Sync)",
    btnLoadCloud: "Lae Drive'ist (Ava)",

    dark: "Tume režiim", lang: "Keel",
    search: "Otsi ISBN, Pealkiri, Autor...", add: "Lisa",
    signIn: "Logi sisse", working: "...", synced: "Sünkroonitud",
    downloading: "Laadin...", saving: "Salvestan...", error: "Viga",
    markRead: "Märgi loetuks", unread: "↩︎ Lugemata", delete: "Kustuta?",
    finished: "Loetud:", due: "Tähtaeg:", audio: "🎧 Audio", reminder: "📅 Meeldetuletus",
    modalAudio: "🎧 Audioraamat?", modalReturn: "📅 Tagastus", cancel: "Loobu",
    changeDate: "📅 Muuda kuupäeva", copyTitle: "📋 Kopeeri pealkiri",
    importSuccess: "Õnnestus! ✅",
    calAdded: "Sündmus lisatud! 📅",
    filterStats: "Kuvatakse {0} / {1} raamatut",
    clearBtn: "Tühjenda",
    invalidIsbn: "Vigane ISBN",
    sessionExpired: "Seanss aegus.",
    dateRequired: "Kuupäev?",
    pickerTitle: "Vali oma raamatutabel",
    signInRequired: "Palun logi esmalt sisse.",
    confirmLoad: "See kirjutab kohalikud andmed üle Drive'i andmetega. Jätka?"
  }
};

/* =========================
   2) STATE & UTILS
   ========================= */
const LS = { LANG: "appLang", LIB: "myLibrary", SHEET_ID: "sheetId", SCOPES: "granted_scopes", DARK: "darkMode", CAL_SYNC: "calSync" };
let currentLang = localStorage.getItem(LS.LANG) || "en";
let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let spreadsheetId = localStorage.getItem(LS.SHEET_ID) || null;
let currentShelf = "read";
let library = { read: [], wishlist: [], loans: [] };
let html5QrCode = null;
let scanLocked = false;
let pendingBook = null;
let isSyncing = false;
let syncPending = false;
let appStatus = "idle"; 
let filterState = { text: "", year: "", month: "", rating: "" };
let pendingCalendarBook = null;
let accessToken = null;

const $ = (id) => document.getElementById(id);
const t = (key) => (TRANSLATIONS[currentLang]?.[key] ?? key);
function setText(id, text) { const el = $(id); if (el) el.textContent = String(text ?? ""); }
function addClick(id, handler) { const el = $(id); if (el) el.onclick = handler; }
function logError(msg, err) { console.error(msg, err); }
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function todayISO() { return new Date().toISOString().split("T")[0]; }
function safeUrl(url) { try { const u = new URL(url); return (u.protocol === "http:" || u.protocol === "https:") ? u.href : ""; } catch { return ""; } }
function getAuthorName(book) { return String(book?.authors?.[0]?.name || "Unknown"); }
function normKey(book) { return `${book?.title || ""}|${getAuthorName(book)}`.toLowerCase().trim(); }
function getErrCode(e) { return e?.status ?? e?.result?.error?.code ?? null; }
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function debounce(fn, ms = 300) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; }
function hasScope(scope) { const s = (localStorage.getItem(LS.SCOPES) || "").trim(); return s.split(/\s+/).includes(scope); }
function addGrantedScopes(scopeString) {
  if (!scopeString) return;
  const current = (localStorage.getItem(LS.SCOPES) || "").trim();
  const merged = (current + " " + scopeString).split(/\s+/).filter((v, i, a) => v && a.indexOf(v) === i).join(" ");
  localStorage.setItem(LS.SCOPES, merged);
}
function getReminderDates(returnDateStr) {
  const [y, m, d] = returnDateStr.split("-").map(Number);
  const returnObj = new Date(y, m - 1, d, 12, 0, 0);
  const startObj = new Date(returnObj); startObj.setDate(startObj.getDate() - 1);
  const endObj = new Date(startObj); endObj.setDate(endObj.getDate() + 1);
  const fmt = (dt) => {
    const yy = dt.getFullYear(); const mm = String(dt.getMonth() + 1).padStart(2, "0"); const dd = String(dt.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };
  return { start: fmt(startObj), end: fmt(endObj) };
}

/* =========================
   3) LIBRARY STORAGE
   ========================= */
function loadLibrary() { try { const raw = JSON.parse(localStorage.getItem(LS.LIB)); if (raw && typeof raw === "object") return raw; } catch {} return { read: [], wishlist: [], loans: [] }; }
function saveLibrary({ shouldSync = false, skipRender = false } = {}) {
  localStorage.setItem(LS.LIB, JSON.stringify(library));
  updateShelfCounts();
  if (!skipRender) renderBooks();
  // NOTE: In manual mode, we only autosync if we HAVE a sheetId already
  if (shouldSync && spreadsheetId && gapi?.client?.getToken?.()) queueUpload();
}
function updateShelfCounts() { setText("count-read", library.read?.length || 0); setText("count-wishlist", library.wishlist?.length || 0); setText("count-loans", library.loans?.length || 0); }

/* =========================
   4) UI & FILTERS
   ========================= */
function openMenu() { $("side-menu")?.classList.add("open"); $("menu-overlay")?.classList.add("open"); document.body.style.overflow = "hidden"; }
function closeMenu() { $("side-menu")?.classList.remove("open"); $("menu-overlay")?.classList.remove("open"); document.body.style.overflow = ""; }
function setActiveTab(shelf) { currentShelf = shelf; ["read", "wishlist", "loans"].forEach((s) => $(`tab-${s}`)?.classList.toggle("active", s === shelf)); closeMenu(); renderBooks(); }
function setSmartPlaceholder() { const el = $("isbn-input"); if (el) el.placeholder = t("search"); }
function updateSheetLink() { const el = $("sheet-link"); if (!el) return; if (spreadsheetId) { el.href = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`; el.style.display = "inline"; } else { el.style.display = "none"; } }

function setSyncStatus(state) {
  appStatus = state;
  const dot = $("sync-dot"); const btn = $("auth-btn");
  if (dot) {
    if (state === "working") dot.style.background = "#f1c40f"; else if (state === "synced") dot.style.background = "#2ecc71"; else if (state === "error") dot.style.background = "#e74c3c"; else dot.style.background = "#bbb";
  }
  if (btn) {
    if (state === "working") btn.textContent = t("working"); else if (state === "synced") btn.textContent = t("synced"); else if (state === "error") btn.textContent = t("error"); else btn.textContent = t("signIn");
  }
}

function setLanguage(lang) {
  currentLang = lang; localStorage.setItem(LS.LANG, lang);
  const sel = $("language-select"); if (sel) sel.value = lang;
  
  // Tabs
  setText("tab-read", t("read")); setText("tab-wishlist", t("wishlist")); setText("tab-loans", t("loans"));
  // Menu
  setText("menu-lang", t("lang")); setText("menu-settings", t("settings")); setText("menu-shelves", t("shelves"));
  setText("menu-display", t("display")); setText("menu-filter", t("filter"));
  setText("menu-integrations", t("integrations")); setText("label-cal-conn", t("calConn")); setText("cal-desc", t("calDesc"));
  setText("menu-data", t("data")); 
  
  // Cloud Buttons
  setText("cloud-header", t("cloudSection"));
  setText("btn-save-drive", t("btnSaveCloud"));
  setText("btn-load-drive", t("btnLoadCloud"));
  
  // Stats
  setText("label-stat-read", t("read")); setText("label-stat-wish", t("wishlist")); setText("label-stat-loans", t("loans"));
  setText("label-darkmode", t("dark")); setText("label-year", t("year")); setText("label-month", t("month")); setText("label-rating", t("rating"));
  setText("btn-clear-filters", t("clear")); setText("reset-btn", t("reset")); setText("btn-export", t("export")); setText("btn-import", t("import"));
  setText("btn-add", t("add")); 
  setSmartPlaceholder(); setSyncStatus(appStatus);
  setText("modal-add-read", `${t("add")} -> ${t("read")}`); setText("modal-add-wish", `${t("add")} -> ${t("wishlist")}`);
  setText("modal-add-loan", `${t("add")} -> ${t("loans")}`); setText("modal-cancel", t("cancel")); setText("label-audio", t("modalAudio")); setText("label-return", t("modalReturn"));
  renderBooks();
}

function clearFilters() { if ($("filter-text")) $("filter-text").value = ""; if ($("filter-year")) $("filter-year").value = ""; if ($("filter-month")) $("filter-month").value = ""; if ($("filter-rating")) $("filter-rating").value = ""; filterState = { text: "", year: "", month: "", rating: "" }; applyFilters(); closeMenu(); }
function applyFilters() {
  const textEl = $("filter-text"); const yEl = $("filter-year"); const mEl = $("filter-month"); const rEl = $("filter-rating");
  if (textEl) filterState.text = (textEl.value || "").toLowerCase();
  if (yEl) filterState.year = yEl.value || ""; if (mEl) filterState.month = mEl.value || ""; if (rEl) filterState.rating = rEl.value || "";
  renderBooks();
}

function renderBooks() {
  const list = $("book-list"); if (!list) return; list.innerHTML = "";
  const allItems = Array.isArray(library[currentShelf]) ? library[currentShelf] : [];
  let visibleItems = allItems;
  const term = (filterState.text || "").toLowerCase(); const cleanTerm = term.replace(/[\s-]/g, "");

  if (term || filterState.year || filterState.month || filterState.rating) {
    visibleItems = allItems.filter((b) => {
      const titleLc = String(b?.title || "").toLowerCase(); const authorLc = getAuthorName(b).toLowerCase(); const isbnLc = String(b?.isbn || "").replace(/[\s-]/g, "").toLowerCase();
      const matchText = !term || titleLc.includes(term) || authorLc.includes(term) || isbnLc.includes(cleanTerm);
      const dateStr = currentShelf === "read" ? String(b?.dateRead || "") : currentShelf === "loans" ? String(b?.returnDate || "") : "";
      const matchYear = !filterState.year || (dateStr && dateStr.startsWith(filterState.year));
      const matchMonth = !filterState.month || (dateStr && dateStr.substring(5, 7) === filterState.month);
      const matchRating = !filterState.rating || (Number(b?.rating || 0) === Number(filterState.rating));
      return matchText && matchYear && matchMonth && matchRating;
    });
  }
  updateShelfCounts();
  const statusEl = $("filter-status");
  if (statusEl) {
    if (allItems.length !== visibleItems.length) {
      statusEl.style.display = "flex";
      const msg = t("filterStats").replace("{0}", String(visibleItems.length)).replace("{1}", String(allItems.length));
      statusEl.innerHTML = `<span>${msg}</span> <span class="filter-clear-link" onclick="clearFilters()">${t("clearBtn")}</span>`;
    } else { statusEl.style.display = "none"; }
  }

  visibleItems.slice().reverse().forEach((b) => {
    const li = document.createElement("li"); li.className = "book-card";
    const menuContainer = document.createElement("div"); menuContainer.className = "card-menu-container";
    const dotsBtn = document.createElement("button"); dotsBtn.className = "dots-btn"; dotsBtn.innerHTML = "⋮";
    dotsBtn.onclick = (e) => { e.stopPropagation(); document.querySelectorAll(".menu-dropdown.show").forEach((d) => d.classList.remove("show")); menuContainer.querySelector(".menu-dropdown")?.classList.toggle("show"); };
    const dropdown = document.createElement("div"); dropdown.className = "menu-dropdown";

    if (currentShelf === "read") {
      const editDateBtn = document.createElement("button"); editDateBtn.className = "menu-item"; editDateBtn.innerHTML = t("changeDate");
      editDateBtn.onclick = () => {
        const dateSpan = document.getElementById(`date-display-${b.id}`); const dateInput = document.getElementById(`date-input-${b.id}`);
        if (dateSpan && dateInput) { dateSpan.style.display = "none"; dateInput.style.display = "inline-block"; dateInput.focus(); try { dateInput.showPicker(); } catch {} }
      }; dropdown.appendChild(editDateBtn);
    }
    const copyBtn = document.createElement("button"); copyBtn.className = "menu-item"; copyBtn.innerHTML = t("copyTitle");
    copyBtn.onclick = () => navigator.clipboard?.writeText?.(String(b?.title || ""))?.catch?.(() => {}); dropdown.appendChild(copyBtn);
    menuContainer.appendChild(dotsBtn); menuContainer.appendChild(dropdown); li.appendChild(menuContainer);

    const coverUrl = safeUrl(b?.cover); const thumb = document.createElement(coverUrl ? "img" : "div"); thumb.className = "book-thumb";
    if (coverUrl) { thumb.src = coverUrl; thumb.onerror = () => { thumb.style.display = "none"; }; } else { thumb.style.background = "#ddd"; } li.appendChild(thumb);

    const info = document.createElement("div"); info.className = "book-info";
    const badges = document.createElement("div"); badges.className = "badges-row";
    if (currentShelf === "loans" && b?.returnDate) { const loanBadge = document.createElement("div"); loanBadge.className = "loan-badge"; loanBadge.textContent = `${t("due")} ${b.returnDate}`; badges.appendChild(loanBadge); }
    if (b?.isAudio) { const audioBadge = document.createElement("div"); audioBadge.className = "audio-badge"; audioBadge.textContent = t("audio"); badges.appendChild(audioBadge); }
    if (badges.children.length > 0) info.appendChild(badges);

    const titleDiv = document.createElement("div"); titleDiv.className = "book-title"; titleDiv.textContent = String(b?.title || "Unknown");
    const metaDiv = document.createElement("div"); metaDiv.className = "book-meta";
    const authorDiv = document.createElement("div"); authorDiv.textContent = getAuthorName(b); metaDiv.appendChild(authorDiv);

    if (currentShelf === "read" && b?.dateRead) {
      const dateDiv = document.createElement("div");
      const dateSpan = document.createElement("span"); dateSpan.id = `date-display-${b.id}`; dateSpan.textContent = `${t("finished")} ${b.dateRead}`;
      const dateInput = document.createElement("input"); dateInput.type = "date"; dateInput.id = `date-input-${b.id}`; dateInput.className = "date-edit-input";
      dateInput.style.display = "none"; // Hide calendar input by default
      dateInput.value = String(b.dateRead || "");
      dateInput.onchange = (e) => updateReadDate(b.id, e.target.value);
      dateInput.onblur = () => setTimeout(() => { dateInput.style.display = "none"; dateSpan.style.display = "inline"; }, 200);
      dateDiv.appendChild(dateSpan); dateDiv.appendChild(dateInput); metaDiv.appendChild(dateDiv);
    }
    info.appendChild(titleDiv); info.appendChild(metaDiv);
    if (b?.isbn) { const isbnPill = document.createElement("div"); isbnPill.className = "isbn-pill"; isbnPill.textContent = `ISBN: ${b.isbn}`; info.appendChild(isbnPill); }

    const actions = document.createElement("div"); actions.className = "actions";
    if (currentShelf === "read") {
      const sel = document.createElement("select"); sel.className = "rating";
      const currentRating = Number(b?.rating || 0);
      sel.innerHTML = `<option value="0">...</option>` + [1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${currentRating === n ? "selected" : ""}>${"⭐".repeat(n)}</option>`).join("");
      sel.onchange = (e) => updateRating(b.id, e.target.value); info.appendChild(sel);
      const unreadBtn = document.createElement("button"); unreadBtn.className = "btn-sm btn-unread"; unreadBtn.textContent = t("unread");
      unreadBtn.onclick = () => moveToWishlist(b.id); actions.appendChild(unreadBtn);
    } else {
      const moveBtn = document.createElement("button"); moveBtn.className = "move-btn"; moveBtn.textContent = t("markRead");
      moveBtn.onclick = () => moveToRead(b.id); actions.appendChild(moveBtn);
    }
    const delBtn = document.createElement("button"); delBtn.className = "btn-del"; delBtn.textContent = "🗑️";
    delBtn.onclick = () => deleteBook(b.id); actions.appendChild(delBtn);
    if (currentShelf === "loans" && b?.returnDate) {
      const calBtn = document.createElement("button"); calBtn.className = "btn-cal"; calBtn.textContent = t("reminder");
      calBtn.onclick = () => processCalendar(b); actions.appendChild(calBtn);
    }
    info.appendChild(actions); li.appendChild(info); list.appendChild(li);
  });
}

function showModal(book, scannedIsbn = "") {
  pendingBook = { ...book }; if (scannedIsbn) pendingBook.isbn = scannedIsbn;
  setText("modal-title", pendingBook.title || "Unknown"); setText("modal-author", getAuthorName(pendingBook)); setText("modal-isbn", pendingBook.isbn ? `ISBN: ${pendingBook.isbn}` : "");
  const audioCheck = $("modal-audio-check"); if (audioCheck) audioCheck.checked = false;
  const loanRow = $("loan-date-row"); if (loanRow) loanRow.style.display = "none";
  const returnInput = $("modal-return-date"); if (returnInput) returnInput.value = "";
  const img = $("modal-img"); const cover = safeUrl(pendingBook.cover);
  if (img) { if (cover) { img.src = cover; img.style.display = "block"; } else { img.removeAttribute("src"); img.style.display = "none"; } }
  $("modal-overlay") && ($("modal-overlay").style.display = "flex");
}
function closeModal() { if ($("modal-overlay")) $("modal-overlay").style.display = "none"; if ($("loan-date-row")) $("loan-date-row").style.display = "none"; pendingBook = null; scanLocked = false; }

function confirmAdd(targetShelf) {
  if (!pendingBook) return;
  const key = normKey(pendingBook); const exists = (library[targetShelf] || []).some((b) => normKey(b) === key);
  if (exists && !confirm("Duplicate?")) { closeModal(); return; }
  let retDate = "";
  if (targetShelf === "loans") {
    const row = $("loan-date-row"); const input = $("modal-return-date");
    if (!row || !input) { alert("Error: Missing loan fields."); return; }
    if (row.style.display === "none") { row.style.display = "flex"; const d = new Date(); d.setDate(d.getDate() + 14); input.value = d.toISOString().split("T")[0]; return; }
    retDate = input.value; if (!retDate) return alert(t("dateRequired"));
  }
  const newBook = {
    id: makeId(), title: pendingBook.title || "Unknown", authors: Array.isArray(pendingBook.authors) && pendingBook.authors.length ? pendingBook.authors : [{ name: "Unknown" }],
    rating: 0, cover: safeUrl(pendingBook.cover) || null, dateRead: targetShelf === "read" ? todayISO() : "", returnDate: retDate, isAudio: $("modal-audio-check") ? !!$("modal-audio-check").checked : false, isbn: pendingBook.isbn || ""
  };
  library[targetShelf].push(newBook); closeModal(); setActiveTab(targetShelf);
  if (targetShelf === "loans" && retDate) processCalendar(newBook);
  saveLibrary({ shouldSync: true, skipRender: true });
}

/* =========================
   11) ACTIONS
   ========================= */
function moveToRead(id) {
  const fromShelf = library.wishlist.find((b) => b.id === id) ? "wishlist" : "loans";
  const idx = library[fromShelf].findIndex((b) => b.id === id); if (idx === -1) return;
  const book = library[fromShelf][idx]; library[fromShelf].splice(idx, 1);
  book.dateRead = todayISO(); book.returnDate = ""; book.rating = 0;
  library.read.push(book); setActiveTab("read"); saveLibrary({ shouldSync: true, skipRender: true });
}
function moveToWishlist(id) {
  const idx = library.read.findIndex((b) => b.id === id); if (idx === -1) return;
  const book = library.read[idx]; library.read.splice(idx, 1);
  book.dateRead = ""; book.rating = 0; library.wishlist.push(book); setActiveTab("wishlist"); saveLibrary({ shouldSync: true, skipRender: true });
}
function deleteBook(id) { if (!confirm(t("delete"))) return; library[currentShelf] = (library[currentShelf] || []).filter((b) => b.id !== id); saveLibrary({ shouldSync: true }); }
function updateRating(id, val) { const book = library.read.find((b) => b.id === id); if (!book) return; book.rating = Number(val); saveLibrary({ shouldSync: true }); }
function updateReadDate(id, newDate) { const book = library.read.find((b) => b.id === id); if (!book) return; book.dateRead = newDate; saveLibrary({ shouldSync: true }); }
function hardReset() { if (!confirm("Reset?")) return; localStorage.clear(); location.reload(); }

/* =========================
   12) GOOGLE AUTH
   ========================= */
function gapiLoaded() { gapi.load("client", async () => { try { await gapi.client.init({ discoveryDocs: DISCOVERY }); gapiInited = true; maybeEnableAuth(); } catch (e) { logError("GAPI Init Fail", e); } }); }
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID, scope: SCOPES.join(" "),
    callback: async (resp) => {
      if (resp?.error) return logError("Auth Fail", resp);
      accessToken = resp.access_token; // Store for Picker
      addGrantedScopes(resp.scope || "");
      gapi.client.setToken(resp);
      if (pendingCalendarBook) { addGrantedScopes("https://www.googleapis.com/auth/calendar.events"); if (hasScope("https://www.googleapis.com/auth/calendar.events")) { await apiAddCalendar(pendingCalendarBook); } pendingCalendarBook = null; return; }
      
      // AUTO SYNC ONLY IF ID EXISTS (Manual mode otherwise)
      if (spreadsheetId) { setSyncStatus("working"); await doSync(); }
      else { setSyncStatus("idle"); }
    }
  });
  gisInited = true; maybeEnableAuth();
}
function maybeEnableAuth() { if (!gapiInited || !gisInited) return; const btn = $("auth-btn"); if (btn) { btn.disabled = false; if (!isSyncing) btn.textContent = t("signIn"); } }
function requireSignedIn() { if (!gapi?.client?.getToken?.()) { alert(t("signInRequired")); return false; } return true; }

/* =========================
   13) MANUAL CLOUD ACTIONS (SAVE / LOAD)
   ========================= */

// BUTTON 1: "Save to Drive"
// Logic: If ID exists -> Update it. If NO ID -> Create New & Update.
async function handleCloudSave() {
  if (!requireSignedIn()) return;
  setSyncStatus("working");
  
  if (!spreadsheetId) {
    try {
      // Create NEW file via Drive API
      const createResp = await gapi.client.drive.files.create({
        resource: { name: SPREADSHEET_TITLE, mimeType: "application/vnd.google-apps.spreadsheet" },
        fields: "id"
      });
      spreadsheetId = createResp.result.id;
      localStorage.setItem(LS.SHEET_ID, spreadsheetId);
      updateSheetLink();
      // Initialize headers
      await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId, range: HEADER_RANGE, valueInputOption: "RAW", resource: { values: [HEADER] }
      });
    } catch (e) {
      logError("Create Sheet Error", e);
      setSyncStatus("error");
      return;
    }
  }
  // Upload data
  await queueUpload();
  setSyncStatus("synced");
  alert(t("importSuccess")); // "Success!"
}

// BUTTON 2: "Load from Drive"
// Logic: Open Picker -> Get ID -> Download Data -> Overwrite Local
async function handleCloudLoad() {
  if (!requireSignedIn()) return;
  if (!confirm(t("confirmLoad"))) return;

  await loadPicker();
  const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS).setIncludeFolders(false).setSelectFolderEnabled(false);
  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setDeveloperKey(DEVELOPER_KEY)
    .setTitle(t("pickerTitle"))
    .setCallback(async (data) => {
      if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        spreadsheetId = fileId;
        localStorage.setItem(LS.SHEET_ID, fileId);
        updateSheetLink();
        setSyncStatus("working");
        await doSync(); // Downloads and overwrites local
        alert(t("importSuccess"));
      }
    })
    .build();
  picker.setVisible(true);
}

function loadPicker() { return new Promise((resolve) => gapi.load("picker", { callback: resolve })); }

/* =========================
   14) SYNC LOGIC (INTERNAL)
   ========================= */
async function doSync() {
  // Download data from spreadsheetId and REPLACE local library
  try {
    const resp = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: DATA_RANGE });
    const rows = resp?.result?.values || [];
    if (rows.length > 0) {
      const newLib = { read: [], wishlist: [], loans: [] };
      rows.forEach((row) => {
        if (!row?.[0]) return;
        let shelf = String(row[3] || "read").toLowerCase(); if (!["read", "wishlist", "loans"].includes(shelf)) shelf = "read";
        newLib[shelf].push({ id: String(row[0]), title: row[1] || "Unknown", authors: [{ name: row[2] || "Unknown" }], shelf, rating: Number(row[4] || 0), cover: row[5] === "null" ? null : (row[5] || null), dateRead: row[6] || "", returnDate: row[7] || "", isAudio: String(row[8]).toUpperCase() === "TRUE", isbn: row[9] || "" });
      });
      library = newLib; 
      saveLibrary({ shouldSync: false }); // Save locally, don't re-upload
    }
    setSyncStatus("synced");
  } catch (e) {
    logError("Sync/Download Error", e);
    setSyncStatus("error");
  }
}

async function queueUpload() {
  if (isSyncing) { syncPending = true; return; } isSyncing = true; setSyncStatus("working");
  try { await uploadData(); setSyncStatus("synced"); } catch (e) {
    logError("Upload Error", e); setSyncStatus("error");
    if (getErrCode(e) === 401) { gapi.client.setToken(null); alert(t("sessionExpired")); setSyncStatus("idle"); }
  } finally { isSyncing = false; if (syncPending) { syncPending = false; setTimeout(queueUpload, 0); } }
}

async function uploadData() {
  if (!spreadsheetId) return;
  const rows = [];
  ["read", "wishlist", "loans"].forEach((shelf) => {
    (library[shelf] || []).forEach((b) => {
      rows.push([ b.id, b.title || "Unknown", getAuthorName(b), shelf, Number(b.rating || 0), b.cover ? String(b.cover) : "null", b.dateRead || "", b.returnDate || "", b.isAudio ? "TRUE" : "FALSE", b.isbn || "" ]);
    });
  });
  await gapi.client.sheets.spreadsheets.values.clear({ spreadsheetId, range: DATA_RANGE });
  if (rows.length > 0) { await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId, range: WRITE_RANGE, valueInputOption: "RAW", resource: { values: rows } }); }
}

/* =========================
   15) CAMERA & SEARCH & EXPORT
   ========================= */
function exportData() { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library, null, 2)); const a = document.createElement("a"); a.setAttribute("href", dataStr); a.setAttribute("download", "my_bookshelf_" + new Date().toISOString().split("T")[0] + ".json"); document.body.appendChild(a); a.click(); a.remove(); }
function triggerImport() { $("import-file")?.click(); }
function importData(event) { const file = event?.target?.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const imported = JSON.parse(e.target.result); if (!imported?.read) return alert("Invalid"); library = imported; saveLibrary({shouldSync:true}); alert(t("importSuccess")); } catch {} }; reader.readAsText(file); }

async function fetchOpenLibrary(isbn) { try { const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`); const data = await res.json(); const key = `ISBN:${isbn}`; if (data?.[key]) { const b = data[key]; return { title: b.title, authors: b.authors || [{ name: "Unknown" }], cover: b.cover?.medium || b.cover?.small || null, isbn }; } } catch {} return null; }
async function fetchFinna(isbn) { try { const res = await fetch(`https://api.finna.fi/v1/search?lookfor=isbn:${isbn}&type=AllFields&field[]=title&field[]=buildings&field[]=images`); const data = await res.json(); if (data?.resultCount > 0) { const b = data.records[0]; return { title: b.title, authors: [{ name: b.buildings?.[0]?.translated || "Unknown" }], cover: b.images?.[0] ? `https://api.finna.fi${b.images[0]}` : null, isbn }; } } catch {} return null; }
async function fetchGoogleBooks(isbn) { try { const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`); const data = await res.json(); if (data?.totalItems > 0) { const v = data.items[0].volumeInfo; return { title: v.title, authors: (v.authors||[]).map(a=>({name:a})), cover: v.imageLinks?.thumbnail?.replace("http:","https:"), isbn }; } } catch {} return null; }
async function fetchAndPrompt(rawIsbn) { const clean = String(rawIsbn).replace(/\D/g, ""); if (clean.length<10) return alert(t("invalidIsbn")); let book = await fetchOpenLibrary(clean) || await fetchFinna(clean) || await fetchGoogleBooks(clean); if(book) showModal(book, clean); else if(confirm("Manual?")) searchAndPrompt("ISBN "+clean); }
async function searchAndPrompt(query) { try { const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`); const data = await res.json(); if(data?.docs?.length) { const d=data.docs[0]; showModal({title:d.title, authors:[{name:d.author_name?.[0]||"?"}], cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`:null, isbn:d.isbn?.[0]||""}); } } catch {} }
async function handleManualAdd() { const el=$("isbn-input"); if(!el?.value) return; const val=el.value.trim(); el.value=""; const isNum=/^[\d-]+$/.test(val); if(isNum) await fetchAndPrompt(val); else await searchAndPrompt(val); }

async function startCamera() { const c=$("reader-container"); if(c) c.style.display="block"; html5QrCode = new Html5Qrcode("reader"); try { await html5QrCode.start({facingMode:"environment"}, {fps:10, qrbox:{width:250,height:250}}, async (txt)=>{ if(scanLocked)return; scanLocked=true; await stopCamera(); await fetchAndPrompt(txt); }); } catch { try{ await html5QrCode.start({facingMode:"user"},{},async(t)=>{}); }catch{ if(c)c.style.display="none"; alert("Camera Error"); } } }
async function stopCamera() { $("reader-container").style.display="none"; if(html5QrCode) { try{await html5QrCode.stop(); html5QrCode.clear();}catch{} html5QrCode=null; } }

function processCalendar(book) {
  if($("cal-connect-toggle")?.checked) {
    if(!requireSignedIn()) return;
    if(!hasScope("https://www.googleapis.com/auth/calendar.events")) {
      pendingCalendarBook=book; addGrantedScopes(SCOPES.join(" ")); tokenClient.requestAccessToken({prompt:"", scope:SCOPES.join(" ")});
    } else apiAddCalendar(book);
  } else magicLinkCalendar(book);
}
async function apiAddCalendar(book) { if(!book.returnDate) return alert("Date?"); const {start,end} = getReminderDates(book.returnDate); try { await gapi.client.calendar.events.insert({calendarId:"primary", resource:{summary:`Return: ${book.title}`, description:`Book by ${getAuthorName(book)}`, start:{date:start}, end:{date:end}}}); alert(t("calAdded")); } catch(e){ logError("Cal",e); } }
function magicLinkCalendar(book) { const {start,end} = getReminderDates(book.returnDate); const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Return: "+book.title)}&dates=${start.replace(/-/g,"")}/${end.replace(/-/g,"")}`; window.open(url,"_blank"); }

/* =========================
   16) INIT
   ========================= */
window.addEventListener("DOMContentLoaded", () => {
  try {
    library = loadLibrary();
    addClick("menu-btn", openMenu); addClick("menu-overlay", closeMenu); addClick("modal-overlay", (e)=>{if(e.target.id==="modal-overlay")closeModal()});
    document.addEventListener("click", (e)=>{ if(!e.target.closest(".menu-dropdown") && !e.target.closest(".dots-btn")) document.querySelectorAll(".menu-dropdown.show").forEach(d=>d.classList.remove("show")); });
    
    if($("language-select")) $("language-select").onchange=(e)=>setLanguage(e.target.value);
    
    // Inject Cloud Buttons into Menu (Dynamically, so no HTML edit needed)
    const exportBtn = $("btn-export");
    if(exportBtn && !$("cloud-controls")) {
      const wrapper = document.createElement("div");
      wrapper.id = "cloud-controls";
      wrapper.style.marginTop = "20px";
      wrapper.style.borderTop = "1px solid var(--border-color)";
      wrapper.style.paddingTop = "10px";
      
      wrapper.innerHTML = `
        <h4 id="cloud-header" style="margin:0 0 10px 0; font-size:0.9rem; opacity:0.7;">Google Drive</h4>
        <button id="btn-save-drive" class="menu-btn">Save to Drive</button>
        <button id="btn-load-drive" class="menu-btn">Load from Drive</button>
      `;
      exportBtn.parentElement.insertBefore(wrapper, exportBtn);
      
      $("btn-save-drive").onclick = handleCloudSave;
      $("btn-load-drive").onclick = handleCloudLoad;
    }

    addClick("btn-clear-filters", clearFilters);
    addClick("btn-add", handleManualAdd);
    $("isbn-input")?.addEventListener("keydown", (e)=>{if(e.key==="Enter")handleManualAdd()});
    addClick("btn-scan", startCamera); addClick("btn-stop-camera", stopCamera);
    addClick("modal-add-read", ()=>confirmAdd("read")); addClick("modal-add-wish", ()=>confirmAdd("wishlist")); addClick("modal-add-loan", ()=>confirmAdd("loans")); addClick("modal-cancel", closeModal);
    addClick("auth-btn", ()=>{ if(!tokenClient)return; tokenClient.requestAccessToken({prompt:""}); });
    addClick("reset-btn", hardReset); addClick("btn-export", exportData); addClick("btn-import", triggerImport);
    $("import-file")?.addEventListener("change", importData);
    
    const calToggle = $("cal-connect-toggle"); if(calToggle){ calToggle.checked=localStorage.getItem(LS.CAL_SYNC)==="true"; calToggle.onchange=(e)=>localStorage.setItem(LS.CAL_SYNC, e.target.checked); }
    const darkToggle = $("dark-mode-toggle"); if(darkToggle){ 
       if(localStorage.getItem(LS.DARK)==="true") { document.body.classList.add("dark-mode"); darkToggle.checked=true; }
       darkToggle.onchange=(e)=>{ if(e.target.checked){document.body.classList.add("dark-mode"); localStorage.setItem(LS.DARK,"true");} else {document.body.classList.remove("dark-mode"); localStorage.setItem(LS.DARK,"false");} };
    }
    document.querySelector(".tabs")?.addEventListener("click", (e)=>{ const t=e.target.closest(".tab"); if(t) setActiveTab(t.id.replace("tab-","")); });
    
    setText("year", new Date().getFullYear());
    setSyncStatus("idle"); setLanguage(currentLang); updateShelfCounts(); updateSheetLink(); setSmartPlaceholder();
    console.log("App Ready");
  } catch(e) { logError("Init",e); }
});

window.clearFilters = clearFilters; window.gapiLoaded = gapiLoaded; window.gisLoaded = gisLoaded;
