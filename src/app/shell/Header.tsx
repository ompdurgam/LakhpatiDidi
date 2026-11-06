import { useTranslation } from "react-i18next"
import { useLocation, useMatch, useNavigate } from "react-router"

import { Icon } from "@/components/ui/Icon"
import { LanguageMenu } from "@/components/ui/LanguageMenu"
import { TextSizeControl } from "@/components/ui/TextSizeControl"
import { isRole, STAFF_ROLES, useSession } from "@/stores/session"
import { useUi } from "@/stores/ui"

import { navForRole, roleHome } from "../navigation"
import { NotificationMenu } from "./NotificationMenu"
import { useScope } from "./useScope"

const overviewTitle: Record<
  string,
  "pageTitle.blockOverview" | "pageTitle.districtOverview" | "pageTitle.stateOverview"
> = {
  "/block": "pageTitle.blockOverview",
  "/district": "pageTitle.districtOverview",
  "/state": "pageTitle.stateOverview",
}

function usePageTitle() {
  const { t } = useTranslation()
  const { t: tn } = useTranslation("nav")
  const { pathname } = useLocation()
  const role = useSession((s) => s.role)
  const dept = useMatch("/dept/:deptCode/*")?.params.deptCode
  if (overviewTitle[pathname]) return t(overviewTitle[pathname])
  if (pathname === "/settings") return t("nav.settings")
  // Longest nav path that prefixes the current URL.
  const match = navForRole(role, dept)
    .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return match ? tn(match.label) : ""
}

export function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const role = useSession((s) => s.role)
  const setRole = useSession((s) => s.setRole)
  const query = useUi((s) => s.query)
  const setQuery = useUi((s) => s.setQuery)
  const setMenuOpen = useUi((s) => s.setMenuOpen)
  const title = usePageTitle()
  const scope = useScope()
  // A Didi sees only her own profile: no role switcher and no staff search.
  const isDidi = useSession((s) => s.user?.role === "didi")

  return (
    <header>
      <button
        className="icon-button mobile-menu"
        onClick={() => setMenuOpen(true)}
        aria-label={t("nav.openMenu")}
      >
        <Icon name="menu" />
      </button>
      <div className="header-title">
        <small>{scope.breadcrumb}</small>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        {!isDidi && (
          <label className="role-switcher">
            <span>{t("header.role")}</span>
            <select
              value={role}
              onChange={(event) => {
                const next = event.target.value
                if (!isRole(next)) return
                setRole(next)
                navigate(roleHome(next))
              }}
              aria-label={t("header.changeRole")}
            >
              {STAFF_ROLES.map((value) => (
                <option key={value} value={value}>
                  {t(`roles.${value}`)}
                </option>
              ))}
            </select>
          </label>
        )}
        {!isDidi && (
          <label className="global-search">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("header.search")}
              aria-label={t("header.search")}
            />
          </label>
        )}
        <TextSizeControl />
        <LanguageMenu />
        <NotificationMenu />
      </div>
    </header>
  )
}
