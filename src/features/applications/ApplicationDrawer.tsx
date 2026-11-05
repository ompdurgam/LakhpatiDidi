import { useState } from "react"

import { api } from "@/api/client"
import { useRefreshData, useResource } from "@/api/hooks"
import type { ApplicationDetail, ApplicationRow } from "@/api/types"
import { Drawer } from "@/components/ui/Drawer"
import { statusClass } from "@/components/ui/statusClass"

import { ApplicationActionBar, type FormAction } from "./ApplicationActionBar"
import { ApplicationActionForm } from "./ApplicationActionForm"
import { ApplicationComments } from "./ApplicationComments"
import { ApplicationOverview } from "./ApplicationOverview"
import { ApplicationPdfModal } from "./ApplicationPdfModal"

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
  const refresh = useRefreshData()
  const {
    data: detail,
    error: loadError,
    reload,
  } = useResource<ApplicationDetail>(`/applications/${item.id}`)
  const [action, setAction] = useState<FormAction | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const view = detail ?? item

  /** Runs a request with the busy/error handling every drawer action shares. */
  const submit = async (work: () => Promise<string>, after: () => Promise<unknown>) => {
    setBusy(true)
    setActionError("")
    try {
      onNotify(await work())
      await after()
      return true
    } catch (e) {
      setActionError((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const run = (payload: Record<string, unknown>) =>
    submit(
      async () => {
        const { message } = await api<{ message: string }>(`/applications/${item.id}/actions`, {
          body: payload,
        })
        setAction(null)
        return message
      },
      () => Promise.all([reload(), refresh()]),
    )

  const sendComment = (body: string) =>
    submit(async () => {
      await api(`/applications/${item.id}/comments`, { body: { body } })
      return "टिप्पणी भेजी गई"
    }, reload)

  return (
    <>
      <Drawer eyebrow="आवेदन विवरण" title={item.id} onClose={onClose}>
        <div className="drawer-person">
          <div className="avatar large">{view.initials}</div>
          <div>
            <h3>{view.name}</h3>
            <p>
              {view.village}, {view.block} • {view.hhCode}
            </p>
          </div>
          <span className={`status ${statusClass[view.status] || "blue"}`}>{view.status}</span>
        </div>
        {loadError && <p className="form-error drawer-error">{loadError}</p>}
        {!detail && !loadError && <div className="drawer-loading">लोड हो रहा है…</div>}
        {detail && (
          <>
            <ApplicationOverview detail={detail} onOpenPdf={() => setPdfOpen(true)} />
            <ApplicationComments comments={detail.comments} busy={busy} onSend={sendComment} />
          </>
        )}
        {action && detail && (
          <ApplicationActionForm
            action={action}
            detail={detail}
            busy={busy}
            onCancel={() => {
              setAction(null)
              setActionError("")
            }}
            onSubmit={(payload) => run({ action, ...payload })}
          />
        )}
        {actionError && (
          <p className="form-error drawer-error" role="alert">
            {actionError}
          </p>
        )}
        <ApplicationActionBar
          role={role}
          statusCode={view.statusCode}
          escalation={detail?.escalation}
          busy={busy}
          onRun={run}
          onOpenForm={setAction}
        />
      </Drawer>
      {pdfOpen && detail && <ApplicationPdfModal item={detail} onClose={() => setPdfOpen(false)} />}
    </>
  )
}
