import { Icon } from "@/components/ui/Icon"

export function DprSuccess({
  compact,
  onTrack,
  onNext,
}: {
  compact: boolean
  onTrack: () => void
  onNext: () => void
}) {
  return (
    <div className={compact ? "phone-content dpr-success" : "dpr-workspace dpr-success"}>
      <div className="success-check">
        <Icon name="check" size={32} />
      </div>
      <span className="eyebrow">DPR सफलतापूर्वक भेजा गया</span>
      <h2>आवेदन विभाग तक पहुँच गया</h2>
      <div className="dpr-success-id">
        <span>Application ID</span>
        <strong>APP-260142</strong>
      </div>
      <div className="routing-success">
        <span>
          <Icon name="building" size={18} />
        </span>
        <div>
          <strong>मत्स्य विभाग, जगदलपुर को भेजा गया</strong>
          <p>प्रतिलिपि BMMU</p>
        </div>
      </div>
      <div className="sla-success">
        <Icon name="clock" size={17} />
        <div>
          <span>स्वीकृति अपेक्षित</span>
          <strong>15 दिन में (20 नवंबर 2026)</strong>
        </div>
      </div>
      <div className="dpr-success-actions">
        <button className="primary" onClick={onTrack}>
          ट्रैक करें <Icon name="arrow" size={16} />
        </button>
        <button className="secondary" onClick={onNext}>
          अगली योजना का DPR
        </button>
      </div>
    </div>
  )
}
