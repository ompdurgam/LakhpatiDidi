import type { ReactNode } from "react"

/** Centered message used for empty tables, loading and error states (`.empty`). */
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
