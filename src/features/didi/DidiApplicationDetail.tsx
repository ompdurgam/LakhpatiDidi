import { useState } from "react"

import type { ApplicationRow } from "@/api/types"
import { Drawer } from "@/components/ui/Drawer"
import { statusClass } from "@/components/ui/statusClass"
import { useTr } from "@/i18n/tr"

import { PrintableApplication } from "../applications/ApplicationDocument"
import { ApplicationOverview } from "../applications/ApplicationOverview"
import { ApplicationPdfModal } from "../applications/ApplicationPdfModal"
import { DocumentActions } from "../applications/DocumentActions"
import { useDidiApplication } from "./useDidi"

/** One of the Didi's applications: progress, scheme details, documents, print / download. */
export function DidiApplicationDetail({
  row,
  onClose,
}: {
  row: ApplicationRow
  onClose: () => void
}) {
  const tr = useTr()
  const { data: detail, error, isLoading } = useDidiApplication(row.id)
  const [preview, setPreview] = useState(false)
  const view = detail ?? row

  return (
    <>
      <Drawer eyebrow={tr("आवेदन विवरण")} title={row.id} onClose={onClose}>
        <div className="drawer-person">
          <div className="avatar large">{tr(view.initials)}</div>
          <div>
            <h3>{tr(view.scheme)}</h3>
            <p>
              {tr(view.dept)} • {view.amount}
            </p>
          </div>
          <span className={`status ${view.overdue ? "red" : statusClass[view.status] || "blue"}`}>
            {tr(view.status)}
          </span>
        </div>
        {error && <p className="form-error drawer-error">{tr((error as Error).message)}</p>}
        {isLoading && <div className="drawer-loading">{tr("लोड हो रहा है…")}</div>}
        {detail && (
          <>
            <DocumentActions code={detail.id} />
            <ApplicationOverview detail={detail} onOpenPdf={() => setPreview(true)} />
          </>
        )}
      </Drawer>
      {preview && detail && <ApplicationPdfModal item={detail} onClose={() => setPreview(false)} />}
      {detail && <PrintableApplication item={detail} />}
    </>
  )
}
