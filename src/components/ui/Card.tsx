import type { ReactNode } from "react"

/** `.card` section with the standard `.card-head` title row. */
export function Card({
  title,
  subtitle,
  action,
  className = "",
  children,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
