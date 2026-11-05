import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { useApplications } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { useUi } from "@/stores/ui"

/** Bell button + dropdown: overdue applications and two standing reminders. */
export function NotificationMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const openApplication = useUi((s) => s.openApplication)
  const { data: applications = [] } = useApplications()
  const overdue = applications.filter((a) => a.overdue)
  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <>
      <button
        className="icon-button notification"
        onClick={() => setOpen(!open)}
        aria-label={t("header.notifications")}
        aria-expanded={open}
      >
        <Icon name="bell" />
        <i>{overdue.length + 2}</i>
      </button>
      {open && (
        <div className="notification-dropdown">
          <div>
            <strong>{t("header.notifications")}</strong>
            <button onClick={() => setOpen(false)}>{t("notifications.close")}</button>
          </div>
          {overdue.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setOpen(false)
                openApplication(item)
              }}
            >
              <span className="alert red">
                <Icon name="alert" size={14} />
              </span>
              <p>
                <strong>{t("notifications.overdue", { id: item.id })}</strong>
                <small>
                  {t("notifications.overdueMeta", {
                    name: item.name,
                    dept: item.dept,
                    days: item.days,
                  })}
                </small>
              </p>
            </button>
          ))}
          <button onClick={() => go("/block/blcc")}>
            <span className="alert amber">
              <Icon name="clock" size={14} />
            </span>
            <p>
              <strong>{t("notifications.blccTitle")}</strong>
              <small>{t("notifications.blccMeta")}</small>
            </p>
          </button>
          <button onClick={() => go("/block/reports")}>
            <span className="alert blue">
              <Icon name="file" size={14} />
            </span>
            <p>
              <strong>{t("notifications.reportTitle")}</strong>
              <small>{t("notifications.reportMeta")}</small>
            </p>
          </button>
        </div>
      )}
    </>
  )
}
