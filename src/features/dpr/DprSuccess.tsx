import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function DprSuccess({
  compact,
  onTrack,
  onNext,
}: {
  compact: boolean
  onTrack: () => void
  onNext: () => void
}) {
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
        <strong>APP-260142</strong>
      </div>
      <div className="routing-success">
        <span>
          <Icon name="building" size={18} />
        </span>
        <div>
          <strong>{tr("मत्स्य विभाग, जगदलपुर को भेजा गया")}</strong>
          <p>{tr("प्रतिलिपि BMMU")}</p>
        </div>
      </div>
      <div className="sla-success">
        <Icon name="clock" size={17} />
        <div>
          <span>{tr("स्वीकृति अपेक्षित")}</span>
          <strong>{tr("15 दिन में (20 नवंबर 2026)")}</strong>
        </div>
      </div>
      <div className="dpr-success-actions">
        <button className="primary" onClick={onTrack}>
          {tr("ट्रैक करें")} <Icon name="arrow" size={16} />
        </button>
        <button className="secondary" onClick={onNext}>
          {tr("अगली योजना का DPR")}
        </button>
      </div>
    </div>
  )
}
