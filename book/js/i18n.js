//# Translations + t() + currentLang + applyLanguageToUI
import { LS } from "./config.js";
import { setText } from "./dom-utils.js";

export const TRANSLATIONS = {
  en: {
    read: "Read",
    wishlist: "Wishlist",
    loans: "Loans",
    settings: "Settings & Filters",
    shelves: "Shelves",
    display: "Display",
    filter: "Filter Books",
    year: "Year",
    month: "Month",
    rating: "Rating",
    clear: "Clear Filters",
    reset: "Reset App Data",
    data: "Data & Backup",
    headerDrive: "Google Drive (Hidden Sync)",
    headerLocal: "Local Device",
    export: "Download Backup (JSON)",
    import: "Restore Backup",
    btnSaveCloud: "Sync to Cloud ☁️",
    btnLoadCloud: "Sync from Cloud 📥",
    dark: "Dark Mode",
    lang: "Language",
    search: "Search ISBN, Title, Author...",
    add: "Add",
    signIn: "Sign In",
    working: "...",
    synced: "Logged In",
    markRead: "Mark Read",
    unread: "↩︎ Unread",
    delete: "Delete?",
    finished: "Finished:",
    due: "Due:",
    audio: "🎧 Audio",
    reminder: "📅 Reminder",
    modalAudio: "🎧 Audio?",
    modalReturn: "📅 Return",
    cancel: "Cancel",
    changeDate: "📅 Change Date",
    copyTitle: "📋 Copy Title",
    importSuccess: "Success! ✅",
    cloudSaved: "Synced! ✅",
    cloudLoaded: "Synced! ✅",
    filterStats: "Showing {0} of {1} books",
    clearBtn: "Clear",
    invalidIsbn: "Invalid ISBN",
    sessionExpired: "Session expired.",
    dateRequired: "Date?",
    signInRequired: "Please Sign In first.",
    confirmLoad: "Overwrite local data with data from Cloud?",
    noFileFound: "No backup found in cloud. Save first?",
    alreadyExists: "Already in your library.",
    notFound: "Not found.",
    searchFailed: "Search failed.",
    cameraError: "Camera error."
  },
  fi: {
    read: "Luetut",
    wishlist: "Toivelista",
    loans: "Lainassa",
    settings: "Asetukset",
    shelves: "Hyllyt",
    display: "Näkymä",
    filter: "Suodata",
    year: "Vuosi",
    month: "Kuukausi",
    rating: "Arvosana",
    clear: "Tyhjennä",
    reset: "Nollaa tiedot",
    data: "Tiedot & Varmuuskopio",
    headerDrive: "Google Drive (Piilotettu synkka)",
    headerLocal: "Paikallinen (Laite)",
    export: "Lataa varmuuskopio (JSON)",
    import: "Palauta varmuuskopio",
    btnSaveCloud: "Synkkaa pilveen ☁️",
    btnLoadCloud: "Hae pilvestä 📥",
    dark: "Tumma tila",
    lang: "Kieli",
    search: "Etsi ISBN, Nimi, Kirjailija...",
    add: "Lisää",
    signIn: "Kirjaudu",
    working: "...",
    synced: "Kirjautunut",
    markRead: "Merkitse luetuksi",
    unread: "↩︎ Lukematon",
    delete: "Poista?",
    finished: "Luettu:",
    due: "Eräpäivä:",
    audio: "🎧 Ääni",
    reminder: "📅 Muistutus",
    modalAudio: "🎧 Äänikirja?",
    modalReturn: "📅 Palautus",
    cancel: "Peruuta",
    changeDate: "📅 Muuta päivää",
    copyTitle: "📋 Kopioi nimi",
    importSuccess: "Onnistui! ✅",
    cloudSaved: "Synkattu! ✅",
    cloudLoaded: "Synkattu! ✅",
    filterStats: "Näytetään {0} / {1} kirjaa",
    clearBtn: "Tyhjennä",
    invalidIsbn: "Virheellinen ISBN",
    sessionExpired: "Istunto vanheni.",
    dateRequired: "Päivämäärä?",
    signInRequired: "Kirjaudu ensin.",
    confirmLoad: "Korvataanko paikalliset tiedot pilvestä haetuilla?",
    noFileFound: "Varmuuskopiota ei löytynyt pilvestä. Tallenna ensin?",
    alreadyExists: "Kirja on jo kirjastossasi.",
    notFound: "Ei löytynyt.",
    searchFailed: "Haku epäonnistui.",
    cameraError: "Kameravirhe."
  },
  et: {
    read: "Loetud",
    wishlist: "Soovinimekiri",
    loans: "Laenatud",
    settings: "Sätted",
    shelves: "Riiulid",
    display: "Kuva",
    filter: "Filtreeri",
    year: "Aasta",
    month: "Kuu",
    rating: "Hinne",
    clear: "Tühjenda",
    reset: "Lähtesta andmed",
    data: "Andmed ja varukoopia",
    headerDrive: "Google Drive (Peidetud sünk)",
    headerLocal: "Kohalik seade",
    export: "Lae varukoopia (JSON)",
    import: "Taasta varukoopia",
    btnSaveCloud: "Synk. pilve ☁️",
    btnLoadCloud: "Lae pilvest 📥",
    dark: "Tume režiim",
    lang: "Keel",
    search: "Otsi ISBN, Pealkiri, Autor...",
    add: "Lisa",
    signIn: "Logi sisse",
    working: "...",
    synced: "Sisse logitud",
    markRead: "Märgi loetuks",
    unread: "↩︎ Lugemata",
    delete: "Kustuta?",
    finished: "Loetud:",
    due: "Tähtaeg:",
    audio: "🎧 Audio",
    reminder: "📅 Meeldetuletus",
    modalAudio: "🎧 Audioraamat?",
    modalReturn: "📅 Tagastus",
    cancel: "Loobu",
    changeDate: "📅 Muuda kuupäeva",
    copyTitle: "📋 Kopeeri pealkiri",
    importSuccess: "Õnnestus! ✅",
    cloudSaved: "Synk. tehtud! ✅",
    cloudLoaded: "Synk. tehtud! ✅",
    filterStats: "Kuvatakse {0} / {1} raamatut",
    clearBtn: "Tühjenda",
    invalidIsbn: "Vigane ISBN",
    sessionExpired: "Seanss aegus.",
    dateRequired: "Kuupäev?",
    signInRequired: "Palun logi esmalt sisse.",
    confirmLoad: "Kirjutan kohalikud andmed üle? Jätka?",
    noFileFound: "Pilvest ei leitud andmeid. Salvesta esmalt?",
    alreadyExists: "Raamat on juba sinu nimekirjas.",
    notFound: "Ei leitud.",
    searchFailed: "Otsing ebaõnnestus.",
    cameraError: "Kaamera viga."
  }
};

export let currentLang = localStorage.getItem(LS.LANG) || "en";

export function setCurrentLang(lang) {
  currentLang = lang;
  localStorage.setItem(LS.LANG, lang);
}

export function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? key;
}

/**
 * Updates UI labels based on current language.
 * This prevents "some labels still English" after module refactor.
 */
export function applyLanguageToUI() {
  // Tabs
  setText("tab-read", t("read"));
  setText("tab-wishlist", t("wishlist"));
  setText("tab-loans", t("loans"));

  // Menu headings
  setText("menu-settings", t("settings"));
  setText("menu-shelves", t("shelves"));
  setText("menu-display", t("display"));
  setText("menu-filter", t("filter"));
  setText("menu-data", t("data"));
  setText("menu-lang", t("lang"));

  // Filter labels
  setText("label-darkmode", t("dark"));
  setText("label-year", t("year"));
  setText("label-month", t("month"));
  setText("label-rating", t("rating"));

  // Stats labels
  setText("label-stat-read", t("read"));
  setText("label-stat-wish", t("wishlist"));
  setText("label-stat-loans", t("loans"));

  // Buttons
  setText("btn-clear-filters", t("clear"));
  setText("btn-export", t("export"));
  setText("btn-import", t("import"));
  setText("reset-btn", t("reset"));
  setText("btn-add", t("add"));

  // Modal
  setText("label-audio", t("modalAudio"));
  setText("label-return", t("modalReturn"));
  setText("modal-cancel", t("cancel"));
  setText("modal-add-read", `Add to ${t("read")}`);
  setText("modal-add-wish", `Add to ${t("wishlist")}`);
  setText("modal-add-loan", `Add to ${t("loans")}`);

  // Search placeholder
  const input = document.getElementById("isbn-input");
  if (input) input.placeholder = t("search");

  // Cloud injected elements
  const save = document.getElementById("btn-save-drive");
  const load = document.getElementById("btn-load-drive");
  const hd = document.getElementById("header-drive");
  const hl = document.getElementById("header-local");
  if (save) save.textContent = t("btnSaveCloud");
  if (load) load.textContent = t("btnLoadCloud");
  if (hd) hd.textContent = t("headerDrive");
  if (hl) hl.textContent = t("headerLocal");
}
