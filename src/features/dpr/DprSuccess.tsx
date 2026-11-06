import { Link } from "react-router"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import type { SentDpr } from "./types"

/** Shown after a DPR is sent (or when opening one that was already sent). */
export function DprSuccess({ compact, sent }: { compact: boolean; sent: SentDpr }) {
  const tr = useTr()
  return (
    <div className={compact ? "phone-content dpr-success" : "dpr-workspace dpr-success"}>
      <div className="success-check">
        <Icon name="check" size={32} />
      </div>
      <span className="eyebrow">{tr("DPR सफलतापूर्वक भेजा गया")}</span>
      <h2>{tr("आवेदन विभाग तक पहुँच गया")}</h2>
      <div className="dpr-success-id">
        <span>Application ID</span>
        <strong>{sent.applicationCode}</strong>
      </div>
      <div className="routing-success">
        <span>
          <Icon name="building" size={18} />
        </span>
        <div>
          <strong>{sent.office}</strong>
          <p>{sent.officer ? tr("अधिकारी: {{name}}", { name: sent.officer }) : sent.department}</p>
        </div>
      </div>
      {sent.slaDue && (
        <div className="sla-success">
          <Icon name="clock" size={17} />
          <div>
            <span>{tr("स्वीकृति अपेक्षित")}</span>
            <strong>{sent.slaDue}</strong>
          </div>
        </div>
      )}
      <div className="dpr-success-actions">
        <Link className="primary" to="/field/households">
          {tr("ट्रैक करें")} <Icon name="arrow" size={16} />
        </Link>
        <Link className="secondary" to="/field/dpr">
          {tr("अगली दीदी का DPR")}
        </Link>
      </div>
    </div>
  )
}
