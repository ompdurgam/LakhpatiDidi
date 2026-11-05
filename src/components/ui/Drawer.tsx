import { type ReactNode, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { Icon } from "./Icon"

/** Right-hand slide-over (`.drawer`) with scrim; closes on Escape. */
export function Drawer({
  eyebrow,
  title,
  onClose,
  className = "drawer",
  children,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  onClose: () => void
  className?: string
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
      <div className="drawer-scrim" onClick={onClose} />
      <aside className={className} role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t("actions.close")}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </aside>
    </>
  )
}
