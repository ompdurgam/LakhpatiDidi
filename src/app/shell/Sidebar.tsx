import { useTranslation } from "react-i18next"
import { NavLink, useMatch } from "react-router"

import { useApplications } from "@/api/hooks"
import { BrandMark } from "@/components/ui/BrandMark"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"
import { useUi } from "@/stores/ui"

import { navForRole } from "../navigation"
import { useScope } from "./useScope"

const OPEN = ["submitted", "under_review", "info_requested"]

export function Sidebar() {
  const tr = useTr()
  const { t } = useTranslation()
  const { t: tn } = useTranslation("nav")
  const role = useSession((s) => s.role)
  const scope = useScope()
  const user = useSession((s) => s.user)
  const signOut = useSession((s) => s.signOut)
  const menuOpen = useUi((s) => s.menuOpen)
  const setMenuOpen = useUi((s) => s.setMenuOpen)
  const notify = useUi((s) => s.notify)
  const dept = useMatch("/dept/:deptCode/*")?.params.deptCode
  const { data: applications = [] } = useApplications()
  const openCount = applications.filter((a) => OPEN.includes(a.statusCode)).length

  return (
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand">
        <BrandMark size={56} />
        <div>
          <strong>{t("brand.name")}</strong>
          <small>{t("brand.tagline")}</small>
        </div>
        <button
          className="icon-button close-menu"
          onClick={() => setMenuOpen(false)}
          aria-label={t("nav.closeMenu")}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="scope-card">
        <small>{t("scope.title")}</small>
        <div>
          <Icon name="map" size={17} />
          <strong>{scope.title}</strong>
        </div>
        <span>{scope.region}</span>
      </div>
      <nav>
        <p>{t("nav.main")}</p>
        {navForRole(role, dept).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setMenuOpen(false)}
          >
            <Icon name={item.icon} size={19} />
            <span>{tn(item.label)}</span>
            {item.badge && openCount > 0 && <b>{openCount}</b>}
          </NavLink>
        ))}
        {role !== "didi" && (
          <>
            <p>{t("nav.system")}</p>
            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name="settings" size={19} />
              <span>{t("nav.settings")}</span>
            </NavLink>
          </>
        )}
      </nav>
      <div className="help-card">
        <div className="help-icon">?</div>
        <strong>{t("help.title")}</strong>
        <span>{t("help.line")}</span>
        <button onClick={() => notify(t("help.sent"))}>{t("help.button")}</button>
      </div>
      <button className="profile" onClick={signOut} title={t("profile.logout")}>
        <div className="avatar">{user?.initials}</div>
        <div>
          <strong>{tr(user?.name ?? "")}</strong>
          <span>
            {user?.designation} • {t("profile.logout")}
          </span>
        </div>
        <Icon name="chevron" size={17} />
      </button>
    </aside>
  )
}
