//# Translations + t() + currentLang
import { LS } from './config.js';

export const TRANSLATIONS = { /* your full TRANSLATIONS object here – copy from your code */ };

export let currentLang = localStorage.getItem(LS.LANG) || "en";

export function setCurrentLang(lang) {
  currentLang = lang;
  localStorage.setItem(LS.LANG, lang);
}

export function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? key;
}
