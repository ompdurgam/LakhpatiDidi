import type { ReactNode } from "react"
import { Link } from "react-router"

import { Icon } from "@/components/ui/Icon"

/** One tappable Didi in a field list (Recommendations and DPR tabs share it). */
export function DidiRow({
  to,
  initials,
  name,
  meta,
  children,
  aside,
}: {
  to: string
  initials: string
  name: string
  meta: string
  children?: ReactNode
  aside?: ReactNode
}) {
  return (
    <li>
      <Link to={to} className="didi-row">
        <span className="fl-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="didi-row-body">
          <strong>{name}</strong>
          <small>{meta}</small>
          {children}
        </span>
        {aside}
        <Icon name="chevron" size={16} />
      </Link>
    </li>
  )
}
