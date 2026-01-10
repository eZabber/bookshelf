/* =========================================================
   MY BOOKSHELF APP — DRIVE APPDATA (HIDDEN JSON) VERSION
   - Cloud Sync: Google Drive appDataFolder (hidden)
   - No Google Sheets API, no "all spreadsheets" permission
   - Optional Calendar integration via separate auth on demand
   - Login button stays in header (#auth-btn) as in your HTML
   ========================================================= */

/* =========================
   1) CONFIG
   ========================= */

const CLIENT_ID = "579369345257-sqq02cnitlhcf54o5ptad36fm19jcha7.apps.googleusercontent.com";

// Optional but recommended (Drive API quota / reliability)
const DEVELOPER_KEY = ""; // <-- your API key (can be blank)

// Scopes (NO Sheets scope)
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";

// Discovery docs (NO Sheets)
const DISCOVERY = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];

// Drive appData file name
const CLOUD_JSON_NAME = "my_bookshelf.json";

/* =========================
   2) TRANSLATIONS
   ========================= */

const TRANSLATIONS = {
  en: {
    read: "Read", wishlist: "Wishlist", loans: "Loans",
    settings: "Settings & Filters", shelves: "Shelves", display: "Display",
    filter: "Filter Books", year: "Year", month: "Month", rating: "Rating",
    clear: "Clear Filters", reset: "Reset App Data",
    integrations: "Integrations", calConn: "Connect Calendar", calDesc: "Enable for reminders.",
    data: "Data & Backup",
    headerDrive: "Google Drive (Hidden Sync)",
    headerLocal: "Local Device",
    export: "Download Backup (JSON)", import: "Restore Backup",
    btnSaveCloud: "Sync to Cloud ☁️",
    btnLoadCloud: "Sync from Cloud 📥",
    dark: "Dark Mode", lang: "Language",
    search: "Search ISBN, Title, Author...", add: "Add",
    signIn: "Sign In", working: "...", synced: "Logged In",
    markRead: "Mark Read", unread: "↩︎ Unread", delete: "Delete?",
    finished: "Finished:", due: "Due:", audio: "🎧 Audio", reminder: "📅 Reminder",
    modalAudio: "🎧 Audio?", modalReturn: "📅 Return", cancel: "Cancel",
    changeDate: "📅 Change Date", copyTitle: "📋 Copy Title",
    importSuccess: "Success! ✅",
    cloudSaved: "Synced! ✅",
    cloudLoaded: "Synced! ✅",
    calAdded: "Event added! 📅",
    filterStats: "Showing {0} of {1} books",
    clearBtn: "Clear",
    invalidIsbn: "Invalid ISBN",
    sessionExpired: "Session expired.",
    dateRequired: "Date?",
    signInRequired: "Please Sign In first.",
    confirmLoad: "Overwrite local data with data from Cloud?",
    noFileFound: "No backup found in cloud. Save first?",
    calNeedAuth: "Calendar access needed for reminders. Continue?",
    alreadyExists: "Already in your library."
  },
  fi: {
    read: "Luetut", wishlist: "Toivelista", loans: "Lainassa",
    settings: "Asetukset", shelves: "Hyllyt", display: "Näkymä",
    filter: "Suodata", year: "Vuosi", month: "Kuukausi", rating: "Arvosana",
    clear: "Tyhjennä", reset: "Nollaa tiedot",
    integrations: "Integraatiot", calConn: "Yhdistä kalenteri", calDesc: "Käytä palautusmuistutuksiin.",
    data: "Tiedot & Varmuuskopio",
    headerDrive: "Google Drive (Piilotettu synkka)",
    headerLocal: "Paikallinen (Laite)",
    export: "Lataa varmuuskopio (JSON)", import: "Palauta varmuuskopio",
    btnSaveCloud: "Synkkaa pilveen ☁️",
    btnLoadCloud: "Hae pilvestä 📥",
    dark: "Tumma tila", lang: "Kieli",
    search: "Etsi ISBN, Nimi, Kirjailija...", add: "Lisää",
    signIn: "Kirjaudu", working: "...", synced: "Kirjautunut",
    markRead: "Merkitse luetuksi", unread: "↩︎ Lukematon", delete: "Poista?",
    finished: "Luettu:", due: "Eräpäivä:", audio: "🎧 Ääni", reminder: "📅 Muistutus",
    modalAudio: "🎧 Äänikirja?", modalReturn: "📅 Palautus", cancel: "Peruuta",
    changeDate: "📅 Muuta päivää", copyTitle: "📋 Kopioi nimi",
    importSuccess: "Onnistui! ✅",
    cloudSaved: "Synkattu! ✅",
    cloudLoaded: "Synkattu! ✅",
    calAdded: "Tapahtuma lisätty! 📅",
    filterStats: "Näytetään {0} / {1} kirjaa",
    clearBtn: "Tyhjennä",
    invalidIsbn: "Virheellinen ISBN",
    sessionExpired: "Istunto vanheni.",
    dateRequired: "Päivämäärä?",
    signInRequired: "Kirjaudu ensin.",
    confirmLoad: "Korvataanko paikalliset tiedot pilvestä haetuilla?",
    noFileFound: "Varmuuskopiota ei löytynyt pilvestä. Tallenna ensin?",
    calNeedAuth: "Kalenterioikeus tarvitaan muistutuksiin. Jatketaanko?",
    alreadyExists: "Kirja on jo kirjastossasi."
  },
  et: {
    read: "Loetud", wishlist: "Soovinimekiri", loans: "Laenatud",
    settings: "Sätted", shelves: "Riiulid", display: "Kuva",
    filter: "Filtreeri", year: "Aasta", month: "Kuu", rating: "Hinne",
    clear: "Tühjenda", reset: "Lähtesta andmed",
    integrations: "Integratsioonid", calConn: "Ühenda kalender", calDesc: "Kasuta tagastusmeeldetuletuseks.",
    data: "Andmed ja varukoopia",
    headerDrive: "Google Drive (Peidetud sünk)",
    headerLocal: "Kohalik seade",
    export: "Lae varukoopia (JSON)", import: "Taasta varukoopia",
    btnSaveCloud: "Synk. pilve ☁️",
    btnLoadCloud: "Lae pilvest 📥",
    dark: "Tume režiim", lang: "Keel",
    search: "Otsi ISBN, Pealkiri, Autor...", add: "Lisa",
    signIn: "Logi sisse", working: "...", synced: "Sisse logitud",
    markRead: "Märgi loetuks", unread: "↩︎ Lugemata", delete: "Kustuta?",
    finished: "Loetud:", due: "Tähtaeg:", audio: "🎧 Audio", reminder: "📅 Meeldetuletus",
    modalAudio: "🎧 Audioraamat?", modalReturn: "📅 Tagastus", cancel: "Loobu",
    changeDate: "📅 Muuda kuupäeva", copyTitle: "📋 Kopeeri pealkiri",
    importSuccess: "Õnnestus! ✅",
    cloudSaved: "Synk. tehtud! ✅",
    cloudLoaded: "Synk. tehtud! ✅",
    calAdded: "Sündmus lisatud! 📅",
    filterStats: "Kuvatakse {0} / {1} raamatut",
    clearBtn: "Tühjenda",
    invalidIsbn: "Vigane ISBN",
    sessionExpired: "Seanss aegus.",
    dateRequired: "Kuupäev?",
    signInRequired: "Palun logi esmalt sisse.",
    confirmLoad: "Kirjutan kohalikud andmed üle? Jätka?",
    noFileFound: "Pilvest ei leitud andmeid. Salvesta esmalt?",
    calNeedAuth: "Kalendriõigus on vajalik. Jätkata?",
    alreadyExists: "Raamat on juba sinu nimekirjas."
  }
};

/* =========================
   3) STATE & UTILS
   ========================= */

const LS = {
  LANG: "appLang",
  LIB: "myLibrary",
  DARK: "darkMode",
  CAL_SYNC: "calSync",
  CLOUD_FILE_ID: "cloudFileId_appdata"
};

let currentLang = localStorage.getItem(LS.LANG) || "en";

let driveTokenClient = null;

let gapiInited = false;
let gisInited = false;

let currentShelf = "read";
let library = { read: [], wishlist: [], loans: [] };

let html5QrCode = null;
let scanLocked = false;
let pendingBook = null;

let isSyncing = false;
let syncPending = false;
let appStatus = "idle";
let filterState = { text: "", year: "", month: "", rating: "" };

// Cloud file id in appDataFolder (cached)
let cloudFileId = localStorage.getItem(LS.CLOUD_FILE_ID) || null;

const $ = (id) => document.getElementById(id);
const t = (key) => (TRANSLATIONS[currentLang]?.[key] ?? key);

function setText(id, text) { const el = $(id); if (el) el.textContent = String(text ?? ""); }
function addClick(id, handler) { const el = $(id); if (el) el.onclick = handler; }

function logError(msg, err) { console.error(msg, err); }

function toast(msg, ms = 2500) {
  const el = $("debug-log");
  const text = String(msg ?? "");

  if (!el) return alert(text);

  el.textContent = text;
  el.classList.add("show");

  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove("show");
  }, ms);
}

function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function todayISO() { return new Date().toISOString().split("T")[0]; }

function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") ? u.href : "";
  } catch { return ""; }
}

function getAuthorName(book) { return String(book?.authors?.[0]?.name || "Unknown"); }
function normKey(book) { return `${book?.title || ""}|${getAuthorName(book)}`.toLowerCase().trim(); }

function isDriveSignedIn() {
  return !!gapi?.client?.getToken?.();
}

function requireSignedInDrive() {
  if (!isDriveSignedIn()) {
    toast(t("signInRequired"), 2500);
    return false;
  }
  return true;
}

function setSyncStatus(state) {
  appStatus = state;
  const dot = $("sync-dot");
  const btn = $("auth-btn");

  if (dot) {
    if (state === "working") dot.style.background = "#f1c40f";
    else if (state === "synced") dot.style.background = "#2ecc71";
    else if (state === "error") dot.style.background = "#e74c3c";
    else dot.style.background = "#bbb";
  }

  if (btn) {
    if (state === "working") btn.textContent = t("working");
    else if (state === "synced") btn.textContent = t("synced");
    else btn.textContent = t("signIn");
  }
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const tId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(tId);
  }
}

/* =========================
   4) LOCAL STORAGE
   ========================= */

function loadLibrary() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS.LIB));
    if (raw && typeof raw === "object") return raw;
  } catch {}
  return { read: [], wishlist: [], loans: [] };
}

function saveLibrary({ shouldSync = false, skipRender = false } = {}) {
  localStorage.setItem(LS.LIB, JSON.stringify(library));
  updateShelfCounts();
  if (!skipRender) renderBooks();

  // Only auto-sync if signed in and cloud file exists/created
  if (shouldSync && isDriveSignedIn()) queueUpload();
}

function updateShelfCounts() {
  setText("count-read", library.read?.length || 0);
  setText("count-wishlist", library.wishlist?.length || 0);
  setText("count-loans", library.loans?.length || 0);
}

/* =========================
   5) UI & FILTERS
   ========================= */

function openMenu() {
  $("side-menu")?.classList.add("open");
  $("menu-overlay")?.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeMenu() {
  $("side-menu")?.classList.remove("open");
  $("menu-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
}

function setActiveTab(shelf) {
  currentShelf = shelf;
  ["read", "wishlist", "loans"].forEach((s) => $(`tab-${s}`)?.classList.toggle("active", s === shelf));
  closeMenu();
  renderBooks();
}

function setSmartPlaceholder() {
  const el = $("isbn-input");
  if (el) el.placeholder = t("search");
}

function updateCloudLink() {
  // appDataFolder is hidden, so no link
  const el = $("sheet-link");
  if (el) el.style.display = "none";
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem(LS.LANG, lang);

  const sel = $("language-select");
  if (sel) sel.value = lang;

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

  setText("header-drive", t("headerDrive"));
  setText("header-local", t("headerLocal"));

  if ($("btn-save-drive")) $("btn-save-drive").textContent = t("btnSaveCloud");
  if ($("btn-load-drive")) $("btn-load-drive").textContent = t("btnLoadCloud");

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

  setText("modal-add-read", `${t("add")} -> ${t("read")}`);
  setText("modal-add-wish", `${t("add")} -> ${t("wishlist")}`);
  setText("modal-add-loan", `${t("add")} -> ${t("loans")}`);
  setText("modal-cancel", t("cancel"));
  setText("label-audio", t("modalAudio"));
  setText("label-return", t("modalReturn"));

  setSmartPlaceholder();
  setSyncStatus(appStatus);
  renderBooks();
}

function clearFilters() {
  if ($("filter-text")) $("filter-text").value = "";
  if ($("filter-year")) $("filter-year").value = "";
  if ($("filter-month")) $("filter-month").value = "";
  if ($("filter-rating")) $("filter-rating").value = "";
  filterState = { text: "", year: "", month: "", rating: "" };
  applyFilters();
  closeMenu();
}

function applyFilters() {
  const textEl = $("filter-text");
  const yEl = $("filter-year");
  const mEl = $("filter-month");
  const rEl = $("filter-rating");

  if (textEl) filterState.text = (textEl.value || "").toLowerCase();
  if (yEl) filterState.year = (yEl.value || "").replace(/[^\d]/g, "").slice(0, 4);
  if (mEl) filterState.month = mEl.value || "";
  if (rEl) filterState.rating = rEl.value || "";

  if (yEl) yEl.value = filterState.year;
  renderBooks();
}

function renderBooks() {
  const list = $("book-list");
  if (!list) return;
  list.innerHTML = "";

  const allItems = Array.isArray(library[currentShelf]) ? library[currentShelf] : [];
  let visibleItems = allItems;

  const term = (filterState.text || "").toLowerCase();
  const cleanTerm = term.replace(/[\s-]/g, "");

  if (term || filterState.year || filterState.month || filterState.rating) {
    visibleItems = allItems.filter((b) => {
      const titleLc = String(b.title || "").toLowerCase();
      const authorLc = getAuthorName(b).toLowerCase();
      const isbnLc = String(b.isbn || "").replace(/[\s-]/g, "").toLowerCase();

      const matchText = !term || titleLc.includes(term) || authorLc.includes(term) || isbnLc.includes(cleanTerm);

      const dateStr =
        currentShelf === "read" ? String(b.dateRead || "") :
        currentShelf === "loans" ? String(b.returnDate || "") : "";

      const matchYear = !filterState.year || dateStr.startsWith(filterState.year);
      const matchMonth = !filterState.month || (dateStr.length >= 7 && dateStr.substring(5, 7) === filterState.month);
      const matchRating = !filterState.rating || (Number(b.rating || 0) === Number(filterState.rating));

      return matchText && matchYear && matchMonth && matchRating;
    });
  }

  updateShelfCounts();

  const statusEl = $("filter-status");
  if (statusEl) {
    if (allItems.length !== visibleItems.length) {
      statusEl.style.display = "flex";
      const msg = t("filterStats")
        .replace("{0}", String(visibleItems.length))
        .replace("{1}", String(allItems.length));
      statusEl.innerHTML = `<span>${msg}</span> <span class="filter-clear-link" onclick="clearFilters()">${t("clearBtn")}</span>`;
    } else {
      statusEl.style.display = "none";
    }
  }

  visibleItems.slice().reverse().forEach((b) => {
    const li = document.createElement("li");
    li.className = "book-card";

    // Dots menu
    const menuContainer = document.createElement("div");
    menuContainer.className = "card-menu-container";

    const dotsBtn = document.createElement("button");
    dotsBtn.className = "dots-btn";
    dotsBtn.innerHTML = "⋮";
    dotsBtn.setAttribute("aria-label", "Book options");
    dotsBtn.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll(".menu-dropdown.show").forEach((d) => d.classList.remove("show"));
      menuContainer.querySelector(".menu-dropdown")?.classList.toggle("show");
    };

    const dropdown = document.createElement("div");
    dropdown.className = "menu-dropdown";

    if (currentShelf === "read") {
      const editDateBtn = document.createElement("button");
      editDateBtn.className = "menu-item";
      editDateBtn.innerHTML = t("changeDate");
      editDateBtn.onclick = () => {
        const dateSpan = document.getElementById(`date-display-${b.id}`);
        const dateInput = document.getElementById(`date-input-${b.id}`);
        if (dateSpan && dateInput) {
          dateSpan.style.display = "none";
          dateInput.style.display = "inline-block";
          dateInput.focus();
          try { dateInput.showPicker(); } catch {}
        }
      };
      dropdown.appendChild(editDateBtn);
    }

    const copyBtn = document.createElement("button");
    copyBtn.className = "menu-item";
    copyBtn.innerHTML = t("copyTitle");
    copyBtn.onclick = () => navigator.clipboard?.writeText?.(String(b?.title || ""))?.catch?.(() => {});
    dropdown.appendChild(copyBtn);

    menuContainer.appendChild(dotsBtn);
    menuContainer.appendChild(dropdown);
    li.appendChild(menuContainer);

    // Thumbnail
    const coverUrl = safeUrl(b?.cover);
    const thumb = document.createElement(coverUrl ? "img" : "div");
    thumb.className = "book-thumb";
    if (coverUrl) {
      thumb.src = coverUrl;
      thumb.onerror = () => { thumb.style.display = "none"; };
    } else {
      thumb.style.background = "#ddd";
    }
    li.appendChild(thumb);

    // Info
    const info = document.createElement("div");
    info.className = "book-info";

    // Badges
    const badges = document.createElement("div");
    badges.className = "badges-row";

    if (currentShelf === "loans" && b?.returnDate) {
      const loanBadge = document.createElement("div");
      loanBadge.className = "loan-badge";
      loanBadge.textContent = `${t("due")} ${b.returnDate}`;
      badges.appendChild(loanBadge);
    }

    if (b?.isAudio) {
      const audioBadge = document.createElement("div");
      audioBadge.className = "audio-badge";
      audioBadge.textContent = t("audio");
      badges.appendChild(audioBadge);
    }

    if (badges.children.length > 0) info.appendChild(badges);

    const titleDiv = document.createElement("div");
    titleDiv.className = "book-title";
    titleDiv.textContent = String(b?.title || "Unknown");

    const metaDiv = document.createElement("div");
    metaDiv.className = "book-meta";

    const authorDiv = document.createElement("div");
    authorDiv.textContent = getAuthorName(b);
    metaDiv.appendChild(authorDiv);

    if (currentShelf === "read" && b?.dateRead) {
      const dateDiv = document.createElement("div");

      const dateSpan = document.createElement("span");
      dateSpan.id = `date-display-${b.id}`;
      dateSpan.textContent = `${t("finished")} ${b.dateRead}`;

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.id = `date-input-${b.id}`;
      dateInput.className = "date-edit-input";
      dateInput.style.display = "none";
      dateInput.value = String(b.dateRead || "");
      dateInput.onchange = (e) => updateReadDate(b.id, e.target.value);
      dateInput.onblur = () => setTimeout(() => {
        dateInput.style.display = "none";
        dateSpan.style.display = "inline";
      }, 200);

      dateDiv.appendChild(dateSpan);
      dateDiv.appendChild(dateInput);
      metaDiv.appendChild(dateDiv);
    }

    info.appendChild(titleDiv);
    info.appendChild(metaDiv);

    if (b?.isbn) {
      const isbnPill = document.createElement("div");
      isbnPill.className = "isbn-pill";
      isbnPill.textContent = `ISBN: ${b.isbn}`;
      info.appendChild(isbnPill);
    }

    // Actions
    const actions = document.createElement("div");
    actions.className = "actions";

    if (currentShelf === "read") {
      const sel = document.createElement("select");
      sel.className = "rating";
      const currentRating = Number(b?.rating || 0);
      sel.innerHTML =
        `<option value="0">...</option>` +
        [1,2,3,4,5].map((n) => `<option value="${n}" ${currentRating === n ? "selected" : ""}>${"⭐".repeat(n)}</option>`).join("");
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
    delBtn.setAttribute("aria-label", "Delete book");
    delBtn.onclick = () => deleteBook(b.id);
    actions.appendChild(delBtn);

    if (currentShelf === "loans" && b?.returnDate) {
      const calBtn = document.createElement("button");
      calBtn.className = "btn-cal";
      calBtn.textContent = t("reminder");
      calBtn.onclick = () => processCalendar(b);
      actions.appendChild(calBtn);
    }

    info.appendChild(actions);
    li.appendChild(info);
    list.appendChild(li);
  });
}

/* =========================
   6) MODAL ADD FLOW
   ========================= */

function showModal(book, scannedIsbn = "") {
  pendingBook = { ...book };
  if (scannedIsbn) pendingBook.isbn = scannedIsbn;

  setText("modal-title", pendingBook.title || "Unknown");
  setText("modal-author", getAuthorName(pendingBook));
  setText("modal-isbn", pendingBook.isbn ? `ISBN: ${pendingBook.isbn}` : "");

  const audioCheck = $("modal-audio-check");
  if (audioCheck) audioCheck.checked = false;

  const loanRow = $("loan-date-row");
  if (loanRow) loanRow.style.display = "none";

  const returnInput = $("modal-return-date");
  if (returnInput) returnInput.value = "";

  const img = $("modal-img");
  const cover = safeUrl(pendingBook.cover);
  if (img) {
    if (cover) { img.src = cover; img.style.display = "block"; }
    else { img.removeAttribute("src"); img.style.display = "none"; }
  }

  if ($("modal-overlay")) $("modal-overlay").style.display = "flex";
}

function closeModal() {
  if ($("modal-overlay")) $("modal-overlay").style.display = "none";
  if ($("loan-date-row")) $("loan-date-row").style.display = "none";
  pendingBook = null;
  scanLocked = false;

  // Safety: stop camera if still running
  if (html5QrCode) stopCamera();
}

function confirmAdd(targetShelf) {
  if (!pendingBook) return;

  // Duplicate detection across ALL shelves
  const key = normKey(pendingBook);
  const allBooks = [
    ...(library.read || []),
    ...(library.wishlist || []),
    ...(library.loans || [])
  ];
  const exists = allBooks.some((b) => normKey(b) === key);
  if (exists) {
    toast(t("alreadyExists"));
    closeModal();
    return;
  }

  let retDate = "";
  if (targetShelf === "loans") {
    const row = $("loan-date-row");
    const input = $("modal-return-date");
    if (!row || !input) { toast("Error: Missing loan fields."); return; }

    // First click shows date row
    if (row.style.display === "none") {
      row.style.display = "flex";
      const d = new Date();
      d.setDate(d.getDate() + 14);
      input.value = d.toISOString().split("T")[0];
      return;
    }
    retDate = input.value;
    if (!retDate) return toast(t("dateRequired"));
  }

  const newBook = {
    id: makeId(),
    title: pendingBook.title || "Unknown",
    authors: Array.isArray(pendingBook.authors) && pendingBook.authors.length
      ? pendingBook.authors
      : [{ name: "Unknown" }],
    rating: 0,
    cover: safeUrl(pendingBook.cover) || null,
    dateRead: targetShelf === "read" ? todayISO() : "",
    returnDate: retDate,
    isAudio: $("modal-audio-check") ? !!$("modal-audio-check").checked : false,
    isbn: pendingBook.isbn || ""
  };

  library[targetShelf].push(newBook);
  closeModal();
  setActiveTab(targetShelf);

  // Auto sync if signed in
  saveLibrary({ shouldSync: true, skipRender: true });
}

/* =========================
   7) ACTIONS
   ========================= */

function moveToRead(id) {
  const fromShelf = library.wishlist.find((b) => b.id === id) ? "wishlist" : "loans";
  const idx = library[fromShelf].findIndex((b) => b.id === id);
  if (idx === -1) return;

  const book = library[fromShelf][idx];
  library[fromShelf].splice(idx, 1);

  book.dateRead = todayISO();
  book.returnDate = "";
  book.rating = 0;

  library.read.push(book);
  setActiveTab("read");
  saveLibrary({ shouldSync: true, skipRender: true });
}

function moveToWishlist(id) {
  const idx = library.read.findIndex((b) => b.id === id);
  if (idx === -1) return;

  const book = library.read[idx];
  library.read.splice(idx, 1);

  book.dateRead = "";
  book.rating = 0;

  library.wishlist.push(book);
  setActiveTab("wishlist");
  saveLibrary({ shouldSync: true, skipRender: true });
}

function deleteBook(id) {
  if (!confirm(t("delete"))) return;
  library[currentShelf] = (library[currentShelf] || []).filter((b) => b.id !== id);
  saveLibrary({ shouldSync: true });
}

function updateRating(id, val) {
  const book = library.read.find((b) => b.id === id);
  if (!book) return;
  book.rating = Number(val);
  saveLibrary({ shouldSync: true });
}

function updateReadDate(id, newDate) {
  const book = library.read.find((b) => b.id === id);
  if (!book) return;
  book.dateRead = newDate;
  saveLibrary({ shouldSync: true });
}

function hardReset() {
  if (!confirm("Reset?")) return;
  localStorage.clear();
  location.reload();
}

/* =========================
   8) GOOGLE AUTH (DRIVE + OPTIONAL CAL)
   ========================= */

function gapiLoaded() {
  gapi.load("client", async () => {
    try {
      await gapi.client.init({
        apiKey: DEVELOPER_KEY || undefined,
        discoveryDocs: DISCOVERY
      });
      gapiInited = true;
      maybeEnableAuth();
    } catch (e) {
      logError("GAPI Init Fail", e);
      setSyncStatus("error");
      toast("Google API init failed.");
    }
  });
}

function gisLoaded() {
  // Drive-only token client
  driveTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: async (resp) => {
      if (resp?.error) {
        logError("Drive Auth Fail", resp);
        setSyncStatus("error");
        toast("Sign-in failed.");
        return;
      }
      gapi.client.setToken(resp);
      setSyncStatus("synced");

      // On sign-in, attempt to find existing cloud file (no creation yet)
      await findCloudFileIfExists();
    }
  });

  gisInited = true;
  maybeEnableAuth();
}

function maybeEnableAuth() {
  if (!gapiInited || !gisInited) return;
  const btn = $("auth-btn");
  if (btn) {
    btn.disabled = false;
    btn.textContent = t("signIn");
  }
}

async function signInDrive() {
  if (!driveTokenClient) return;
  setSyncStatus("working");
  driveTokenClient.requestAccessToken({ prompt: "" });
}

/**
 * When calendar is needed we request BOTH scopes in one token
 * so we don't accidentally lose Drive permissions.
 */
async function ensureCalendarAuth() {
  if (!confirm(t("calNeedAuth"))) return false;

  return new Promise((resolve) => {
    const comboClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: `${DRIVE_SCOPE} ${CAL_SCOPE}`,
      callback: (resp) => {
        if (resp?.error) { logError("Combo Auth Fail", resp); resolve(false); return; }
        gapi.client.setToken(resp);
        resolve(true);
      }
    });
    comboClient.requestAccessToken({ prompt: "" });
  });
}

/* =========================
   9) DRIVE APPDATA JSON SYNC
   ========================= */

/**
 * Find the file in appDataFolder.
 * Validates cached fileId first (handles deletion).
 */
async function findCloudFileIfExists() {
  if (!requireSignedInDrive()) return null;

  // Validate cached id
  if (cloudFileId) {
    try {
      await gapi.client.drive.files.get({
        fileId: cloudFileId,
        fields: "id",
        supportsAllDrives: true
      });
      return cloudFileId;
    } catch {
      cloudFileId = null;
      localStorage.removeItem(LS.CLOUD_FILE_ID);
    }
  }

  try {
    const resp = await gapi.client.drive.files.list({
      spaces: "appDataFolder",
      q: `name='${CLOUD_JSON_NAME}' and trashed=false`,
      fields: "files(id,name,modifiedTime)"
    });

    const files = resp?.result?.files || [];
    if (files.length > 0) {
      cloudFileId = files[0].id;
      localStorage.setItem(LS.CLOUD_FILE_ID, cloudFileId);
      return cloudFileId;
    }
    return null;
  } catch (e) {
    logError("findCloudFileIfExists", e);
    setSyncStatus("error");
    return null;
  }
}

async function ensureCloudFile() {
  const existing = await findCloudFileIfExists();
  if (existing) return existing;

  // Create new JSON file in appDataFolder
  try {
    setSyncStatus("working");

    const token = gapi.client.getToken()?.access_token;
    if (!token) throw new Error("No token");

    const metadata = {
      name: CLOUD_JSON_NAME,
      mimeType: "application/json",
      parents: ["appDataFolder"]
    };

    const body = JSON.stringify({ library, version: 1, updatedAt: new Date().toISOString() });

    const fileId = await driveMultipartCreate(metadata, body, token);
    cloudFileId = fileId;
    localStorage.setItem(LS.CLOUD_FILE_ID, cloudFileId);

    setSyncStatus("synced");
    return cloudFileId;
  } catch (e) {
    logError("ensureCloudFile create", e);
    setSyncStatus("error");
    toast("Cloud file create failed.");
    return null;
  }
}

// Upload local -> cloud (JSON)
async function handleCloudSave() {
  if (!requireSignedInDrive()) return;

  const btn = $("btn-save-drive");
  const origText = btn?.textContent || "";
  if (btn) btn.textContent = t("working");
  setSyncStatus("working");

  try {
    const fileId = await ensureCloudFile();
    if (!fileId) throw new Error("No cloud file id");

    const token = gapi.client.getToken()?.access_token;
    if (!token) throw new Error("No token");

    const metadata = { name: CLOUD_JSON_NAME, mimeType: "application/json" };
    const body = JSON.stringify({ library, version: 1, updatedAt: new Date().toISOString() });

    await driveMultipartUpdate(fileId, metadata, body, token);

    setSyncStatus("synced");
    if (btn) btn.textContent = t("cloudSaved");
    setTimeout(() => { if (btn) btn.textContent = t("btnSaveCloud"); }, 2500);
  } catch (e) {
    logError("handleCloudSave", e);
    setSyncStatus("error");
    toast("Cloud sync failed. Try again.", 3500);

    // Token expired
    if (String(e?.message || "").includes("401")) {
      gapi.client.setToken(null);
      toast(t("sessionExpired"), 3500);
      setSyncStatus("idle");
    }
    if (btn) btn.textContent = origText || t("btnSaveCloud");
  }
}

// Download cloud -> local (JSON)
async function handleCloudLoad() {
  if (!requireSignedInDrive()) return;
  if (!confirm(t("confirmLoad"))) return;

  setSyncStatus("working");

  try {
    const fileId = await findCloudFileIfExists();
    if (!fileId) { toast(t("noFileFound"), 3500); setSyncStatus("idle"); return; }

    const token = gapi.client.getToken()?.access_token;
    if (!token) throw new Error("No token");

    const jsonText = await driveDownloadFile(fileId, token);
    const obj = JSON.parse(jsonText);

    if (!obj?.library) throw new Error("Invalid cloud JSON");
    library = obj.library;

    saveLibrary({ shouldSync: false });
    setSyncStatus("synced");
    toast(t("cloudLoaded"));
  } catch (e) {
    logError("handleCloudLoad", e);
    setSyncStatus("error");
    toast("Cloud load failed.", 3500);
  }
}

async function queueUpload() {
  if (isSyncing) { syncPending = true; return; }
  isSyncing = true;
  setSyncStatus("working");

  try {
    const fileId = await ensureCloudFile();
    if (!fileId) return;

    const token = gapi.client.getToken()?.access_token;
    if (!token) throw new Error("No token");

    const metadata = { name: CLOUD_JSON_NAME, mimeType: "application/json" };
    const body = JSON.stringify({ library, version: 1, updatedAt: new Date().toISOString() });

    await driveMultipartUpdate(fileId, metadata, body, token);
    setSyncStatus("synced");
  } catch (e) {
    logError("queueUpload", e);
    setSyncStatus("error");
    toast("Cloud sync failed. Open menu → Sync ☁️ to retry.", 4000);

    if (String(e?.message || "").includes("401")) {
      gapi.client.setToken(null);
      toast(t("sessionExpired"), 3500);
      setSyncStatus("idle");
    }
  } finally {
    isSyncing = false;
    if (syncPending) {
      syncPending = false;
      setTimeout(queueUpload, 0);
    }
  }
}

/* =========================
   10) DRIVE UPLOAD/DOWNLOAD HELPERS (FETCH)
   ========================= */

function buildMultipartBody(metadataObj, fileContent, boundary) {
  const delimiter = `--${boundary}`;
  const closeDelim = `--${boundary}--`;

  const metadataPart =
    `${delimiter}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadataObj)}\r\n`;

  const filePart =
    `${delimiter}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${fileContent}\r\n`;

  return metadataPart + filePart + closeDelim;
}

async function driveMultipartCreate(metadata, content, token) {
  const boundary = "-------314159265358979323846";
  const multipartBody = buildMultipartBody(metadata, content, boundary);

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

async function driveMultipartUpdate(fileId, metadata, content, token) {
  const boundary = "-------314159265358979323846";
  const multipartBody = buildMultipartBody(metadata, content, boundary);

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
  return await res.json();
}

async function driveDownloadFile(fileId, token) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return await res.text();
}

/* =========================
   11) CAMERA + BOOK LOOKUPS
   ========================= */

async function fetchOpenLibrary(isbn) {
  try {
    const res = await fetchWithTimeout(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
    const data = await res.json();
    const key = `ISBN:${isbn}`;
    if (data?.[key]) {
      const b = data[key];
      return {
        title: b.title,
        authors: b.authors || [{ name: "Unknown" }],
        cover: b.cover?.medium || b.cover?.small || null,
        isbn
      };
    }
  } catch {}
  return null;
}

async function fetchFinna(isbn) {
  try {
    const res = await fetchWithTimeout(`https://api.finna.fi/v1/search?lookfor=isbn:${isbn}&type=AllFields&field[]=title&field[]=buildings&field[]=images`);
    const data = await res.json();
    if (data?.resultCount > 0) {
      const b = data.records[0];
      return {
        title: b.title,
        authors: [{ name: b.buildings?.[0]?.translated || "Unknown" }],
        cover: b.images?.[0] ? `https://api.finna.fi${b.images[0]}` : null,
        isbn
      };
    }
  } catch {}
  return null;
}

async function fetchGoogleBooks(isbn) {
  try {
    const res = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await res.json();
    if (data?.totalItems > 0) {
      const v = data.items[0].volumeInfo;
      return {
        title: v.title,
        authors: (v.authors || []).map((a) => ({ name: a })),
        cover: v.imageLinks?.thumbnail?.replace("http:", "https:"),
        isbn
      };
    }
  } catch {}
  return null;
}

async function searchAndPrompt(query) {
  try {
    const res = await fetchWithTimeout(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data?.docs?.length) {
      const d = data.docs[0];
      showModal({
        title: d.title,
        authors: [{ name: d.author_name?.[0] || "?" }],
        cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
        isbn: d.isbn?.[0] || ""
      });
    } else {
      toast("No results.");
    }
  } catch {
    toast("Search failed.");
  }
}

async function fetchAndPrompt(rawIsbn) {
  const clean = String(rawIsbn).replace(/\D/g, "");

  // ISBN length validation (10 or 13)
  if (![10, 13].includes(clean.length)) return toast(t("invalidIsbn"));

  const book =
    (await fetchOpenLibrary(clean)) ||
    (await fetchFinna(clean)) ||
    (await fetchGoogleBooks(clean));

  if (book) showModal(book, clean);
  else if (confirm("Manual?")) searchAndPrompt("ISBN " + clean);
  else toast("Not found.");
}

async function handleManualAdd() {
  const el = $("isbn-input");
  if (!el?.value) return;
  const val = el.value.trim();
  el.value = "";

  const isNum = /^[\d-]+$/.test(val);
  if (isNum) await fetchAndPrompt(val);
  else await searchAndPrompt(val);
}

async function startCamera() {
  const c = $("reader-container");
  if (c) c.style.display = "block";

  html5QrCode = new Html5Qrcode("reader");
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (txt) => {
        if (scanLocked) return;
        scanLocked = true;
        await stopCamera();
        await fetchAndPrompt(txt);
      }
    );
  } catch {
    try {
      await html5QrCode.start({ facingMode: "user" }, {}, async () => {});
    } catch {
      if (c) c.style.display = "none";
      toast("Camera Error");
    }
  }
}

async function stopCamera() {
  const c = $("reader-container");
  if (c) c.style.display = "none";

  if (html5QrCode) {
    try { await html5QrCode.stop(); html5QrCode.clear(); } catch {}
    html5QrCode = null;
  }
}

/* =========================
   12) EXPORT / IMPORT LOCAL JSON
   ========================= */

function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "my_bookshelf_" + new Date().toISOString().split("T")[0] + ".json");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function triggerImport() { $("import-file")?.click(); }

function importData(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported?.read || !imported?.wishlist || !imported?.loans) return toast("Invalid JSON");
      library = imported;
      saveLibrary({ shouldSync: true });
      toast(t("importSuccess"));
      // Allow importing the same file again
      event.target.value = "";
    } catch {
      toast("Invalid JSON");
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

/* =========================
   13) CALENDAR (OPTIONAL)
   ========================= */

function getReminderDates(returnDateStr) {
  const [y, m, d] = returnDateStr.split("-").map(Number);
  const returnObj = new Date(y, m - 1, d, 12, 0, 0);
  const startObj = new Date(returnObj); startObj.setDate(startObj.getDate() - 1);
  const endObj = new Date(startObj); endObj.setDate(endObj.getDate() + 1);

  const fmt = (dt) => {
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  return { start: fmt(startObj), end: fmt(endObj) };
}

async function processCalendar(book) {
  if (!book?.returnDate) return toast(t("dateRequired"));

  const calToggle = $("cal-connect-toggle");
  const useApi = !!calToggle?.checked;

  if (!useApi) return magicLinkCalendar(book);

  // Need calendar auth (with Drive too)
  const ok = await ensureCalendarAuth();
  if (!ok) return;

  await apiAddCalendar(book);
}

async function apiAddCalendar(book) {
  const { start, end } = getReminderDates(book.returnDate);

  try {
    await gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: {
        summary: `Return: ${book.title}`,
        description: `Book by ${getAuthorName(book)}`,
        start: { date: start },
        end: { date: end }
      }
    });
    toast(t("calAdded"));
  } catch (e) {
    logError("Calendar insert", e);
    toast("Calendar error");
  }
}

function magicLinkCalendar(book) {
  const { start, end } = getReminderDates(book.returnDate);
  const url =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent("Return: " + book.title)}` +
    `&details=${encodeURIComponent("Book by " + getAuthorName(book))}` +
    `&dates=${start.replace(/-/g, "")}/${end.replace(/-/g, "")}`;
  window.open(url, "_blank");
}

/* =========================
   14) INIT
   ========================= */

window.addEventListener("DOMContentLoaded", () => {
  try {
    library = loadLibrary();

    addClick("menu-btn", openMenu);
    addClick("menu-overlay", closeMenu);
    addClick("modal-overlay", (e) => { if (e.target.id === "modal-overlay") closeModal(); });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".menu-dropdown") && !e.target.closest(".dots-btn")) {
        document.querySelectorAll(".menu-dropdown.show").forEach((d) => d.classList.remove("show"));
      }
    });

    if ($("language-select")) $("language-select").onchange = (e) => setLanguage(e.target.value);

    // Inject Cloud buttons into menu (under Data & Backup)
    const exportBtn = $("btn-export");
    if (exportBtn && !$("cloud-controls")) {
      const style = document.createElement("style");
      style.innerHTML = `
        #cloud-controls { margin-top:15px; padding-top:15px; border-top:1px solid var(--border-color, #ccc); }
        .cloud-btn-row { display:flex; gap:10px; margin-bottom:10px; }
        .cloud-action-btn { flex:1; padding:10px; border:1px solid currentColor; background:none; border-radius:6px; cursor:pointer; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:6px; opacity:0.8; transition:all 0.2s; color:inherit; }
        .cloud-action-btn:hover { opacity:1; background:rgba(128,128,128,0.1); }
      `;
      document.head.appendChild(style);

      const cloudDiv = document.createElement("div");
      cloudDiv.id = "cloud-controls";
      cloudDiv.innerHTML = `
        <h4 id="header-drive">Google Drive (Hidden Sync)</h4>
        <div class="cloud-btn-row">
          <button id="btn-save-drive" class="cloud-action-btn">Sync ☁️</button>
          <button id="btn-load-drive" class="cloud-action-btn">Load 📥</button>
        </div>
      `;
      exportBtn.parentElement.insertBefore(cloudDiv, exportBtn);

      const localHeader = document.createElement("h4");
      localHeader.id = "header-local";
      localHeader.textContent = "Local Device";
      localHeader.style.marginTop = "15px";
      exportBtn.parentElement.insertBefore(localHeader, exportBtn);

      $("btn-save-drive").onclick = handleCloudSave;
      $("btn-load-drive").onclick = handleCloudLoad;
    }

    addClick("btn-clear-filters", clearFilters);
    addClick("btn-add", handleManualAdd);
    $("isbn-input")?.addEventListener("keydown", (e) => { if (e.key === "Enter") handleManualAdd(); });

    addClick("btn-scan", startCamera);
    addClick("btn-stop-camera", stopCamera);

    addClick("modal-add-read", () => confirmAdd("read"));
    addClick("modal-add-wish", () => confirmAdd("wishlist"));
    addClick("modal-add-loan", () => confirmAdd("loans"));
    addClick("modal-cancel", closeModal);

    // Login button is in header (your HTML already)
    addClick("auth-btn", signInDrive);

    addClick("reset-btn", hardReset);
    addClick("btn-export", exportData);
    addClick("btn-import", triggerImport);
    $("import-file")?.addEventListener("change", importData);

    const calToggle = $("cal-connect-toggle");
    if (calToggle) {
      calToggle.checked = localStorage.getItem(LS.CAL_SYNC) === "true";
      calToggle.onchange = (e) => localStorage.setItem(LS.CAL_SYNC, String(!!e.target.checked));
    }

    const darkToggle = $("dark-mode-toggle");
    if (darkToggle) {
      if (localStorage.getItem(LS.DARK) === "true") {
        document.body.classList.add("dark-mode");
        darkToggle.checked = true;
      }
      darkToggle.onchange = (e) => {
        if (e.target.checked) {
          document.body.classList.add("dark-mode");
          localStorage.setItem(LS.DARK, "true");
        } else {
          document.body.classList.remove("dark-mode");
          localStorage.setItem(LS.DARK, "false");
        }
      };
    }

    document.querySelector(".tabs")?.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (tab) setActiveTab(tab.id.replace("tab-", ""));
    });

    setText("year", new Date().getFullYear());
    setSyncStatus(isDriveSignedIn() ? "synced" : "idle");
    updateShelfCounts();
    updateCloudLink();
    setSmartPlaceholder();
    setLanguage(currentLang);

    // Hook filters live
    $("filter-text")?.addEventListener("input", applyFilters);
    $("filter-year")?.addEventListener("input", applyFilters);
    $("filter-month")?.addEventListener("change", applyFilters);
    $("filter-rating")?.addEventListener("change", applyFilters);

    window.addEventListener("resize", setSmartPlaceholder);
    window.addEventListener("orientationchange", setSmartPlaceholder);

    console.log("App Ready (Drive appData JSON)");
  } catch (e) {
    logError("Init", e);
    setSyncStatus("error");
  }
});

// Expose callbacks for Google script tags
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;
window.clearFilters = clearFilters;
