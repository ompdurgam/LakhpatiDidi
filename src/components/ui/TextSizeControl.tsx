import { useTranslation } from "react-i18next"

import { canStep, setTextSize, stepTextSize, useTextSize } from "@/lib/textSize"

/** "A− A A+" text-size buttons, as on Indian government websites (GIGW). */
export function TextSizeControl() {
  const { t } = useTranslation()
  const size = useTextSize()
  return (
    <div className="text-size-control" role="group" aria-label={t("textSize.label")}>
      <button
        type="button"
        onClick={() => stepTextSize(-1)}
        disabled={!canStep(size, -1)}
        aria-label={t("textSize.decrease")}
        title={t("textSize.decrease")}
      >
        A<sup>−</sup>
      </button>
      <button
        type="button"
        className="normal"
        onClick={() => setTextSize("normal")}
        aria-pressed={size === "normal"}
        aria-label={t("textSize.reset")}
        title={t("textSize.reset")}
      >
        A
      </button>
      <button
        type="button"
        onClick={() => stepTextSize(1)}
        disabled={!canStep(size, 1)}
        aria-label={t("textSize.increase")}
        title={t("textSize.increase")}
      >
        A<sup>+</sup>
      </button>
    </div>
  )
}
