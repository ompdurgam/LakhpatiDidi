import { type ReactNode, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { Icon } from "./Icon"

/** Centered dialog using the design's consent-modal header (`.consent-modal-head`). */
export function Modal({
  eyebrow,
  title,
  onClose,
  className,
  scrimClassName,
  children,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  onClose: () => void
  /** e.g. "scheme-consent-modal" or "application-pdf-modal" */
  className: string
  scrimClassName: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <>
      <div className={scrimClassName} onClick={onClose} />
      <div className={className} role="dialog" aria-modal="true">
        <div className="consent-modal-head">
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h3>{title}</h3>
          </div>
          <button onClick={onClose} aria-label={t("actions.close")}>
            <Icon name="close" size={17} />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
