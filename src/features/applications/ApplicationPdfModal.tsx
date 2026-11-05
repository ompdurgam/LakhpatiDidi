import type { ApplicationDetail } from "@/api/types"
import { Icon } from "@/components/ui/Icon"

export function ApplicationPdfModal({
  item,
  onClose,
}: {
  item: ApplicationDetail
  onClose: () => void
}) {
  return (
    <>
      <div className="application-pdf-scrim" onClick={onClose} />
      <div className="application-pdf-modal">
        <div className="consent-modal-head">
          <div>
            <span>DPR PDF</span>
            <h3>{item.id}</h3>
          </div>
          <button onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="mini-application-pdf">
          <div>
            <span>महिला लखपति कार्यक्रम – CGSRLM</span>
            <strong>विस्तृत परियोजना प्रतिवेदन</strong>
            <small>{item.scheme}</small>
          </div>
          <hr />
          <p>
            <b>लाभार्थी:</b> {item.name}
            <br />
            <b>ग्राम:</b> {item.village}, {item.block}
            <br />
            <b>विभाग:</b> {item.dept}
          </p>
          <h4>परियोजना सारांश</h4>
          <p>
            कुल लागत {item.amount} • अनुदान {item.subsidy} • अनुमानित अतिरिक्त आय ₹
            {item.expectedGain.toLocaleString("en-IN")}/वर्ष
          </p>
          <h4>संलग्न दस्तावेज़</h4>
          <p>{item.documents.map((d) => `${d.name} ${d.verified ? "✓" : "✖"}`).join("   ")}</p>
          <div className="pdf-sign-line">
            लाभार्थी &nbsp;&nbsp;&nbsp; CRP &nbsp;&nbsp;&nbsp; CLF &nbsp;&nbsp;&nbsp; BMMU
          </div>
        </div>
        <button className="primary modal-download">
          <Icon name="download" size={15} /> PDF डाउनलोड
        </button>
      </div>
    </>
  )
}
