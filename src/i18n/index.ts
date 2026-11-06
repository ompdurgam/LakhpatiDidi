import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import enAuth from "./locales/en/auth.json"
import enCommon from "./locales/en/common.json"
import enNav from "./locales/en/nav.json"
import hiAuth from "./locales/hi/auth.json"
import hiCommon from "./locales/hi/common.json"
import hiNav from "./locales/hi/nav.json"

export const LANGUAGES = ["hi", "en"] as const
export type Language = (typeof LANGUAGES)[number]
const STORAGE_KEY = "ld.lang"

/** Each language named in its own script (as on UMANG / GIGW sites). */
export const LANGUAGE_NAMES: Record<Language, string> = { hi: "हिन्दी", en: "English" }

const TITLES: Record<Language, string> = {
  hi: "स्वावलंबी दीदी – लखपति अभिसरण पोर्टल",
  en: "Swavalambi Didi – Lakhpati Convergence Portal",
}

export const resources = {
  hi: { common: hiCommon, nav: hiNav, auth: hiAuth },
  en: { common: enCommon, nav: enNav, auth: enAuth },
} as const

function savedLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "hi"
  } catch {
    return "hi"
  }
}

void i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage(),
  fallbackLng: "hi",
  defaultNS: "common",
  ns: ["common", "nav", "auth"],
  interpolation: { escapeValue: false },
})

function applyToDocument(lng: string) {
  document.documentElement.lang = lng
  document.title = TITLES[lng === "en" ? "en" : "hi"]
}

i18n.on("languageChanged", (lng) => {
  applyToDocument(lng)
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* storage unavailable */
  }
})
applyToDocument(i18n.language)

export const currentLanguage = (): Language => (i18n.language === "en" ? "en" : "hi")

/** Switches the UI language (saved for the next visit). */
export function setLanguage(lng: Language) {
  void i18n.changeLanguage(lng)
}

/** False until the visitor has picked a language once (drives the first-visit chooser). */
export function hasChosenLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return true
  }
}

export default i18n
