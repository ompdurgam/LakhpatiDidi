import type { ApplicationRow } from "@/api/types"
import { Drawer } from "@/components/ui/Drawer"
import { statusClass } from "@/components/ui/statusClass"
import { useTr } from "@/i18n/tr"

import { ApplicationActionBar } from "./ApplicationActionBar"
import { ApplicationActionForm } from "./ApplicationActionForm"
import { ApplicationComments } from "./ApplicationComments"
import { PrintableApplication } from "./ApplicationDocument"
import { ApplicationOverview } from "./ApplicationOverview"
import { ApplicationPdfModal } from "./ApplicationPdfModal"
import { type ApplicationDetailState, useApplicationDetail } from "./useApplicationDetail"

/** Right-hand panel with one application's details and workflow actions. */
export function ApplicationDrawer({
  item,
  role,
  onClose,
  onNotify,
}: {
  item: ApplicationRow
  role: string
  onClose: () => void
  onNotify: (s: string) => void
}) {
  const tr = useTr()
  const state = useApplicationDetail(item.id, onNotify)
  const view = state.detail ?? item
  return (
    <>
      <Drawer eyebrow={tr("आवेदन विवरण")} title={item.id} onClose={onClose}>
        <div className="drawer-person">
          <div className="avatar large">{tr(view.initials)}</div>
          <div>
            <h3>{tr(view.name)}</h3>
            <p>
              {tr(view.village)}, {view.block} • {tr(view.hhCode)}
            </p>
          </div>
          <span className={`status ${statusClass[view.status] || "blue"}`}>{tr(view.status)}</span>
        </div>
        <ApplicationBody state={state} role={role} statusCode={view.statusCode} />
      </Drawer>
      <ApplicationExtras state={state} />
    </>
  )
}

/** Overview, comments, the action form and the action bar (drawer and full page). */
export function ApplicationBody({
  state,
  role,
  statusCode,
}: {
  state: ApplicationDetailState
  role: string
  statusCode: string
}) {
  const tr = useTr()
  const { detail, loadError, action, busy, actionError } = state
  return (
    <>
      {loadError && <p className="form-error drawer-error">{tr(loadError)}</p>}
      {!detail && !loadError && <div className="drawer-loading">{tr("लोड हो रहा है…")}</div>}
      {detail && (
        <>
          <ApplicationOverview detail={detail} onOpenPdf={() => state.setPdfOpen(true)} />
          <ApplicationComments comments={detail.comments} busy={busy} onSend={state.sendComment} />
        </>
      )}
      {action && detail && (
        <ApplicationActionForm
          action={action}
          detail={detail}
          busy={busy}
          onCancel={() => {
            state.setAction(null)
            state.setActionError("")
          }}
          onSubmit={(payload) => state.run({ action, ...payload })}
        />
      )}
      {actionError && (
        <p className="form-error drawer-error" role="alert">
          {tr(actionError)}
        </p>
      )}
      <ApplicationActionBar
        role={role}
        statusCode={statusCode}
        escalation={detail?.escalation}
        busy={busy}
        onRun={state.run}
        onOpenForm={state.setAction}
      />
    </>
  )
}

/** The PDF preview and the print-only copy of the application. */
export function ApplicationExtras({ state }: { state: ApplicationDetailState }) {
  const { detail, pdfOpen } = state
  return (
    <>
      {pdfOpen && detail && (
        <ApplicationPdfModal item={detail} onClose={() => state.setPdfOpen(false)} />
      )}
      {detail && <PrintableApplication item={detail} />}
    </>
  )
}
