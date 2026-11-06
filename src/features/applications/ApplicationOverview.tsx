import type { ApplicationDetail } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { Timeline } from "@/components/ui/Timeline"
import { useTr } from "@/i18n/tr"

import { slaBanner } from "./applicationSla"

/** SLA strip, Lakhpati meter, scheme details, timeline and documents. */
export function ApplicationOverview({
  detail,
  onOpenPdf,
}: {
  detail: ApplicationDetail
  onOpenPdf: () => void
}) {
  const tr = useTr()
  const sla = slaBanner(detail)
  const meta: [string, string][] = [
    ["योजना", detail.scheme],
    ["विभाग", detail.dept],
    ["परियोजना लागत", detail.amount],
    ["अनुदान", detail.subsidy],
    ["प्राप्ति तिथि", detail.received],
    ["नियुक्त अधिकारी", detail.officer],
    ["GPDP संदर्भ", detail.gpdpRef ?? "—"],
    ["VPRP संदर्भ", detail.vprpRef ?? "—"],
  ]
  return (
    <>
      <div className={`application-sla ${sla.tone}`}>
        <Icon name={sla.icon} size={17} />
        <div>
          <strong>{tr(sla.title)}</strong>
          <span>{tr(sla.sub)}</span>
        </div>
      </div>
      <div className="lakhpati-meter">
        <div>
          <span>{tr("वर्तमान वार्षिक आय")}</span>
          <strong>
            ₹{detail.currentIncome.toLocaleString("en-IN")} <small>/ ₹1,00,000</small>
          </strong>
        </div>
        <div className="meter">
          <i style={{ width: `${Math.min(detail.currentIncome / 1000, 100)}%` }} />
        </div>
        <p>
          {tr("इस योजना के बाद अनुमानित आय:")}{" "}
          <b>₹{detail.projectedIncome.toLocaleString("en-IN")}</b>
        </p>
      </div>
      <div className="drawer-section application-meta">
        <h4>{tr("योजना विवरण")}</h4>
        <dl>
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt>{tr(label)}</dt>
              <dd>{tr(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="drawer-section">
        <h4>{tr("प्रगति")}</h4>
        <Timeline steps={detail.timeline} className="application-timeline" />
      </div>
      <div className="drawer-section application-documents">
        <div className="drawer-section-title">
          <h4>{tr("दस्तावेज़")}</h4>
          <button onClick={onOpenPdf}>
            <Icon name="file" size={14} /> {tr("PDF देखें")}
          </button>
        </div>
        {detail.documents.map(({ name, verified }) => (
          <div key={name} className={verified ? "complete" : "missing"}>
            <span>
              <Icon name={verified ? "check" : "close"} size={13} />
            </span>
            <strong>{tr(name)}</strong>
            <small>{verified ? tr("सत्यापित") : tr("दस्तावेज़ अनुपलब्ध")}</small>
          </div>
        ))}
      </div>
    </>
  )
}
