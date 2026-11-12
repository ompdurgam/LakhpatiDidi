import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { statusClass } from "@/components/ui/statusClass"
import { useTr } from "@/i18n/tr"

import { ApplicationBody, ApplicationExtras } from "./ApplicationDrawer"
import { useApplicationDetail } from "./useApplicationDetail"

/**
 * One application on its own page: the Didi and status, a track bar of every
 * stage (received → … → income active), then details, comments and actions.
 */
export function ApplicationPage({
  code,
  role,
  onBack,
  onNotify,
}: {
  code: string
  role: string
  onBack: () => void
  onNotify: (message: string) => void
}) {
  const tr = useTr()
  const state = useApplicationDetail(code, onNotify)
  const { detail, loadError } = state
  if (loadError) return <EmptyState>{tr(loadError)}</EmptyState>
  if (!detail) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  const reached = detail.timeline.filter((s) => s.state === "done").length
  return (
    <div className="page application-page">
      <button className="text-button application-back" onClick={onBack}>
        <Icon name="arrow" size={14} /> {tr("इनबॉक्स पर वापस")}
      </button>
      <section className="card application-page-head">
        <div className="drawer-person">
          <div className="avatar large">{tr(detail.initials)}</div>
          <div>
            <span className="eyebrow">{detail.id}</span>
            <h2>{tr(detail.name)}</h2>
            <p>
              {tr(detail.village)}, {detail.block} • {tr(detail.hhCode)} • {tr(detail.scheme)}
            </p>
          </div>
          <span className={`status ${statusClass[detail.status] || "blue"}`}>
            {tr(detail.status)}
          </span>
        </div>
        <div className="application-track" aria-label={tr("आवेदन की प्रगति")}>
          <div className="application-track-bar">
            <i style={{ width: `${(reached / Math.max(1, detail.timeline.length)) * 100}%` }} />
          </div>
          <div className="horizontal-timeline">
            {detail.timeline.map((step, index) => (
              <div key={step.label} className={step.state}>
                <i>{step.state === "done" ? "✓" : index + 1}</i>
                <span>{tr(step.label)}</span>
                {step.date && <small>{tr(step.date)}</small>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="card application-page-body">
        <ApplicationBody state={state} role={role} statusCode={detail.statusCode} />
      </section>
      <ApplicationExtras state={state} />
    </div>
  )
}
