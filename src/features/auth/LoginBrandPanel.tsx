import { useTranslation } from "react-i18next"

import { BrandMark } from "@/components/ui/BrandMark"
import { useEnglish } from "@/i18n"

import { LoginSlider } from "./LoginSlider"

/** Left half of the login screen: programme title, flow chips and slideshow. */
export function LoginBrandPanel() {
  const { t } = useTranslation("auth")
  const english = useEnglish()
  return (
    <div className="login-brand-panel">
      <div className="login-brand-copy">
        <div className="login-emblem">
          <BrandMark />
          <span>{t("emblem")}</span>
        </div>
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <div className="login-flow">
          {t("flow", { returnObjects: true }).map((item, index) => (
            <span key={item}>
              <i>{index + 1}</i>
              {item}
            </span>
          ))}
        </div>
      </div>
      <LoginSlider english={english} />
    </div>
  )
}
