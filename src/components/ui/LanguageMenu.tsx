import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { currentLanguage, type Language, LANGUAGE_NAMES, LANGUAGES, setLanguage } from "@/i18n"

import { Icon } from "./Icon"

/**
 * Header language selector in the UMANG / GIGW style: a globe button showing
 * the current language, opening a menu where each language is written in its
 * own script (and marked with its own `lang` for screen readers).
 */
export function LanguageMenu() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const active = currentLanguage()

  useEffect(() => {
    if (!open) return
    items.current[LANGUAGES.indexOf(active)]?.focus()
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open, active])

  const choose = (lng: Language) => {
    setLanguage(lng)
    setOpen(false)
  }

  const onMenuKey = (event: KeyboardEvent) => {
    const index = items.current.findIndex((item) => item === document.activeElement)
    if (event.key === "Escape") {
      setOpen(false)
      root.current?.querySelector<HTMLButtonElement>(".lang-menu-button")?.focus()
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const step = event.key === "ArrowDown" ? 1 : -1
      items.current[(index + step + LANGUAGES.length) % LANGUAGES.length]?.focus()
    }
  }

  return (
    <div className="lang-menu" ref={root}>
      <button
        type="button"
        className="lang-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        // Visible text is part of the accessible name (WCAG 2.5.3).
        aria-label={`${t("lang.label")}: ${LANGUAGE_NAMES[active]}`}
        onClick={() => setOpen(!open)}
      >
        <Icon name="globe" size={16} />
        <span lang={active}>{LANGUAGE_NAMES[active]}</span>
        <Icon name="chevron" size={13} className="lang-menu-caret" />
      </button>
      {open && (
        <div
          className="lang-menu-list"
          role="menu"
          aria-label={t("lang.label")}
          onKeyDown={onMenuKey}
        >
          {LANGUAGES.map((lng, index) => (
            <button
              key={lng}
              ref={(el) => {
                items.current[index] = el
              }}
              type="button"
              role="menuitemradio"
              aria-checked={lng === active}
              lang={lng}
              onClick={() => choose(lng)}
            >
              <span>{LANGUAGE_NAMES[lng]}</span>
              {lng === active && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
