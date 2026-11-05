import { useTranslation } from "react-i18next"

import { toggleLanguage } from "@/i18n"

/** हिं / EN switch (`.lang-toggle`). */
export function LanguageToggle() {
  const { t } = useTranslation()
  return (
    <button className="lang-toggle" onClick={toggleLanguage} aria-label={t("lang.switch")}>
      <b>{t("lang.current")}</b>
      <span>{t("lang.other")}</span>
    </button>
  )
}
