import { useTr } from "@/i18n/tr"

/** The page's outline while its figures load: heading, a row of tiles and two panels. */
export function PageSkeleton({ tiles = 4 }: { tiles?: number }) {
  const tr = useTr()
  return (
    <div className="page skeleton-page" role="status" aria-busy="true">
      <span className="sr-only">{tr("लोड हो रहा है…")}</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton-tiles">
        {Array.from({ length: tiles }, (_, i) => (
          <div key={i} className="skeleton skeleton-tile" />
        ))}
      </div>
      <div className="skeleton-panels">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
    </div>
  )
}
