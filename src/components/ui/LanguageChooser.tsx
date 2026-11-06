import { useState } from "react"

import { hasChosenLanguage, type Language, LANGUAGE_NAMES, LANGUAGES, setLanguage } from "@/i18n"

import { BrandMark } from "./BrandMark"

/**
 * First-visit language picker (as UMANG asks on first launch). Shown once;
 * the choice is saved and can be changed later from the language menu.
 * The prompt is bilingual because the visitor's language isn't known yet.
 */
export function LanguageChooser() {
  const [open, setOpen] = useState(() => !hasChosenLanguage())
  if (!open) return null

  const choose = (lng: Language) => {
    setLanguage(lng)
    setOpen(false)
  }

  return (
    <div className="language-chooser-scrim">
      <div
        className="language-chooser"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-chooser-title"
      >
        <BrandMark size={128} />
        <h2 id="language-chooser-title">
          <span lang="hi">{/* i18n-exempt: bilingual prompt */}भाषा चुनें</span>
          <span lang="en">Choose your language</span>
        </h2>
        <div className="language-chooser-options">
          {LANGUAGES.map((lng) => (
            <button key={lng} type="button" lang={lng} onClick={() => choose(lng)}>
              <b>{lng === "hi" ? /* i18n-exempt: script sample */ "अ" : "A"}</b>
              <span>{LANGUAGE_NAMES[lng]}</span>
            </button>
          ))}
        </div>
        <p>
          <span lang="hi">
            {/* i18n-exempt: bilingual prompt */}आप इसे बाद में ऊपर दिए भाषा मेन्यू से बदल सकते हैं।
          </span>
          <span lang="en">You can change it later from the language menu at the top.</span>
        </p>
      </div>
    </div>
  )
}
