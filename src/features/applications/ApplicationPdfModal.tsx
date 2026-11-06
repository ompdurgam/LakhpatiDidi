import type { ApplicationDetail } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

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
      <div className="application-pdf-modal">
        <div className="consent-modal-head">
          <div>
            <span>DPR PDF</span>
            <h3>{tr(item.id)}</h3>
          </div>
          <button onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="mini-application-pdf">
          <div>
            <span>{tr("महिला लखपति कार्यक्रम – CGSRLM")}</span>
            <strong>{tr("विस्तृत परियोजना प्रतिवेदन")}</strong>
            <small>{tr(item.scheme)}</small>
          </div>
          <hr />
          <p>
            <b>{tr("लाभार्थी:")}</b> {tr(item.name)}
            <br />
            <b>{tr("ग्राम:")}</b> {tr(item.village)}, {tr(item.block)}
            <br />
            <b>{tr("विभाग:")}</b> {tr(item.dept)}
          </p>
          <h4>{tr("परियोजना सारांश")}</h4>
          <p>
            {tr("कुल लागत")} {item.amount} {tr("• अनुदान")} {item.subsidy}{" "}
            {tr("• अनुमानित अतिरिक्त आय ₹")}
            {item.expectedGain.toLocaleString("en-IN")}
            {tr("/वर्ष")}
          </p>
          <h4>{tr("संलग्न दस्तावेज़")}</h4>
          <p>{item.documents.map((d) => `${d.name} ${d.verified ? "✓" : "✖"}`).join("   ")}</p>
          <div className="pdf-sign-line">
            {tr("लाभार्थी &nbsp;&nbsp;&nbsp; CRP &nbsp;&nbsp;&nbsp; CLF &nbsp;&nbsp;&nbsp; BMMU")}
          </div>
        </div>
        <button className="primary modal-download">
          <Icon name="download" size={15} /> {tr("PDF डाउनलोड")}
        </button>
      </div>
    </>
  )
}
