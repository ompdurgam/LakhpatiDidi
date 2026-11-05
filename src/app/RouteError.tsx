import { useTranslation } from "react-i18next"
import { isRouteErrorResponse, Link, useRouteError } from "react-router"

import { EmptyState } from "@/components/ui/EmptyState"
import { useSession } from "@/stores/session"

import { roleHome } from "./navigation"

/** Error boundary for every route (also handles 404s). */
export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  const role = useSession((s) => s.role)
  const notFound = isRouteErrorResponse(error) && error.status === 404
  if (!notFound) console.error(error)
  return (
    <div className="page">
      <EmptyState>
        <p>{notFound ? t("status.notFound") : t("status.error")}</p>
        {!notFound && error instanceof Error && <small>{error.message}</small>}
        <p>
          <Link to={roleHome(role)}>{t("status.goHome")}</Link>
        </p>
      </EmptyState>
    </div>
  )
}

export function NotFound() {
  const { t } = useTranslation()
  const role = useSession((s) => s.role)
  return (
    <div className="page">
      <EmptyState>
        <p>{t("status.notFound")}</p>
        <Link to={roleHome(role)}>{t("status.goHome")}</Link>
      </EmptyState>
    </div>
  )
}
