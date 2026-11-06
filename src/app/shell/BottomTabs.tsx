import { useTranslation } from "react-i18next"
import { NavLink } from "react-router"

import { Icon } from "@/components/ui/Icon"
import { useDidi } from "@/features/didi/useDidi"
import { useSession } from "@/stores/session"

import { roleNav } from "../navigation"

/**
 * Bottom tab bar for a Didi on a phone (hidden on larger screens, where the sidebar
 * is used). The tasks tab shows how many tasks are still open.
 */
export function BottomTabs() {
  const { t: tn } = useTranslation("nav")
  const { data } = useDidi()
  const open = data ? data.tasks.total - data.tasks.done : 0
  const role = useSession((s) => s.role)
  if (role !== "didi") return null
  return (
    <nav className="bottom-tabs" aria-label={tn("didi.menu")}>
      {roleNav.didi.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="bottom-tab-icon">
            <Icon name={item.icon} size={21} />
            {item.path === "/didi/tasks" && open > 0 && <b>{open}</b>}
          </span>
          <span>{tn(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
