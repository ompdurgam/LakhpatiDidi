import type { ApplicationDetail } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { ApplicationDocument } from "./ApplicationDocument"
import { DocumentActions } from "./DocumentActions"

/**
 * On-screen preview of the application document with print / download.
 * The opener must also mount <PrintableApplication> for printing to work.
 */
export function ApplicationPdfModal({
  item,
  onClose,
}: {
  item: ApplicationDetail
  onClose: () => void
}) {
  const tr = useTr()
  return (
    <>
      <div className="application-pdf-scrim" onClick={onClose} />
      <div className="application-pdf-modal" role="dialog" aria-modal="true">
        <div className="consent-modal-head">
          <div>
            <span>{tr("आवेदन पत्र")}</span>
            <h3>{item.id}</h3>
          </div>
          <button onClick={onClose} aria-label={tr("बंद करें")}>
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="document-preview">
          <ApplicationDocument item={item} />
        </div>
        <DocumentActions code={item.id} />
      </div>
    </>
  )
}
