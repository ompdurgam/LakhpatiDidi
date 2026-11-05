import i18n from "i18next"
import { initReactI18next, useTranslation } from "react-i18next"

import enAuth from "./locales/en/auth.json"
import enCommon from "./locales/en/common.json"
import enNav from "./locales/en/nav.json"
import hiAuth from "./locales/hi/auth.json"
import hiCommon from "./locales/hi/common.json"
import hiNav from "./locales/hi/nav.json"

export const LANGUAGES = ["hi", "en"] as const
export type Language = (typeof LANGUAGES)[number]
const STORAGE_KEY = "ld.lang"

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

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* storage unavailable */
  }
})
document.documentElement.lang = i18n.language

export function toggleLanguage() {
  void i18n.changeLanguage(i18n.language === "en" ? "hi" : "en")
}

/** `english` flag for the ported prototype screens, which take it as a prop. */
export function useEnglish() {
  const { i18n: instance } = useTranslation()
  return instance.language === "en"
}

export default i18n
