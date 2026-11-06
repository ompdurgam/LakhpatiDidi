import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function RecommendationSheet({
  type,
  schemeName,
  onClose,
  onConfirm,
}: {
  type: "reason" | "later"
  schemeName: string
  onClose: () => void
  onConfirm: () => void
}) {
  const tr = useTr()
  const [reason, setReason] = useState("पैसा नहीं")
  const [date, setDate] = useState("2026-11-25")
  return (
    <>
      <div className="recommend-sheet-scrim" onClick={onClose} />
      <aside className="recommend-sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">
          <div>
            <span>{type === "reason" ? tr("रुचि नहीं") : tr("बाद में याद दिलाएँ")}</span>
            <h3>{tr(schemeName)}</h3>
          </div>
          <button onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </div>
        {type === "reason" ? (
          <div className="reason-options">
            {["पैसा नहीं", "समय नहीं", "परिवार सहमत नहीं", "पहले से लाभ", "अन्य"].map((option) => (
              <button
                key={option}
                className={reason === option ? "active" : ""}
                onClick={() => setReason(option)}
              >
                <i>{reason === option && <span />}</i>
                {tr(option)}
              </button>
            ))}
          </div>
        ) : (
          <label className="reminder-date">
            <span>{tr("याद दिलाने की तारीख")}</span>
            <input
              type="date"
              min="2026-11-01"
              max="2026-11-30"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <small>{tr("नवंबर 2026 में सर्वेयर होम पर रिमाइंडर दिखेगा।")}</small>
          </label>
        )}
        <button className="primary sheet-confirm" onClick={onConfirm}>
          {type === "reason" ? tr("कारण सुरक्षित करें") : tr("रिमाइंडर लगाएँ")}
        </button>
      </aside>
    </>
  )
}
