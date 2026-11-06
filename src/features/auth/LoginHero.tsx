import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { loginSlides } from "./loginSlides"

/**
 * Onboarding card: photo of a Didi over two diagonal colour bands, then the
 * programme headline. On phones it is the first screen (Skip / Next lead to
 * login); on desktop it sits beside the login card.
 */
export function LoginHero({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation("auth")
  const tr = useTr()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % loginSlides.length), 5000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="login-hero" aria-roledescription="carousel">
      <div className="login-hero-art">
        <i className="band band-gold" />
        <i className="band band-sky" />
        {loginSlides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={tr(slide.caption)}
            className={index === active ? "active" : ""}
            aria-hidden={index !== active}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
      <div className="login-hero-copy">
        <span className="login-hero-eyebrow">{t("hero.eyebrow")}</span>
        <h1>{t("hero.title")}</h1>
        <p>{tr(loginSlides[active].caption)}</p>
        <div className="login-hero-dots">
          {loginSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              className={index === active ? "active" : ""}
              aria-label={t("hero.slide", { n: index + 1 })}
              aria-current={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
        <div className="login-hero-actions">
          <button type="button" className="login-link" onClick={onContinue}>
            {t("hero.skip")}
          </button>
          <button type="button" className="login-next" onClick={onContinue}>
            {t("hero.next")} <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </section>
  )
}
